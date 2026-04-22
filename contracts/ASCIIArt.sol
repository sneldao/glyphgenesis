// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title GlyphGenesis
 * @dev ERC721 ASCII/glyph art on any EVM chain
 * Chain-agnostic: Works on Monad, Ethereum, BNB Chain, Base, and any EVM chain.
 *
 * Security improvements over v1:
 * - ERC721 compliance (ownable, transferable, wallet-displayable)
 * - ReentrancyGuard on all value-transfer functions
 * - Pausable for emergency stops
 * - Ownable for admin functions
 * - Rate limiting (1 mint per 30s per address)
 * - Checks-Effects-Interactions pattern throughout
 * - tokenURI with on-chain metadata (data URI)
 * - Overpayment refund before external calls
 */
contract GlyphGenesis is ERC721, ReentrancyGuard, Pausable, Ownable {
    using Strings for uint256;

    // ─── Constants ───
    uint256 public constant ROYALTY_PERCENT = 250;    // 2.5%
    uint256 public constant ROYALTY_DIVISOR = 10000;
    uint256 public constant MINT_COOLDOWN = 30;       // 30 seconds between mints
    uint256 public constant MAX_CONTENT_LENGTH = 10000;

    // ─── Data Structures ───
    struct Artwork {
        address creator;
        string content;
        string title;
        string prompt;
        uint256 timestamp;
        uint256 price;
        bool forSale;
        uint256 likes;
    }

    // ─── Storage ───
    mapping(uint256 => Artwork) public artworks;
    mapping(address => uint256[]) public creatorArtworks;
    mapping(uint256 => mapping(address => bool)) public hasLiked;
    mapping(address => uint256) public lastMintTime;

    uint256 public nextArtworkId;
    uint256 public totalArtworks;

    // ─── Events ───
    event ArtworkCreated(uint256 indexed id, address indexed creator, string title);
    event ArtworkTransferred(uint256 indexed id, address indexed from, address indexed to);
    event ArtworkLiked(uint256 indexed id, address indexed liker);
    event ArtworkPriceSet(uint256 indexed id, uint256 price);
    event ArtworkSaleCancelled(uint256 indexed id);

    // ─── Constructor ───
    constructor() ERC721("GlyphGenesis", "GLYPH") Ownable(msg.sender) {}

    // ─── Modifiers ───
    modifier onlyExisting(uint256 _id) {
        require(_ownerOf(_id) != address(0), "Artwork does not exist");
        _;
    }

    // ─── Pausable Admin ───
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ─── Minting ───
    /**
     * @dev Create new ASCII artwork (ERC721 mint)
     * Rate-limited: 1 mint per MINT_COOLDOWN seconds per address
     */
    function createArtwork(
        string memory _content,
        string memory _title,
        string memory _prompt
    ) external whenNotPaused returns (uint256) {
        require(bytes(_content).length > 0, "Content cannot be empty");
        require(bytes(_content).length <= MAX_CONTENT_LENGTH, "Content too large");
        require(
            block.timestamp >= lastMintTime[msg.sender] + MINT_COOLDOWN,
            "Mint cooldown active"
        );

        uint256 artworkId = nextArtworkId++;

        // ─── Effects ───
        artworks[artworkId] = Artwork({
            creator: msg.sender,
            content: _content,
            title: _title,
            prompt: _prompt,
            timestamp: block.timestamp,
            price: 0,
            forSale: false,
            likes: 0
        });

        creatorArtworks[msg.sender].push(artworkId);
        totalArtworks++;
        lastMintTime[msg.sender] = block.timestamp;

        // ERC721 mint (internal, no external call)
        _mint(msg.sender, artworkId);

        emit ArtworkCreated(artworkId, msg.sender, _title);
        return artworkId;
    }

    /**
     * @dev Batch create artworks (for agent efficiency)
     * Rate limit still applies but only once per batch
     */
    function batchCreateArtwork(
        string[] memory _contents,
        string[] memory _titles,
        string[] memory _prompts
    ) external whenNotPaused returns (uint256[] memory) {
        require(_contents.length == _titles.length, "Array length mismatch");
        require(_titles.length == _prompts.length, "Array length mismatch");
        require(_contents.length <= 10, "Max batch size is 10");
        require(
            block.timestamp >= lastMintTime[msg.sender] + MINT_COOLDOWN,
            "Mint cooldown active"
        );

        uint256[] memory ids = new uint256[](_contents.length);
        lastMintTime[msg.sender] = block.timestamp;

        for (uint256 i = 0; i < _contents.length; i++) {
            require(bytes(_contents[i]).length > 0, "Content cannot be empty");
            require(bytes(_contents[i]).length <= MAX_CONTENT_LENGTH, "Content too large");

            uint256 artworkId = nextArtworkId++;

            artworks[artworkId] = Artwork({
                creator: msg.sender,
                content: _contents[i],
                title: _titles[i],
                prompt: _prompts[i],
                timestamp: block.timestamp,
                price: 0,
                forSale: false,
                likes: 0
            });

            creatorArtworks[msg.sender].push(artworkId);
            totalArtworks++;
            ids[i] = artworkId;

            _mint(msg.sender, artworkId);
            emit ArtworkCreated(artworkId, msg.sender, _titles[i]);
        }

        return ids;
    }

    // ─── Marketplace ───
    /**
     * @dev Set artwork for sale
     */
    function setForSale(uint256 _id, uint256 _price) external onlyExisting(_id) {
        require(ownerOf(_id) == msg.sender, "Not the owner");
        require(_price > 0, "Price must be positive");
        artworks[_id].forSale = true;
        artworks[_id].price = _price;
        emit ArtworkPriceSet(_id, _price);
    }

    /**
     * @dev Cancel a sale listing
     */
    function cancelSale(uint256 _id) external onlyExisting(_id) {
        require(ownerOf(_id) == msg.sender, "Not the owner");
        artworks[_id].forSale = false;
        artworks[_id].price = 0;
        emit ArtworkSaleCancelled(_id);
    }

    /**
     * @dev Buy artwork (with creator royalties)
     * Uses Checks-Effects-Interactions: state updated before any external call
     * Refund overpayment before seller payment to prevent reentrancy
     */
    function buyArtwork(uint256 _id) external payable whenNotPaused nonReentrant onlyExisting(_id) {
        Artwork storage art = artworks[_id];
        require(art.forSale, "Not for sale");
        require(msg.value >= art.price, "Insufficient payment");
        require(ownerOf(_id) != msg.sender, "Already owner");

        address previousOwner = ownerOf(_id);
        address creator = art.creator;
        uint256 salePrice = art.price;

        // Calculate royalty
        uint256 royalty = (salePrice * ROYALTY_PERCENT) / ROYALTY_DIVISOR;
        uint256 sellerAmount = salePrice - royalty;

        // ─── Effects (all state changes before interactions) ───
        art.forSale = false;
        art.price = 0;
        // ERC721 transfer (internal _transfer, no external call to previousOwner)
        _transfer(previousOwner, msg.sender, _id);

        // ─── Interactions ───
        // Refund overpayment FIRST (to msg.sender, who initiated the call — safe)
        if (msg.value > salePrice) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - salePrice}("");
            require(refunded, "Refund failed");
        }

        // Pay seller
        (bool ok, ) = payable(previousOwner).call{value: sellerAmount}("");
        require(ok, "Payment to seller failed");

        // Pay creator royalty (if different from seller)
        if (creator != previousOwner && royalty > 0) {
            (bool royaltyOk, ) = payable(creator).call{value: royalty}("");
            require(royaltyOk, "Royalty payment failed");
        }

        emit ArtworkTransferred(_id, previousOwner, msg.sender);
    }

    // ─── Social ───
    /**
     * @dev Like an artwork
     */
    function likeArtwork(uint256 _id) external onlyExisting(_id) {
        require(!hasLiked[_id][msg.sender], "Already liked");
        artworks[_id].likes++;
        hasLiked[_id][msg.sender] = true;
        emit ArtworkLiked(_id, msg.sender);
    }

    // ─── Views ───
    /**
     * @dev Get artwork details
     */
    function getArtwork(uint256 _id) external view onlyExisting(_id) returns (
        address creator,
        address owner,
        string memory content,
        string memory title,
        string memory prompt,
        uint256 timestamp,
        uint256 price,
        bool forSale,
        uint256 likes
    ) {
        Artwork memory art = artworks[_id];
        return (
            art.creator,
            ownerOf(_id),
            art.content,
            art.title,
            art.prompt,
            art.timestamp,
            art.price,
            art.forSale,
            art.likes
        );
    }

    /**
     * @dev Get artworks by creator
     */
    function getCreatorArtworks(address _creator) external view returns (uint256[] memory) {
        return creatorArtworks[_creator];
    }

    /**
     * @dev Get recent artworks
     */
    function getRecentArtworks(uint256 _count) external view returns (uint256[] memory) {
        uint256 count = _count > totalArtworks ? totalArtworks : _count;
        uint256[] memory recent = new uint256[](count);

        uint256 currentId = nextArtworkId;
        for (uint256 i = 0; i < count && currentId > 0; i++) {
            currentId--;
            recent[i] = currentId;
        }

        return recent;
    }

    /**
     * @dev Get royalty info for an artwork
     */
    function getRoyaltyInfo(uint256 _id) external view onlyExisting(_id) returns (
        address creator,
        uint256 royaltyAmount,
        uint256 salePrice
    ) {
        Artwork storage art = artworks[_id];
        salePrice = art.price > 0 ? art.price : 0.01 ether;
        royaltyAmount = (salePrice * ROYALTY_PERCENT) / ROYALTY_DIVISOR;
        creator = art.creator;
    }

    /**
     * @dev ERC721 metadata — data URI with on-chain art
     */
    function tokenURI(uint256 _id) public view override onlyExisting(_id) returns (string memory) {
        Artwork memory art = artworks[_id];

        // Build JSON metadata
        string memory json = string(abi.encodePacked(
            '{"name":"', art.title,
            '","description":"GlyphGenesis ASCII Art #', _id.toString(),
            '","image":"data:text/plain;charset=utf-8,', _encodeArt(art.content),
            '","attributes":[{"trait_type":"Pattern","value":"', art.prompt,
            '"},{"trait_type":"Creator","value":"', _toAsciiString(art.creator),
            '"},{"trait_type":"Likes","display_type":"number","value":"', art.likes.toString(),
            '"}]}'
        ));

        return string(abi.encodePacked(
            "data:application/json;charset=utf-8,",
            json
        ));
    }

    // ─── Internal Helpers ───

    /**
     * @dev URL-encode art content for data URI
     */
    function _encodeArt(string memory _content) internal pure returns (string memory) {
        bytes memory src = bytes(_content);
        bytes memory dst = new bytes(src.length * 3); // worst case
        uint256 dstLen = 0;

        for (uint256 i = 0; i < src.length; i++) {
            bytes1 c = src[i];
            if (c == 0x0a) {
                // newline -> %0A
                dst[dstLen++] = '%';
                dst[dstLen++] = '0';
                dst[dstLen++] = 'A';
            } else if (c == 0x0d) {
                // carriage return -> skip
            } else if (c == '#') {
                dst[dstLen++] = '%';
                dst[dstLen++] = '2';
                dst[dstLen++] = '3';
            } else if (c == '%') {
                dst[dstLen++] = '%';
                dst[dstLen++] = '2';
                dst[dstLen++] = '5';
            } else if (c == '"') {
                dst[dstLen++] = '%';
                dst[dstLen++] = '2';
                dst[dstLen++] = '2';
            } else if (c == '\\') {
                dst[dstLen++] = '%';
                dst[dstLen++] = '5';
                dst[dstLen++] = 'C';
            } else if (c >= 0x20 && c <= 0x7e) {
                dst[dstLen++] = c;
            }
        }

        bytes memory result = new bytes(dstLen);
        for (uint256 i = 0; i < dstLen; i++) {
            result[i] = dst[i];
        }
        return string(result);
    }

    /**
     * @dev Convert address to hex string (without 0x)
     */
    function _toAsciiString(address _addr) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes20 addr = bytes20(_addr);
        bytes memory result = new bytes(40);
        for (uint256 i = 0; i < 20; i++) {
            result[i * 2] = alphabet[uint8(addr[i] >> 4)];
            result[i * 2 + 1] = alphabet[uint8(addr[i] & 0x0f)];
        }
        return string(abi.encodePacked("0x", result));
    }

    /**
     * @dev Override _update to enforce pause
     */
    function _update(address to, uint256 tokenId, address auth) internal override whenNotPaused returns (address) {
        return super._update(to, tokenId, auth);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ASCIIArt
 * @dev Store and trade ASCII art on Monad
 * Hackathon: Monad Moltiverse + USDC
 */
contract ASCIIArt {
    struct Artwork {
        uint256 id;
        address creator;
        string content;      // The ASCII art itself
        string title;
        string prompt;       // Original prompt used to generate
        uint256 timestamp;
        uint256 price;       // Price in wei if for sale
        bool forSale;
        uint256 likes;
    }

    // Storage
    mapping(uint256 => Artwork) public artworks;
    mapping(uint256 => address) public artworkOwner;
    mapping(address => uint256[]) public creatorArtworks;
    mapping(uint256 => mapping(address => bool)) public hasLiked;
    
    uint256 public nextArtworkId;
    uint256 public totalArtworks;
    
    // Events
    event ArtworkCreated(uint256 indexed id, address indexed creator, string title);
    event ArtworkTransferred(uint256 indexed id, address indexed from, address indexed to);
    event ArtworkLiked(uint256 indexed id, address indexed liker);
    event ArtworkPriceSet(uint256 indexed id, uint256 price);
    event ArtworkSaleCancelled(uint256 indexed id);

    /**
     * @dev Create new ASCII artwork
     */
    function createArtwork(
        string memory _content,
        string memory _title,
        string memory _prompt
    ) external returns (uint256) {
        require(bytes(_content).length > 0, "Content cannot be empty");
        require(bytes(_content).length <= 10000, "Content too large");
        
        uint256 artworkId = nextArtworkId++;
        
        artworks[artworkId] = Artwork({
            id: artworkId,
            creator: msg.sender,
            content: _content,
            title: _title,
            prompt: _prompt,
            timestamp: block.timestamp,
            price: 0,
            forSale: false,
            likes: 0
        });
        
        artworkOwner[artworkId] = msg.sender;
        creatorArtworks[msg.sender].push(artworkId);
        totalArtworks++;
        
        emit ArtworkCreated(artworkId, msg.sender, _title);
        
        return artworkId;
    }

    /**
     * @dev Get artwork details
     */
    function getArtwork(uint256 _id) external view returns (
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
        require(_id < nextArtworkId, "Artwork does not exist");
        Artwork memory art = artworks[_id];
        return (
            art.creator,
            artworkOwner[_id],
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
     * @dev Set artwork for sale
     */
    function setForSale(uint256 _id, uint256 _price) external {
        require(_id < nextArtworkId, "Artwork does not exist");
        require(artworkOwner[_id] == msg.sender, "Not the owner");
        require(_price > 0, "Price must be positive");
        artworks[_id].forSale = true;
        artworks[_id].price = _price;
        
        emit ArtworkPriceSet(_id, _price);
    }

    /**
     * @dev Cancel a sale listing
     */
    function cancelSale(uint256 _id) external {
        require(_id < nextArtworkId, "Artwork does not exist");
        require(artworkOwner[_id] == msg.sender, "Not the owner");
        artworks[_id].forSale = false;
        artworks[_id].price = 0;

        emit ArtworkSaleCancelled(_id);
    }

    /**
     * @dev Buy artwork
     */
    function buyArtwork(uint256 _id) external payable {
        require(_id < nextArtworkId, "Artwork does not exist");
        Artwork storage art = artworks[_id];
        require(art.forSale, "Not for sale");
        require(msg.value >= art.price, "Insufficient payment");
        require(artworkOwner[_id] != msg.sender, "Already owner");
        
        address previousOwner = artworkOwner[_id];
        uint256 salePrice = art.price;

        artworkOwner[_id] = msg.sender;
        art.forSale = false;
        art.price = 0;
        
        (bool ok, ) = payable(previousOwner).call{value: salePrice}("");
        require(ok, "Payment to seller failed");

        if (msg.value > salePrice) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - salePrice}("");
            require(refunded, "Refund to buyer failed");
        }
        
        emit ArtworkTransferred(_id, previousOwner, msg.sender);
    }

    /**
     * @dev Transfer artwork to another address
     */
    function transferArtwork(uint256 _id, address _to) external {
        require(_id < nextArtworkId, "Artwork does not exist");
        require(artworkOwner[_id] == msg.sender, "Not the owner");
        require(_to != address(0), "Cannot transfer to zero address");
        require(_to != msg.sender, "Cannot transfer to self");

        artworkOwner[_id] = _to;

        emit ArtworkTransferred(_id, msg.sender, _to);
    }

    /**
     * @dev Like an artwork
     */
    function likeArtwork(uint256 _id) external {
        require(_id < nextArtworkId, "Artwork does not exist");
        require(!hasLiked[_id][msg.sender], "Already liked");
        
        artworks[_id].likes++;
        hasLiked[_id][msg.sender] = true;
        
        emit ArtworkLiked(_id, msg.sender);
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
}

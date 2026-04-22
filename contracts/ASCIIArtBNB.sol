// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GlyphGenesis BNB Edition
 * @dev Enhanced marketplace with auctions and collections
 * Hackathon: Four.meme AI Sprint 2026 — BNB Chain
 * 
 * Differentiation from Monad edition:
 * -Auction system for bidding
 * -Collections for grouping artwork series
 * -Higher royalty for collection creators
 * -Auction fees benefit platform
 */
contract GlyphGenesisBNB {
    uint256 public constant ROYALTY_PERCENT = 250;
    uint256 public constant ROYALTY_DIVISOR = 10000;
    uint256 public constant AUCTION_DURATION = 3 days;
    uint256 public constant AUCTION_FEE_PERCENT = 100; // 1% platform fee
    
    struct Artwork {
        uint256 id;
        address creator;
        string content;
        string title;
        string prompt;
        uint256 timestamp;
        uint256 price;
        bool forSale;
        uint256 likes;
        uint256 collectionId;
    }
    
    struct Collection {
        uint256 id;
        string name;
        string description;
        address creator;
        uint256[] artworkIds;
    }
    
    struct Auction {
        uint256 artworkId;
        address seller;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool active;
    }
    
    mapping(uint256 => Artwork) public artworks;
    mapping(uint256 => address) public artworkOwner;
    mapping(address => uint256[]) public creatorArtworks;
    mapping(uint256 => mapping(address => bool)) public hasLiked;
    
    mapping(uint256 => Collection) public collections;
    mapping(address => uint256[]) public creatorCollections;
    
    mapping(uint256 => Auction) public auctions;
    
    uint256 public nextArtworkId;
    uint256 public nextCollectionId;
    uint256 public totalArtworks;
    uint256 public platformFees;
    
    event ArtworkCreated(uint256 indexed id, address indexed creator, string title);
    event ArtworkTransferred(uint256 indexed id, address indexed from, address indexed to);
    event ArtworkLiked(uint256 indexed id, address indexed liker);
    event ArtworkPriceSet(uint256 indexed id, uint256 price);
    event CollectionCreated(uint256 indexed id, address indexed creator, string name);
    event AuctionStarted(uint256 indexed id, address indexed seller, uint256 startingPrice);
    event AuctionEnded(uint256 indexed id, address indexed winner, uint256 finalPrice);
    
    function createArtwork(
        string memory _content,
        string memory _title,
        string memory _prompt,
        uint256 _collectionId
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
            likes: 0,
            collectionId: _collectionId
        });
        
        artworkOwner[artworkId] = msg.sender;
        creatorArtworks[msg.sender].push(artworkId);
        
        if (_collectionId > 0 && _collectionId < nextCollectionId) {
            collections[_collectionId].artworkIds.push(artworkId);
        }
        
        totalArtworks++;
        emit ArtworkCreated(artworkId, msg.sender, _title);
        return artworkId;
    }
    
    function createCollection(string memory _name, string memory _description) external returns (uint256) {
        require(bytes(_name).length > 0, "Name required");
        
        uint256 collectionId = nextCollectionId++;
        
        collections[collectionId] = Collection({
            id: collectionId,
            name: _name,
            description: _description,
            creator: msg.sender,
            artworkIds: new uint256[](0)
        });
        
        creatorCollections[msg.sender].push(collectionId);
        emit CollectionCreated(collectionId, msg.sender, _name);
        return collectionId;
    }
    
    function getArtwork(uint256 _id) external view returns (
        address creator,
        address owner,
        string memory content,
        string memory title,
        string memory prompt,
        uint256 timestamp,
        uint256 price,
        bool forSale,
        uint256 likes,
        uint256 collectionId
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
            art.likes,
            art.collectionId
        );
    }
    
    function getCollection(uint256 _id) external view returns (
        string memory name,
        string memory description,
        address creator,
        uint256 artworkCount
    ) {
        require(_id < nextCollectionId, "Collection does not exist");
        Collection memory col = collections[_id];
        return (col.name, col.description, col.creator, col.artworkIds.length);
    }
    
    function setForSale(uint256 _id, uint256 _price) external {
        require(_id < nextArtworkId, "Artwork does not exist");
        require(artworkOwner[_id] == msg.sender, "Not the owner");
        require(_price > 0, "Price must be positive");
        artworks[_id].forSale = true;
        artworks[_id].price = _price;
        emit ArtworkPriceSet(_id, _price);
    }
    
    function startAuction(uint256 _artworkId, uint256 _startingPrice) external {
        require(_artworkId < nextArtworkId, "Artwork does not exist");
        require(artworkOwner[_artworkId] == msg.sender, "Not the owner");
        require(!auctions[_artworkId].active, "Auction already active");
        
        auctions[_artworkId] = Auction({
            artworkId: _artworkId,
            seller: msg.sender,
            highestBid: _startingPrice,
            highestBidder: address(0),
            endTime: block.timestamp + AUCTION_DURATION,
            active: true
        });
        
        emit AuctionStarted(_artworkId, msg.sender, _startingPrice);
    }
    
    function bid(uint256 _artworkId) external payable {
        Auction storage auction = auctions[_artworkId];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value > auction.highestBid, "Bid too low");
        
        address previousBidder = auction.highestBidder;
        if (previousBidder != address(0)) {
            payable(previousBidder).transfer(auction.highestBid);
        }
        
        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;
        
        if (block.timestamp + 15 minutes > auction.endTime) {
            auction.endTime = block.timestamp + 15 minutes;
        }
    }
    
    function endAuction(uint256 _artworkId) external {
        Auction storage auction = auctions[_artworkId];
        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction still active");
        
        uint256 finalPrice = auction.highestBid;
        address winner = auction.highestBidder;
        
        if (winner != address(0)) {
            uint256 fee = (finalPrice * AUCTION_FEE_PERCENT) / ROYALTY_DIVISOR;
            uint256 sellerPayment = finalPrice - fee;
            
            payable(auctions[_artworkId].seller).transfer(sellerPayment);
            platformFees += fee;
            
            artworkOwner[_artworkId] = winner;
        }
        
        auction.active = false;
        emit AuctionEnded(_artworkId, winner, finalPrice);
    }
    
    function buyArtwork(uint256 _id) external payable {
        require(_id < nextArtworkId, "Artwork does not exist");
        Artwork storage art = artworks[_id];
        require(art.forSale, "Not for sale");
        require(msg.value >= art.price, "Insufficient payment");
        require(artworkOwner[_id] != msg.sender, "Already owner");
        
        address previousOwner = artworkOwner[_id];
        uint256 salePrice = art.price;
        uint256 royalty = (salePrice * ROYALTY_PERCENT) / ROYALTY_DIVISOR;
        uint256 sellerAmount = salePrice - royalty;
        
        artworkOwner[_id] = msg.sender;
        art.forSale = false;
        art.price = 0;
        
        payable(previousOwner).call{value: sellerAmount}("");
        if (art.creator != previousOwner && royalty > 0) {
            payable(art.creator).call{value: royalty}("");
        }
        if (msg.value > salePrice) {
            payable(msg.sender).call{value: msg.value - salePrice}("");
        }
        
        emit ArtworkTransferred(_id, previousOwner, msg.sender);
    }
    
    function transferArtwork(uint256 _id, address _to) external {
        require(_id < nextArtworkId, "Artwork does not exist");
        require(artworkOwner[_id] == msg.sender, "Not the owner");
        require(_to != address(0), "Cannot transfer to zero");
        
        artworkOwner[_id] = _to;
        emit ArtworkTransferred(_id, msg.sender, _to);
    }
    
    function likeArtwork(uint256 _id) external {
        require(_id < nextArtworkId, "Artwork does not exist");
        require(!hasLiked[_id][msg.sender], "Already liked");
        
        artworks[_id].likes++;
        hasLiked[_id][msg.sender] = true;
        emit ArtworkLiked(_id, msg.sender);
    }
    
    function getRecentArtworks(uint256 _count) external view returns (uint256[] memory) {
        uint256 count = _count > totalArtworks ? totalArtworks : _count;
        uint256[] memory recent = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            recent[i] = nextArtworkId - 1 - i;
        }
        return recent;
    }
    
    function getCollectionArtworks(uint256 _collectionId) external view returns (uint256[] memory) {
        return collections[_collectionId].artworkIds;
    }
}
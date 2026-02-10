const { expect } = require("chai");
const hre = require("hardhat");

describe("ASCIIArt Contract", function () {
  let asciiArt;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const SAMPLE_ART = `╔══════════════════╗
║ TEST ART         ║
╚══════════════════╝`;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await hre.ethers.getSigners();
    
    const ASCIIArt = await hre.ethers.getContractFactory("ASCIIArt");
    asciiArt = await ASCIIArt.deploy();
    await asciiArt.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right initial state", async function () {
      expect(await asciiArt.totalArtworks()).to.equal(0);
      expect(await asciiArt.nextArtworkId()).to.equal(0);
    });
  });

  describe("Artwork Creation", function () {
    it("Should create an artwork", async function () {
      await expect(asciiArt.createArtwork(SAMPLE_ART, "Test Title", "Test Prompt"))
        .to.emit(asciiArt, "ArtworkCreated")
        .withArgs(0, owner.address, "Test Title");

      expect(await asciiArt.totalArtworks()).to.equal(1);
      
      const artwork = await asciiArt.getArtwork(0);
      expect(artwork.creator).to.equal(owner.address);
      expect(artwork.owner).to.equal(owner.address);
      expect(artwork.title).to.equal("Test Title");
      expect(artwork.prompt).to.equal("Test Prompt");
      expect(artwork.forSale).to.equal(false);
      expect(artwork.likes).to.equal(0);
    });

    it("Should reject empty content", async function () {
      await expect(
        asciiArt.createArtwork("", "Title", "Prompt")
      ).to.be.revertedWith("Content cannot be empty");
    });

    it("Should reject oversized content", async function () {
      const largeContent = "x".repeat(10001);
      await expect(
        asciiArt.createArtwork(largeContent, "Title", "Prompt")
      ).to.be.revertedWith("Content too large");
    });

    it("Should track creator artworks", async function () {
      await asciiArt.createArtwork(SAMPLE_ART, "Art 1", "Prompt 1");
      await asciiArt.createArtwork(SAMPLE_ART, "Art 2", "Prompt 2");

      const creatorWorks = await asciiArt.getCreatorArtworks(owner.address);
      expect(creatorWorks.length).to.equal(2);
      expect(creatorWorks[0]).to.equal(0);
      expect(creatorWorks[1]).to.equal(1);
    });
  });

  describe("Liking", function () {
    beforeEach(async function () {
      await asciiArt.createArtwork(SAMPLE_ART, "Test", "Prompt");
    });

    it("Should allow liking an artwork", async function () {
      await expect(asciiArt.likeArtwork(0))
        .to.emit(asciiArt, "ArtworkLiked")
        .withArgs(0, owner.address);

      const artwork = await asciiArt.getArtwork(0);
      expect(artwork.likes).to.equal(1);
    });

    it("Should prevent double liking", async function () {
      await asciiArt.likeArtwork(0);
      await expect(asciiArt.likeArtwork(0))
        .to.be.revertedWith("Already liked");
    });

    it("Should prevent liking non-existent artwork", async function () {
      await expect(asciiArt.likeArtwork(999))
        .to.be.revertedWith("Artwork does not exist");
    });

    it("Should allow multiple users to like", async function () {
      await asciiArt.likeArtwork(0);
      await asciiArt.connect(addr1).likeArtwork(0);
      await asciiArt.connect(addr2).likeArtwork(0);

      const artwork = await asciiArt.getArtwork(0);
      expect(artwork.likes).to.equal(3);
    });
  });

  describe("Selling", function () {
    beforeEach(async function () {
      await asciiArt.createArtwork(SAMPLE_ART, "Test", "Prompt");
    });

    it("Should allow owner to set for sale", async function () {
      const price = hre.ethers.parseEther("0.1");
      
      await expect(asciiArt.setForSale(0, price))
        .to.emit(asciiArt, "ArtworkPriceSet")
        .withArgs(0, price);

      const artwork = await asciiArt.getArtwork(0);
      expect(artwork.forSale).to.equal(true);
      expect(artwork.price).to.equal(price);
    });

    it("Should prevent non-owner from setting for sale", async function () {
      const price = hre.ethers.parseEther("0.1");
      await expect(
        asciiArt.connect(addr1).setForSale(0, price)
      ).to.be.revertedWith("Not the owner");
    });

    it("Should require positive price", async function () {
      await expect(
        asciiArt.setForSale(0, 0)
      ).to.be.revertedWith("Price must be positive");
    });

    it("Should allow canceling sale", async function () {
      const price = hre.ethers.parseEther("0.1");
      await asciiArt.setForSale(0, price);
      
      await expect(asciiArt.cancelSale(0))
        .to.emit(asciiArt, "ArtworkSaleCancelled")
        .withArgs(0);

      const artwork = await asciiArt.getArtwork(0);
      expect(artwork.forSale).to.equal(false);
      expect(artwork.price).to.equal(0);
    });
  });

  describe("Buying", function () {
    const price = hre.ethers.parseEther("0.1");

    beforeEach(async function () {
      await asciiArt.createArtwork(SAMPLE_ART, "Test", "Prompt");
      await asciiArt.setForSale(0, price);
    });

    it("Should allow buying artwork", async function () {
      const sellerBalanceBefore = await hre.ethers.provider.getBalance(owner.address);
      
      await expect(
        asciiArt.connect(addr1).buyArtwork(0, { value: price })
      )
        .to.emit(asciiArt, "ArtworkTransferred")
        .withArgs(0, owner.address, addr1.address);

      const artwork = await asciiArt.getArtwork(0);
      expect(artwork.owner).to.equal(addr1.address);
      expect(artwork.forSale).to.equal(false);
    });

    it("Should refund overpayment", async function () {
      const overpayment = hre.ethers.parseEther("0.2");
      const buyerBalanceBefore = await hre.ethers.provider.getBalance(addr1.address);
      
      const tx = await asciiArt.connect(addr1).buyArtwork(0, { value: overpayment });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const buyerBalanceAfter = await hre.ethers.provider.getBalance(addr1.address);
      const expectedBalance = buyerBalanceBefore - price - gasUsed;
      
      // Allow small rounding difference
      expect(buyerBalanceAfter).to.be.closeTo(expectedBalance, hre.ethers.parseEther("0.0001"));
    });

    it("Should require sufficient payment", async function () {
      const insufficient = hre.ethers.parseEther("0.05");
      await expect(
        asciiArt.connect(addr1).buyArtwork(0, { value: insufficient })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should prevent buying from self", async function () {
      await expect(
        asciiArt.buyArtwork(0, { value: price })
      ).to.be.revertedWith("Already owner");
    });

    it("Should prevent buying non-listed artwork", async function () {
      await asciiArt.cancelSale(0);
      await expect(
        asciiArt.connect(addr1).buyArtwork(0, { value: price })
      ).to.be.revertedWith("Not for sale");
    });
  });

  describe("Transferring", function () {
    beforeEach(async function () {
      await asciiArt.createArtwork(SAMPLE_ART, "Test", "Prompt");
    });

    it("Should allow owner to transfer", async function () {
      await expect(asciiArt.transferArtwork(0, addr1.address))
        .to.emit(asciiArt, "ArtworkTransferred")
        .withArgs(0, owner.address, addr1.address);

      const artwork = await asciiArt.getArtwork(0);
      expect(artwork.owner).to.equal(addr1.address);
    });

    it("Should prevent non-owner from transferring", async function () {
      await expect(
        asciiArt.connect(addr1).transferArtwork(0, addr2.address)
      ).to.be.revertedWith("Not the owner");
    });

    it("Should prevent transfer to zero address", async function () {
      await expect(
        asciiArt.transferArtwork(0, hre.ethers.ZeroAddress)
      ).to.be.revertedWith("Cannot transfer to zero address");
    });

    it("Should prevent transfer to self", async function () {
      await expect(
        asciiArt.transferArtwork(0, owner.address)
      ).to.be.revertedWith("Cannot transfer to self");
    });
  });

  describe("Recent Artworks", function () {
    it("Should return recent artworks in reverse order", async function () {
      await asciiArt.createArtwork(SAMPLE_ART, "Art 1", "Prompt");
      await asciiArt.createArtwork(SAMPLE_ART, "Art 2", "Prompt");
      await asciiArt.createArtwork(SAMPLE_ART, "Art 3", "Prompt");

      const recent = await asciiArt.getRecentArtworks(2);
      expect(recent.length).to.equal(2);
      expect(recent[0]).to.equal(2); // Most recent
      expect(recent[1]).to.equal(1);
    });

    it("Should handle requesting more than available", async function () {
      await asciiArt.createArtwork(SAMPLE_ART, "Art 1", "Prompt");
      
      const recent = await asciiArt.getRecentArtworks(10);
      expect(recent.length).to.equal(1);
    });

    it("Should return empty array when no artworks", async function () {
      const recent = await asciiArt.getRecentArtworks(5);
      expect(recent.length).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should prevent getting non-existent artwork", async function () {
      await expect(asciiArt.getArtwork(999))
        .to.be.revertedWith("Artwork does not exist");
    });

    it("Should handle multiple artworks from different creators", async function () {
      await asciiArt.createArtwork(SAMPLE_ART, "Owner Art", "Prompt");
      await asciiArt.connect(addr1).createArtwork(SAMPLE_ART, "Addr1 Art", "Prompt");
      await asciiArt.connect(addr2).createArtwork(SAMPLE_ART, "Addr2 Art", "Prompt");

      expect(await asciiArt.totalArtworks()).to.equal(3);
      
      const ownerWorks = await asciiArt.getCreatorArtworks(owner.address);
      const addr1Works = await asciiArt.getCreatorArtworks(addr1.address);
      
      expect(ownerWorks.length).to.equal(1);
      expect(addr1Works.length).to.equal(1);
    });
  });
});

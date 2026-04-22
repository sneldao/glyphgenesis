import { expect } from "chai";
import hre from "hardhat";

describe("GlyphGenesis Contract", function () {
  let glyphGenesis;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const SAMPLE_ART = `╔══════════════════╗
║ TEST ART         ║
╚══════════════════╝`;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await hre.ethers.getSigners();

    const GlyphGenesis = await hre.ethers.getContractFactory("GlyphGenesis");
    glyphGenesis = await GlyphGenesis.deploy();
    await glyphGenesis.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right initial state", async function () {
      expect(await glyphGenesis.totalArtworks()).to.equal(0);
      expect(await glyphGenesis.nextArtworkId()).to.equal(0);
      expect(await glyphGenesis.name()).to.equal("GlyphGenesis");
      expect(await glyphGenesis.symbol()).to.equal("GLYPH");
      expect(await glyphGenesis.owner()).to.equal(owner.address);
    });

    it("Should not be paused initially", async function () {
      expect(await glyphGenesis.paused()).to.equal(false);
    });
  });

  describe("Artwork Creation (ERC721)", function () {
    it("Should create an artwork and mint ERC721 token", async function () {
      await expect(glyphGenesis.createArtwork(SAMPLE_ART, "Test Title", "Test Prompt"))
        .to.emit(glyphGenesis, "ArtworkCreated")
        .withArgs(0, owner.address, "Test Title");

      expect(await glyphGenesis.totalArtworks()).to.equal(1);
      expect(await glyphGenesis.ownerOf(0)).to.equal(owner.address);
      expect(await glyphGenesis.balanceOf(owner.address)).to.equal(1);

      const artwork = await glyphGenesis.getArtwork(0);
      expect(artwork.creator).to.equal(owner.address);
      expect(artwork.owner).to.equal(owner.address);
      expect(artwork.title).to.equal("Test Title");
      expect(artwork.prompt).to.equal("Test Prompt");
      expect(artwork.forSale).to.equal(false);
      expect(artwork.likes).to.equal(0);
    });

    it("Should reject empty content", async function () {
      await expect(
        glyphGenesis.createArtwork("", "Title", "Prompt")
      ).to.be.revertedWith("Content cannot be empty");
    });

    it("Should reject oversized content", async function () {
      const largeContent = "x".repeat(10001);
      await expect(
        glyphGenesis.createArtwork(largeContent, "Title", "Prompt")
      ).to.be.revertedWith("Content too large");
    });

    it("Should enforce mint cooldown", async function () {
      await glyphGenesis.createArtwork(SAMPLE_ART, "Art 1", "Prompt 1");
      await expect(
        glyphGenesis.createArtwork(SAMPLE_ART, "Art 2", "Prompt 2")
      ).to.be.revertedWith("Mint cooldown active");
    });

    it("Should track creator artworks", async function () {
      await glyphGenesis.createArtwork(SAMPLE_ART, "Art 1", "Prompt 1");
      // Wait for cooldown
      await hre.network.provider.send("evm_increaseTime", [31]);
      await hre.network.provider.send("evm_mine");
      await glyphGenesis.createArtwork(SAMPLE_ART, "Art 2", "Prompt 2");

      const creatorWorks = await glyphGenesis.getCreatorArtworks(owner.address);
      expect(creatorWorks.length).to.equal(2);
      expect(creatorWorks[0]).to.equal(0);
      expect(creatorWorks[1]).to.equal(1);
    });

    it("Should return tokenURI with metadata", async function () {
      await glyphGenesis.createArtwork(SAMPLE_ART, "Test", "circles pattern");
      const uri = await glyphGenesis.tokenURI(0);
      expect(uri).to.include("data:application/json");
      expect(uri).to.include("Test");
    });
  });

  describe("Batch Creation", function () {
    it("Should batch create artworks", async function () {
      const contents = [SAMPLE_ART, SAMPLE_ART, SAMPLE_ART];
      const titles = ["Art 1", "Art 2", "Art 3"];
      const prompts = ["P1", "P2", "P3"];

      const tx = await glyphGenesis.batchCreateArtwork(contents, titles, prompts);
      await tx.wait();

      expect(await glyphGenesis.totalArtworks()).to.equal(3);
      expect(await glyphGenesis.ownerOf(0)).to.equal(owner.address);
      expect(await glyphGenesis.ownerOf(2)).to.equal(owner.address);
    });

    it("Should reject mismatched array lengths", async function () {
      await expect(
        glyphGenesis.batchCreateArtwork([SAMPLE_ART], ["T1", "T2"], ["P1"])
      ).to.be.revertedWith("Array length mismatch");
    });

    it("Should reject batch larger than 10", async function () {
      const big = new Array(11).fill(SAMPLE_ART);
      const titles = new Array(11).fill("T");
      const prompts = new Array(11).fill("P");
      await expect(
        glyphGenesis.batchCreateArtwork(big, titles, prompts)
      ).to.be.revertedWith("Max batch size is 10");
    });
  });

  describe("Liking", function () {
    beforeEach(async function () {
      await glyphGenesis.createArtwork(SAMPLE_ART, "Test", "Prompt");
    });

    it("Should allow liking an artwork", async function () {
      await expect(glyphGenesis.likeArtwork(0))
        .to.emit(glyphGenesis, "ArtworkLiked")
        .withArgs(0, owner.address);

      const artwork = await glyphGenesis.getArtwork(0);
      expect(artwork.likes).to.equal(1);
    });

    it("Should prevent double liking", async function () {
      await glyphGenesis.likeArtwork(0);
      await expect(glyphGenesis.likeArtwork(0))
        .to.be.revertedWith("Already liked");
    });

    it("Should prevent liking non-existent artwork", async function () {
      await expect(glyphGenesis.likeArtwork(999))
        .to.be.revertedWith("Artwork does not exist");
    });

    it("Should allow multiple users to like", async function () {
      await glyphGenesis.likeArtwork(0);
      await glyphGenesis.connect(addr1).likeArtwork(0);
      await glyphGenesis.connect(addr2).likeArtwork(0);

      const artwork = await glyphGenesis.getArtwork(0);
      expect(artwork.likes).to.equal(3);
    });
  });

  describe("Selling", function () {
    beforeEach(async function () {
      await glyphGenesis.createArtwork(SAMPLE_ART, "Test", "Prompt");
    });

    it("Should allow owner to set for sale", async function () {
      const price = hre.ethers.parseEther("0.1");

      await expect(glyphGenesis.setForSale(0, price))
        .to.emit(glyphGenesis, "ArtworkPriceSet")
        .withArgs(0, price);

      const artwork = await glyphGenesis.getArtwork(0);
      expect(artwork.forSale).to.equal(true);
      expect(artwork.price).to.equal(price);
    });

    it("Should prevent non-owner from setting for sale", async function () {
      const price = hre.ethers.parseEther("0.1");
      await expect(
        glyphGenesis.connect(addr1).setForSale(0, price)
      ).to.be.revertedWith("Not the owner");
    });

    it("Should require positive price", async function () {
      await expect(
        glyphGenesis.setForSale(0, 0)
      ).to.be.revertedWith("Price must be positive");
    });

    it("Should allow canceling sale", async function () {
      const price = hre.ethers.parseEther("0.1");
      await glyphGenesis.setForSale(0, price);

      await expect(glyphGenesis.cancelSale(0))
        .to.emit(glyphGenesis, "ArtworkSaleCancelled")
        .withArgs(0);

      const artwork = await glyphGenesis.getArtwork(0);
      expect(artwork.forSale).to.equal(false);
      expect(artwork.price).to.equal(0);
    });
  });

  describe("Buying", function () {
    const price = hre.ethers.parseEther("0.1");

    beforeEach(async function () {
      await glyphGenesis.createArtwork(SAMPLE_ART, "Test", "Prompt");
      await glyphGenesis.setForSale(0, price);
    });

    it("Should allow buying artwork with ERC721 transfer", async function () {
      await expect(
        glyphGenesis.connect(addr1).buyArtwork(0, { value: price })
      )
        .to.emit(glyphGenesis, "ArtworkTransferred")
        .withArgs(0, owner.address, addr1.address);

      const artwork = await glyphGenesis.getArtwork(0);
      expect(artwork.owner).to.equal(addr1.address);
      expect(artwork.forSale).to.equal(false);
      // ERC721 ownership should transfer
      expect(await glyphGenesis.ownerOf(0)).to.equal(addr1.address);
    });

    it("Should refund overpayment", async function () {
      const overpayment = hre.ethers.parseEther("0.2");
      const buyerBalanceBefore = await hre.ethers.provider.getBalance(addr1.address);

      const tx = await glyphGenesis.connect(addr1).buyArtwork(0, { value: overpayment });
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
        glyphGenesis.connect(addr1).buyArtwork(0, { value: insufficient })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should prevent buying from self", async function () {
      await expect(
        glyphGenesis.buyArtwork(0, { value: price })
      ).to.be.revertedWith("Already owner");
    });

    it("Should prevent buying non-listed artwork", async function () {
      await glyphGenesis.cancelSale(0);
      await expect(
        glyphGenesis.connect(addr1).buyArtwork(0, { value: price })
      ).to.be.revertedWith("Not for sale");
    });

    it("Should pay creator royalty on secondary sale", async function () {
      // First: owner sells to addr1
      await glyphGenesis.connect(addr1).buyArtwork(0, { value: price });

      // Wait for cooldown, addr1 lists
      await hre.network.provider.send("evm_increaseTime", [31]);
      await hre.network.provider.send("evm_mine");

      const resalePrice = hre.ethers.parseEther("0.2");
      await glyphGenesis.connect(addr1).setForSale(0, resalePrice);

      // addr2 buys — creator (owner) should get royalty
      const creatorBalanceBefore = await hre.ethers.provider.getBalance(owner.address);
      await glyphGenesis.connect(addr2).buyArtwork(0, { value: resalePrice });
      const creatorBalanceAfter = await hre.ethers.provider.getBalance(owner.address);

      const royalty = (resalePrice * 250n) / 10000n;
      expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(royalty);
    });
  });

  describe("ERC721 Standard", function () {
    beforeEach(async function () {
      await glyphGenesis.createArtwork(SAMPLE_ART, "Test", "Prompt");
    });

    it("Should support transferFrom", async function () {
      await glyphGenesis.transferFrom(owner.address, addr1.address, 0);
      expect(await glyphGenesis.ownerOf(0)).to.equal(addr1.address);
    });

    it("Should support approve + transferFrom", async function () {
      await glyphGenesis.approve(addr1.address, 0);
      await glyphGenesis.connect(addr1).transferFrom(owner.address, addr2.address, 0);
      expect(await glyphGenesis.ownerOf(0)).to.equal(addr2.address);
    });

    it("Should support safeTransferFrom", async function () {
      await glyphGenesis.safeTransferFrom(owner.address, addr1.address, 0);
      expect(await glyphGenesis.ownerOf(0)).to.equal(addr1.address);
    });

    it("Should support setApprovalForAll", async function () {
      await glyphGenesis.setApprovalForAll(addr1.address, true);
      expect(await glyphGenesis.isApprovedForAll(owner.address, addr1.address)).to.equal(true);
    });
  });

  describe("Pausable", function () {
    beforeEach(async function () {
      await glyphGenesis.createArtwork(SAMPLE_ART, "Test", "Prompt");
    });

    it("Should allow owner to pause", async function () {
      await glyphGenesis.pause();
      expect(await glyphGenesis.paused()).to.equal(true);
    });

    it("Should prevent non-owner from pausing", async function () {
      await expect(
        glyphGenesis.connect(addr1).pause()
      ).to.be.reverted; // Ownable: caller is not the owner
    });

    it("Should prevent minting when paused", async function () {
      await glyphGenesis.pause();
      await expect(
        glyphGenesis.connect(addr1).createArtwork(SAMPLE_ART, "Paused", "Test")
      ).to.be.reverted; // Enforced pause
    });

    it("Should prevent buying when paused", async function () {
      const price = hre.ethers.parseEther("0.1");
      await glyphGenesis.setForSale(0, price);
      await glyphGenesis.pause();
      await expect(
        glyphGenesis.connect(addr1).buyArtwork(0, { value: price })
      ).to.be.reverted;
    });

    it("Should allow owner to unpause", async function () {
      await glyphGenesis.pause();
      await glyphGenesis.unpause();
      expect(await glyphGenesis.paused()).to.equal(false);
    });
  });

  describe("Recent Artworks", function () {
    it("Should return recent artworks in reverse order", async function () {
      await glyphGenesis.createArtwork(SAMPLE_ART, "Art 1", "Prompt");
      await hre.network.provider.send("evm_increaseTime", [31]);
      await hre.network.provider.send("evm_mine");
      await glyphGenesis.createArtwork(SAMPLE_ART, "Art 2", "Prompt");
      await hre.network.provider.send("evm_increaseTime", [31]);
      await hre.network.provider.send("evm_mine");
      await glyphGenesis.createArtwork(SAMPLE_ART, "Art 3", "Prompt");

      const recent = await glyphGenesis.getRecentArtworks(2);
      expect(recent.length).to.equal(2);
      expect(recent[0]).to.equal(2); // Most recent
      expect(recent[1]).to.equal(1);
    });

    it("Should handle requesting more than available", async function () {
      await glyphGenesis.createArtwork(SAMPLE_ART, "Art 1", "Prompt");

      const recent = await glyphGenesis.getRecentArtworks(10);
      expect(recent.length).to.equal(1);
    });

    it("Should return empty array when no artworks", async function () {
      const recent = await glyphGenesis.getRecentArtworks(5);
      expect(recent.length).to.equal(0);
    });
  });

  describe("Royalty Info", function () {
    it("Should return correct royalty info", async function () {
      await glyphGenesis.createArtwork(SAMPLE_ART, "Test", "Prompt");
      const info = await glyphGenesis.getRoyaltyInfo(0);
      expect(info.creator).to.equal(owner.address);
      expect(info.royaltyAmount).to.be.gt(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should prevent getting non-existent artwork", async function () {
      await expect(glyphGenesis.getArtwork(999))
        .to.be.revertedWith("Artwork does not exist");
    });

    it("Should prevent tokenURI for non-existent token", async function () {
      await expect(glyphGenesis.tokenURI(999))
        .to.be.revertedWith("Artwork does not exist");
    });

    it("Should handle multiple artworks from different creators", async function () {
      await glyphGenesis.createArtwork(SAMPLE_ART, "Owner Art", "Prompt");
      await hre.network.provider.send("evm_increaseTime", [31]);
      await hre.network.provider.send("evm_mine");
      await glyphGenesis.connect(addr1).createArtwork(SAMPLE_ART, "Addr1 Art", "Prompt");
      await hre.network.provider.send("evm_increaseTime", [31]);
      await hre.network.provider.send("evm_mine");
      await glyphGenesis.connect(addr2).createArtwork(SAMPLE_ART, "Addr2 Art", "Prompt");

      expect(await glyphGenesis.totalArtworks()).to.equal(3);

      const ownerWorks = await glyphGenesis.getCreatorArtworks(owner.address);
      const addr1Works = await glyphGenesis.getCreatorArtworks(addr1.address);

      expect(ownerWorks.length).to.equal(1);
      expect(addr1Works.length).to.equal(1);
    });
  });
});

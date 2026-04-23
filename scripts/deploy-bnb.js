import hre from "hardhat";

async function main() {
  console.log("Deploying GlyphGenesisBNB contract...");
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with address:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "BNB");

  // Deploy GlyphGenesisBNB contract
  const GlyphGenesisBNB = await hre.ethers.getContractFactory("GlyphGenesisBNB");
  const contract = await GlyphGenesisBNB.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\n✅ GlyphGenesisBNB deployed to:", address);

  // Create a genesis collection
  console.log("\nCreating genesis collection...");
  const colTx = await contract.createCollection(
    "Genesis Collection",
    "The first collection of GlyphGenesis on BNB Chain"
  );
  await colTx.wait();
  console.log("✅ Genesis collection created!");

  // Create a genesis artwork in the collection
  console.log("\nCreating genesis artwork...");
  const art = `╔══════════════════════════════════════════╗
║ GLYPHGENESIS BNB                          ║
╟──────────────────────────────────────────╢
║            ░░▒▒▓▓██▓▓▒▒░░              ║
║           ░░▒▒▓▓████▓▓▒▒░░             ║
║           ░▒▓██████████▓▒░             ║
║          ░▒▓████████████▓▒░            ║
║          ▒▓██████████████▓▒            ║
║          ▓██████▓▓▓██████▓             ║
╚══════════════════════════════════════════╝`;

  const tx = await contract.createArtwork(
    art,
    "Genesis - BNB Glyph #1",
    "First glyph on BNB Chain",
    0 // collection 0 = Genesis Collection
  );

  await tx.wait();
  console.log("✅ Genesis artwork created!");

  console.log("\n📊 Contract Summary:");
  console.log("- Contract: GlyphGenesisBNB");
  console.log("- Address:", address);
  console.log("- Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);
  console.log("- Deployer:", deployer.address);
  console.log("\n🚀 Ready for marketplace trading with auctions & collections!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

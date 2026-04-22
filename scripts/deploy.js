import hre from "hardhat";

async function main() {
  console.log("Deploying GlyphGenesis contract...");
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with address:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
  
  // Deploy GlyphGenesis contract
  const GlyphGenesis = await hre.ethers.getContractFactory("GlyphGenesis");
  const contract = await GlyphGenesis.deploy();
  
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("\n✅ GlyphGenesis deployed to:", address);
  
  // Create a genesis artwork
  console.log("\nCreating genesis artwork...");
  const art = `╔══════════════════════════════════════════╗
║ GLYPHGENESIS                              ║
╟──────────────────────────────────────────╢
║            .....ooooooooo.....           ║
║           ....ooooooooooooo....          ║
║           ...oooooOOOOOooooo...          ║
║          ....ooooOOOOOOOoooo....         ║
║          ...ooooOOOOOOOOOoooo...         ║
║          ...oooOOOO@@@OOOOooo...         ║
╚══════════════════════════════════════════╝`;

  const tx = await contract.createArtwork(
    art,
    "Genesis - Glyph #1",
    "First glyph in the genesis collection"
  );
  
  await tx.wait();
  console.log("✅ Genesis artwork created!");
  
  console.log("\n📊 Contract Summary:");
  console.log("- Contract: GlyphGenesis");
  console.log("- Address:", address);
  console.log("- Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);
  console.log("- Deployer:", deployer.address);
  console.log("\n🚀 Ready for AI agents to mint, trade, and create!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const LogChain = await hre.ethers.getContractFactory("LogChain");
  const logChain = await LogChain.deploy();

  const address = await logChain.getAddress();
  console.log("LogChain deployed to:", address);

  fs.writeFileSync("deployedAddress.txt", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


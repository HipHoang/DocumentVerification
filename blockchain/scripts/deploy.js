const hre = require("hardhat");

async function main() {
  console.log("Đang bắt đầu deploy hợp đồng Certificate...");

  // Lấy contract factory
  const Certificate = await hre.ethers.getContractFactory("Certificate");

  // Triển khai hợp đồng
  const certificate = await Certificate.deploy();

  // Đợi cho đến khi giao dịch hoàn tất (Ethers v6)
  await certificate.waitForDeployment();

  const address = await certificate.getAddress();
  console.log("----------------------------------------------");
  console.log(`Hợp đồng đã được deploy thành công tại: ${address}`);
  console.log("----------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
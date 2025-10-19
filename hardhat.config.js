require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.21",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: [
        "0xdf587ef4abc2265d74a454e1f0858476b6d90d71b30324fe29cab7cb5423bda4"
      ]
    }
  }
};

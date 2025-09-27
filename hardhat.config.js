require("@nomiclabs/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.24",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        hardhat: {
            chainId: 1337,
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 1337,
        },
        rskTestnet: {
            url: process.env.RSK_TESTNET_URL || "https://public-node.testnet.rsk.co",
            chainId: 31,
            accounts: ['17e530f2c112d976008bd4a7efd4b6bfcbbc027777d9e9f0729a87872f4da593']
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};
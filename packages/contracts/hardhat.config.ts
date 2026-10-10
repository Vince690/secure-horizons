import path from "node:path";
import { config as loadEnv } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

// Single .env at the monorepo root. GUARDIAN_PRIVATE_KEY is a dedicated hackathon wallet.
loadEnv({ path: path.resolve(__dirname, "../../.env") });

const pk = process.env.GUARDIAN_PRIVATE_KEY?.trim();
const accounts = pk && /^0x[0-9a-fA-F]{64}$/.test(pk) ? [pk] : [];

const config: HardhatUserConfig = {
  solidity: { version: "0.8.24", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    hardhat: {},
    // Avalanche Fuji C-Chain, TESTNET ONLY. No mainnet entry on purpose.
    fuji: {
      url: process.env.FUJI_RPC_URL ?? "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts,
    },
  },
  etherscan: {
    // Snowtrace (routescan) verification for Fuji; no key needed.
    apiKey: { avalancheFujiTestnet: "verifyContract" },
    customChains: [
      {
        network: "avalancheFujiTestnet",
        chainId: 43113,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan",
          browserURL: "https://testnet.snowtrace.io",
        },
      },
    ],
  },
};

export default config;

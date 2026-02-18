import dotenv from 'dotenv';
dotenv.config();

export const env = {
  privateKey: process.env.STACKS_PRIVATE_KEY,
  mainnetUrl: process.env.STACKS_MAINNET_URL,
  testnetUrl: process.env.STACKS_TESTNET_URL,
};

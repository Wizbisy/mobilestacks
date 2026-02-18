import { z } from "zod";

export const NetworkConfigSchema = z.object({
  url: z.string().url(),
  name: z.string(),
  explorerUrl: z.string().url().optional(),
  faucetUrl: z.string().url().nullable().optional(),
});


// Wallet config: allow privateKey, seedPhrase, or both. If both, privateKey is used.
export const WalletConfigSchema = z.object({
  privateKey: z.string().min(1, "Private key is required").optional(),
  seedPhrase: z.string().optional(),
  derivationPath: z.string().optional(),
  address: z.string().optional(),
}).refine(
  (data) => data.privateKey || data.seedPhrase,
  { message: "Either privateKey or seedPhrase is required" }
);

export const MobilestacksConfigSchema = z.object({
  networks: z.record(NetworkConfigSchema),
  defaultNetwork: z.string(),
  wallet: WalletConfigSchema,
});

export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;
export type WalletConfig = z.infer<typeof WalletConfigSchema>;
export type MobilestacksConfig = z.infer<typeof MobilestacksConfigSchema>;

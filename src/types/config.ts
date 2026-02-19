import { z } from "zod";

export const NetworkConfigSchema = z.object({
  url: z.string().url(),
  name: z.string(),
  explorerUrl: z.string().url().optional(),
  faucetUrl: z.string().url().nullable().optional(),
});


// Wallet config: secrets are resolved at runtime from env vars.
// Config values are optional fallbacks.
export const WalletConfigSchema = z.object({
  privateKey: z.string().optional(),
  seedPhrase: z.string().optional(),
  derivationPath: z.string().optional(),
  address: z.string().optional(),
});

export const MobilestacksConfigSchema = z.object({
  networks: z.record(NetworkConfigSchema),
  defaultNetwork: z.string(),
  wallet: WalletConfigSchema,
});

export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;
export type WalletConfig = z.infer<typeof WalletConfigSchema>;
export type MobilestacksConfig = z.infer<typeof MobilestacksConfigSchema>;

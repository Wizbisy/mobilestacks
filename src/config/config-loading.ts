import { MobilestacksConfigSchema, MobilestacksConfig } from '../types/config';
import path from 'path';
import fs from 'fs';
import { env } from '../core/env';

type RawConfig = {
  networks?: Record<string, { url?: string }>;
  wallet?: { privateKey?: string };
  [key: string]: unknown;
};

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

export function loadConfig(
  configPath?: string,
  cliOverrides: Record<string, unknown> = {},
): MobilestacksConfig {
  const configFile = configPath || path.resolve(process.cwd(), 'mobilestacks.config.ts');
  if (!fs.existsSync(configFile)) {
    throw new Error(`Config file not found: ${configFile}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  require('ts-node').register();
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const userConfig = require(configFile);
  const config: RawConfig = { ...(userConfig.default || userConfig) };
  config.wallet = { ...(config.wallet || {}) };
  config.networks = { ...(config.networks || {}) };

  if (env.privateKey) config.wallet.privateKey = env.privateKey;
  if (env.mainnetUrl && config.networks.mainnet) {
    config.networks.mainnet.url = stripTrailingSlash(env.mainnetUrl);
  }
  if (env.testnetUrl && config.networks.testnet) {
    config.networks.testnet.url = stripTrailingSlash(env.testnetUrl);
  }

  const configWithOverrides = { ...config, ...cliOverrides };

  const parsed = MobilestacksConfigSchema.safeParse(configWithOverrides);
  if (!parsed.success) {
    throw new Error('Invalid mobilestacks.config.ts: ' + JSON.stringify(parsed.error.format(), null, 2));
  }
  return parsed.data;
}

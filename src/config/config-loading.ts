import { MobilestacksConfigSchema, MobilestacksConfig } from '../types/config';
import path from 'path';
import fs from 'fs';
import { env } from '../core/env';

export function loadConfig(configPath?: string, cliOverrides: Record<string, unknown> = {}): MobilestacksConfig {
  const configFile = configPath || path.resolve(process.cwd(), 'mobilestacks.config.ts');
  if (!fs.existsSync(configFile)) {
    throw new Error(`Config file not found: ${configFile}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  require('ts-node').register();
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const userConfig = require(configFile);
  let config = userConfig.default || userConfig;

  // .env override
  if (env.privateKey) config.wallet.privateKey = env.privateKey;
  if (env.mainnetUrl) config.networks.mainnet.url = env.mainnetUrl.replace(/\/$/, "");
  if (env.testnetUrl) config.networks.testnet.url = env.testnetUrl.replace(/\/$/, "");

  // CLI overrides
  config = { ...config, ...cliOverrides };

  const parsed = MobilestacksConfigSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error('Invalid mobilestacks.config.ts: ' + JSON.stringify(parsed.error.format(), null, 2));
  }
  return parsed.data;
}

import { task } from '../core/dsl';
import { generateSecretKey } from '@stacks/wallet-sdk';
import fs from 'fs';
import path from 'path';

task('setupsimnet', 'Generates Simnet.toml and Devnet.toml with test accounts')
  .setAction(async () => {
    const dir = path.resolve(process.cwd(), 'settings');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const accounts = ['deployer', 'wallet_1', 'wallet_2'];
    const sections = accounts.map((name) => {
      const mnemonic = generateSecretKey();
      return `[accounts.${name}]\nmnemonic = "${mnemonic}"\nbalance = 100_000_000_000_000`;
    });

    const toml = `[network]\nname = "simnet"\n\n${sections.join('\n\n')}\n`;

    fs.writeFileSync(path.join(dir, 'Simnet.toml'), toml, 'utf-8');
    fs.writeFileSync(path.join(dir, 'Devnet.toml'), toml.replace(/simnet/g, 'devnet'), 'utf-8');

    return 'Generated settings/Simnet.toml and settings/Devnet.toml with test accounts';
  });

import { generateSecretKey } from '@stacks/wallet-sdk';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('settings');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const accounts = ['deployer', 'wallet_1', 'wallet_2'];
const sections = accounts.map(name => {
  const mnemonic = generateSecretKey();
  return `[accounts.${name}]\nmnemonic = "${mnemonic}"\nbalance = 100_000_000_000_000`;
});

const toml = `[network]\nname = "simnet"\n\n${sections.join('\n\n')}\n`;

fs.writeFileSync(path.join(dir, 'Simnet.toml'), toml, 'utf-8');
fs.writeFileSync(path.join(dir, 'Devnet.toml'), toml.replace(/simnet/g, 'devnet'), 'utf-8');

console.log('✓ Generated settings/Simnet.toml and settings/Devnet.toml with test accounts');

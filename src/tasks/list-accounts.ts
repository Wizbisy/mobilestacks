import { task } from '../core/dsl';
import { generateWallet } from '@stacks/wallet-sdk';

function maskAddress(address: string) {
  return address ? address.slice(0, 6) + '...' + address.slice(-4) : '';
}

function containsSecret(obj: unknown): boolean {
  const str = JSON.stringify(obj);
  return /[A-Za-z0-9]{32,}/.test(str); // crude check for long secrets
}

task('list-accounts', 'List all accounts derived from the configured seed phrase')
  .setAction(async (args, env) => {
    if (!env.config.wallet.seedPhrase) {
      throw new Error('No seed phrase configured.');
    }
    const wallet = await generateWallet({ secretKey: env.config.wallet.seedPhrase, password: '' });
    const result = wallet.accounts.map((a: unknown) => ({
      address: maskAddress((a as { address: string }).address || (a as { stxAddress: string }).stxAddress),
      index: (a as { index: number }).index
    }));
    if (containsSecret(result)) {
      console.warn('[mobilestacks] Warning: Output may contain sensitive data.');
    }
    return result;
  });

import { task } from '../core/dsl';
import { generateWallet } from '@stacks/wallet-sdk';
import { getAddressFromPrivateKey } from '@stacks/transactions';

function containsSecret(obj: unknown): boolean {
  const str = JSON.stringify(obj);
  return /[A-Za-z0-9]{32,}/.test(str); // crude check for long secrets
}

task('list-accounts', 'List all accounts derived from the configured seed phrase')
  .addParam('network', 'Network (mainnet|testnet)', { type: 'string', required: false, defaultValue: 'testnet' })
  .setAction(async (args, env) => {
    const networkName = args.network as string;
    
    if (!env.config.wallet.seedPhrase) {
      throw new Error('No seed phrase configured.');
    }
    const wallet = await generateWallet({ secretKey: env.config.wallet.seedPhrase, password: '' });
    
    const result = wallet.accounts.map((a: unknown) => {
      const account = a as { index: number; stxPrivateKey: string };
      const address = getAddressFromPrivateKey(account.stxPrivateKey, networkName === 'mainnet' ? 'mainnet' : 'testnet');
      return {
        address,
        index: account.index
      };
    });
    
    if (containsSecret(result)) {
      console.warn('[mobilestacks] Warning: Output may contain sensitive data.');
    }
    return result;
  });

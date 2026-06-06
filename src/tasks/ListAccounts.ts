import { task } from '../core/dsl';
import { generateWallet } from '@stacks/wallet-sdk';
import { getAddressFromPrivateKey } from '@stacks/transactions';
import { getSupportedNetworkName, warnIfSensitiveOutput } from './utils';

type WalletAccount = {
  index: number;
  stxPrivateKey: string;
};

task('listaccounts', 'List all accounts derived from the configured seed phrase')
  .addParam('network', 'Network (mainnet|testnet)', {
    type: 'string',
    required: false,
    defaultValue: 'testnet',
  })
  .setAction(async (args, env) => {
    const networkName = getSupportedNetworkName(args.network);
    const seedPhrase =
      process.env.MOBILESTACKS_SEED_PHRASE ||
      process.env.STACKS_SEED_PHRASE ||
      env.config.wallet.seedPhrase;

    if (!seedPhrase) {
      throw new Error('No seed phrase configured.');
    }

    const wallet = await generateWallet({ secretKey: seedPhrase, password: '' });
    const result = (wallet.accounts as WalletAccount[]).map((account) => {
      const address = getAddressFromPrivateKey(account.stxPrivateKey, networkName);
      return {
        address,
        index: account.index,
      };
    });

    warnIfSensitiveOutput(result);
    return result;
  });

import dotenv from 'dotenv';
import { createNetwork, StacksNetwork } from '@stacks/network';
import { getAddressFromPrivateKey } from '@stacks/transactions';
import { generateWallet } from '@stacks/wallet-sdk';
import { MobilestacksConfig, NetworkConfig } from '../types/config';
import { Extender } from './extender';

dotenv.config({ quiet: true });

type RuntimeWallet = {
  privateKey: string;
  address: string;
  accountIndex?: number;
};

export class RuntimeEnvironment {
  public config: MobilestacksConfig;
  public network: StacksNetwork;
  public wallet: RuntimeWallet = { privateKey: '', address: '' };
  public stacks: Record<string, unknown> = {};
  public ready: Promise<void>;
  [key: string]: unknown;

  constructor(config: MobilestacksConfig) {
    this.config = config;

    const networkName = config.defaultNetwork;
    const networkConfig: NetworkConfig | undefined = config.networks[networkName];
    if (!networkConfig) {
      throw new Error(`Network config not found for: ${networkName}`);
    }

    this.network = createNetwork({
      network: networkName === 'mainnet' ? 'mainnet' : 'testnet',
      client: { baseUrl: networkConfig.url },
    });

    this.ready = this.initializeWallet(networkName);

    for (const extension of Extender.getInstance().getExtensions()) {
      extension(this);
    }
  }

  private async initializeWallet(networkName: string): Promise<void> {
    const privateKey =
      process.env.MOBILESTACKS_PRIVATE_KEY ||
      process.env.STACKS_PRIVATE_KEY ||
      this.config.wallet.privateKey ||
      '';
    const seedPhrase =
      process.env.MOBILESTACKS_SEED_PHRASE ||
      process.env.STACKS_SEED_PHRASE ||
      this.config.wallet.seedPhrase ||
      '';

    if (privateKey) {
      this.wallet = {
        privateKey,
        address: getAddressFromPrivateKey(
          privateKey,
          networkName === 'mainnet' ? 'mainnet' : 'testnet',
        ),
      };
      return;
    }

    if (seedPhrase) {
      try {
        const derivationPath = this.config.wallet.derivationPath || "m/44'/5757'/0'/0/0";
        const requestedIndex = Number.parseInt(derivationPath.split('/').pop() || '0', 10);
        const accountIndex = Number.isNaN(requestedIndex) ? 0 : requestedIndex;
        const wallet = await generateWallet({ secretKey: seedPhrase, password: '' });
        const account = wallet.accounts[accountIndex] || wallet.accounts[0];

        this.wallet = {
          privateKey: account.stxPrivateKey,
          address: getAddressFromPrivateKey(
            account.stxPrivateKey,
            networkName === 'mainnet' ? 'mainnet' : 'testnet',
          ),
          accountIndex: account.index,
        };
        return;
      } catch (error) {
        throw new Error(
          `Failed to generate wallet from seed phrase: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    console.warn(
      'Warning: No wallet secret found. Set MOBILESTACKS_PRIVATE_KEY or MOBILESTACKS_SEED_PHRASE in your .env file.',
    );
  }
}

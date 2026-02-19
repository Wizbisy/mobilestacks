import 'dotenv/config'; 
import { MobilestacksConfig, NetworkConfig } from '../types/config';
import { getAddressFromPrivateKey } from '@stacks/transactions';
import { generateWallet } from '@stacks/wallet-sdk';
import { StacksNetwork, createNetwork } from '@stacks/network';
import { Extender } from './extender';

export class RuntimeEnvironment {
  public config: MobilestacksConfig;
  public network: StacksNetwork;
  public wallet!: { privateKey: string; address: string; accountIndex?: number };
  public stacks: Record<string, unknown>; // Extension point
  [key: string]: unknown; // Allow extensions

  constructor(config: MobilestacksConfig) {
    this.config = config;
    const networkName = config.defaultNetwork;
    const networkConfig: NetworkConfig = config.networks[networkName];
    if (!networkConfig) {
      throw new Error(`Network config not found for: ${networkName}`);
    }
    
    // Instantiate proper StacksNetwork
    if (networkName === 'mainnet' || networkName === 'testnet') {
      this.network = createNetwork({
        network: networkName,
        client: { baseUrl: networkConfig.url }
      });
    } else {
      // Default to testnet structure for custom networks
       this.network = createNetwork({
        network: 'testnet',
        client: { baseUrl: networkConfig.url }
      });
    }

    // ── Resolve wallet secrets (env vars take priority over config) ──
    const privateKey =
      process.env.MOBILESTACKS_PRIVATE_KEY ||
      process.env.STACKS_PRIVATE_KEY ||
      config.wallet.privateKey ||
      '';
    const seedPhrase =
      process.env.MOBILESTACKS_SEED_PHRASE ||
      process.env.STACKS_SEED_PHRASE ||
      config.wallet.seedPhrase ||
      '';

    if (privateKey) {
      const address = getAddressFromPrivateKey(privateKey, networkName === 'mainnet' ? 'mainnet' : 'testnet');
      this.wallet = { privateKey, address };
    } else if (seedPhrase) {
      const derivPath = config.wallet.derivationPath || "m/44'/5757'/0'/0/0";
      generateWallet({ secretKey: seedPhrase, password: '' }).then(wallet => {
        const index = parseInt(derivPath.split('/').pop() || '0', 10);
        const account = wallet.accounts[index] || wallet.accounts[0];
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { getStxAddress } = require('@stacks/wallet-sdk/dist/models/account');
        const address = getStxAddress(account, this.network.transactionVersion);
        this.wallet = {
          privateKey: account.stxPrivateKey,
          address,
          accountIndex: account.index,
        };
      }).catch(() => {
        throw new Error('Failed to generate wallet from seed phrase');
      });
    } else {
      // No secrets anywhere — warn but don't crash (devnet may not need a wallet)
      console.warn(
        '⚠️  No wallet secret found. Set MOBILESTACKS_PRIVATE_KEY or MOBILESTACKS_SEED_PHRASE in your .env file.',
      );
    }
    this.stacks = {};

    // Apply extensions
    for (const extension of Extender.getInstance().getExtensions()) {
      extension(this);
    }
  }
}

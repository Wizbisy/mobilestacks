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

    // Wallet: support privateKey, seedPhrase+derivationPath, or both (prefer privateKey)
    if (config.wallet.privateKey) {
      // Derive address from privateKey
      const address = getAddressFromPrivateKey(config.wallet.privateKey, networkName === 'mainnet' ? 'mainnet' : 'testnet');
      this.wallet = {
        privateKey: config.wallet.privateKey,
        address,
      };
    } else if (config.wallet.seedPhrase) {
      const path = config.wallet.derivationPath || "m/44'/5757'/0'/0/0"; // Stacks main path
      // generateWallet requires a password param
      generateWallet({ secretKey: config.wallet.seedPhrase, password: '' }).then(wallet => {
        const index = parseInt(path.split('/').pop() || '0', 10);
        const account = wallet.accounts[index] || wallet.accounts[0];
        // Use getStxAddress to get the address
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { getStxAddress } = require('@stacks/wallet-sdk/dist/models/account');
        // network.addressVersion has singleSig/multiSig lines. 
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
      throw new Error('No privateKey or seedPhrase provided in wallet config');
    }
    this.stacks = {};

    // Apply extensions
    for (const extension of Extender.getInstance().getExtensions()) {
      extension(this);
    }
  }
}

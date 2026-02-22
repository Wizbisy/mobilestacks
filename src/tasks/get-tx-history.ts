import { task } from '../core/dsl';
import fetch from 'node-fetch';
import { getAddressFromPrivateKey } from '@stacks/transactions';

function maskAddress(address: string) {
  return address ? address.slice(0, 6) + '...' + address.slice(-4) : '';
}

function containsSecret(obj: unknown): boolean {
  const str = JSON.stringify(obj);
  return /[A-Za-z0-9]{32,}/.test(str); // crude check for long secrets
}

task('get-tx-history', 'Get transaction history for the configured wallet address')
  .addParam('limit', 'Number of transactions to fetch', { type: 'number', required: false, defaultValue: 10 })
  .addParam('network', 'Network (mainnet|testnet)', { type: 'string', required: false, defaultValue: 'testnet' })
  .setAction(async (args, env) => {
    const networkName = args.network as string;
    let address = env.wallet.address;
    if (env.wallet.privateKey) {
      address = getAddressFromPrivateKey(env.wallet.privateKey, networkName === 'mainnet' ? 'mainnet' : 'testnet');
    }
    
    if (!address) throw new Error('No wallet address found.');
    
    const apiUrl = networkName === 'mainnet' 
      ? env.config.networks.mainnet.url 
      : env.config.networks.testnet.url;
      
    const url = `${apiUrl}/extended/v1/address/${address}/transactions?limit=${args.limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch tx history: ${res.statusText}`);
    const data = await res.json() as { results: unknown[] };
    const txs = data.results.map((tx) => ({
      tx_id: (tx as { tx_id: string }).tx_id,
      type: (tx as { tx_type: string }).tx_type,
      status: (tx as { tx_status: string }).tx_status,
      fee_rate: (tx as { fee_rate: string }).fee_rate,
      block_height: (tx as { block_height: number }).block_height
    }));
    // Mask address in logs and warn if secrets detected
    if (containsSecret(txs)) {
      console.warn('[mobilestacks] Warning: Output may contain sensitive data.');
    }
    return {
      address: maskAddress(address),
      transactions: txs
    };
  });

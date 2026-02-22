import { task } from '../core/dsl';
import fetch from 'node-fetch';
import { getAddressFromPrivateKey } from '@stacks/transactions';



function containsSecret(obj: unknown): boolean {
  const str = JSON.stringify(obj);
  return /[A-Za-z0-9]{32,}/.test(str); // crude check for long secrets
}

task('get-balance', 'Get STX balance for the configured wallet address or a provided address')
  .addParam('address', 'STX address to check (optional, defaults to wallet main address)', { type: 'string', required: false })
  .addParam('network', 'Network (mainnet|testnet)', { type: 'string', required: false, defaultValue: 'testnet' })
  .setAction(async (args, env) => {
    const networkName = args.network as string;
    
    // dynamically derive address if not provided
    let address = args.address as string;
    if (!address) {
      if (!env.wallet.privateKey) throw new Error('No wallet address or private key found.');
      address = getAddressFromPrivateKey(env.wallet.privateKey, networkName === 'mainnet' ? 'mainnet' : 'testnet');
    }
    
    const apiUrl = networkName === 'mainnet' 
      ? env.config.networks.mainnet.url 
      : env.config.networks.testnet.url;
      
    const url = `${apiUrl}/extended/v1/address/${address}/balances`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch balance: ${res.statusText}`);
    const data: unknown = await res.json();
    
    const stxData = (data as { stx: { balance: string; locked: string; unlock_height: number } }).stx;
    const stxFormatted = (parseInt(stxData.balance || '0', 10) / 1_000_000).toString() + ' STX';
    
    const result: Record<string, unknown> = {
      address,
      stx: stxFormatted,
      locked: stxData.locked === '0' ? '0' : stxData.locked,
    };
    if (stxData.unlock_height !== undefined && stxData.unlock_height !== 0) {
      result.unlock_height = stxData.unlock_height;
    }

    if (containsSecret(result)) {
      console.warn('[mobilestacks] Warning: Output may contain sensitive data.');
    }
    return result;
  });

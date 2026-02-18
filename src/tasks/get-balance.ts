import { task } from '../core/dsl';
import fetch from 'node-fetch';

function maskAddress(address: string) {
  return address ? address.slice(0, 6) + '...' + address.slice(-4) : '';
}

function containsSecret(obj: unknown): boolean {
  const str = JSON.stringify(obj);
  return /[A-Za-z0-9]{32,}/.test(str); // crude check for long secrets
}

task('get-balance', 'Get STX balance for the configured wallet address or a provided address')
  .addParam('address', 'STX address to check (optional, defaults to wallet main address)', { type: 'string', required: false })
  .setAction(async (args, env) => {
    const address = (args.address as string) || env.wallet.address;
    if (!address) throw new Error('No wallet address found.');
    const network = env.network;
    const apiUrl = network.client.baseUrl;
    const url = `${apiUrl}/extended/v1/address/${address}/balances`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch balance: ${res.statusText}`);
    const data: unknown = await res.json();
    const result = {
      address: maskAddress(address),
      stx: (data as { stx: { balance: string; locked: string; unlock_height: number } }).stx.balance,
      locked: (data as { stx: { balance: string; locked: string; unlock_height: number } }).stx.locked,
      unlock_height: (data as { stx: { balance: string; locked: string; unlock_height: number } }).stx.unlock_height
    };
    if (containsSecret(result)) {
      console.warn('[mobilestacks] Warning: Output may contain sensitive data.');
    }
    return result;
  });

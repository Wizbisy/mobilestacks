import { task } from '../core/dsl';
import fetch from 'node-fetch';

task('faucet-request', 'Request STX from the testnet faucet')
  .addParam('address', 'STX address to fund', { type: 'string', required: true })
  .setAction(async (args, env) => {
    if (env.network.client.baseUrl && env.network.client.baseUrl.includes('testnet')) {
      const url = `${env.config.networks.testnet.url}/extended/v1/faucets/stx?address=${args.address}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        throw new Error(`Faucet request failed: ${res.statusText}`);
      }
      return await res.json();
    } else {
      throw new Error('Faucet is only available on testnet.');
    }
  });

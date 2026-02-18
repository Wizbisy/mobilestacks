import { task } from '../core/dsl';
import fetch from 'node-fetch';

task('faucet-request', 'Request STX from the testnet faucet')
  .addParam('address', 'STX address to fund', { type: 'string', required: true })
  .setAction(async (args, env) => {
    if (env.network.client.baseUrl && env.network.client.baseUrl.includes('testnet')) {
      const url = `https://stacks-node-api.testnet.stacks.co/extended/v1/faucet/stx`; // Default testnet faucet
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: args.address })
      });
      if (!res.ok) {
        throw new Error(`Faucet request failed: ${res.statusText}`);
      }
      return await res.json();
    } else {
      throw new Error('Faucet is only available on testnet.');
    }
  });

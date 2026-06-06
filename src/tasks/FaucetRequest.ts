import { task } from '../core/dsl';
import fetch from 'node-fetch';
import { getNetworkUrl, getResponseJson } from './utils';

task('faucet-request', 'Request STX from the testnet faucet')
  .addParam('address', 'STX address to fund', { type: 'string', required: true })
  .setAction(async (args, env) => {
    if (env.config.defaultNetwork !== 'testnet') {
      throw new Error('Faucet is only available on testnet.');
    }

    const address = args.address as string;
    const apiUrl = getNetworkUrl(env.config, 'testnet');
    const url = `${apiUrl}/extended/v1/faucets/stx?address=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    return getResponseJson<unknown>(res);
  });

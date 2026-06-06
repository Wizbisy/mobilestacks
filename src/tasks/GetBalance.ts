import { task } from '../core/dsl';
import fetch from 'node-fetch';
import {
  getNetworkUrl,
  getResponseJson,
  getSupportedNetworkName,
  getWalletAddress,
  warnIfSensitiveOutput,
} from './utils';

type BalanceResponse = {
  stx: {
    balance: string;
    locked: string;
    unlock_height?: number;
  };
};

task('getbalance', 'Get STX balance for the configured wallet address or a provided address')
  .addParam('address', 'STX address to check (optional, defaults to wallet main address)', {
    type: 'string',
    required: false,
  })
  .addParam('network', 'Network (mainnet|testnet)', {
    type: 'string',
    required: false,
    defaultValue: 'testnet',
  })
  .setAction(async (args, env) => {
    const networkName = getSupportedNetworkName(args.network);
    const address = (args.address as string | undefined) || getWalletAddress(env, networkName);
    const apiUrl = getNetworkUrl(env.config, networkName);
    const url = `${apiUrl}/extended/v1/address/${encodeURIComponent(address)}/balances`;
    const res = await fetch(url);
    const data = await getResponseJson<BalanceResponse>(res);
    const balanceMicroStx = Number.parseInt(data.stx.balance || '0', 10);

    const result: Record<string, unknown> = {
      address,
      stx: `${balanceMicroStx / 1_000_000} STX`,
      locked: data.stx.locked === '0' ? '0' : data.stx.locked,
    };
    if (data.stx.unlock_height !== undefined && data.stx.unlock_height !== 0) {
      result.unlock_height = data.stx.unlock_height;
    }

    warnIfSensitiveOutput(result);
    return result;
  });

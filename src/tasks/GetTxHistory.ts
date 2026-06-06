import { task } from '../core/dsl';
import fetch from 'node-fetch';
import {
  getNetworkUrl,
  getResponseJson,
  getSupportedNetworkName,
  getWalletAddress,
  maskValue,
  warnIfSensitiveOutput,
} from './utils';

type TransactionHistoryResponse = {
  results: Array<{
    tx_id: string;
    tx_type: string;
    tx_status: string;
    fee_rate: string;
    block_height: number;
  }>;
};

task('gettxhistory', 'Get transaction history for the configured wallet address')
  .addParam('limit', 'Number of transactions to fetch', { type: 'number', required: false, defaultValue: 10 })
  .addParam('network', 'Network (mainnet|testnet)', {
    type: 'string',
    required: false,
    defaultValue: 'testnet',
  })
  .setAction(async (args, env) => {
    const networkName = getSupportedNetworkName(args.network);
    const limit = args.limit as number;
    const address = getWalletAddress(env, networkName);
    const apiUrl = getNetworkUrl(env.config, networkName);
    const url = `${apiUrl}/extended/v1/address/${encodeURIComponent(
      address,
    )}/transactions?limit=${encodeURIComponent(String(limit))}`;
    const res = await fetch(url);
    const data = await getResponseJson<TransactionHistoryResponse>(res);
    const txs = data.results.map((tx) => ({
      tx_id: tx.tx_id,
      type: tx.tx_type,
      status: tx.tx_status,
      fee_rate: tx.fee_rate,
      block_height: tx.block_height,
    }));

    warnIfSensitiveOutput(txs);
    return {
      address: maskValue(address),
      transactions: txs,
    };
  });

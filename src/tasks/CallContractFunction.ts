import { task } from '../core/dsl';
import fetch from 'node-fetch';
import { hexToCV, cvToJSON } from '@stacks/transactions';
import { getNetworkUrl, getResponseJson, getSupportedNetworkName } from './utils';

task('callcontractfunction', 'Call a read-only function on a deployed Clarity contract')
  .addParam('contractAddress', 'Deployed contract address (STX...)', { type: 'string', required: true })
  .addParam('contractName', 'Contract name', { type: 'string', required: true })
  .addParam('functionName', 'Function name', { type: 'string', required: true })
  .addParam('args', 'Comma-separated function arguments', { type: 'string', required: false, defaultValue: '' })
  .addParam('network', 'Network (mainnet|testnet)', {
    type: 'string',
    required: false,
    defaultValue: 'testnet',
  })
  .setAction(async (args, env) => {
    const contractAddress = args.contractAddress as string;
    const contractName = args.contractName as string;
    const functionName = args.functionName as string;
    const fnArgs = args.args as string;
    const networkName = getSupportedNetworkName(args.network);
    const apiUrl = getNetworkUrl(env.config, networkName);

    const addressPart = contractAddress.includes('.') ? contractAddress.split('.')[0] : contractAddress;
    const url = `${apiUrl}/v2/contracts/call-read/${addressPart}/${contractName}/${functionName}`;
    const body = fnArgs
      ? { sender: addressPart, arguments: fnArgs.split(',').map((a: string) => a.trim()) }
      : { sender: addressPart, arguments: [] };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await getResponseJson<Record<string, unknown>>(res);
    if (result && result.okay && typeof result.result === 'string' && result.result.startsWith('0x')) {
      try {
        result.decodedResult = cvToJSON(hexToCV(result.result));
      } catch {
        // ignore decode errors, fallback to raw hex
      }
    }

    return result;
  });

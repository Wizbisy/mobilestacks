import { task } from '../core/dsl';
import fetch from 'node-fetch';

task('call-contract-function', 'Call a public function on a deployed Clarity contract')
  .addParam('contractAddress', 'Deployed contract address (STX...)', { type: 'string', required: true })
  .addParam('contractName', 'Contract name', { type: 'string', required: true })
  .addParam('functionName', 'Function name', { type: 'string', required: true })
  .addParam('args', 'Comma-separated function arguments', { type: 'string', required: false, defaultValue: '' })
  .addParam('network', 'Network (mainnet|testnet)', { type: 'string', required: false, defaultValue: 'testnet' })
  .setAction(async (args, env) => {
    const contractAddress = args.contractAddress as string;
    const contractName = args.contractName as string;
    const functionName = args.functionName as string;
    const fnArgs = args.args as string;
    const network = args.network as string;
    const apiUrl = network === 'mainnet'
      ? env.config.networks.mainnet.url
      : env.config.networks.testnet.url;

    const addressPart = contractAddress.includes('.') ? contractAddress.split('.')[0] : contractAddress;

    const url = `${apiUrl}/v2/contracts/call-read/${addressPart}/${contractName}/${functionName}`;
    const body = fnArgs
      ? { sender: addressPart, arguments: fnArgs.split(',').map((a: string) => a.trim()) }
      : { sender: addressPart, arguments: [] };
      
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Failed to call contract function: ${res.statusText}`);
    const result = await res.json();
    return result;
  });

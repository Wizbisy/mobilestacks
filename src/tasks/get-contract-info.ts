import { task } from '../core/dsl';
import fetch from 'node-fetch';

task('get-contract-info', 'Get contract attributes and details from Stacks blockchain')
  .addParam('contractAddress', 'Deployed contract address (STX...)', { type: 'string', required: true })
  .addParam('contractName', 'Contract name', { type: 'string', required: true })
  .addParam('network', 'Network (mainnet|testnet)', { type: 'string', required: false, defaultValue: 'testnet' })
  .setAction(async (args) => {
    const { contractAddress, contractName, network } = args;
    const apiUrl = network === 'mainnet'
      ? 'https://stacks-node-api.mainnet.stacks.co'
      : 'https://stacks-node-api.testnet.stacks.co';
    const url = `${apiUrl}/extended/v1/contract/${contractAddress}/${contractName}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch contract info: ${res.statusText}`);
    const info = await res.json();
    return info;
  });

import { task } from '../core/dsl';
import fetch from 'node-fetch';
import { getNetworkUrl, getResponseJson, getSupportedNetworkName } from './utils';

task('getcontractinfo', 'Get contract attributes and details from Stacks blockchain')
  .addParam('contractAddress', 'Deployed contract address (STX...)', { type: 'string', required: true })
  .addParam('contractName', 'Contract name', { type: 'string', required: true })
  .addParam('network', 'Network (mainnet|testnet)', {
    type: 'string',
    required: false,
    defaultValue: 'testnet',
  })
  .setAction(async (args, env) => {
    const contractAddress = args.contractAddress as string;
    const contractName = args.contractName as string;
    const networkName = getSupportedNetworkName(args.network);
    const apiUrl = getNetworkUrl(env.config, networkName);
    const fullContractId = contractAddress.includes('.')
      ? contractAddress
      : `${contractAddress}.${contractName}`;

    const url = `${apiUrl}/extended/v1/contract/${fullContractId}`;
    const res = await fetch(url);
    return getResponseJson<unknown>(res);
  });

import { task } from '../core/dsl';
import fetch from 'node-fetch';

task('get-contract-info', 'Get contract attributes and details from Stacks blockchain')
  .addParam('contractAddress', 'Deployed contract address (STX...)', { type: 'string', required: true })
  .addParam('contractName', 'Contract name', { type: 'string', required: true })
  .addParam('network', 'Network (mainnet|testnet)', { type: 'string', required: false, defaultValue: 'testnet' })
  .setAction(async (args, env) => {
    const contractAddress = args.contractAddress as string;
    const contractName = args.contractName as string;
    const network = args.network as string;
    const apiUrl = network === 'mainnet'
      ? env.config.networks.mainnet.url
      : env.config.networks.testnet.url;
      
    // Hiro API expects the full Contract Principal ID (Address.Name)
    const fullContractId = contractAddress.includes('.') 
      ? contractAddress 
      : `${contractAddress}.${contractName}`;
      
    const url = `${apiUrl}/extended/v1/contract/${fullContractId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch contract info: ${res.statusText}`);
    const info = await res.json();
    return info;
  });

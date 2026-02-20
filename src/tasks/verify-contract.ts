import { task } from '../core/dsl';
import fetch from 'node-fetch';
import fs from 'fs';

task('verify-contract', 'Verify a deployed Clarity contract on the Stacks explorer')
  .addParam('contractAddress', 'Deployed contract address (STX...)', { type: 'string', required: true })
  .addParam('contractName', 'Contract name', { type: 'string', required: true })
  .addParam('source', 'Path to contract source file', { type: 'string', required: true })
  .addParam('network', 'Network (mainnet|testnet)', { type: 'string', required: false, defaultValue: 'testnet' })
  .setAction(async (args, env) => {
    const contractAddress = args.contractAddress as string;
    const contractName = args.contractName as string;
    const source = args.source as string;
    const network = args.network as string;
    const codeBody = fs.readFileSync(source, 'utf8');
    const apiUrl = network === 'mainnet'
      ? env.config.networks.mainnet.url
      : env.config.networks.testnet.url;
      
    const fullContractId = contractAddress.includes('.') 
      ? contractAddress 
      : `${contractAddress}.${contractName}`;

    // Fetch contract source from chain using full principal ID
    const url = `${apiUrl}/extended/v1/contract/${fullContractId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch on-chain contract source: ${res.statusText}`);
    const onChain = await res.json() as { source_code?: string };
    const verified = onChain.source_code && onChain.source_code.trim() === codeBody.trim();
    const explorer = network === 'mainnet'
      ? `https://explorer.hiro.so/txid/${contractAddress}.${contractName}`
      : `https://explorer.hiro.so/txid/${contractAddress}.${contractName}?chain=testnet`;
    return {
      verified,
      message: verified ? 'Contract source matches on-chain code!' : 'Source does NOT match on-chain code!',
      explorer
    };
  });

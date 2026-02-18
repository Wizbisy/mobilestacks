import { task } from '../core/dsl';
import fetch from 'node-fetch';
import fs from 'fs';

task('verify-contract', 'Verify a deployed Clarity contract on the Stacks explorer')
  .addParam('contractAddress', 'Deployed contract address (STX...)', { type: 'string', required: true })
  .addParam('contractName', 'Contract name', { type: 'string', required: true })
  .addParam('source', 'Path to contract source file', { type: 'string', required: true })
  .addParam('network', 'Network (mainnet|testnet)', { type: 'string', required: false, defaultValue: 'testnet' })
  .setAction(async (args) => {
    const contractAddress = args.contractAddress as string;
    const contractName = args.contractName as string;
    const source = args.source as string;
    const network = args.network as string;
    const codeBody = fs.readFileSync(source, 'utf8');
    const apiUrl = network === 'mainnet'
      ? 'https://stacks-node-api.mainnet.stacks.co'
      : 'https://stacks-node-api.testnet.stacks.co';
    // Fetch contract source from chain
    const url = `${apiUrl}/extended/v1/contract/source/${contractAddress}/${contractName}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch on-chain contract source: ${res.statusText}`);
    const onChain = await res.json() as { source_code?: string };
    const verified = onChain.source_code && onChain.source_code.trim() === codeBody.trim();
    const explorer = network === 'mainnet'
      ? `https://explorer.stacks.co/txid/${contractAddress}.${contractName}`
      : `https://explorer.stacks.co/txid/${contractAddress}.${contractName}?chain=testnet`;
    return {
      verified,
      message: verified ? 'Contract source matches on-chain code!' : 'Source does NOT match on-chain code!',
      explorer
    };
  });

import { task } from '../core/dsl';
import fetch from 'node-fetch';
import fs from 'fs';
import {
  getExplorerTxUrl,
  getNetworkUrl,
  getResponseJson,
  getSupportedNetworkName,
  normalizeClaritySource,
} from './utils';

type ContractInfoResponse = {
  source_code?: string;
};

task('verifycontract', 'Verify a deployed Clarity contract on the Stacks explorer')
  .addParam('contractAddress', 'Deployed contract address (STX...)', { type: 'string', required: true })
  .addParam('contractName', 'Contract name', { type: 'string', required: true })
  .addParam('source', 'Path to contract source file', { type: 'string', required: true })
  .addParam('network', 'Network (mainnet|testnet)', {
    type: 'string',
    required: false,
    defaultValue: 'testnet',
  })
  .setAction(async (args, env) => {
    const contractAddress = args.contractAddress as string;
    const contractName = args.contractName as string;
    const source = args.source as string;
    const networkName = getSupportedNetworkName(args.network);
    const codeBody = normalizeClaritySource(fs.readFileSync(source, 'utf8')).trim();
    const apiUrl = getNetworkUrl(env.config, networkName);
    const fullContractId = contractAddress.includes('.')
      ? contractAddress
      : `${contractAddress}.${contractName}`;
    const url = `${apiUrl}/extended/v1/contract/${fullContractId}`;
    const res = await fetch(url);
    const onChain = await getResponseJson<ContractInfoResponse>(res);
    const verified = Boolean(
      onChain.source_code && normalizeClaritySource(onChain.source_code).trim() === codeBody,
    );

    return {
      verified,
      message: verified ? 'Contract source matches on-chain code!' : 'Source does NOT match on-chain code!',
      explorer: getExplorerTxUrl(fullContractId, networkName),
    };
  });

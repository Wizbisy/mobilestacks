import { task } from '../core/dsl';
import {
  makeContractDeploy,
  broadcastTransaction,
} from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import fs from 'fs';

function maskAddress(address: string) {
  return address ? address.slice(0, 6) + '...' + address.slice(-4) : '';
}

function containsSecret(obj: unknown): boolean {
  const str = JSON.stringify(obj);
  return /[A-Za-z0-9]{32,}/.test(str); // crude check for long secrets
}

// Deploy a Clarity contract to Stacks mainnet or testnet
task('deploy-contract', 'Deploy a Clarity smart contract to Stacks blockchain')
  .addParam('contractName', 'Name of the contract', { type: 'string', required: true })
  .addParam('file', 'Path to Clarity contract file', { type: 'string', required: true })
  .addParam('network', 'Network to deploy to (mainnet|testnet)', { type: 'string', required: false, defaultValue: 'testnet' })
  .addParam('clarityVersion', 'Version of Clarity to use (1|2|3|4)', { type: 'number', required: false, defaultValue: 2 })
  .setAction(async (args, env) => {
    const contractName = args.contractName as string;
    const file = args.file as string;
    const network = args.network as string;
    const clarityVersion = args.clarityVersion as number;
    let codeBody = fs.readFileSync(file, 'utf8');
    codeBody = codeBody.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    codeBody = codeBody.replace(/^\uFEFF/, '').replace(/[^\x20-\x7E\n\t]/g, '');
    if (network === 'mainnet') {
      env.network = createNetwork({ network: 'mainnet', client: { baseUrl: env.config.networks.mainnet.url } });
    } else {
      env.network = createNetwork({ network: 'testnet', client: { baseUrl: env.config.networks.testnet.url } });
    }
    const txOptions: any = {
      contractName,
      codeBody,
      clarityVersion,
      senderKey: env.wallet.privateKey,
      network: env.network,
    };
    const tx = await makeContractDeploy(txOptions);
    const result = await broadcastTransaction({ transaction: tx, network: env.network });
    if (containsSecret(result)) {
      console.warn('[mobilestacks] Warning: Output may contain sensitive data.');
    }
    // Mask any address fields if present
    if (result && result.txid) {
      const resObj = result as Record<string, unknown>;
      resObj.explorerUrl = network === 'mainnet' 
        ? `https://explorer.hiro.so/txid/${result.txid}`
        : `https://explorer.hiro.so/txid/${result.txid}?chain=testnet`;
      resObj.txid = maskAddress(result.txid);
    }
    return result;
  });

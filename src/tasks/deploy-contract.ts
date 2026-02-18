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
  .setAction(async (args, env) => {
    const contractName = args.contractName as string;
    const file = args.file as string;
    const network = args.network as string;
    const codeBody = fs.readFileSync(file, 'utf8');
    // Switch network if needed
    if (network === 'mainnet') {
      env.network = createNetwork({ network: 'mainnet', client: { baseUrl: env.config.networks.mainnet.url } });
    } else {
      env.network = createNetwork({ network: 'testnet', client: { baseUrl: env.config.networks.testnet.url } });
    }
    const tx = await makeContractDeploy({
      contractName,
      codeBody,
      senderKey: env.wallet.privateKey,
      network: env.network,
    });
    const result = await broadcastTransaction({ transaction: tx, network: env.network });
    if (containsSecret(result)) {
      console.warn('[mobilestacks] Warning: Output may contain sensitive data.');
    }
    // Mask any address fields if present
    if (result && result.txid) {
      result.txid = maskAddress(result.txid);
    }
    return result;
  });

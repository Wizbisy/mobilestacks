import { task } from '../core/dsl';
import { broadcastTransaction, makeContractDeploy, SignedContractDeployOptions } from '@stacks/transactions';
import fs from 'fs';
import {
  createStacksNetwork,
  getExplorerTxUrl,
  getSupportedNetworkName,
  getWalletPrivateKey,
  maskValue,
  normalizeClaritySource,
  warnIfSensitiveOutput,
} from './utils';

task('deploycontract', 'Deploy a Clarity smart contract to Stacks blockchain')
  .addParam('contractName', 'Name of the contract', { type: 'string', required: true })
  .addParam('file', 'Path to Clarity contract file', { type: 'string', required: true })
  .addParam('network', 'Network to deploy to (mainnet|testnet)', {
    type: 'string',
    required: false,
    defaultValue: 'testnet',
  })
  .addParam('clarityVersion', 'Version of Clarity to use (1|2|3|4)', {
    type: 'number',
    required: false,
    defaultValue: 2,
  })
  .addParam('fee', 'Custom fee in microSTX', { type: 'number', required: false })
  .setAction(async (args, env) => {
    const contractName = args.contractName as string;
    const file = args.file as string;
    const networkName = getSupportedNetworkName(args.network);
    const clarityVersion = args.clarityVersion as number;
    const fee = args.fee as number | undefined;

    const codeBody = normalizeClaritySource(fs.readFileSync(file, 'utf8'));
    env.network = createStacksNetwork(env.config, networkName);

    const txOptions: SignedContractDeployOptions = {
      contractName,
      codeBody,
      clarityVersion: clarityVersion as SignedContractDeployOptions['clarityVersion'],
      senderKey: getWalletPrivateKey(env),
      network: env.network,
    };
    if (fee !== undefined) {
      txOptions.fee = fee;
    }

    const tx = await makeContractDeploy(txOptions);
    const result = await broadcastTransaction({ transaction: tx, network: env.network });
    warnIfSensitiveOutput(result);

    if (result && result.txid) {
      const resObj = result as Record<string, unknown>;
      resObj.explorerUrl = getExplorerTxUrl(result.txid, networkName);
      resObj.txid = maskValue(result.txid);
    }

    return result;
  });

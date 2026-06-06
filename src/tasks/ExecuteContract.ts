import { task } from '../core/dsl';
import {
  makeContractCall,
  broadcastTransaction,
  uintCV,
  intCV,
  stringAsciiCV,
  standardPrincipalCV,
  trueCV,
  falseCV,
  ClarityValue,
  SignedContractCallOptions,
} from '@stacks/transactions';
import {
  createStacksNetwork,
  getExplorerTxUrl,
  getSupportedNetworkName,
  getWalletPrivateKey,
  maskValue,
  warnIfSensitiveOutput,
} from './utils';

function splitFunctionArgs(args: string): string[] {
  const values: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;

  for (const char of args) {
    if ((char === '"' || char === "'") && quote === null) {
      quote = char;
    } else if (char === quote) {
      quote = null;
    }

    if (char === ',' && quote === null) {
      if (current.trim()) values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (quote !== null) {
    throw new Error('Unterminated quoted argument.');
  }
  if (current.trim()) {
    values.push(current.trim());
  }

  return values;
}

function parseArgToCV(arg: string): ClarityValue {
  const t = arg.trim();
  if (t === 'true') return trueCV();
  if (t === 'false') return falseCV();
  if (/^u\d+$/.test(t)) return uintCV(t.slice(1));
  if (/^-?\d+$/.test(t)) return intCV(t);
  if (
    (t.startsWith("'") && t.endsWith("'")) ||
    (t.startsWith('"') && t.endsWith('"'))
  ) {
    return stringAsciiCV(t.slice(1, -1));
  }
  if (t.startsWith('ST') || t.startsWith('SP')) return standardPrincipalCV(t);
  throw new Error(`Unsupported Clarity argument: ${arg}`);
}

task('execute-contract', 'Execute a state-modifying function on a Clarity contract')
  .addParam('contractAddress', 'Deployed contract address (STX...)', { type: 'string', required: true })
  .addParam('contractName', 'Contract name', { type: 'string', required: true })
  .addParam('functionName', 'Function name', { type: 'string', required: true })
  .addParam('args', 'Comma-separated args e.g. u1,"hello",ST...', {
    type: 'string',
    required: false,
    defaultValue: '',
  })
  .addParam('network', 'Network (mainnet|testnet)', {
    type: 'string',
    required: false,
    defaultValue: 'testnet',
  })
  .addParam('fee', 'Custom fee in microSTX', { type: 'number', required: false })
  .setAction(async (args, env) => {
    const contractAddress = args.contractAddress as string;
    const contractName = args.contractName as string;
    const functionName = args.functionName as string;
    const fnArgs = args.args as string;
    const networkName = getSupportedNetworkName(args.network);
    const fee = args.fee as number | undefined;
    const network = createStacksNetwork(env.config, networkName);

    const addressPart = contractAddress.includes('.') ? contractAddress.split('.')[0] : contractAddress;
    const parsedArgs = fnArgs ? splitFunctionArgs(fnArgs).map(parseArgToCV) : [];
    const txOptions: SignedContractCallOptions = {
      contractAddress: addressPart,
      contractName,
      functionName,
      functionArgs: parsedArgs,
      senderKey: getWalletPrivateKey(env),
      validateWithAbi: false,
      network,
    };
    if (fee !== undefined) {
      txOptions.fee = fee;
    }

    const transaction = await makeContractCall(txOptions);
    const result = await broadcastTransaction({ transaction, network });

    warnIfSensitiveOutput(result);

    if (result && result.txid) {
      const resObj = result as Record<string, unknown>;
      resObj.explorerUrl = getExplorerTxUrl(result.txid, networkName);
      resObj.txid = maskValue(result.txid);
    }

    return result;
  });

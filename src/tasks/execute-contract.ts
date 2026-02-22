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
  ClarityValue
} from '@stacks/transactions';
import { createNetwork } from '@stacks/network';

function parseArgToCV(arg: string): ClarityValue {
  const t = arg.trim();
  if (t === 'true') return trueCV();
  if (t === 'false') return falseCV();
  if (t.startsWith('u')) return uintCV(t.slice(1));
  if (t.startsWith("'") || t.startsWith("\"")) return stringAsciiCV(t.slice(1, -1));
  if (t.startsWith('ST') || t.startsWith('SP')) return standardPrincipalCV(t);
  return intCV(t);
}

function maskAddress(address: string) {
  return address ? address.slice(0, 6) + '...' + address.slice(-4) : '';
}

function containsSecret(obj: unknown): boolean {
  const str = JSON.stringify(obj);
  return /[A-Za-z0-9]{32,}/.test(str);
}

task('execute-contract', 'Execute a state-modifying function on a Clarity contract')
  .addParam('contractAddress', 'Deployed contract address (STX...)', { type: 'string', required: true })
  .addParam('contractName', 'Contract name', { type: 'string', required: true })
  .addParam('functionName', 'Function name', { type: 'string', required: true })
  .addParam('args', 'Comma-separated args e.g. u1,"hello",ST...', { type: 'string', required: false, defaultValue: '' })
  .addParam('network', 'Network (mainnet|testnet)', { type: 'string', required: false, defaultValue: 'testnet' })
  .setAction(async (args, env) => {
    const contractAddress = args.contractAddress as string;
    const contractName = args.contractName as string;
    const functionName = args.functionName as string;
    const fnArgs = args.args as string;
    const networkName = args.network as string;
    const wallet = env.wallet;

    const networkUrl = networkName === 'mainnet' 
      ? env.config.networks.mainnet.url 
      : env.config.networks.testnet.url;

    const network = createNetwork({
      network: networkName as 'mainnet' | 'testnet',
      client: { baseUrl: networkUrl }
    });

    const addressPart = contractAddress.includes('.') ? contractAddress.split('.')[0] : contractAddress;

    const parsedArgs = fnArgs
      ? fnArgs.split(',').filter(x => x.trim().length > 0).map(parseArgToCV)
      : [];

    const txOptions = {
      contractAddress: addressPart,
      contractName,
      functionName,
      functionArgs: parsedArgs,
      senderKey: wallet.privateKey,
      validateWithAbi: false,
      network,
    };

    const transaction = await makeContractCall(txOptions);
    const result = await broadcastTransaction({ transaction, network });

    if (containsSecret(result)) {
      console.warn('[mobilestacks] Warning: Output may contain sensitive data.');
    }
    if (result && result.txid) {
      const resObj = result as Record<string, unknown>;
      resObj.explorerUrl = networkName === 'mainnet' 
        ? `https://explorer.hiro.so/txid/${result.txid}`
        : `https://explorer.hiro.so/txid/${result.txid}?chain=testnet`;
      resObj.txid = maskAddress(result.txid);
    }
    
    // Broadcast transaction returns txid or error details
    return result;
  });

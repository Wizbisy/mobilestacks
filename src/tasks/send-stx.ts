import { task } from '../core/dsl';
import { broadcastTransaction, makeSTXTokenTransfer } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';

function maskAddress(address: string) {
  return address ? address.slice(0, 6) + '...' + address.slice(-4) : '';
}

function containsSecret(obj: unknown): boolean {
  const str = JSON.stringify(obj);
  return /[A-Za-z0-9]{32,}/.test(str); // crude check for long secrets
}

// This task sends STX to an address using the loaded SRE (env)
task('send-stx', 'Sends STX to an address')
  .addParam('to', 'Recipient STX address', { type: 'string', required: true })
  .addParam('amount', 'Amount in STX (e.g. 10.5)', { type: 'number', required: true })
  .addParam('memo', 'Optional memo', { type: 'string', required: false, defaultValue: '' })
  .addParam('network', 'Network (mainnet|testnet)', { type: 'string', required: false, defaultValue: 'testnet' })
  .addParam('fee', 'Custom fee in microSTX', { type: 'number', required: false })
  .setAction(async (args, env) => {
    const to = args.to as string;
    const amountSTX = args.amount as number;
    const memo = args.memo as string | undefined;
    const networkName = args.network as string;
    const fee = args.fee as number | undefined;
    const wallet = env.wallet;
    
    const networkUrl = networkName === 'mainnet' 
      ? env.config.networks.mainnet.url 
      : env.config.networks.testnet.url;

    const network = createNetwork({
      network: networkName as 'mainnet' | 'testnet',
      client: { baseUrl: networkUrl }
    });
    
    // Convert STX to microSTX (1 STX = 1,000,000 microSTX)
    const amountMicroStx = BigInt(Math.floor(amountSTX * 1_000_000));

    const txOptions: any = {
      recipient: to,
      amount: amountMicroStx,
      senderKey: wallet.privateKey,
      network,
      memo: memo || undefined
    };
    if (fee !== undefined) {
      txOptions.fee = fee;
    }

    const tx = await makeSTXTokenTransfer(txOptions);
    const result = await broadcastTransaction({ transaction: tx, network });
    if (containsSecret(result)) {
      console.warn('[mobilestacks] Warning: Output may contain sensitive data.');
    }
    // Mask any address fields if present
    if (result && result.txid) {
      const resObj = result as Record<string, unknown>;
      resObj.explorerUrl = networkName === 'mainnet' 
        ? `https://explorer.hiro.so/txid/${result.txid}`
        : `https://explorer.hiro.so/txid/${result.txid}?chain=testnet`;
      resObj.txid = maskAddress(result.txid);
    }
    return result;
  });

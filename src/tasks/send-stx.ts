import { task } from '../core/dsl';
import { broadcastTransaction, makeSTXTokenTransfer } from '@stacks/transactions';

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
  .addParam('amount', 'Amount in microSTX', { type: 'number', required: true })
  .addParam('memo', 'Optional memo', { type: 'string', required: false, defaultValue: '' })
  .setAction(async (args, env) => {
    const to = args.to as string;
    const amount = args.amount as number;
    const memo = args.memo as string | undefined;
    const { wallet, network } = env;
    const tx = await makeSTXTokenTransfer({
      recipient: to,
      amount: BigInt(amount),
      senderKey: wallet.privateKey,
      network,
      memo: memo || undefined
    });
    const result = await broadcastTransaction({ transaction: tx, network });
    if (containsSecret(result)) {
      console.warn('[mobilestacks] Warning: Output may contain sensitive data.');
    }
    // Mask any address fields if present
    if (result && result.txid) {
      result.txid = maskAddress(result.txid);
    }
    return result;
  });

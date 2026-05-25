import { task } from '../core/dsl';
import { broadcastTransaction, makeSTXTokenTransfer, SignedTokenTransferOptions } from '@stacks/transactions';
import {
  createStacksNetwork,
  getExplorerTxUrl,
  getSupportedNetworkName,
  getWalletPrivateKey,
  maskValue,
  warnIfSensitiveOutput,
} from './utils';

task('send-stx', 'Sends STX to an address')
  .addParam('to', 'Recipient STX address', { type: 'string', required: true })
  .addParam('amount', 'Amount in STX (e.g. 10.5)', { type: 'number', required: true })
  .addParam('memo', 'Optional memo', { type: 'string', required: false, defaultValue: '' })
  .addParam('network', 'Network (mainnet|testnet)', {
    type: 'string',
    required: false,
    defaultValue: 'testnet',
  })
  .addParam('fee', 'Custom fee in microSTX', { type: 'number', required: false })
  .setAction(async (args, env) => {
    const to = args.to as string;
    const amountSTX = args.amount as number;
    const memo = args.memo as string | undefined;
    const networkName = getSupportedNetworkName(args.network);
    const fee = args.fee as number | undefined;

    const amountMicroStx = BigInt(Math.floor(amountSTX * 1_000_000));
    const network = createStacksNetwork(env.config, networkName);
    const txOptions: SignedTokenTransferOptions = {
      recipient: to,
      amount: amountMicroStx,
      senderKey: getWalletPrivateKey(env),
      network,
      memo: memo || undefined,
    };
    if (fee !== undefined) {
      txOptions.fee = fee;
    }

    const tx = await makeSTXTokenTransfer(txOptions);
    const result = await broadcastTransaction({ transaction: tx, network });
    warnIfSensitiveOutput(result);

    if (result && result.txid) {
      const resObj = result as Record<string, unknown>;
      resObj.explorerUrl = getExplorerTxUrl(result.txid, networkName);
      resObj.txid = maskValue(result.txid);
    }

    return result;
  });

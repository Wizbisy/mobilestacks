import { createNetwork, StacksNetwork } from '@stacks/network';
import { getAddressFromPrivateKey } from '@stacks/transactions';
import { MobilestacksConfig } from '../types/config';
import { RuntimeEnvironment } from '../core/runtime-environment';

export type SupportedNetworkName = 'mainnet' | 'testnet';

const SENSITIVE_FIELD_PATTERN = /(privateKey|seedPhrase|mnemonic|secret|password)/i;

export function getSupportedNetworkName(value: unknown): SupportedNetworkName {
  if (value === 'mainnet' || value === 'testnet') {
    return value;
  }

  throw new Error(`Unsupported network '${String(value)}'. Expected 'mainnet' or 'testnet'.`);
}

export function getNetworkUrl(config: MobilestacksConfig, networkName: SupportedNetworkName): string {
  const network = config.networks[networkName];
  if (!network?.url) {
    throw new Error(`Missing ${networkName} network URL in mobilestacks config.`);
  }

  return network.url;
}

export function createStacksNetwork(
  config: MobilestacksConfig,
  networkName: SupportedNetworkName,
): StacksNetwork {
  return createNetwork({
    network: networkName,
    client: { baseUrl: getNetworkUrl(config, networkName) },
  });
}

export function getExplorerTxUrl(txid: string, networkName: SupportedNetworkName): string {
  return networkName === 'mainnet'
    ? `https://explorer.hiro.so/txid/${txid}`
    : `https://explorer.hiro.so/txid/${txid}?chain=testnet`;
}

export function maskValue(value: string): string {
  return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : '';
}

export function normalizeClaritySource(source: string): string {
  return source
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/^\uFEFF/, '');
}

export function getWalletPrivateKey(env: RuntimeEnvironment): string {
  if (!env.wallet.privateKey) {
    throw new Error('No wallet private key found. Set MOBILESTACKS_PRIVATE_KEY or STACKS_PRIVATE_KEY.');
  }

  return env.wallet.privateKey;
}

export function getWalletAddress(env: RuntimeEnvironment, networkName: SupportedNetworkName): string {
  if (env.wallet.privateKey) {
    return getAddressFromPrivateKey(env.wallet.privateKey, networkName);
  }

  if (env.wallet.address) {
    return env.wallet.address;
  }

  throw new Error('No wallet address found.');
}

export function containsSensitiveField(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some(containsSensitiveField);
  }

  return Object.entries(value as Record<string, unknown>).some(([key, entryValue]) => {
    return SENSITIVE_FIELD_PATTERN.test(key) || containsSensitiveField(entryValue);
  });
}

export function warnIfSensitiveOutput(value: unknown): void {
  if (containsSensitiveField(value)) {
    console.warn('[mobilestacks] Warning: Output may contain sensitive data.');
  }
}

export async function getResponseJson<T>(response: {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    const detail = body ? `${response.statusText}: ${body}` : response.statusText;
    throw new Error(`Request failed with status ${response.status}: ${detail}`);
  }

  return (await response.json()) as T;
}

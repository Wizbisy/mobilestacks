import { initSimnet } from '@hirosystems/clarinet-sdk';
import { ClarityValue } from '@stacks/transactions';



// Import the SDK's Simnet type under an alias
type SimnetInstance = Awaited<ReturnType<typeof initSimnet>>;

export class Simnet {
  private static _instance: Simnet;
  public simnet!: SimnetInstance;
  public accounts!: Map<string, string>;

  private constructor() {}

  public static async init(): Promise<Simnet> {
    if (!Simnet._instance) {
      Simnet._instance = new Simnet();
      // Initialize SDK - auto-detects Clarinet.toml from CWD
      try {
        console.log('Initializing Simnet...');
        Simnet._instance.simnet = await initSimnet();
        // Get accounts
        Simnet._instance.accounts = Simnet._instance.simnet.getAccounts();
      } catch (error) {
        console.error('Failed to initialize Simnet:', error);
        throw error;
      }
    }
    return Simnet._instance;
  }

  public getDeployer(): string {
    const deployer = this.accounts.get('deployer');
    if (!deployer) throw new Error('Deployer account not found');
    return deployer;
  }

  public getAccount(name: string): string {
    const acc = this.accounts.get(name);
    if (!acc) throw new Error(`Account ${name} not found`);
    return acc;
  }

  public callPublic(contract: string, func: string, args: ClarityValue[], sender: string) {
    return this.simnet.callPublicFn(contract, func, args, sender);
  }

  public callReadOnly(contract: string, func: string, args: ClarityValue[], sender: string) {
    return this.simnet.callReadOnlyFn(contract, func, args, sender);
  }

  public async mineBlock(txs: Parameters<SimnetInstance['mineBlock']>[0]) {
    return this.simnet.mineBlock(txs);
  }
}

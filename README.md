# mobilestacks

A Hardhat-style development framework for Stacks. Write, test, and deploy Clarity smart contracts with a task-based CLI, local Simnet testing, and a pluggable runtime.

## Install

```bash
npm install mobilestacks
```

## Quick Start

Scaffold a new project:

```bash
npx mobilestacks init
```

This generates a config file, a sample Clarity contract, and an example task.

## Configuration

All config lives in `mobilestacks.config.ts`:

```ts
export default {
  networks: {
    mainnet: { url: 'https://api.mainnet.hiro.so', name: 'mainnet' },
    testnet: { url: 'https://api.testnet.hiro.so', name: 'testnet' },
  },
  defaultNetwork: 'testnet',
  wallet: {
    privateKey: process.env.STACKS_PRIVATE_KEY,
  },
};
```

Secrets can live in `.env`; they override config values automatically.

## CLI

```bash
npx mobilestacks                    # list all tasks
npx mobilestacks deploy-contract    # deploy a contract
npx mobilestacks get-balance        # check STX balance
npx mobilestacks send-stx           # send STX
npx mobilestacks faucet-request     # get testnet tokens
```

Missing required params are prompted interactively. Run any task with `--help` for options.

### Built-in Tasks

| Task | What it does |
| ---- | ------------ |
| `deploy-contract` | Deploy a `.clar` file to mainnet/testnet |
| `send-stx` | Transfer STX to an address |
| `get-balance` | Check STX balance for any address |
| `faucet-request` | Request testnet STX from the faucet |
| `list-accounts` | List derived wallet accounts |
| `get-tx-history` | Fetch recent transactions |
| `call-contract-function` | Call a read-only contract function |
| `get-contract-info` | Fetch deployed contract metadata |
| `verify-contract` | Diff on-chain source against a local file |

## Writing Tasks

Drop a file in `src/tasks/`; it is auto-discovered:

```ts
import { task } from 'mobilestacks';
import { z } from 'zod';

task('greet', 'Say hello')
  .addParam('name', 'Who to greet', { schema: z.string().min(1) })
  .setAction((args, env) => {
    return `Hello, ${args.name}! (network: ${env.config.defaultNetwork})`;
  });
```

Subtasks and workflows are also supported:

```ts
import { subtask, runWorkflow } from 'mobilestacks';

subtask('deploy:validate', 'Pre-deploy check', 'deploy-contract').setAction((args, env) => {
  // validate deployment inputs
});

await runWorkflow(
  [
    { taskName: 'deploy-contract', args: { contractName: 'sample-contract' } },
    { taskName: 'verify-contract', args: { contractName: 'sample-contract' } },
  ],
  env,
);
```

## Extending the Runtime

Add custom properties to the runtime environment, available in every task:

```ts
import { extendEnvironment } from 'mobilestacks';

extendEnvironment((env) => {
  env.formatSTX = (micro: number) => `${(micro / 1e6).toFixed(6)} STX`;
});
```

## Testing with Simnet

Test contracts locally using the Clarinet SDK. No devnet is needed:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { Simnet } from 'mobilestacks';
import { Cl } from '@stacks/transactions';

describe('My Contract', () => {
  let simnet: Simnet;

  beforeAll(async () => {
    simnet = await Simnet.init();
  });

  it('calls hello-world', () => {
    const deployer = simnet.getDeployer();
    const { result } = simnet.callPublic('sample-contract', 'hello-world', [], deployer);
    expect(result).toStrictEqual(Cl.ok(Cl.stringAscii('Hello, Stacks!')));
  });
});
```

### Setup

Contract tests need a `Clarinet.toml` and test accounts. Run the setup script once:

```bash
npm run setup:simnet
```

Then run tests:

```bash
npm test
```

## Programmatic API

Use mobilestacks as a library:

```ts
import { task, subtask, extendEnvironment, Simnet, RuntimeEnvironment } from 'mobilestacks';
```

## Project Structure

```text
src/
  cli/           CLI entry point and init scaffolding
  core/          DSL, Simnet, RuntimeEnvironment, task registry
  tasks/         Built-in tasks
  types/         Zod schemas and TypeScript types
  index.ts       Public API
tests/           Vitest test files
contracts/       Clarity contracts
Clarinet.toml    Clarinet project manifest
```

## Contributing

```bash
git clone https://github.com/Wizbisy/mobilestacks.git
cd mobilestacks
npm install
npm run setup:simnet
npm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Security

Private keys and seed phrases are never logged. Output is scanned for sensitive fields and masked automatically when tasks return transaction IDs. Keep your `.env` out of version control.

## License

MIT

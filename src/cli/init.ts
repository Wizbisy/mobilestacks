import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

export async function runInit() {
  console.log('Welcome to mobilestacks project initialization!');
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: path.basename(process.cwd()),
    },
    {
      type: 'input',
      name: 'mainnetUrl',
      message: 'Stacks mainnet node URL:',
      default: 'https://stacks-node-api.mainnet.stacks.co',
    },
    {
      type: 'input',
      name: 'testnetUrl',
      message: 'Stacks testnet node URL:',
      default: 'https://stacks-node-api.testnet.stacks.co',
    },
    {
      type: 'input',
      name: 'privateKey',
      message: 'Your wallet private key (leave blank to use seed phrase):',
    },
    {
      type: 'input',
      name: 'seedPhrase',
      message: 'Your wallet seed phrase (leave blank if using private key):',
    },
    {
      type: 'input',
      name: 'derivationPath',
      message: 'Derivation path (default: m/44\'/5757\'/0\'/0/0):',
      default: "m/44'/5757'/0'/0/0",
    },
  ]);

  const config = `export default {\n  networks: {\n    mainnet: { url: '${answers.mainnetUrl}', name: 'mainnet' },\n    testnet: { url: '${answers.testnetUrl}', name: 'testnet' }\n  },\n  defaultNetwork: 'testnet',\n  wallet: {\n    ${answers.privateKey ? `privateKey: '${answers.privateKey}',` : ''}\n    ${answers.seedPhrase ? `seedPhrase: '${answers.seedPhrase}',` : ''}\n    derivationPath: '${answers.derivationPath}'\n  }\n};\n`;

  fs.writeFileSync(path.join(process.cwd(), 'mobilestacks.config.ts'), config);
  // Scaffold example contract
  const contractsDir = path.join(process.cwd(), 'contracts');
  if (!fs.existsSync(contractsDir)) fs.mkdirSync(contractsDir);
  fs.writeFileSync(path.join(contractsDir, 'sample-contract.clar'), '(define-public (hello-world)\n  (ok "Hello, Stacks!"))\n');
  // Scaffold example user task
  const tasksDir = path.join(process.cwd(), 'src', 'tasks');
  if (!fs.existsSync(tasksDir)) fs.mkdirSync(tasksDir, { recursive: true });
  fs.writeFileSync(path.join(tasksDir, 'example-task.ts'),
    "import { task } from '../core/dsl';\n\ntask('example', 'An example user task for onboarding')\n  .addParam('name', 'Your name', { type: 'string', required: false, defaultValue: 'World' })\n  .setAction(async (args) => {\n    return `Hello, ${args.name}! Welcome to mobilestacks.`;\n  });\n");
  console.log('Created mobilestacks.config.ts, contracts/sample-contract.clar, and src/tasks/example-task.ts!');
}

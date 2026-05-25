import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

type InitAnswers = {
  projectName: string;
  mainnetUrl: string;
  testnetUrl: string;
  derivationPath: string;
};

function writeFileIfMissing(filePath: string, content: string, options?: fs.WriteFileOptions): void {
  if (fs.existsSync(filePath)) {
    throw new Error(`Refusing to overwrite existing file: ${filePath}`);
  }

  fs.writeFileSync(filePath, content, options);
}

export async function runInit(): Promise<void> {
  console.log('Welcome to mobilestacks project initialization.');
  const answers = await inquirer.prompt<InitAnswers>([
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
      default: 'https://api.mainnet.hiro.so',
    },
    {
      type: 'input',
      name: 'testnetUrl',
      message: 'Stacks testnet node URL:',
      default: 'https://api.testnet.hiro.so',
    },
    {
      type: 'input',
      name: 'derivationPath',
      message: "Derivation path (default: m/44'/5757'/0'/0/0):",
      default: "m/44'/5757'/0'/0/0",
    },
  ]);

  const config = `import 'dotenv/config';

export default {
  projectName: ${JSON.stringify(answers.projectName)},
  networks: {
    mainnet: { url: process.env.STACKS_MAINNET_URL || ${JSON.stringify(
      answers.mainnetUrl,
    )}, name: 'mainnet' },
    testnet: { url: process.env.STACKS_TESTNET_URL || ${JSON.stringify(
      answers.testnetUrl,
    )}, name: 'testnet' },
  },
  defaultNetwork: 'testnet',
  wallet: {
    privateKey: process.env.MOBILESTACKS_PRIVATE_KEY || '',
    seedPhrase: process.env.MOBILESTACKS_SEED_PHRASE || '',
    derivationPath: ${JSON.stringify(answers.derivationPath)},
  },
};
`;

  const configPath = path.join(process.cwd(), 'mobilestacks.config.ts');
  const contractsDir = path.join(process.cwd(), 'contracts');
  const sampleContractPath = path.join(contractsDir, 'sample-contract.clar');
  const tasksDir = path.join(process.cwd(), 'src', 'tasks');
  const exampleTaskPath = path.join(tasksDir, 'example-task.ts');
  const existingTargets = [configPath, sampleContractPath, exampleTaskPath].filter((target) =>
    fs.existsSync(target),
  );

  if (existingTargets.length > 0) {
    throw new Error(`Refusing to overwrite existing files:\n${existingTargets.join('\n')}`);
  }

  writeFileIfMissing(configPath, config);

  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    const envContent = `# Mobilestacks secrets - NEVER commit this file.
MOBILESTACKS_PRIVATE_KEY=
MOBILESTACKS_SEED_PHRASE=
STACKS_MAINNET_URL=${answers.mainnetUrl}
STACKS_TESTNET_URL=${answers.testnetUrl}
`;
    fs.writeFileSync(envPath, envContent, { mode: 0o600 });
  }

  if (!fs.existsSync(contractsDir)) fs.mkdirSync(contractsDir);
  writeFileIfMissing(
    sampleContractPath,
    '(define-public (hello-world)\n  (ok "Hello, Stacks!"))\n',
  );

  if (!fs.existsSync(tasksDir)) fs.mkdirSync(tasksDir, { recursive: true });
  writeFileIfMissing(
    exampleTaskPath,
    "import { task } from 'mobilestacks';\n\ntask('example', 'An example user task for onboarding')\n  .addParam('name', 'Your name', { type: 'string', required: false, defaultValue: 'World' })\n  .setAction((args) => {\n    return `Hello, ${args.name}! Welcome to mobilestacks.`;\n  });\n",
  );

  console.log('\nCreated:');
  console.log('   - mobilestacks.config.ts  (reads secrets from env vars)');
  console.log('   - .env                    (store your secrets here)');
  console.log('   - contracts/sample-contract.clar');
  console.log('   - src/tasks/example-task.ts');

  console.log('\nSECURITY WARNING:');
  console.log('   Your wallet secrets belong in the .env file, not in source code.');
  console.log('   - .env is already listed in .gitignore; never remove that entry.');
  console.log('   - Set MOBILESTACKS_PRIVATE_KEY or MOBILESTACKS_SEED_PHRASE in .env.');
  console.log('   - See .env.example for the full list of supported variables.\n');
}

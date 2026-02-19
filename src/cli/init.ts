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
      name: 'derivationPath',
      message: "Derivation path (default: m/44'/5757'/0'/0/0):",
      default: "m/44'/5757'/0'/0/0",
    },
  ]);

  // ── Config file: references env vars, never embeds secrets ──
  const config = `import 'dotenv/config';

export default {
  networks: {
    mainnet: { url: process.env.STACKS_MAINNET_URL || '${answers.mainnetUrl}', name: 'mainnet' },
    testnet: { url: process.env.STACKS_TESTNET_URL || '${answers.testnetUrl}', name: 'testnet' },
  },
  defaultNetwork: 'testnet',
  wallet: {
    // Secrets are read from environment variables — never hard-code them here.
    privateKey: process.env.MOBILESTACKS_PRIVATE_KEY || '',
    seedPhrase: process.env.MOBILESTACKS_SEED_PHRASE || '',
    derivationPath: '${answers.derivationPath}',
  },
};
`;

  fs.writeFileSync(path.join(process.cwd(), 'mobilestacks.config.ts'), config);

  // ── .env file (if it doesn't exist yet) ──
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    const envContent = `# Mobilestacks secrets — NEVER commit this file!\nMOBILESTACKS_PRIVATE_KEY=\nMOBILESTACKS_SEED_PHRASE=\nSTACKS_MAINNET_URL=${answers.mainnetUrl}\nSTACKS_TESTNET_URL=${answers.testnetUrl}\n`;
    fs.writeFileSync(envPath, envContent, { mode: 0o600 }); // owner-only permissions
  }

  // ── Scaffold example contract ──
  const contractsDir = path.join(process.cwd(), 'contracts');
  if (!fs.existsSync(contractsDir)) fs.mkdirSync(contractsDir);
  fs.writeFileSync(
    path.join(contractsDir, 'sample-contract.clar'),
    '(define-public (hello-world)\n  (ok "Hello, Stacks!"))\n',
  );

  // ── Scaffold example user task ──
  const tasksDir = path.join(process.cwd(), 'src', 'tasks');
  if (!fs.existsSync(tasksDir)) fs.mkdirSync(tasksDir, { recursive: true });
  fs.writeFileSync(
    path.join(tasksDir, 'example-task.ts'),
    "import { task } from 'mobilestacks';\n\ntask('example', 'An example user task for onboarding')\n  .addParam('name', 'Your name', { type: 'string', required: false, defaultValue: 'World' })\n  .setAction(async (args: Record<string, string>) => {\n    return `Hello, ${args.name}! Welcome to mobilestacks.`;\n  });\n",
  );

  // ── Security notice ──
  console.log('\n✅ Created:');
  console.log('   • mobilestacks.config.ts  (reads secrets from env vars)');
  console.log('   • .env                    (store your secrets here)');
  console.log('   • contracts/sample-contract.clar');
  console.log('   • src/tasks/example-task.ts');

  console.log('\n⚠️  SECURITY WARNING:');
  console.log('   Your wallet secrets belong in the .env file, NOT in source code.');
  console.log('   • .env is already listed in .gitignore — never remove that entry.');
  console.log('   • Set MOBILESTACKS_PRIVATE_KEY or MOBILESTACKS_SEED_PHRASE in .env');
  console.log('   • See .env.example for the full list of supported variables.\n');
}

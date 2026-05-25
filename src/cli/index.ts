#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import { loadConfig } from '../config/config-loading';
import { RuntimeEnvironment } from '../core/runtime-environment';
import { TaskDefinitions, TaskParam } from '../core/tasks-definitions';
import { runInit } from './init';

const tasksDir = path.join(__dirname, '../tasks');
fs.readdirSync(tasksDir)
  .filter((fileName) => {
    return (
      (fileName.endsWith('.ts') || fileName.endsWith('.js')) &&
      !fileName.endsWith('.d.ts') &&
      !fileName.includes('.test.')
    );
  })
  .forEach((fileName) => {
    require(path.join(tasksDir, fileName));
  });

function getProvidedOptions(argv: string[]): Set<string> {
  return new Set(
    argv
      .filter((arg) => arg.startsWith('--'))
      .map((arg) => arg.slice(2).split('=')[0])
      .filter(Boolean),
  );
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  }

  return Boolean(value);
}

function coerceParamValue(param: TaskParam, value: unknown): unknown {
  if (value === undefined) return value;
  if (param.type === 'number') {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new Error(`Parameter '${param.name}' must be a number.`);
    }
    return parsed;
  }
  if (param.type === 'boolean') {
    return parseBoolean(value);
  }
  return value;
}

function getPackageVersion(): string {
  const packagePath = path.resolve(__dirname, '../../package.json');
  const packageFile = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as { version?: string };
  return packageFile.version || '0.0.0';
}

const program = new Command();
program
  .name('mobilestacks')
  .description('Professional Task Runner for Stacks')
  .version(getPackageVersion());

program
  .command('init')
  .description('Scaffold a new mobilestacks project and config')
  .action(async () => {
    await runInit();
    process.exit(0);
  });

program.action(() => {
  console.log(chalk.bold.blue('\nMobilestacks - Professional Task Runner for Stacks\n'));
  console.log(chalk.white('USAGE: ') + chalk.green('mobilestacks <task> [options]\n'));
  console.log(chalk.bold('Available tasks:'));
  TaskDefinitions.getInstance()
    .getAllTasks()
    .forEach((task) => {
      const params = task.params.map((param) => chalk.yellow(`--${param.name}`)).join(' ');
      console.log(`  ${chalk.cyan(task.name)} ${params}`);
      console.log(`    ${chalk.gray(task.description)}`);
    });
  console.log(
    `\n${chalk.white('Use ')}${chalk.green('mobilestacks <task> --help')}${chalk.white(
      ' for more info on a task.',
    )}`,
  );
  console.log(chalk.white('\nExample:'));
  console.log(
    `  ${chalk.green(
      'mobilestacks deploy-contract --contractName my-contract --file ./contracts/my-contract.clar --network testnet',
    )}`,
  );
  console.log(chalk.white('\nDocs: ') + chalk.underline('https://github.com/Wizbisy/mobilestacks#readme'));
  program.help({ error: false });
});

TaskDefinitions.getInstance()
  .getAllTasks()
  .forEach((task) => {
    const cmd = program.command(task.name).description(task.description);

    task.params.forEach((param) => {
      const optStr = param.type === 'boolean' ? `--${param.name}` : `--${param.name} <value>`;
      cmd.option(optStr, param.description, param.defaultValue as string | boolean | undefined);
    });

    cmd.action(async (opts: Record<string, unknown>) => {
      try {
        const providedOptions = getProvidedOptions(process.argv.slice(3));
        const missingRequiredParams = task.params.filter((param) => {
          return param.required !== false && !providedOptions.has(param.name);
        });

        if (missingRequiredParams.length > 0 && process.stdout.isTTY) {
          const answers = await inquirer.prompt(
            missingRequiredParams.map((param) => ({
              type: param.type === 'boolean' ? 'confirm' : 'input',
              name: param.name,
              message: param.description,
              default: opts[param.name] !== undefined ? opts[param.name] : param.defaultValue,
            })),
          );
          Object.assign(opts, answers);
        }

        task.params.forEach((param) => {
          opts[param.name] = coerceParamValue(param, opts[param.name]);
          if (param.required !== false && (opts[param.name] === undefined || opts[param.name] === '')) {
            throw new Error(`Missing required parameter '${param.name}'.`);
          }
        });

        const config = loadConfig();
        const env = new RuntimeEnvironment(config);
        await env.ready;

        const result = await task.action(opts, env);
        if (typeof result === 'object' && result !== null) {
          const resObj = result as Record<string, unknown>;
          if (resObj.txid) {
            console.log(
              chalk.yellowBright('Transaction broadcasted to mempool. Check explorer for final confirmation.'),
            );
          } else {
            console.log(chalk.greenBright('Success!'));
          }
          console.dir(result, { depth: null, colors: true });
        } else {
          console.log(chalk.greenBright(result));
        }
      } catch (err) {
        const error = err as Error;
        console.error(chalk.redBright('Task failed:'), error.message || error);
        if (error && typeof error === 'object' && 'stack' in error && error.stack) {
          console.error(chalk.gray(error.stack));
        }
        process.exit(1);
      }
    });
  });

program.parse(process.argv);

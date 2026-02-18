#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import { loadConfig } from '../config/config-loading';
import { RuntimeEnvironment } from '../core/runtime-environment';
import { TaskDefinitions } from '../core/tasks-definitions';
import { runInit } from './init';
import inquirer from 'inquirer';

// Import all user tasks
import fs from 'fs';
import path from 'path';
// Auto-load all tasks in src/tasks
const tasksDir = path.join(__dirname, '../tasks');
fs.readdirSync(tasksDir)
  .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
  .forEach(f => {
    require(path.join(tasksDir, f));
  });

const program = new Command();
program
  .name('mobilestacks')
  .description('Professional Task Runner for Stacks')
  .version('0.1.0');


// Init command for project scaffolding
program
  .command('init')
  .description('Scaffold a new mobilestacks project and config')
  .action(async () => {
    await runInit();
    process.exit(0);
  });

// List all tasks if no command is given
program.action(() => {
  console.log(chalk.bold.blue('\nMobilestacks - Professional Task Runner for Stacks\n'));
  console.log(chalk.white('USAGE: ') + chalk.green('mobilestacks <task> [options]\n'));
  console.log(chalk.bold('Available tasks:'));
  TaskDefinitions.getInstance().getAllTasks().forEach(task => {
    const params = task.params.map(p => chalk.yellow(`--${p.name}`)).join(' ');
    console.log('  ' + chalk.cyan(task.name) + ' ' + params);
    console.log('    ' + chalk.gray(task.description));
  });
  console.log('\n' + chalk.white('Use ') + chalk.green('mobilestacks <task> --help') + chalk.white(' for more info on a task.'));
  console.log(chalk.white('\nExample:'));
  console.log('  ' + chalk.green('mobilestacks deploy-contract --contractName my-contract --file ./contracts/my-contract.clar --network testnet'));
  console.log(chalk.white('\nDocs: ') + chalk.underline('https://github.com/your-org/mobilestacks#readme'));
  program.help({ error: false });
});

// Dynamically add all registered tasks

TaskDefinitions.getInstance().getAllTasks().forEach(task => {
  const cmd = program.command(task.name)
    .description(task.description);
  task.params.forEach(param => {
    const optStr = `--${param.name} <value>`;
    if (param.required !== false) {
      cmd.option(optStr, param.description);
    } else {
      cmd.option(optStr, param.description, param.defaultValue as string | boolean | undefined);
    }
  });
  cmd.action(async (opts) => {
    try {
      // Prompt for missing required params
      const missing = task.params.filter(p => p.required !== false && !opts[p.name]);
      if (missing.length > 0) {
        const answers = await inquirer.prompt(missing.map(p => ({
          type: p.type === 'boolean' ? 'confirm' : 'input',
          name: p.name,
          message: p.description,
          default: p.defaultValue
        })));
        Object.assign(opts, answers);
      }
      // Type conversion
      task.params.forEach(p => {
        if (opts[p.name] && p.type === 'number') opts[p.name] = Number(opts[p.name]);
        if (opts[p.name] && p.type === 'boolean') opts[p.name] = Boolean(opts[p.name]);
      });
      const config = loadConfig();
      const env = new RuntimeEnvironment(config);
      const result = await task.action(opts, env);
      if (typeof result === 'object') {
        console.log(chalk.greenBright('Success!'));
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

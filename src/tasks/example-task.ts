import { task } from '../core/dsl';

task('example', 'An example user task for onboarding')
  .addParam('name', 'Your name', { type: 'string', required: false, defaultValue: 'World' })
  .setAction(async (args) => {
    return `Hello, ${args.name}! Welcome to mobilestacks.`;
  });

import { describe, it, expect, beforeEach } from 'vitest';
import { task } from './dsl';
import { TaskDefinitions } from './tasks-definitions';
import { z } from 'zod';
import { RuntimeEnvironment } from './runtime-environment';
import { extendEnvironment, Extender } from './extender';

describe('DSL', () => {
  beforeEach(() => {
    // Clear tasks before each test
    (TaskDefinitions.getInstance() as unknown as { _tasks: unknown[] })._tasks = [];
  });

  it('should register a task with generic parameters', () => {
    task('test-task', 'A test task')
      .addParam('p1', 'param 1')
      .setAction(async () => { return 'done'; });

    const def = TaskDefinitions.getInstance().getTask('test-task');
    expect(def).toBeDefined();
    expect(def?.name).toBe('test-task');
    expect(def?.params.length).toBe(1);
  });

  it('should validate Zod schema', async () => {
    task('zod-task', 'Task with validation')
      .addParam('age', 'Age param', { schema: z.number().min(18) })
      .setAction(async (args) => {
        return args.age;
      });
    
    const def = TaskDefinitions.getInstance().getTask('zod-task');
    expect(def).toBeDefined();

    // Mock environment
    const env = {} as RuntimeEnvironment;

    // Valid call
    const result = await def?.action({ age: 20 }, env);
    expect(result).toBe(20);

    // Invalid call
    await expect(def?.action({ age: 10 }, env)).rejects.toThrow('Invalid value for parameter \'age\'');
  });

  it('should support environment extensions', () => {
    
    
    // Clear extensions
    (Extender.getInstance() as unknown as { _extensions: unknown[] })._extensions = [];

    extendEnvironment((env: RuntimeEnvironment) => {
      env['foo'] = 'bar';
    });

    const extensions = Extender.getInstance().getExtensions();
    expect(extensions.length).toBe(1);
    
    const mockEnv = {} as RuntimeEnvironment;
    extensions[0](mockEnv);
    expect(mockEnv['foo']).toBe('bar');
  });
});

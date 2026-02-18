import { TaskDefinitions, TaskDefinition, TaskParam, TaskParamType } from './tasks-definitions';
import { ZodSchema } from 'zod';
import { RuntimeEnvironment } from './runtime-environment';
import { extendEnvironment } from './extender';

function task(name: string, description: string) {
  const params: TaskParam[] = [];
  return {
    addParam(
      paramName: string,
      paramDesc: string,
      options?: { type?: TaskParamType; required?: boolean; defaultValue?: unknown; schema?: ZodSchema }
    ) {
      params.push({
        name: paramName,
        description: paramDesc,
        type: options?.type || 'string',
        required: options?.required !== false, // default true
        defaultValue: options?.defaultValue,
        schema: options?.schema,
      });
      return this;
    },
    setAction(action: (args: Record<string, unknown>, env: RuntimeEnvironment) => Promise<unknown>) {
      const def: TaskDefinition = {
        name,
        description,
        params,
        action: async (args: Record<string, unknown>, env: RuntimeEnvironment) => {
          // Validate args against schemas if present
          for (const param of params) {
            if (param.schema && args[param.name] !== undefined) {
              try {
                param.schema.parse(args[param.name]);
              } catch (error) {
                throw new Error(`Invalid value for parameter '${param.name}': ${error}`);
              }
            }
          }
          return action(args, env);
        },
      };
      TaskDefinitions.getInstance().addTask(def);
      return def;
    },
  };
}

function subtask(name: string, description: string, parentTaskName?: string) {
  // Register as a subtask with a parent if provided
  const sub = task(name, description);
  if (parentTaskName) {
    // Attach parent info for future use (e.g., dependency graph, CLI grouping)
    const def = TaskDefinitions.getInstance().getTask(name);
    if (def) (def as TaskDefinition & { parent?: string }).parent = parentTaskName;
  }
  return sub;
}

// Workflow system: define and run ordered task/subtask sequences
export type WorkflowStep = { taskName: string; args?: Record<string, unknown> };
export type Workflow = WorkflowStep[];

export async function runWorkflow(workflow: Workflow, env: RuntimeEnvironment) {
  for (const step of workflow) {
    const def = TaskDefinitions.getInstance().getTask(step.taskName);
    if (!def) throw new Error(`Task not found: ${step.taskName}`);
    // eslint-disable-next-line no-await-in-loop
    await def.action(step.args || {}, env);
  }
}

export { task, subtask, extendEnvironment };

import { TaskAction, TaskDefinitions, TaskDefinition, TaskParam, TaskParamType } from './TasksDefinitions';
import { ZodError, ZodSchema } from 'zod';
import { RuntimeEnvironment } from './RuntimeEnvironment';
import { extendEnvironment } from './extender';

type TaskParamOptions = {
  type?: TaskParamType;
  required?: boolean;
  defaultValue?: unknown;
  schema?: ZodSchema;
};

function formatValidationError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join(', ');
  }

  return error instanceof Error ? error.message : String(error);
}

function task(name: string, description: string, parent?: string) {
  const params: TaskParam[] = [];
  return {
    addParam(paramName: string, paramDesc: string, options?: TaskParamOptions) {
      params.push({
        name: paramName,
        description: paramDesc,
        type: options?.type || 'string',
        required: options?.required !== false,
        defaultValue: options?.defaultValue,
        schema: options?.schema,
      });
      return this;
    },
    setAction(action: TaskAction) {
      const def: TaskDefinition = {
        name,
        description,
        params,
        parent,
        action: async (args: Record<string, unknown>, env: RuntimeEnvironment) => {
          for (const param of params) {
            if (param.schema && args[param.name] !== undefined) {
              try {
                param.schema.parse(args[param.name]);
              } catch (error) {
                throw new Error(
                  `Invalid value for parameter '${param.name}': ${formatValidationError(error)}`,
                );
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
  return task(name, description, parentTaskName);
}

export type WorkflowStep = { taskName: string; args?: Record<string, unknown> };
export type Workflow = WorkflowStep[];

export async function runWorkflow(workflow: Workflow, env: RuntimeEnvironment) {
  for (const step of workflow) {
    const def = TaskDefinitions.getInstance().getTask(step.taskName);
    if (!def) throw new Error(`Task not found: ${step.taskName}`);
    await def.action(step.args || {}, env);
  }
}

export { task, subtask, extendEnvironment };

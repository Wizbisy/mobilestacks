import { ZodSchema } from 'zod';
import { RuntimeEnvironment } from './runtime-environment';

export type TaskParamType = 'string' | 'number' | 'boolean';
export interface TaskParam {
  name: string;
  description: string;
  type?: TaskParamType;
  required?: boolean;
  defaultValue?: unknown;
  schema?: ZodSchema;
}

export interface TaskDefinition {
  name: string;
  description: string;
  params: TaskParam[];
  action: (args: Record<string, unknown>, env: RuntimeEnvironment) => Promise<unknown>;
}

class TaskDefinitions {
  private static _instance: TaskDefinitions;
  private _tasks: TaskDefinition[] = [];

  private constructor() {}

  public static getInstance(): TaskDefinitions {
    if (!TaskDefinitions._instance) {
      TaskDefinitions._instance = new TaskDefinitions();
    }
    return TaskDefinitions._instance;
  }

  public addTask(task: TaskDefinition) {
    this._tasks.push(task);
  }

  public getTask(name: string): TaskDefinition | undefined {
    return this._tasks.find((t) => t.name === name);
  }

  public getAllTasks(): TaskDefinition[] {
    return this._tasks;
  }
}

export { TaskDefinitions };

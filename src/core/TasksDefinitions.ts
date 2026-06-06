import { ZodSchema } from 'zod';
import { RuntimeEnvironment } from './RuntimeEnvironment';

export type TaskParamType = 'string' | 'number' | 'boolean';
export type TaskAction = (
  args: Record<string, unknown>,
  env: RuntimeEnvironment,
) => unknown | Promise<unknown>;

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
  parent?: string;
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

  public addTask(task: TaskDefinition): void {
    const existingIndex = this._tasks.findIndex((registeredTask) => registeredTask.name === task.name);
    if (existingIndex >= 0) {
      this._tasks[existingIndex] = task;
      return;
    }

    this._tasks.push(task);
  }

  public getTask(name: string): TaskDefinition | undefined {
    return this._tasks.find((t) => t.name === name);
  }

  public getAllTasks(): TaskDefinition[] {
    return this._tasks;
  }

  public clear(): void {
    this._tasks = [];
  }
}

export { TaskDefinitions };

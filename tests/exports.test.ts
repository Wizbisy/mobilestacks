import { describe, it, expect } from 'vitest';
import * as Mobilestacks from '../src/index';

describe('Package Exports', () => {
  it('should export core members', () => {
    expect(Mobilestacks.task).toBeDefined();
    expect(Mobilestacks.subtask).toBeDefined();
    expect(Mobilestacks.extendEnvironment).toBeDefined();
    expect(Mobilestacks.Simnet).toBeDefined();
    expect(Mobilestacks.RuntimeEnvironment).toBeDefined();
    expect(Mobilestacks.TaskDefinitions).toBeDefined();
  });
});

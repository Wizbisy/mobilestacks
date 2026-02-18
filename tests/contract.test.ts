import { describe, it, expect, beforeAll } from 'vitest';
import { Simnet } from '../src/core/simnet';
import { Cl } from '@stacks/transactions';

describe('Sample Contract (Simnet)', () => {
  let simnet: Simnet;
  let deployer: string;

  beforeAll(async () => {
    simnet = await Simnet.init();
    deployer = simnet.getDeployer();
  });

  it('should call hello-world public function', () => {
    const result = simnet.callPublic(
      'sample-contract',
      'hello-world',
      [],
      deployer
    );
    // The function returns (ok "Hello, Stacks!")
    expect(result.result).toStrictEqual(Cl.ok(Cl.stringAscii('Hello, Stacks!')));
  });
});

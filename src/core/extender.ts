import { RuntimeEnvironment } from './runtime-environment';

export type ExtensionFunc = (env: RuntimeEnvironment) => void;

export class Extender {
  private static _instance: Extender;
  private _extensions: ExtensionFunc[] = [];

  private constructor() {}

  public static getInstance(): Extender {
    if (!Extender._instance) {
      Extender._instance = new Extender();
    }
    return Extender._instance;
  }

  public addExtension(func: ExtensionFunc): void {
    this._extensions.push(func);
  }

  public getExtensions(): ExtensionFunc[] {
    return this._extensions;
  }

  public clear(): void {
    this._extensions = [];
  }
}

export function extendEnvironment(func: ExtensionFunc): void {
  Extender.getInstance().addExtension(func);
}

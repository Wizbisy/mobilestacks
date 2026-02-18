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

  public addExtension(func: ExtensionFunc) {
    this._extensions.push(func);
  }

  public getExtensions(): ExtensionFunc[] {
    return this._extensions;
  }
}

export function extendEnvironment(func: ExtensionFunc) {
  Extender.getInstance().addExtension(func);
}

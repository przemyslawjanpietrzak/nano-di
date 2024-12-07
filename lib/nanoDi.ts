import "reflect-metadata";

export type DiConstructor<T = any> = new (...args: Array<any>) => T;

export interface IContainer {
  bind<T>(identifier: string | symbol, implementation: DiConstructor<T>, scope?: DiContainerScope): void;
  bindConstant<T>(identifier: string | symbol, value: T): void;
  resolve<T>(identifier: string | symbol): T;
}

export const enum DiContainerScope {
  Singleton,
  Transient,
}

export interface Binding<T> {
  scope: DiContainerScope;
  implementation: DiConstructor<T> | (() => T);
  instance?: T;
}

export class Container implements IContainer {
  private bindings = new Map<string | symbol, Binding<any>>();

  static create<T extends IContainer = IContainer>() {
    return new Container() as unknown as T;
  }

  // Bind a dependency with an optional scope
  bind<T>(
    identifier: string | symbol,
    implementation: DiConstructor<T>,
    scope: DiContainerScope = DiContainerScope.Singleton,
  ) {
    this.bindings.set(identifier, { implementation, scope });
  }

  // Bind a constant value
  bindConstant<T>(identifier: string | symbol, value: T) {
    this.bindings.set(identifier, {
      implementation: () => value,
      scope: DiContainerScope.Singleton,
      instance: value,
    });
  }

  // Resolve a dependency
  resolve<T>(identifier: string | symbol): T {
    const binding = this.bindings.get(identifier);
    if (!binding) {
      throw new Error(`No binding found for identifier: ${String(identifier)}`);
    }

    if (binding.scope === DiContainerScope.Singleton) {
      // Return the existing instance if it's a singleton
      if (!binding.instance) {
        binding.instance = this.createInstance(binding.implementation);
      }
      return binding.instance;
    }

    // Otherwise, create a new instance each time (transient)
    return this.createInstance(binding.implementation);
  }

  // Create an instance, resolving dependencies recursively
  private createInstance<T>(implementation: DiConstructor<T> | (() => T)): T {
    if (typeof implementation === "function" && implementation.prototype) {
      // It's a class constructor; resolve dependencies
      const paramTypes: Array<string> = Reflect.getMetadata("design:paramtypes", implementation) || [];
      const dependencies = paramTypes.map((paramType) => this.resolve(paramType));
      // @ts-expect-error
      return new implementation(...dependencies);
    }

    // Otherwise, assume it's a factory function
    // @ts-expect-error
    return implementation();
  }
}

// Decorators for binding and injecting
export function injectable(): ClassDecorator {
  return (target: any) => {
    // Placeholder to mark the class as injectable
    Reflect.defineMetadata("injectable", true, target);
  };
}

export function inject(identifier: string | symbol): ParameterDecorator {
  return (target, _propertyKey, parameterIndex) => {
    const existingInjections: Array<any> = Reflect.getMetadata("design:paramtypes", target) || [];
    existingInjections[parameterIndex] = identifier;
    Reflect.defineMetadata("design:paramtypes", existingInjections, target);
  };
}

import { Reflect as ReflectMetadata } from "@dx/reflect";

export type DiConstructor<T = unknown> = new (...args: Array<unknown>) => T;

export interface IContainer {
	bind<T>(identifier: string | symbol, implementation: DiConstructor<T>, scope?: DiContainerScope): void;
	bindConstant<T>(identifier: string | symbol, value: T): void;
	resolve<T>(identifier: string | symbol): T;
}

export const enum DiContainerScope {
	Singleton = 0,
	Transient = 1,
}

export interface Binding<T> {
	scope: DiContainerScope;
	implementation: DiConstructor<T> | (() => T);
	instance?: T;
}

export class Container implements IContainer {
	private bindings = new Map<string | symbol, Binding<unknown>>();

	/**
	 * Create a new container instance. Pass ContainerFacade as generic to retype the container.
	 */
	static create<T extends IContainer = IContainer>(): T {
		return new Container() as unknown as T;
	}

	/**
	 * Bind dependency to the container on the identifier key with proper scope.
	 */
	bind<T>(
		identifier: string | symbol,
		implementation: DiConstructor<T>,
		scope: DiContainerScope = DiContainerScope.Singleton,
	) {
		this.bindings.set(identifier, { implementation, scope });
		return this;
	}

	/**
	 * Bind constant to the container on the identifier key, instead of class instance.
	 */
	bindConstant<T>(identifier: string | symbol, value: T) {
		this.bindings.set(identifier, {
			implementation: () => value,
			scope: DiContainerScope.Singleton,
			instance: value,
		});
	}

	/**
	 * Resolve the dependency from the container. Based on key, it will return the instance of the class.
	 */
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
			return binding.instance as T;
		}

		// Otherwise, create a new instance each time (transient)
		return this.createInstance(binding.implementation) as T;
	}

	// Create an instance, resolving dependencies recursively
	private createInstance<T>(implementation: DiConstructor<T> | (() => T)): T {
		if (typeof implementation === "function" && implementation.prototype) {
			// It's a class constructor; resolve dependencies
			const paramTypes: Array<string> = ReflectMetadata.getMetadata("design:paramtypes", implementation) || [];
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
	return (target: unknown) => {
		// Placeholder to mark the class as injectable
		ReflectMetadata.defineMetadata("injectable", true, target);
	};
}

export function inject(identifier: string | symbol): ParameterDecorator {
	return (target, _propertyKey, parameterIndex) => {
		const existingInjections: Array<unknown> = ReflectMetadata.getMetadata("design:paramtypes", target) || [];
		existingInjections[parameterIndex] = identifier;
		ReflectMetadata.defineMetadata("design:paramtypes", existingInjections, target);
	};
}

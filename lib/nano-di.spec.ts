import { describe, expect, it, beforeEach } from "vitest";

import { Container, injectable, inject, DiContainerScope } from "./nano-di.ts";

describe("Lightweight DI Library", () => {
	let container: Container;

	beforeEach(() => {
		container = Container.create();
	});

	it("should resolve class instance", () => {
		@injectable()
		class ServiceA {
			getMessage() {
				return "Hello from ServiceA!";
			}
		}

		container.bind("ServiceA", ServiceA);
		const serviceA = container.resolve<ServiceA>("ServiceA");

		expect(serviceA).toBeInstanceOf(ServiceA);
		expect(serviceA.getMessage()).toBe("Hello from ServiceA!");
	});

	it("when class was not injected resolve should throw proper error", () => {});

	it("should throw an error for unbound dependencies", () => {
		@injectable()
		class ServiceA {}

		expect(() => container.resolve<ServiceA>("ServiceA")).toThrow("No binding found for identifier: ServiceA");
	});

	it("should resolve constant values", () => {
		container.bindConstant("Config", { appName: "MyApp" });

		const config = container.resolve<{ appName: string }>("Config");

		expect(config).toEqual({ appName: "MyApp" });
	});

	it("should resolve multiple levels of dependencies", () => {
		@injectable()
		class ServiceA {
			getMessage() {
				return "Hello from ServiceA!";
			}
		}

		@injectable()
		class ServiceB {
			constructor(@inject("ServiceA") private serviceA: ServiceA) {}

			getServiceAMessage() {
				return this.serviceA.getMessage();
			}
		}

		@injectable()
		class ServiceC {
			constructor(@inject("ServiceB") private serviceB: ServiceB) {}

			getCombinedMessage() {
				return `${this.serviceB.getServiceAMessage()} And ServiceC too!`;
			}
		}

		container.bind("ServiceA", ServiceA).bind("ServiceB", ServiceB).bind("ServiceC", ServiceC);

		const serviceC = container.resolve<ServiceC>("ServiceC");

		expect(serviceC).toBeInstanceOf(ServiceC);
		expect(serviceC.getCombinedMessage()).toBe("Hello from ServiceA! And ServiceC too!");
	});

	it("should create a singleton instance", () => {
		@injectable()
		class SingletonService {
			id = crypto.randomUUID();
		}

		container.bind("SingletonService", SingletonService, DiContainerScope.Singleton);

		const instance1 = container.resolve<SingletonService>("SingletonService");
		const instance2 = container.resolve<SingletonService>("SingletonService");

		expect(instance1).toBe(instance2); // Same instance
		expect(instance1.id).toBe(instance2.id);
	});

	it("should create multiple transient instances", () => {
		@injectable()
		class TransientService {
			id = crypto.randomUUID();
		}

		container.bind("TransientService", TransientService, DiContainerScope.Transient);

		const instance1 = container.resolve<TransientService>("TransientService");
		const instance2 = container.resolve<TransientService>("TransientService");

		expect(instance1).not.toBe(instance2); // Different instances
		expect(instance1.id).not.toBe(instance2.id);
	});

	it("should mix singleton and transient scopes", () => {
		@injectable()
		class SingletonService {
			id = crypto.randomUUID();
		}

		@injectable()
		class TransientService {
			id = crypto.randomUUID();
		}

		@injectable()
		class ClientService {
			constructor(
				@inject("SingletonService") private singletonService: SingletonService,
				@inject("TransientService") private transientService: TransientService,
			) {}

			getIds() {
				return {
					singleton: this.singletonService.id,
					transient: this.transientService.id,
				};
			}
		}

		container.bind("SingletonService", SingletonService, DiContainerScope.Singleton);
		container.bind("TransientService", TransientService, DiContainerScope.Transient);
		container.bind("ClientService", ClientService, DiContainerScope.Transient);

		const client1 = container.resolve<ClientService>("ClientService");
		const client2 = container.resolve<ClientService>("ClientService");

		expect(client1.getIds().singleton).toBe(client2.getIds().singleton);

		expect(client1.getIds().transient).not.toBe(client2.getIds().transient);
	});
});

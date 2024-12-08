# nanoDi lightway dependency injection library

This library provides a simple, lightweight dependency injection for TypeScript. It supports singleton and transient scopes, constants, and recursive dependency resolution.

## Features

- **Binding and resolution** of class dependencies.
- **Singleton and transient** lifecycle scopes.
- Support for **constant values**.
- **Decorators** for marking classes as injectable and injecting dependencies.

## Installation

Install:

```bash
npx jsr add @beigert/nano-di S
```

## Usage

```ts
import { Container, DiContainerScope, injectable  } from "@beigert/nano-di";

const container = Container.create();

const ServiceASymbol = Symbol("ServiceA");
@injectable()
class ServiceA {
  getMessage() {
    return "Hello from ServiceA!";
  }
}

const ServiceBSymbol = Symbol("ServiceB");
@injectable()
class ServiceB {
  constructor(@inject(ServiceASymbol) private readonly serviceA: ServiceA) {}

  getMessages() {
    return [
      this.serviceA.getMessage(),
      "Hello from ServiceB!"
    ];
  }
}

container
  .bind(ServiceASymbol, ServiceA)
  .bind(ServiceBSymbol, ServiceB);

const serviceB = container.resolve(ServiceBSymbol);
serviceB.getMessages(); // ["Hello from ServiceA!", "Hello from ServiceB!"]
```


## Bind constant value

```ts
import { Container, DiContainerScope, injectable  } from "@beigert/nano-di";

const container = Container.create();

const ServiceASymbol = Symbol("ServiceA");
const ServiceBSymbol = Symbol("ServiceB");
@injectable()
class ServiceB {
  constructor(@inject(ServiceASymbol) private readonly serviceA: ServiceA) {}

  getMessages() {
    return [
      this.serviceA.getMessage(),
      "Hello from ServiceB!"
    ];
  }
}

container
  .bindConstant(ServiceASymbol, { getMessage: () => "Hello from ServiceA!" })
  .bind(ServiceBSymbol, ServiceB, DiContainerScope.Singleton);

const serviceB = container.resolve(ServiceBSymbol);
serviceB.getMessages(); // ["Hello from ServiceA!", "Hello from ServiceB!"]
```


## Scopes

```ts
const container = Container.create();

@injectable()
class SingletonService {
  id = crypto.randomUUID();
}
container.bind("SingletonService", SingletonService, DiContainerScope.Singleton);
const instance1 = container.resolve<SingletonService>("SingletonService");
const instance2 = container.resolve<SingletonService>("SingletonService");

instance1.id === instance2.id // true
```

```ts
const container = Container.create();

@injectable()
class TransientService {
  id = crypto.randomUUID();
}

container.bind("TransientService", TransientService, DiContainerScope.Transient);

const instance1 = container.resolve<TransientService>("TransientService");
const instance2 = container.resolve<TransientService>("TransientService");

instance1.id === instance2.id // false
```

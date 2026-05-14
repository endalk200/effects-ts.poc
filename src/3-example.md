# Effect-TS Dependency Injection: Services Done Right

> **Learning Path**: Read this → Study `3-example.effect.ts` → Practice with `3-example.problem.ts`

## Introduction

In `3-example.ts`, you saw traditional dependency injection patterns:
- Manual parameter passing
- Constructor injection
- Factory functions
- Singletons
- Service containers

**Problems with Traditional DI:**

```typescript
// Manual passing – signatures become unwieldy
function findUser(db: Database, logger: Logger, id: number): Promise<User> { ... }

// Constructor injection – lots of boilerplate
class UserService {
  constructor(
    private db: Database,
    private email: EmailService,
    private logger: Logger,
    private config: Config
  ) {}
}

// Singletons – global state nightmare
let globalLogger: Logger | null = null;
function getLogger(): Logger {
  if (!globalLogger) throw new Error("Not initialized!");
  return globalLogger;
}
```

**Common issues:**
- Dependencies hidden from type system
- Runtime errors when dependencies missing
- Hard to test (mock everything manually)
- No compile-time verification

**Effect's solution:** The `R` (Requirements) type parameter + Layers

---

## The `R` in `Effect<A, E, R>`

Remember `Effect<A, E, R>`? The **R** tracks what services an effect needs:

```typescript
// This effect needs a Logger service
const logEffect: Effect.Effect<void, never, Logger> = ...;
//                                          ^^^^^^
//                                          Requirements!

// This effect needs Logger AND Database
const dbEffect: Effect.Effect<User, DbError, Logger | Database> = ...;
//                                           ^^^^^^^^^^^^^^^^^^
//                                           Multiple requirements!
```

**Key insight:** TypeScript won't let you run an effect until you provide all its requirements.

```typescript
// ❌ Error: Logger is not provided
Effect.runPromise(logEffect);

// ✅ Must provide Logger first
Effect.runPromise(Effect.provide(logEffect, LoggerLayer));
```

---

## Defining Services with `Context.Service`

Services are defined using `Context.Service`:

```typescript
import { Context, Effect } from "effect";

class Logger extends Context.Service<
  Logger,
  {
    readonly info: (message: string) => Effect.Effect<void, never, never>;
    readonly error: (message: string) => Effect.Effect<void, never, never>;
  }
>()("Logger") {}
```

**Anatomy:**
- `Context.Service<Logger, Shape>()("Logger")` – Creates a unique identifier (the string is for debugging)
- First type param: The tag class itself
- Second type param: The service interface

### Value Services (No Methods)

```typescript
class Config extends Context.Service<
  Config,
  {
    readonly apiUrl: string;
    readonly timeout: number;
    readonly maxRetries: number;
  }
>()("Config") {}
```

### Method Services

```typescript
class Database extends Context.Service<
  Database,
  {
    readonly findUser: (id: number) => Effect.Effect<User | null, DbError, never>;
    readonly saveUser: (user: User) => Effect.Effect<void, DbError, never>;
  }
>()("Database") {}
```

---

## Accessing Services in Effects

Use `yield*` with the service tag:

```typescript
const program = Effect.gen(function* () {
  // Get the Logger service
  const logger = yield* Logger;
  
  // Use it
  yield* logger.info("Hello!");
  
  // Get another service
  const db = yield* Database;
  const user = yield* db.findUser(1);
  
  return user;
});

// Type: Effect<User | null, DbError, Logger | Database>
//                                    ^^^^^^^^^^^^^^^^^
//                                    Requirements tracked automatically!
```

**The magic:** TypeScript automatically unions all your requirements.

---

## Creating Layers with `Layer.succeed`

Layers are **recipes** for creating services. The simplest layer:

```typescript
import { Layer } from "effect";

const LoggerLive: Layer.Layer<Logger, never, never> = Layer.succeed(
  Logger,  // What service to provide
  {        // The implementation
    info: (msg) => Effect.sync(() => console.log(`[INFO] ${msg}`)),
    error: (msg) => Effect.sync(() => console.error(`[ERROR] ${msg}`)),
  }
);
```

**Layer type: `Layer<ROut, E, RIn>`**
- `ROut` – Services this layer provides
- `E` – Errors that can occur during construction
- `RIn` – Services this layer needs to be built

For `LoggerLive`:
- Provides: `Logger`
- Errors: `never` (can't fail)
- Requires: `never` (no dependencies)

### Value Service Layers

```typescript
const ConfigLive: Layer.Layer<Config, never, never> = Layer.succeed(
  Config,
  {
    apiUrl: "https://api.example.com",
    timeout: 5000,
    maxRetries: 3
  }
);
```

---

## Layers with Internal State: `Layer.effect`

When your service needs mutable state:

```typescript
const InMemoryDatabaseLive: Layer.Layer<Database, never, never> = Layer.effect(
  Database
)(
  Effect.sync(() => {
    // State captured in closure
    const users = new Map<number, User>();
    
    return {
      findUser: (id: number) => 
        Effect.sync(() => users.get(id) ?? null),
      
      saveUser: (user: User) => 
        Effect.sync(() => { users.set(user.id, user); }),
    };
  })
);
```

**When to use:**
- `Layer.succeed` – Static implementation, no state
- `Layer.effect` – Need to run an Effect to create the service (state, async init)

---

## Layers That Depend on Other Services

Real services often need other services:

```typescript
class UserService extends Context.Service<
  UserService,
  {
    readonly getUser: (id: number) => Effect.Effect<User | null, DbError, never>;
    readonly createUser: (name: string, email: string) => Effect.Effect<User, DbError, never>;
  }
>()("UserService") {}

// UserService needs Database and Logger to work
const UserServiceLive: Layer.Layer<
  UserService,     // Provides
  never,           // Errors
  Database | Logger // Requires!
> = Layer.effect(
  UserService
)(
  Effect.gen(function* () {
    // Access required services during construction
    const db = yield* Database;
    const logger = yield* Logger;
    
    return {
      getUser: (id: number) => Effect.gen(function* () {
        yield* logger.info(`Getting user: ${id}`);
        return yield* db.findUser(id);
      }),
      
      createUser: (name: string, email: string) => Effect.gen(function* () {
        yield* logger.info(`Creating user: ${name}`);
        const user = { id: Date.now(), name, email };
        yield* db.saveUser(user);
        return user;
      }),
    };
  })
);
```

---

## Composing Layers

### Merging Independent Layers

```typescript
// Combine layers that don't depend on each other
const BasicLayers = Layer.merge(LoggerLive, ConfigLive);
// Type: Layer<Logger | Config, never, never>

// Merge multiple at once
const InfrastructureLayers = Layer.mergeAll(
  LoggerLive,
  ConfigLive,
  InMemoryDatabaseLive,
  MockEmailServiceLive
);
// Type: Layer<Logger | Config | Database | EmailService, never, never>
```

### Providing Dependencies to Layers

```typescript
// UserServiceLive requires Database | Logger
// InfrastructureLayers provides Database | Logger | ...

const UserServiceWithDeps: Layer.Layer<UserService, never, never> = 
  Layer.provide(UserServiceLive, InfrastructureLayers);
```

**What happened:**
- `UserServiceLive` needed `Database | Logger`
- `InfrastructureLayers` provides those
- Result: A layer that provides `UserService` with no requirements

### Building Complete Application Layers

```typescript
const AppLayer: Layer.Layer<
  Logger | Config | Database | EmailService | UserService,
  never,
  never
> = Layer.mergeAll(
  LoggerLive,
  ConfigLive,
  InMemoryDatabaseLive,
  MockEmailServiceLive,
  UserServiceWithDeps  // Already has deps satisfied
);
```

---

## Providing Services to Effects

### With Layers

```typescript
const program: Effect.Effect<User, DbError, UserService | Logger> = 
  Effect.gen(function* () {
    const userService = yield* UserService;
    const logger = yield* Logger;
    
    yield* logger.info("Starting...");
    return yield* userService.createUser("Alice", "alice@example.com");
  });

// Run with layer
const result = await Effect.runPromise(
  Effect.provide(program, AppLayer)
);
```

### Inline Service with `Effect.provideService`

For quick one-off services:

```typescript
const program = Effect.gen(function* () {
  const logger = yield* Logger;
  yield* logger.info("Hello!");
});

const result = Effect.runSync(
  Effect.provideService(program, Logger, {
    info: (msg) => Effect.sync(() => console.log(msg)),
    error: (msg) => Effect.sync(() => console.error(msg)),
  })
);
```

---

## Testing with Mock Layers

**This is where Effect shines!** Just create different layers for testing:

### Test Logger That Collects Logs

```typescript
function makeTestLogger(): {
  layer: Layer.Layer<Logger, never, never>;
  logs: string[];
} {
  const logs: string[] = [];
  
  const layer = Layer.succeed(Logger, {
    info: (msg) => Effect.sync(() => { logs.push(`[INFO] ${msg}`); }),
    error: (msg) => Effect.sync(() => { logs.push(`[ERROR] ${msg}`); }),
  });
  
  return { layer, logs };
}

// In your test:
const { layer: testLoggerLayer, logs } = makeTestLogger();

await Effect.runPromise(
  Effect.provide(myProgram, testLoggerLayer)
);

expect(logs).toContain("[INFO] User created");
```

### Test Database with Observable State

```typescript
function makeTestDatabase(): {
  layer: Layer.Layer<Database, never, never>;
  users: Map<number, User>;
} {
  const users = new Map<number, User>();
  
  const layer = Layer.succeed(Database, {
    findUser: (id) => Effect.sync(() => users.get(id) ?? null),
    saveUser: (user) => Effect.sync(() => { users.set(user.id, user); }),
  });
  
  return { layer, users };
}

// In your test:
const { layer: testDbLayer, users } = makeTestDatabase();

await Effect.runPromise(
  Effect.provide(createUserProgram, testDbLayer)
);

expect(users.size).toBe(1);
```

### Complete Test Setup

```typescript
function makeTestLayer(): {
  layer: Layer.Layer<Logger | Database | UserService, never, never>;
  state: {
    logs: string[];
    users: Map<number, User>;
  };
} {
  const logs: string[] = [];
  const users = new Map<number, User>();
  
  const testLogger = Layer.succeed(Logger, {
    info: (msg) => Effect.sync(() => { logs.push(`[INFO] ${msg}`); }),
    error: (msg) => Effect.sync(() => { logs.push(`[ERROR] ${msg}`); }),
  });
  
  const testDatabase = Layer.succeed(Database, {
    findUser: (id) => Effect.sync(() => users.get(id) ?? null),
    saveUser: (user) => Effect.sync(() => { users.set(user.id, user); }),
  });
  
  const testInfra = Layer.merge(testLogger, testDatabase);
  const testUserService = Layer.provide(UserServiceLive, testInfra);
  
  const layer = Layer.mergeAll(testLogger, testDatabase, testUserService);
  
  return { layer, state: { logs, users } };
}
```

---

## Scoped Services with Cleanup

For resources that need cleanup (connections, file handles):

```typescript
class ConnectionPool extends Context.Service<
  ConnectionPool,
  {
    readonly getConnection: () => Effect.Effect<Connection, never, never>;
  }
>()("ConnectionPool") {}

const ConnectionPoolLive: Layer.Layer<ConnectionPool, never, never> = 
  Layer.effect(
    ConnectionPool
  )(
    Effect.gen(function* () {
      // Acquire resource
      yield* Effect.log("🔌 Opening connection pool...");
      
      // Register cleanup (runs when scope closes)
      yield* Effect.addFinalizer(() => 
        Effect.log("🔌 Closing connection pool...")
      );
      
      // Return the service
      return {
        getConnection: () => Effect.succeed(new Connection()),
      };
    })
  );

// Usage - cleanup happens automatically when effect completes
const program = Effect.scoped(
  Effect.gen(function* () {
    const pool = yield* Effect.provide(
      ConnectionPool,
      ConnectionPoolLive
    );
    const conn = yield* pool.getConnection();
    // ... use connection
  })  // ← Cleanup runs here
);
```

---

## Summary: DI Comparison

| Aspect | Traditional | Effect-TS |
|--------|-------------|-----------|
| Define service | Interface | `Context.Service` |
| Implement service | Class/Object | `Layer` |
| Access service | Constructor/Import | `yield* ServiceTag` |
| Dependencies | Hidden/Manual | Tracked in `R` type |
| Composition | Manual wiring | `Layer.merge/provide` |
| Testing | Mock frameworks | Just create test layers |
| Verification | Runtime errors | Compile-time errors |
| Resource cleanup | Manual/try-finally | `Layer.effect` + finalizers |

---

## The Dependency Graph

Effect builds a dependency graph automatically:

```
AppLayer provides:
├── Logger (standalone)
├── Config (standalone)
├── Database (standalone)
├── EmailService (standalone)
├── UserService (needs Logger, Database)
│   └── provided by: Logger + Database
└── NotificationService (needs UserService, EmailService, Logger)
    └── provided by: UserService + EmailService + Logger
```

TypeScript ensures:
- ✅ All dependencies are provided
- ✅ No circular dependencies
- ✅ Type-safe service interfaces

---

## Key Takeaways Before the Code

1. **`Context.Service`** – Define service identifiers with typed interfaces
2. **`R` in `Effect<A, E, R>`** – Requirements tracked by the type system
3. **`yield* ServiceTag`** – Access services in Effect.gen
4. **`Layer.succeed`** – Create simple layers from values
5. **`Layer.effect`** – Create layers that need initialization/state
6. **`Layer.merge`** – Combine independent layers
7. **`Layer.provide`** – Satisfy a layer's dependencies
8. **`Effect.provide`** – Give layers to effects for execution
9. **Testing** – Just create different layer implementations
10. **`Layer.effect`** – Automatic resource cleanup

---

## What's Next?

Now you're ready to:
1. **Study** `3-example.effect.ts` – See DI patterns with Effect
2. **Practice** `3-example.problem.ts` – Build and compose services

The exercises will have you create service tags, implement layers, compose complex dependency graphs, and test with mock layers!

---

## Quick Reference

```typescript
import { Context, Layer, Effect } from "effect";

// Define a service
class MyService extends Context.Service<
  MyService,
  {
    readonly method: (arg: A) => Effect.Effect<B, E, never>;
  }
>()("MyService") {}

// Access a service
Effect.gen(function* () {
  const service = yield* MyService;
  const result = yield* service.method(arg);
  return result;
});

// Create layers
Layer.succeed(Tag)(implementation)     // Simple
Layer.effect(Tag)(effect)              // With initialization or cleanup

// Compose layers
Layer.merge(layerA, layerB)            // Combine two
Layer.mergeAll(a, b, c, d)             // Combine many
Layer.provide(layer, dependencies)     // Satisfy requirements

// Provide to effects
Effect.provide(effect, layer)
Effect.provideService(effect, Tag, implementation)

// Test setup pattern
function makeTestLayer(): { layer: Layer; state: State } {
  const state = { /* observable state */ };
  const layer = Layer.succeed(Tag, {
    method: () => Effect.sync(() => { /* modify state */ })
  });
  return { layer, state };
}
```

---

## Dependency Flow Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                        Your Effect                          │
│                                                             │
│   Effect.gen(function* () {                                │
│     const userService = yield* UserService;                │
│     const logger = yield* Logger;                          │
│     ...                                                     │
│   })                                                        │
│                                                             │
│   Requirements: UserService | Logger                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Effect.provide(effect, AppLayer)
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                       AppLayer                              │
│                                                             │
│   Provides: Logger | Database | UserService                 │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│   │ LoggerLive  │  │DatabaseLive │  │   UserServiceLive   ││
│   │             │  │             │  │                     ││
│   │ Provides:   │  │ Provides:   │  │ Provides:           ││
│   │ Logger      │  │ Database    │  │ UserService         ││
│   │             │  │             │  │                     ││
│   │ Requires:   │  │ Requires:   │  │ Requires:           ││
│   │ nothing     │  │ nothing     │  │ Logger | Database   ││
│   └─────────────┘  └─────────────┘  └─────────┬───────────┘│
│                                               │            │
│                          Satisfied by ────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ All requirements satisfied!
                        │
                        ▼
                 ┌─────────────┐
                 │ Runnable!   │
                 │             │
                 │ R = never   │
                 └─────────────┘
```

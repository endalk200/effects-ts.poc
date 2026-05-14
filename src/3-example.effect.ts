/**
 * 3-example.effect.ts
 *
 * Managing Services with Effect (The Effect Way)
 *
 * This file demonstrates Effect's powerful dependency injection system:
 * - Context.Service - Creating service identifiers
 * - Effect.Service - Modern way to define services
 * - Layer - Providing service implementations
 * - Effect.provide / Effect.provideService - Injecting dependencies
 * - Layer composition - Building complex dependency graphs
 * - Testing with mock layers
 *
 * Key Concepts:
 *
 * 1. Context.Service<Identifier, Service>
 *    - Creates a unique identifier for a service
 *    - Links the identifier to the service interface
 *    - Used to request and provide services
 *
 * 2. Effect<A, E, R>
 *    - R (Requirements) tracks which services an effect needs
 *    - TypeScript ensures all requirements are provided before running
 *
 * 3. Layer<ROut, E, RIn>
 *    - ROut = Services this layer provides
 *    - E = Errors that can occur during construction
 *    - RIn = Services this layer requires to construct
 *
 * 4. Benefits over traditional DI:
 *    - Compile-time verification of dependencies
 *    - No runtime dependency resolution errors
 *    - Easy to swap implementations (testing, different environments)
 *    - Automatic resource management (cleanup)
 *    - Dependencies are explicit in type signatures
 */

import { Effect, Context, Layer, Data } from "effect";

// =============================================================================
// TYPES
// =============================================================================

interface User {
  id: number;
  name: string;
  email: string;
}

// =============================================================================
// CUSTOM ERRORS
// =============================================================================

class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: number;
}> {}

class DatabaseError extends Data.TaggedError("DatabaseError")<{
  operation: string;
  cause: string;
}> {}

class EmailError extends Data.TaggedError("EmailError")<{
  to: string;
  cause: string;
}> {}

// =============================================================================
// 1. DEFINING SERVICES WITH Context.Service
// =============================================================================
/**
 * Context.Service creates a unique identifier for a service.
 *
 * Syntax:
 *   class MyService extends Context.Service<MyService, Shape>()("MyService")<
 *     MyService,
 *     { readonly method: (arg: A) => Effect<B, E, R> }
 *   >() {}
 *
 * The string "MyService" is used for debugging/error messages.
 * The first type parameter is the Tag itself (for self-reference).
 * The second type parameter is the service interface.
 */

// Logger Service - A simple service with synchronous methods
class Logger extends Context.Service<Logger, {
    readonly info: (message: string) => Effect.Effect<void, never, never>;
    readonly error: (message: string) => Effect.Effect<void, never, never>;
    readonly debug: (message: string) => Effect.Effect<void, never, never>;
  }
>()("Logger") {}

// Config Service - A service that provides configuration values
interface ConfigShape {
  readonly apiUrl: string;
  readonly timeout: number;
  readonly maxRetries: number;
}

class Config extends Context.Service<Config, ConfigShape>()("Config") {}

// Database Service - A service with async methods that can fail
class Database extends Context.Service<Database, {
    readonly findUser: (
      id: number
    ) => Effect.Effect<User | null, DatabaseError, never>;
    readonly saveUser: (
      user: User
    ) => Effect.Effect<void, DatabaseError, never>;
    readonly deleteUser: (
      id: number
    ) => Effect.Effect<boolean, DatabaseError, never>;
  }
>()("Database") {}

// Email Service - Another async service
class EmailService extends Context.Service<EmailService, {
    readonly sendEmail: (
      to: string,
      subject: string,
      body: string
    ) => Effect.Effect<boolean, EmailError, never>;
  }
>()("EmailService") {}

// =============================================================================
// 2. USING SERVICES IN EFFECTS
// =============================================================================
/**
 * To use a service, access it with the Tag:
 *   const logger = yield* Logger;
 *   yield* logger.info("Hello");
 *
 * Or use Effect.flatMap:
 *   Logger.pipe(Effect.flatMap(logger => logger.info("Hello")))
 *
 * The service requirement (R) is automatically tracked in the Effect type.
 */

// An effect that uses Logger service
// Return type: Effect<void, never, Logger>
// The 'Logger' in R position means this effect requires Logger service
const logStartup: Effect.Effect<void, never, Logger> = Effect.gen(function* () {
  const logger = yield* Logger;
  yield* logger.info("Application starting...");
});

// An effect that uses multiple services
// Return type: Effect<User | null, DatabaseError, Logger | Database>
function findUser(
  id: number
): Effect.Effect<User | null, DatabaseError, Logger | Database> {
  return Effect.gen(function* () {
    const logger = yield* Logger;
    const db = yield* Database;

    yield* logger.info(`Finding user with id: ${id}`);
    const user = yield* db.findUser(id);

    if (user) {
      yield* logger.info(`Found user: ${user.name}`);
    } else {
      yield* logger.info(`User not found: ${id}`);
    }

    return user;
  });
}

// =============================================================================
// 3. CREATING SERVICE IMPLEMENTATIONS WITH Layer
// =============================================================================
/**
 * Layer<ROut, E, RIn> describes how to create services:
 * - ROut = Services this layer provides
 * - E = Errors during construction
 * - RIn = Services needed to construct this layer
 *
 * Layer.succeed - Create a layer from a value (no dependencies, can't fail)
 * Layer.effect - Create a layer from an Effect
 * Layer.function - Create a layer that depends on other services
 */

// Simple layer - Logger implementation using console
const ConsoleLoggerLive: Layer.Layer<Logger, never, never> = Layer.succeed(
  Logger,
  {
    info: (message) =>
      Effect.sync(() =>
        console.log(`[INFO] ${new Date().toISOString()} ${message}`)
      ),
    error: (message) =>
      Effect.sync(() =>
        console.error(`[ERROR] ${new Date().toISOString()} ${message}`)
      ),
    debug: (message) =>
      Effect.sync(() =>
        console.debug(`[DEBUG] ${new Date().toISOString()} ${message}`)
      ),
  }
);

// Config layer - provides configuration
const ConfigLive: Layer.Layer<Config, never, never> = Layer.succeed(Config, {
  apiUrl: "https://api.example.com",
  timeout: 5000,
  maxRetries: 3,
});

// Database layer - in-memory implementation
const InMemoryDatabaseLive: Layer.Layer<Database, never, never> = Layer.effect(
  Database,
  Effect.sync(() => {
    const users = new Map<number, User>();

    return {
      findUser: (id: number) =>
        Effect.sync(() => users.get(id) ?? null).pipe(
          Effect.catch(() =>
            Effect.fail(
              new DatabaseError({
                operation: "findUser",
                cause: "Database error",
              })
            )
          )
        ),
      saveUser: (user: User) =>
        Effect.sync(() => {
          users.set(user.id, user);
        }).pipe(
          Effect.catch(() =>
            Effect.fail(
              new DatabaseError({
                operation: "saveUser",
                cause: "Database error",
              })
            )
          )
        ),
      deleteUser: (id: number) =>
        Effect.sync(() => users.delete(id)).pipe(
          Effect.catch(() =>
            Effect.fail(
              new DatabaseError({
                operation: "deleteUser",
                cause: "Database error",
              })
            )
          )
        ),
    };
  })
);

// Email service layer - mock implementation
const MockEmailServiceLive: Layer.Layer<EmailService, never, never> =
  Layer.succeed(EmailService, {
    sendEmail: (to, subject, body) =>
      Effect.gen(function* () {
        yield* Effect.log(`📧 Sending email to ${to}: ${subject}`);
        // In real implementation, this would send actual email
        return true;
      }),
  });

// =============================================================================
// 4. LAYERS THAT DEPEND ON OTHER SERVICES
// =============================================================================
/**
 * Layers can depend on other services.
 * Use Layer.effect with Effect.gen to access required services.
 */

// UserService that depends on Database, EmailService, and Logger
class UserService extends Context.Service<UserService, {
    readonly getUser: (
      id: number
    ) => Effect.Effect<User | null, DatabaseError, never>;
    readonly createUser: (
      name: string,
      email: string
    ) => Effect.Effect<User, DatabaseError, never>;
    readonly notifyUser: (
      id: number,
      message: string
    ) => Effect.Effect<boolean, DatabaseError | EmailError, never>;
  }
>()("UserService") {}

// This layer requires Database, EmailService, and Logger to construct UserService
const UserServiceLive: Layer.Layer<
  UserService,
  never,
  Database | EmailService | Logger
> = Layer.effect(
  UserService,
  Effect.gen(function* () {
    // Access required services
    const db = yield* Database;
    const emailService = yield* EmailService;
    const logger = yield* Logger;

    // Return the service implementation
    return {
      getUser: (id: number) =>
        Effect.gen(function* () {
          yield* logger.info(`Getting user: ${id}`);
          return yield* db.findUser(id);
        }),

      createUser: (name: string, email: string) =>
        Effect.gen(function* () {
          yield* logger.info(`Creating user: ${name}`);
          const user: User = {
            id: Date.now(),
            name,
            email,
          };
          yield* db.saveUser(user);
          yield* logger.info(`User created: ${user.id}`);
          return user;
        }),

      notifyUser: (id: number, message: string) =>
        Effect.gen(function* () {
          const user = yield* db.findUser(id);
          if (!user) {
            yield* logger.error(`User not found: ${id}`);
            return false;
          }

          yield* logger.info(`Notifying user: ${user.email}`);
          return yield* emailService.sendEmail(
            user.email,
            "Notification",
            message
          );
        }),
    };
  })
);

// =============================================================================
// 5. COMPOSING LAYERS
// =============================================================================
/**
 * Layers can be composed in different ways:
 *
 * Layer.merge - Combine layers horizontally (both provide services)
 * Layer.provide - Provide dependencies to a layer
 * Layer.provideMerge - Provide and keep the provider in output
 */

// Combine independent layers
const BaseLayers = Layer.merge(ConsoleLoggerLive, ConfigLive);

// Combine more layers
const InfrastructureLayers = Layer.mergeAll(
  ConsoleLoggerLive,
  InMemoryDatabaseLive,
  MockEmailServiceLive
);

// Create UserService layer with its dependencies provided
// UserServiceLive needs Database | EmailService | Logger
// InfrastructureLayers provides Logger | Database | EmailService
const UserServiceWithDeps: Layer.Layer<UserService, never, never> =
  Layer.provide(UserServiceLive, InfrastructureLayers);

// Complete application layer - provides everything
const AppLayer: Layer.Layer<
  Logger | Config | Database | EmailService | UserService,
  never,
  never
> = Layer.mergeAll(
  ConsoleLoggerLive,
  ConfigLive,
  InMemoryDatabaseLive,
  MockEmailServiceLive,
  UserServiceWithDeps
);

// =============================================================================
// 6. PROVIDING SERVICES TO EFFECTS
// =============================================================================
/**
 * Effect.provide(layer) - Provide services to an effect
 * Effect.provideService(tag, implementation) - Provide a single service
 *
 * After providing all required services, the R type becomes 'never'
 * and the effect can be run.
 */

// Using a composed effect with all services
const createAndNotifyUser: Effect.Effect<
  User,
  DatabaseError | EmailError,
  UserService | Logger
> = Effect.gen(function* () {
  const userService = yield* UserService;
  const logger = yield* Logger;

  yield* logger.info("Creating and notifying user...");

  const user = yield* userService.createUser("Alice", "alice@example.com");
  yield* userService.notifyUser(user.id, "Welcome to our service!");

  yield* logger.info(`Process complete for user: ${user.id}`);
  return user;
});

// Provide services and run
const runCreateAndNotify = (): Promise<User> =>
  Effect.runPromise(Effect.provide(createAndNotifyUser, AppLayer));

// =============================================================================
// 7. TESTING WITH MOCK LAYERS
// =============================================================================
/**
 * For testing, simply create different layer implementations.
 * No need for mocking frameworks - just different Layers!
 */

// Test logger that collects logs
interface TestLoggerState {
  logs: string[];
}

const makeTestLogger = (
  state: TestLoggerState
): Layer.Layer<Logger, never, never> =>
  Layer.succeed(Logger, {
    info: (message) =>
      Effect.sync(() => {
        state.logs.push(`[INFO] ${message}`);
      }),
    error: (message) =>
      Effect.sync(() => {
        state.logs.push(`[ERROR] ${message}`);
      }),
    debug: (message) =>
      Effect.sync(() => {
        state.logs.push(`[DEBUG] ${message}`);
      }),
  });

// Test database with observable state
interface TestDatabaseState {
  users: Map<number, User>;
}

const makeTestDatabase = (
  state: TestDatabaseState
): Layer.Layer<Database, never, never> =>
  Layer.succeed(Database, {
    findUser: (id) => Effect.sync(() => state.users.get(id) ?? null),
    saveUser: (user) =>
      Effect.sync(() => {
        state.users.set(user.id, user);
      }),
    deleteUser: (id) => Effect.sync(() => state.users.delete(id)),
  });

// Test email service that tracks sent emails
interface TestEmailState {
  sentEmails: Array<{ to: string; subject: string; body: string }>;
}

const makeTestEmailService = (
  state: TestEmailState
): Layer.Layer<EmailService, never, never> =>
  Layer.succeed(EmailService, {
    sendEmail: (to, subject, body) =>
      Effect.sync(() => {
        state.sentEmails.push({ to, subject, body });
        return true;
      }),
  });

// Create a test layer with observable state
function makeTestLayer(): {
  layer: Layer.Layer<
    Logger | Database | EmailService | UserService,
    never,
    never
  >;
  state: {
    logs: string[];
    users: Map<number, User>;
    sentEmails: Array<{ to: string; subject: string; body: string }>;
  };
} {
  const state = {
    logs: [] as string[],
    users: new Map<number, User>(),
    sentEmails: [] as Array<{ to: string; subject: string; body: string }>,
  };

  const testLogger = makeTestLogger(state);
  const testDatabase = makeTestDatabase(state);
  const testEmailService = makeTestEmailService(state);

  const testInfra = Layer.mergeAll(testLogger, testDatabase, testEmailService);
  const testUserService = Layer.provide(UserServiceLive, testInfra);

  const layer = Layer.mergeAll(
    testLogger,
    testDatabase,
    testEmailService,
    testUserService
  );

  return { layer, state };
}

// =============================================================================
// 8. STATEFUL SERVICES WITH Layer.effect
// =============================================================================
/**
 * For services that need mutable state, use Layer.effect to
 * create the service with internal state captured in a closure.
 */

// Counter service with mutable state
class Counter extends Context.Service<Counter, {
    readonly increment: () => Effect.Effect<number, never, never>;
    readonly decrement: () => Effect.Effect<number, never, never>;
    readonly get: () => Effect.Effect<number, never, never>;
  }
>()("Counter") {}

// Counter layer with mutable state
const CounterLive: Layer.Layer<Counter, never, never> = Layer.effect(
  Counter,
  Effect.sync(() => {
    let count = 0;
    return {
      increment: () =>
        Effect.sync(() => {
          count += 1;
          return count;
        }),
      decrement: () =>
        Effect.sync(() => {
          count -= 1;
          return count;
        }),
      get: () => Effect.sync(() => count),
    };
  })
);

// Using the Counter service
const counterExample: Effect.Effect<number, never, Counter> = Effect.gen(
  function* () {
    const counter = yield* Counter;
    yield* counter.increment();
    yield* counter.increment();
    yield* counter.increment();
    return yield* counter.get();
  }
);

// =============================================================================
// 9. SCOPED SERVICES (Resources with Cleanup)
// =============================================================================
/**
 * Layer.effect creates services with resource lifecycle management.
 * The service is acquired when the layer is built and released when done.
 */

class ConnectionPool extends Context.Service<ConnectionPool, {
    readonly getConnection: () => Effect.Effect<string, never, never>;
  }
>()("ConnectionPool") {}

// A scoped layer that manages resource lifecycle
const ConnectionPoolLive: Layer.Layer<ConnectionPool, never, never> =
  Layer.effect(
    ConnectionPool,
    Effect.gen(function* () {
      // Acquire resource
      yield* Effect.log("🔌 Creating connection pool...");

      // Add finalizer for cleanup
      yield* Effect.addFinalizer(() =>
        Effect.log("🔌 Closing connection pool...")
      );

      // Return the service
      return {
        getConnection: () => Effect.succeed("connection-1"),
      };
    })
  );

// =============================================================================
// DEMO - Run examples
// =============================================================================

const runExamples: Effect.Effect<void, never, never> = Effect.gen(function* () {
  console.log("=== 3-example.effect.ts: Managing Services with Effect ===\n");

  // Example 1: Simple service usage
  console.log("1. Using Logger service:");
  yield* Effect.provide(logStartup, ConsoleLoggerLive);
  console.log("");

  // Example 2: Using multiple services
  console.log("2. Using multiple services (findUser):");
  const foundUser = yield* Effect.provide(
    findUser(1).pipe(Effect.catch(() => Effect.succeed(null))),
    Layer.merge(ConsoleLoggerLive, InMemoryDatabaseLive)
  );
  console.log(`   Found user: ${foundUser?.name ?? "null"}\n`);

  // Example 3: Full application with composed layers
  console.log("3. Full application with UserService:");
  const createdUser = yield* Effect.provide(
    Effect.gen(function* () {
      const userService = yield* UserService;
      return yield* userService.createUser("Bob", "bob@example.com");
    }).pipe(
      Effect.catch(() =>
        Effect.succeed({ id: 0, name: "Error", email: "" } as User)
      )
    ),
    AppLayer
  );
  console.log(`   Created user: ${createdUser.name}\n`);

  // Example 4: Testing with mock layer
  console.log("4. Testing with mock layer:");
  const { layer: testLayer, state } = makeTestLayer();

  yield* Effect.provide(
    Effect.gen(function* () {
      const userService = yield* UserService;
      const user = yield* userService.createUser("Test", "test@example.com");
      yield* userService.notifyUser(user.id, "Welcome!");
    }).pipe(Effect.catch(() => Effect.succeed(undefined))),
    testLayer
  );

  console.log(`   Logs captured: ${state.logs.length}`);
  console.log(`   Users in DB: ${state.users.size}`);
  console.log(`   Emails sent: ${state.sentEmails.length}`);
  console.log("");

  // Example 5: Stateful service (Counter)
  console.log("5. Stateful service (Counter):");
  const count = yield* Effect.provide(counterExample, CounterLive);
  console.log(`   Counter value: ${count}\n`);

  // Example 6: Scoped service with cleanup
  console.log("6. Scoped service (ConnectionPool):");
  yield* Effect.scoped(
    Effect.gen(function* () {
      yield* Effect.provide(
        Effect.gen(function* () {
          const pool = yield* ConnectionPool;
          const conn = yield* pool.getConnection();
          yield* Effect.log(`   Got connection: ${conn}`);
        }),
        ConnectionPoolLive
      );
    })
  );
  console.log("");

  console.log("=== Demo Complete ===");
});

// Run the demo
Effect.runPromise(runExamples).catch(console.error);

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Types
  type User,
  type ConfigShape,

  // Errors
  UserNotFoundError,
  DatabaseError,
  EmailError,

  // Service Tags
  Logger,
  Config,
  Database,
  EmailService,
  UserService,
  Counter,
  ConnectionPool,

  // Counter layer
  CounterLive,

  // Layers
  ConsoleLoggerLive,
  ConfigLive,
  InMemoryDatabaseLive,
  MockEmailServiceLive,
  UserServiceLive,
  UserServiceWithDeps,
  AppLayer,
  ConnectionPoolLive,

  // Test utilities
  makeTestLogger,
  makeTestDatabase,
  makeTestEmailService,
  makeTestLayer,

  // Effects
  logStartup,
  findUser,
  createAndNotifyUser,
};

// =============================================================================
// SUMMARY OF CONCEPTS COVERED
// =============================================================================

/**
 * Key takeaways from this example:
 *
 * 1. Context.Service - Define service identifiers:
 *    class MyService extends Context.Service<MyService, Interface>()("MyService") {}
 *
 * 2. Access services in Effects:
 *    Effect.gen(function* () {
 *      const service = yield* MyService;
 *      yield* service.method();
 *    })
 *
 * 3. Create Layers:
 *    - Layer.succeed(Tag)(implementation) - Simple implementation
 *    - Layer.effect(Tag)(effect) - Effectful construction
 *    - Layer.effect(Tag)(effect) - With resource cleanup
 *
 * 4. Compose Layers:
 *    - Layer.merge(layerA, layerB) - Combine layers
 *    - Layer.mergeAll(...layers) - Combine multiple layers
 *    - Layer.provide(layer, dependencies) - Satisfy layer requirements
 *
 * 5. Provide services to Effects:
 *    - Effect.provide(effect, layer) - Provide all services from layer
 *    - Effect.provideService(Tag, impl) - Provide single service
 *
 * 6. Testing:
 *    - Create test layers with mock implementations
 *    - Use Effect.provide with test layer
 *    - No mocking frameworks needed!
 *
 * 7. Effect.Service - Alternative syntax:
 *    class MyService extends Effect.Service<MyService>()("Name", {
 *      succeed: { ... }
 *    }) {}
 *
 * Benefits over traditional DI:
 * - Compile-time dependency verification
 * - Explicit requirements in type signatures
 * - Easy to swap implementations
 * - Automatic resource management
 * - No runtime DI container errors
 */

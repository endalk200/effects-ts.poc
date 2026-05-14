/**
 * 3-example.problem.ts
 *
 * 20 Exercises covering Effect's Service/Dependency Injection System
 *
 * Topics covered:
 * - Context.Service (defining service identifiers)
 * - Accessing services in Effects
 * - Layer.succeed / Layer.effect (creating layers)
 * - Layer.merge / Layer.mergeAll (composing layers)
 * - Layer.provide (satisfying layer dependencies)
 * - Effect.provide / Effect.provideService (injecting dependencies)
 * - Testing with mock layers
 * - Effect.Service (alternative syntax)
 * - Scoped services with cleanup
 *
 * Instructions:
 * 1. Copy this file to 3-example.solution.ts
 * 2. Implement each TODO
 * 3. Run the file to verify your solutions
 * 4. Each exercise has a test that will print PASS or FAIL
 *
 * Run with: bun run src/3-example.solution.ts
 */

import { Effect, Context, Layer, Data } from "effect";

// =============================================================================
// TEST UTILITIES - DO NOT MODIFY
// =============================================================================

let passCount = 0;
let failCount = 0;

function test(name: string, fn: () => boolean): void {
  try {
    const result = fn();
    if (result) {
      console.log(`✓ PASS: ${name}`);
      passCount++;
    } else {
      console.log(`✗ FAIL: ${name}`);
      failCount++;
    }
  } catch (e) {
    console.log(`✗ FAIL: ${name} - Error: ${e}`);
    failCount++;
  }
}

async function testAsync(
  name: string,
  fn: () => Promise<boolean>
): Promise<void> {
  try {
    const result = await fn();
    if (result) {
      console.log(`✓ PASS: ${name}`);
      passCount++;
    } else {
      console.log(`✗ FAIL: ${name}`);
      failCount++;
    }
  } catch (e) {
    console.log(`✗ FAIL: ${name} - Error: ${e}`);
    failCount++;
  }
}

function printSummary(): void {
  console.log("\n========================================");
  console.log(`RESULTS: ${passCount} passed, ${failCount} failed`);
  console.log("========================================\n");
}

// =============================================================================
// TYPES - Used throughout the exercises
// =============================================================================

interface User {
  id: number;
  name: string;
  email: string;
}

// =============================================================================
// EXERCISE 1: Create a simple service tag
// =============================================================================
/**
 * Create a service tag for a Logger service.
 *
 * The Logger service should have this interface:
 * {
 *   readonly log: (message: string) => Effect.Effect<void, never, never>
 * }
 *
 * Hints:
 * - Use Context.Service to create a service identifier
 * - Syntax: class Name extends Context.Service<Name, Interface>()("Name") {}
 */

// TODO: Replace this placeholder with a proper Logger service tag
// class Logger extends Context.Service<
//   Logger,
//   { readonly log: (message: string) => Effect.Effect<void, never, never> }
// >()("Logger") {}
class Logger extends Context.Service<Logger, { readonly log: (message: string) => Effect.Effect<void, never, never> }
>()("TODO_REPLACE") {}

test("Exercise 1: Create Logger service tag", () => {
  // Check that Logger is a valid tag (key should be "Logger" when implemented)
  return (Logger as { key: string }).key === "Logger";
});

// =============================================================================
// EXERCISE 2: Create a Layer with Layer.succeed
// =============================================================================
/**
 * Create a layer that provides the Logger service implementation.
 *
 * The implementation should:
 * - log: prints the message to console with "[LOG]" prefix
 *
 * Hints:
 * - Use Layer.succeed(Tag)(implementation)
 * - Implementation methods should return Effect.sync(() => ...)
 */

// TODO: Implement LoggerLive layer
// Replace the placeholder below with:
// const LoggerLive: Layer.Layer<Logger, never, never> = Layer.succeed(
//   Logger,
//   {
//     log: (message) => Effect.sync(() => console.log(`[LOG] ${message}`)),
//   }
// );
const LoggerLive: Layer.Layer<Logger, never, never> = Layer.succeed(Logger, {
  log: (_message) => Effect.fail("Not implemented") as never,
});

await testAsync("Exercise 2: Create Logger layer", async () => {
  const effect = Effect.gen(function* () {
    const logger = yield* Logger;
    yield* logger.log("test");
    return true;
  });

  const result = await Effect.runPromise(Effect.provide(effect, LoggerLive));
  return result === true;
});

// =============================================================================
// EXERCISE 3: Access a service in an Effect
// =============================================================================
/**
 * Create an effect that uses the Logger service to log "Hello, Services!".
 *
 * Hints:
 * - Use Effect.gen with yield* to access the service
 * - const logger = yield* Logger;
 */
function exercise3(): Effect.Effect<void, never, Logger> {
  // TODO: Access Logger and call logger.log("Hello, Services!")
  throw new Error("Not implemented");
}

await testAsync("Exercise 3: Access service in Effect", async () => {
  const logs: string[] = [];
  const testLoggerLayer = Layer.succeed(Logger, {
    log: (message) =>
      Effect.sync(() => {
        logs.push(message);
      }),
  });

  await Effect.runPromise(Effect.provide(exercise3(), testLoggerLayer));
  return logs.includes("Hello, Services!");
});

// =============================================================================
// EXERCISE 4: Create a Config service tag
// =============================================================================
/**
 * Create a service tag for a Config service.
 *
 * The Config service should provide these values:
 * {
 *   readonly apiUrl: string;
 *   readonly timeout: number;
 * }
 *
 * Note: This is a value service, not a method service.
 */

// TODO: Create Config service tag
class Config extends Context.Service<Config, {
    readonly apiUrl: string;
    readonly timeout: number;
  }
>()("TODO_REPLACE") {}

test("Exercise 4: Create Config service tag", () => {
  return (Config as { key: string }).key === "Config";
});

// =============================================================================
// EXERCISE 5: Create a Config layer
// =============================================================================
/**
 * Create a layer that provides Config with:
 * - apiUrl: "https://api.example.com"
 * - timeout: 5000
 */

// TODO: Create ConfigLive layer
const ConfigLive: Layer.Layer<Config, never, never> = Layer.succeed(Config, {
  apiUrl: "TODO", // TODO: Replace with "https://api.example.com"
  timeout: 0, // TODO: Replace with 5000
});

await testAsync("Exercise 5: Create Config layer", async () => {
  const effect = Effect.gen(function* () {
    const config = yield* Config;
    return config;
  });

  const result = await Effect.runPromise(Effect.provide(effect, ConfigLive));
  return result.apiUrl === "https://api.example.com" && result.timeout === 5000;
});

// =============================================================================
// EXERCISE 6: Access multiple services
// =============================================================================
/**
 * Create an effect that uses both Logger and Config services.
 * Log the message: "API URL: {apiUrl}, Timeout: {timeout}"
 *
 * Return type should be: Effect<void, never, Logger | Config>
 */
function exercise6(): Effect.Effect<void, never, Logger | Config> {
  // TODO: Access both Logger and Config, log the API URL and timeout
  throw new Error("Not implemented");
}

await testAsync("Exercise 6: Access multiple services", async () => {
  const logs: string[] = [];
  const testLoggerLayer = Layer.succeed(Logger, {
    log: (message) =>
      Effect.sync(() => {
        logs.push(message);
      }),
  });
  const testConfigLayer = Layer.succeed(Config, {
    apiUrl: "https://test.com",
    timeout: 1000,
  });
  const combined = Layer.merge(testLoggerLayer, testConfigLayer);

  await Effect.runPromise(Effect.provide(exercise6(), combined));
  return logs.some(
    (log) => log.includes("https://test.com") && log.includes("1000")
  );
});

// =============================================================================
// EXERCISE 7: Create a Database service with methods
// =============================================================================
/**
 * Create a Database service tag with these methods:
 * - findUser: (id: number) => Effect<User | null, never, never>
 * - saveUser: (user: User) => Effect<void, never, never>
 */

// TODO: Create Database service tag
class Database extends Context.Service<Database, {
    readonly findUser: (id: number) => Effect.Effect<User | null, never, never>;
    readonly saveUser: (user: User) => Effect.Effect<void, never, never>;
  }
>()("TODO_REPLACE") {}

test("Exercise 7: Create Database service tag", () => {
  return (Database as { key: string }).key === "Database";
});

// =============================================================================
// EXERCISE 8: Create an in-memory Database layer
// =============================================================================
/**
 * Create a layer that provides an in-memory Database implementation.
 *
 * Use Layer.effect to create a layer with internal state (a Map).
 *
 * Hints:
 * - Layer.effect(Tag, Effect.sync(() => implementation))
 * - Use a Map<number, User> for storage
 */

// TODO: Implement InMemoryDatabaseLive layer
// Replace the placeholder below with:
// const InMemoryDatabaseLive: Layer.Layer<Database, never, never> = Layer.effect(
//   Database,
//   Effect.sync(() => {
//     const users = new Map<number, User>();
//     return {
//       findUser: (id: number) => Effect.sync(() => users.get(id) ?? null),
//       saveUser: (user: User) => Effect.sync(() => { users.set(user.id, user); }),
//     };
//   })
// );
const InMemoryDatabaseLive: Layer.Layer<Database, never, never> = Layer.succeed(
  Database,
  {
    findUser: (_id) => Effect.fail("Not implemented") as never,
    saveUser: (_user) => Effect.fail("Not implemented") as never,
  }
);

await testAsync("Exercise 8: In-memory Database layer", async () => {
  const effect = Effect.gen(function* () {
    const db = yield* Database;
    const user: User = { id: 1, name: "Test", email: "test@test.com" };
    yield* db.saveUser(user);
    const found = yield* db.findUser(1);
    return found?.name === "Test";
  });

  const result = await Effect.runPromise(
    Effect.provide(effect, InMemoryDatabaseLive)
  );
  return result === true;
});

// =============================================================================
// EXERCISE 9: Merge layers with Layer.merge
// =============================================================================
/**
 * Merge LoggerLive and ConfigLive into a single layer.
 *
 * Hints:
 * - Use Layer.merge(layerA, layerB)
 */

// TODO: Create merged layer
// const BasicServicesLive = Layer.merge(LoggerLive, ConfigLive);
const BasicServicesLive: Layer.Layer<Logger | Config, never, never> =
  Layer.merge(LoggerLive, ConfigLive);

await testAsync("Exercise 9: Merge layers", async () => {
  const effect = Effect.gen(function* () {
    const logger = yield* Logger;
    const config = yield* Config;
    yield* logger.log(`URL: ${config.apiUrl}`);
    return true;
  });

  const result = await Effect.runPromise(
    Effect.provide(effect, BasicServicesLive)
  );
  return result === true;
});

// =============================================================================
// EXERCISE 10: Merge multiple layers with Layer.mergeAll
// =============================================================================
/**
 * Merge Logger, Config, and Database layers into one.
 *
 * Hints:
 * - Use Layer.mergeAll(layer1, layer2, layer3)
 */

// TODO: Create AllServicesLive layer
const AllServicesLive: Layer.Layer<Logger | Config | Database, never, never> =
  Layer.mergeAll(LoggerLive, ConfigLive, InMemoryDatabaseLive);

await testAsync("Exercise 10: Merge multiple layers", async () => {
  const effect = Effect.gen(function* () {
    const logger = yield* Logger;
    const config = yield* Config;
    const db = yield* Database;
    yield* logger.log(`Timeout: ${config.timeout}`);
    yield* db.saveUser({ id: 1, name: "Test", email: "test@test.com" });
    return true;
  });

  const result = await Effect.runPromise(
    Effect.provide(effect, AllServicesLive)
  );
  return result === true;
});

// =============================================================================
// EXERCISE 11: Create a service that depends on other services
// =============================================================================
/**
 * Create a UserService that depends on Database and Logger.
 *
 * UserService interface:
 * {
 *   readonly getUser: (id: number) => Effect<User | null, never, never>
 *   readonly createUser: (name: string, email: string) => Effect<User, never, never>
 * }
 */

// TODO: Create UserService tag
class UserService extends Context.Service<UserService, {
    readonly getUser: (id: number) => Effect.Effect<User | null, never, never>;
    readonly createUser: (
      name: string,
      email: string
    ) => Effect.Effect<User, never, never>;
  }
>()("TODO_REPLACE") {}

test("Exercise 11: Create UserService tag", () => {
  return (UserService as { key: string }).key === "UserService";
});

// =============================================================================
// EXERCISE 12: Create a layer that depends on other services
// =============================================================================
/**
 * Create UserServiceLive that depends on Database and Logger.
 *
 * Implementation:
 * - getUser: logs "Getting user: {id}" then calls db.findUser
 * - createUser: logs "Creating user: {name}", creates user with Date.now() as id,
 *               saves to db, returns the user
 *
 * Hints:
 * - Use Layer.effect(Tag, Effect.gen(function* () { ... }))
 * - Access required services inside the Effect
 */

// TODO: Implement UserServiceLive layer
// Replace the placeholder below with:
// const UserServiceLive: Layer.Layer<UserService, never, Database | Logger> =
//   Layer.effect(
//     UserService,
//     Effect.gen(function* () {
//       const db = yield* Database;
//       const logger = yield* Logger;
//       return {
//         getUser: (id: number) => Effect.gen(function* () {
//           yield* logger.log(`Getting user: ${id}`);
//           return yield* db.findUser(id);
//         }),
//         createUser: (name: string, email: string) => Effect.gen(function* () {
//           yield* logger.log(`Creating user: ${name}`);
//           const user: User = { id: Date.now(), name, email };
//           yield* db.saveUser(user);
//           return user;
//         }),
//       };
//     })
//   );
const UserServiceLive: Layer.Layer<UserService, never, Database | Logger> =
  Layer.succeed(UserService, {
    getUser: (_id) => Effect.fail("Not implemented") as never,
    createUser: (_name, _email) => Effect.fail("Not implemented") as never,
  });

await testAsync("Exercise 12: Create layer with dependencies", async () => {
  // Create test implementations for Logger and Database
  const testLogger = Layer.succeed(Logger, {
    log: (_msg) => Effect.succeed(undefined),
  });
  const testDb = Layer.succeed(Database, {
    findUser: (_id) => Effect.succeed(null),
    saveUser: (_user) => Effect.succeed(undefined),
  });

  const effect = Effect.gen(function* () {
    const userService = yield* UserService;
    const user = yield* userService.createUser("Test", "test@test.com");
    return user.name === "Test";
  });

  const result = await Effect.runPromise(
    Effect.provide(
      effect,
      Layer.provide(UserServiceLive, Layer.merge(testLogger, testDb))
    )
  );
  return result === true;
});

// =============================================================================
// EXERCISE 13: Provide dependencies to a layer
// =============================================================================
/**
 * Create a fully-resolved UserService layer by providing its dependencies.
 *
 * Hints:
 * - Use Layer.provide(layer, dependencies)
 * - UserServiceLive needs Database | Logger
 * - Use LoggerLive and InMemoryDatabaseLive
 */

// TODO: Create UserServiceWithDeps layer
const UserServiceWithDeps: Layer.Layer<UserService, never, never> =
  Layer.provide(UserServiceLive, Layer.merge(LoggerLive, InMemoryDatabaseLive));

await testAsync("Exercise 13: Provide dependencies to layer", async () => {
  const effect = Effect.gen(function* () {
    const userService = yield* UserService;
    const user = yield* userService.createUser("Alice", "alice@test.com");
    const found = yield* userService.getUser(user.id);
    return found?.name === "Alice";
  });

  const result = await Effect.runPromise(
    Effect.provide(effect, UserServiceWithDeps)
  );
  return result === true;
});

// =============================================================================
// EXERCISE 14: Use Effect.provideService for single service
// =============================================================================
/**
 * Create a function that provides Logger service directly to an effect.
 *
 * Hints:
 * - Use Effect.provideService(Tag, implementation)
 */
function exercise14(
  effect: Effect.Effect<void, never, Logger>
): Effect.Effect<void, never, never> {
  // TODO: Provide Logger service with a console.log implementation
  throw new Error("Not implemented");
}

await testAsync("Exercise 14: Effect.provideService", async () => {
  const effect = Effect.gen(function* () {
    const logger = yield* Logger;
    yield* logger.log("test");
  });

  // Call exercise14 which should provide the Logger service
  await Effect.runPromise(exercise14(effect));
  return true; // If it runs without error, pass
});

// =============================================================================
// EXERCISE 15: Create a test layer for mocking
// =============================================================================
/**
 * Create a function that returns a test layer and a state object.
 *
 * The test layer should provide Logger with an implementation that
 * collects all logged messages in an array.
 *
 * Return: { layer: Layer<Logger>, logs: string[] }
 */
function exercise15(): {
  layer: Layer.Layer<Logger, never, never>;
  logs: string[];
} {
  // TODO: Create a test logger layer that collects logs
  throw new Error("Not implemented");
}

await testAsync("Exercise 15: Create test layer", async () => {
  const { layer, logs } = exercise15();

  const effect = Effect.gen(function* () {
    const logger = yield* Logger;
    yield* logger.log("message 1");
    yield* logger.log("message 2");
  });

  await Effect.runPromise(Effect.provide(effect, layer));
  return (
    logs.length === 2 && logs[0] === "message 1" && logs[1] === "message 2"
  );
});

// =============================================================================
// EXERCISE 16: Create a complete test setup
// =============================================================================
/**
 * Create a function that returns a complete test setup with:
 * - Test Logger (collects logs)
 * - Test Database (in-memory)
 * - UserService (using test Logger and Database)
 *
 * Return: { layer, state: { logs: string[], users: Map<number, User> } }
 */
function exercise16(): {
  layer: Layer.Layer<Logger | Database | UserService, never, never>;
  state: {
    logs: string[];
    users: Map<number, User>;
  };
} {
  // TODO: Create complete test setup
  throw new Error("Not implemented");
}

await testAsync("Exercise 16: Complete test setup", async () => {
  const { layer, state } = exercise16();

  const effect = Effect.gen(function* () {
    const userService = yield* UserService;
    yield* userService.createUser("TestUser", "test@example.com");
  });

  await Effect.runPromise(Effect.provide(effect, layer));

  return (
    state.logs.some((log) => log.includes("Creating user")) &&
    state.users.size === 1
  );
});

// =============================================================================
// EXERCISE 17: Create an EmailService
// =============================================================================
/**
 * Create an EmailService tag and implementation.
 *
 * Interface:
 * {
 *   readonly sendEmail: (to: string, subject: string, body: string) => Effect<boolean, never, never>
 * }
 *
 * Create both the tag and a mock layer that always returns true.
 */

// TODO: Create EmailService tag
class EmailService extends Context.Service<EmailService, {
    readonly sendEmail: (
      to: string,
      subject: string,
      body: string
    ) => Effect.Effect<boolean, never, never>;
  }
>()("TODO_REPLACE") {}

// TODO: Implement MockEmailServiceLive layer
// Replace the placeholder below with:
// const MockEmailServiceLive: Layer.Layer<EmailService, never, never> =
//   Layer.succeed(EmailService, {
//     sendEmail: (_to, _subject, _body) => Effect.succeed(true),
//   });
const MockEmailServiceLive: Layer.Layer<EmailService, never, never> =
  Layer.succeed(EmailService, {
    sendEmail: (_to, _subject, _body) =>
      Effect.fail("Not implemented") as never,
  });

await testAsync("Exercise 17: EmailService", async () => {
  const effect = Effect.gen(function* () {
    const emailService = yield* EmailService;
    return yield* emailService.sendEmail("test@test.com", "Hi", "Hello!");
  });

  const result = await Effect.runPromise(
    Effect.provide(effect, MockEmailServiceLive)
  );
  return result === true;
});

// =============================================================================
// EXERCISE 18: Complex service composition
// =============================================================================
/**
 * Create a NotificationService that depends on UserService, EmailService, and Logger.
 *
 * Interface:
 * {
 *   readonly notifyUser: (userId: number, message: string) => Effect<boolean, never, never>
 * }
 *
 * Implementation:
 * - Get user from UserService
 * - If user exists, send email via EmailService and return true
 * - If user doesn't exist, log error and return false
 */

// TODO: Create NotificationService tag
class NotificationService extends Context.Service<NotificationService, {
    readonly notifyUser: (
      userId: number,
      message: string
    ) => Effect.Effect<boolean, never, never>;
  }
>()("TODO_REPLACE") {}

// TODO: Create NotificationServiceLive layer
const NotificationServiceLive: Layer.Layer<
  NotificationService,
  never,
  UserService | EmailService | Logger
> = Layer.effect(
  NotificationService,
  Effect.gen(function* () {
    const userService = yield* UserService;
    const emailService = yield* EmailService;
    const logger = yield* Logger;

    return {
      notifyUser: (userId: number, message: string) =>
        Effect.gen(function* () {
          const user = yield* userService.getUser(userId);
          if (!user) {
            yield* logger.log(`User not found: ${userId}`);
            return false;
          }
          yield* logger.log(`Notifying ${user.email}`);
          return yield* emailService.sendEmail(
            user.email,
            "Notification",
            message
          );
        }),
    };
  })
);

// Skip this test initially - it requires exercise 16 to be complete
await testAsync("Exercise 18: Complex service composition", async () => {
  const logs: string[] = [];
  const users = new Map<number, User>();

  const testLogger = Layer.succeed(Logger, {
    log: (msg) =>
      Effect.sync(() => {
        logs.push(msg);
      }),
  });

  const testDatabase = Layer.succeed(Database, {
    findUser: (id) => Effect.sync(() => users.get(id) ?? null),
    saveUser: (user) =>
      Effect.sync(() => {
        users.set(user.id, user);
      }),
  });

  const testInfra = Layer.mergeAll(
    testLogger,
    testDatabase,
    MockEmailServiceLive
  );
  const testUserService = Layer.provide(UserServiceLive, testInfra);
  const testNotificationService = Layer.provide(
    NotificationServiceLive,
    Layer.mergeAll(testUserService, MockEmailServiceLive, testLogger)
  );

  const fullLayer = Layer.mergeAll(
    testLogger,
    testDatabase,
    testUserService,
    MockEmailServiceLive,
    testNotificationService
  );

  const effect = Effect.gen(function* () {
    const userService = yield* UserService;
    const notificationService = yield* NotificationService;

    const user = yield* userService.createUser("Alice", "alice@test.com");
    return yield* notificationService.notifyUser(user.id, "Welcome!");
  });

  const result = await Effect.runPromise(Effect.provide(effect, fullLayer));
  return result === true && logs.some((log) => log.includes("Notifying"));
});

// =============================================================================
// EXERCISE 19: Error handling in services
// =============================================================================
/**
 * Create a custom error type and a service that can fail.
 *
 * Create:
 * - DatabaseError (tagged error with operation: string, cause: string)
 * - SafeDatabase service with findUser that can fail with DatabaseError
 */

// TODO: Create DatabaseError
class DatabaseError extends Data.TaggedError("TODO_REPLACE")<{
  operation: string;
  cause: string;
}> {}

// TODO: Create SafeDatabase tag
class SafeDatabase extends Context.Service<SafeDatabase, {
    readonly findUser: (
      id: number
    ) => Effect.Effect<User | null, DatabaseError, never>;
  }
>()("TODO_REPLACE") {}

// TODO: Implement SafeDatabaseLive that fails for id <= 0
// Replace the placeholder below with proper implementation:
// const SafeDatabaseLive: Layer.Layer<SafeDatabase, never, never> = Layer.succeed(
//   SafeDatabase,
//   {
//     findUser: (id) =>
//       id <= 0
//         ? Effect.fail(new DatabaseError({ operation: "findUser", cause: "Invalid ID" }))
//         : Effect.succeed(null),
//   }
// );
const SafeDatabaseLive: Layer.Layer<SafeDatabase, never, never> = Layer.succeed(
  SafeDatabase,
  {
    findUser: (_id) => Effect.fail("Not implemented") as never,
  }
);

await testAsync("Exercise 19: Service with errors", async () => {
  const effect = Effect.gen(function* () {
    const db = yield* SafeDatabase;
    return yield* db.findUser(0);
  });

  const result = await Effect.runPromise(
    Effect.provide(effect, SafeDatabaseLive).pipe(
      Effect.catch((e) => Effect.succeed((e as DatabaseError).cause))
    )
  );

  return result === "Invalid ID";
});

// =============================================================================
// EXERCISE 20: Complete application layer
// =============================================================================
/**
 * Create a complete AppLayer that provides:
 * - Logger
 * - Config
 * - Database
 * - EmailService
 * - UserService
 * - NotificationService
 *
 * All services should be properly wired with their dependencies.
 */

// TODO: Create the complete AppLayer
// When implemented, this should provide all services

function createAppLayer(): Layer.Layer<
  Logger | Config | Database | EmailService | UserService | NotificationService,
  never,
  never
> {
  // TODO: Build the complete layer
  // 1. Merge base layers (Logger, Config, Database, EmailService)
  // 2. Create UserService with its dependencies
  // 3. Create NotificationService with its dependencies
  // 4. Merge everything together
  throw new Error("Not implemented");
}

// This will be called in the test - wrap in try/catch in the test
let AppLayer: Layer.Layer<
  Logger | Config | Database | EmailService | UserService | NotificationService,
  never,
  never
> | null = null;

try {
  AppLayer = createAppLayer();
} catch {
  // Expected to fail until implemented
}

await testAsync("Exercise 20: Complete application layer", async () => {
  if (!AppLayer) {
    return false; // Not implemented yet
  }

  try {
    const effect = Effect.gen(function* () {
      const logger = yield* Logger;
      const config = yield* Config;
      const db = yield* Database;
      const emailService = yield* EmailService;
      const userService = yield* UserService;
      const notificationService = yield* NotificationService;

      yield* logger.log(`Starting app with timeout: ${config.timeout}`);

      const user = yield* userService.createUser("FinalTest", "final@test.com");
      const notified = yield* notificationService.notifyUser(user.id, "Hello!");

      return notified;
    });

    const result = await Effect.runPromise(Effect.provide(effect, AppLayer));
    return result === true;
  } catch {
    return false;
  }
});

// =============================================================================
// PRINT SUMMARY
// =============================================================================

printSummary();

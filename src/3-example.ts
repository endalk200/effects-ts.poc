/**
 * 3-example.ts
 *
 * Managing Services in TypeScript (Traditional Approach)
 *
 * This file demonstrates common patterns for managing dependencies and services:
 * - Manual dependency passing
 * - Constructor injection
 * - Factory functions
 * - Singleton pattern
 * - Service containers
 * - Issues with testing and mocking
 *
 * These patterns will be converted to Effect's service system in 3-example.effect.ts
 */

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface User {
  id: number;
  name: string;
  email: string;
}

interface Config {
  apiUrl: string;
  timeout: number;
  maxRetries: number;
}

interface Logger {
  info(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

interface Database {
  findUser(id: number): Promise<User | null>;
  saveUser(user: User): Promise<void>;
  deleteUser(id: number): Promise<boolean>;
}

interface EmailService {
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
}

interface UserService {
  getUser(id: number): Promise<User | null>;
  createUser(name: string, email: string): Promise<User>;
  notifyUser(id: number, message: string): Promise<boolean>;
}

// =============================================================================
// 1. MANUAL DEPENDENCY PASSING - The Simplest Approach
// =============================================================================
/**
 * The most basic form of dependency injection - pass everything as arguments.
 *
 * Problems:
 * - Function signatures become unwieldy with many dependencies
 * - Every function must explicitly pass dependencies to sub-functions
 * - Hard to add new dependencies without changing many call sites
 */

function findUserManual(
  db: Database,
  logger: Logger,
  id: number
): Promise<User | null> {
  logger.info(`Finding user with id: ${id}`);
  return db.findUser(id);
}

function sendWelcomeEmailManual(
  emailService: EmailService,
  logger: Logger,
  user: User
): Promise<boolean> {
  logger.info(`Sending welcome email to: ${user.email}`);
  return emailService.sendEmail(
    user.email,
    "Welcome!",
    `Hello ${user.name}, welcome to our service!`
  );
}

// Composing operations requires threading all dependencies
async function createAndNotifyUserManual(
  db: Database,
  emailService: EmailService,
  logger: Logger,
  name: string,
  email: string
): Promise<User> {
  logger.info(`Creating user: ${name}`);

  const user: User = {
    id: Date.now(),
    name,
    email,
  };

  await db.saveUser(user);
  await sendWelcomeEmailManual(emailService, logger, user);

  logger.info(`User created successfully: ${user.id}`);
  return user;
}

// =============================================================================
// 2. CONSTRUCTOR INJECTION - Class-Based DI
// =============================================================================
/**
 * Dependencies are passed to the constructor and stored.
 *
 * Benefits:
 * - Cleaner method signatures
 * - Dependencies are explicit in constructor
 *
 * Problems:
 * - Requires classes (not always desirable)
 * - Constructor can become large with many dependencies
 * - Testing requires creating mock instances for all dependencies
 */

class UserServiceImpl implements UserService {
  constructor(
    private db: Database,
    private emailService: EmailService,
    private logger: Logger,
    private config: Config
  ) {}

  async getUser(id: number): Promise<User | null> {
    this.logger.info(`Getting user: ${id}`);
    return this.db.findUser(id);
  }

  async createUser(name: string, email: string): Promise<User> {
    this.logger.info(`Creating user: ${name}`);

    const user: User = {
      id: Date.now(),
      name,
      email,
    };

    await this.db.saveUser(user);
    return user;
  }

  async notifyUser(id: number, message: string): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) {
      this.logger.error(`User not found: ${id}`);
      return false;
    }

    this.logger.info(`Notifying user: ${user.email}`);
    return this.emailService.sendEmail(user.email, "Notification", message);
  }
}

// =============================================================================
// 3. FACTORY FUNCTIONS - Functional DI
// =============================================================================
/**
 * Factory functions create services with dependencies closed over.
 *
 * Benefits:
 * - More functional approach
 * - No classes needed
 * - Easy to create multiple instances with different dependencies
 *
 * Problems:
 * - Dependencies are hidden in closures (less explicit)
 * - Harder to inspect dependencies at runtime
 */

function createUserService(
  db: Database,
  emailService: EmailService,
  logger: Logger
): UserService {
  return {
    async getUser(id: number): Promise<User | null> {
      logger.info(`Getting user: ${id}`);
      return db.findUser(id);
    },

    async createUser(name: string, email: string): Promise<User> {
      logger.info(`Creating user: ${name}`);

      const user: User = {
        id: Date.now(),
        name,
        email,
      };

      await db.saveUser(user);
      return user;
    },

    async notifyUser(id: number, message: string): Promise<boolean> {
      const user = await db.findUser(id);
      if (!user) {
        logger.error(`User not found: ${id}`);
        return false;
      }

      logger.info(`Notifying user: ${user.email}`);
      return emailService.sendEmail(user.email, "Notification", message);
    },
  };
}

// =============================================================================
// 4. SINGLETON PATTERN - Global Service Instances
// =============================================================================
/**
 * Create global singleton instances of services.
 *
 * Benefits:
 * - Easy to access from anywhere
 * - Single instance ensures consistency
 *
 * Problems:
 * - Global state makes testing difficult
 * - Hidden dependencies (not explicit in function signatures)
 * - Hard to use different implementations in different contexts
 * - Order of initialization matters
 */

// Global instances (typically defined once at app startup)
let globalLogger: Logger | null = null;
let globalDatabase: Database | null = null;
let globalEmailService: EmailService | null = null;

function initializeSingletons(
  logger: Logger,
  db: Database,
  email: EmailService
): void {
  globalLogger = logger;
  globalDatabase = db;
  globalEmailService = email;
}

function getLogger(): Logger {
  if (!globalLogger) {
    throw new Error("Logger not initialized");
  }
  return globalLogger;
}

function getDatabase(): Database {
  if (!globalDatabase) {
    throw new Error("Database not initialized");
  }
  return globalDatabase;
}

// Function using singletons (dependencies are implicit)
async function findUserWithSingleton(id: number): Promise<User | null> {
  const logger = getLogger();
  const db = getDatabase();

  logger.info(`Finding user: ${id}`);
  return db.findUser(id);
}

// =============================================================================
// 5. SERVICE CONTAINER - Centralized Dependency Management
// =============================================================================
/**
 * A container that holds all service instances and manages their lifecycle.
 *
 * Benefits:
 * - Centralized management of all dependencies
 * - Can handle initialization order
 * - Supports different scopes (singleton, transient)
 *
 * Problems:
 * - Service locator is sometimes considered an anti-pattern
 * - Dependencies are resolved at runtime (no compile-time checking)
 * - Container itself becomes a dependency
 */

class ServiceContainer {
  private services: Map<string, unknown> = new Map();

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service not found: ${name}`);
    }
    return service as T;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }
}

// Usage example
function setupContainer(): ServiceContainer {
  const container = new ServiceContainer();

  // Register services
  container.register<Logger>("logger", createConsoleLogger());
  container.register<Config>("config", {
    apiUrl: "https://api.example.com",
    timeout: 5000,
    maxRetries: 3,
  });

  return container;
}

function useContainer(container: ServiceContainer): void {
  const logger = container.get<Logger>("logger");
  const config = container.get<Config>("config");

  logger.info(`API URL: ${config.apiUrl}`);
}

// =============================================================================
// 6. MOCK IMPLEMENTATIONS FOR TESTING
// =============================================================================
/**
 * Creating mock implementations for testing is tedious
 * and requires maintaining parallel implementations.
 */

// Production implementations
function createConsoleLogger(): Logger {
  return {
    info: (msg) => console.log(`[INFO] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`),
    debug: (msg) => console.debug(`[DEBUG] ${msg}`),
  };
}

function createInMemoryDatabase(): Database & { users: Map<number, User> } {
  const users = new Map<number, User>();

  return {
    users,
    async findUser(id: number): Promise<User | null> {
      return users.get(id) ?? null;
    },
    async saveUser(user: User): Promise<void> {
      users.set(user.id, user);
    },
    async deleteUser(id: number): Promise<boolean> {
      return users.delete(id);
    },
  };
}

function createMockEmailService(): EmailService & {
  sentEmails: Array<{ to: string; subject: string; body: string }>;
} {
  const sentEmails: Array<{ to: string; subject: string; body: string }> = [];

  return {
    sentEmails,
    async sendEmail(
      to: string,
      subject: string,
      body: string
    ): Promise<boolean> {
      sentEmails.push({ to, subject, body });
      return true;
    },
  };
}

// Test implementations (for unit testing)
function createTestLogger(): Logger & { logs: string[] } {
  const logs: string[] = [];
  return {
    logs,
    info: (msg) => logs.push(`[INFO] ${msg}`),
    error: (msg) => logs.push(`[ERROR] ${msg}`),
    debug: (msg) => logs.push(`[DEBUG] ${msg}`),
  };
}

// =============================================================================
// 7. COMPOSING SERVICES - The Challenge
// =============================================================================
/**
 * When services depend on other services, composition becomes complex.
 */

interface NotificationService {
  notifyUserById(userId: number, message: string): Promise<boolean>;
  notifyAllUsers(message: string): Promise<number>;
}

function createNotificationService(
  userService: UserService,
  emailService: EmailService,
  logger: Logger
): NotificationService {
  return {
    async notifyUserById(userId: number, message: string): Promise<boolean> {
      const user = await userService.getUser(userId);
      if (!user) {
        logger.error(`Cannot notify: user ${userId} not found`);
        return false;
      }

      logger.info(`Sending notification to ${user.email}`);
      return emailService.sendEmail(user.email, "Notification", message);
    },

    async notifyAllUsers(message: string): Promise<number> {
      // In a real app, we'd fetch all users
      // This demonstrates the complexity of service composition
      logger.info(`Would notify all users: ${message}`);
      return 0;
    },
  };
}

// Creating a complete application requires careful ordering
function createApplication(): {
  userService: UserService;
  notificationService: NotificationService;
} {
  // Create base dependencies first
  const logger = createConsoleLogger();
  const db = createInMemoryDatabase();
  const emailService = createMockEmailService();

  // Create services that depend on base dependencies
  const userService = createUserService(db, emailService, logger);

  // Create services that depend on other services
  const notificationService = createNotificationService(
    userService,
    emailService,
    logger
  );

  return { userService, notificationService };
}

// =============================================================================
// 8. THE TESTING PROBLEM
// =============================================================================
/**
 * Testing requires creating all dependencies manually,
 * which leads to verbose test setup.
 */

async function testUserService(): Promise<void> {
  // Setup - create all mock dependencies
  const logger = createTestLogger();
  const db = createInMemoryDatabase();
  const emailService = createMockEmailService();

  // Create the service under test
  const userService = createUserService(db, emailService, logger);

  // Test: Create a user
  const user = await userService.createUser("Test User", "test@example.com");

  // Verify
  console.assert(user.name === "Test User", "Name should match");
  console.assert(user.email === "test@example.com", "Email should match");
  console.assert(db.users.has(user.id), "User should be saved to database");
  console.assert(
    logger.logs.some((log) => log.includes("Creating user")),
    "Should log creation"
  );

  console.log("testUserService passed!");
}

// =============================================================================
// DEMO - Run examples
// =============================================================================

async function runExamples(): Promise<void> {
  console.log("=== 3-example.ts: Managing Services (Traditional) ===\n");

  // Setup
  const logger = createConsoleLogger();
  const db = createInMemoryDatabase();
  const emailService = createMockEmailService();

  // Example 1: Manual dependency passing
  console.log("1. Manual dependency passing:");
  const user1 = await findUserManual(db, logger, 1);
  console.log(`   Found user: ${user1?.name ?? "null"}\n`);

  // Example 2: Constructor injection
  console.log("2. Constructor injection:");
  const config: Config = {
    apiUrl: "https://api.test.com",
    timeout: 5000,
    maxRetries: 3,
  };
  const userServiceClass = new UserServiceImpl(
    db,
    emailService,
    logger,
    config
  );
  const createdUser = await userServiceClass.createUser(
    "Alice",
    "alice@example.com"
  );
  console.log(`   Created user: ${createdUser.name}\n`);

  // Example 3: Factory function
  console.log("3. Factory function:");
  const userServiceFactory = createUserService(db, emailService, logger);
  const user3 = await userServiceFactory.getUser(createdUser.id);
  console.log(`   Got user: ${user3?.name ?? "null"}\n`);

  // Example 4: Service container
  console.log("4. Service container:");
  const container = setupContainer();
  useContainer(container);
  console.log("");

  // Example 5: Composed services
  console.log("5. Composed services:");
  const { notificationService } = createApplication();
  await notificationService.notifyUserById(999, "Hello!");
  console.log("");

  // Example 6: Testing
  console.log("6. Testing with mocks:");
  await testUserService();
  console.log("");

  console.log("=== Demo Complete ===");
}

// Run the demo
runExamples();

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Types
  type User,
  type Config,
  type Logger,
  type Database,
  type EmailService,
  type UserService,
  type NotificationService,

  // Manual DI
  findUserManual,
  sendWelcomeEmailManual,
  createAndNotifyUserManual,

  // Constructor injection
  UserServiceImpl,

  // Factory functions
  createUserService,
  createNotificationService,

  // Singletons
  initializeSingletons,
  getLogger,
  getDatabase,
  findUserWithSingleton,

  // Service container
  ServiceContainer,
  setupContainer,

  // Implementations
  createConsoleLogger,
  createInMemoryDatabase,
  createMockEmailService,
  createTestLogger,

  // Application
  createApplication,
};

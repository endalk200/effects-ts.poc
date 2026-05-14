/**
 * 2-example.problem.ts
 *
 * 20 Exercises covering async operations with Effect.ts
 *
 * Topics covered:
 * - Effect.tryPromise (wrapping fetch and Promises)
 * - Effect.sleep (delays)
 * - Effect.flatMap / Effect.map (chaining and transforming)
 * - Effect.gen (generator syntax)
 * - Effect.all (parallel execution)
 * - Effect.race (racing effects)
 * - Effect.timeout / Effect.timeoutOrElse (timeouts)
 * - Effect.retry with Schedule (retries)
 * - Effect.result (error handling as values)
 * - Effect.tap / Effect.tapError (side effects)
 * - Custom errors with Data.TaggedError
 *
 * Instructions:
 * 1. Copy this file to 2-example.solution.ts
 * 2. Implement each TODO
 * 3. Run the file to verify your solutions
 * 4. Each exercise has a test that will print PASS or FAIL
 *
 * Run with: bun run src/2-example.solution.ts
 */

import { Effect, Data, Duration, Schedule, Result } from "effect";

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

interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

// =============================================================================
// EXERCISE 1: Create a delay using Effect.sleep
// =============================================================================
/**
 * Create an effect that delays for the specified milliseconds.
 *
 * Hints:
 * - Use Effect.sleep(Duration.millis(ms))
 * - Duration.millis converts milliseconds to a Duration
 */
function exercise1(ms: number): Effect.Effect<void, never, never> {
  // TODO: Return an effect that delays for `ms` milliseconds
  throw new Error("Not implemented");
}

await testAsync("Exercise 1: Effect.sleep delay", async () => {
  const start = Date.now();
  await Effect.runPromise(exercise1(100));
  const elapsed = Date.now() - start;
  return elapsed >= 90 && elapsed < 200; // Allow some timing variance
});

// =============================================================================
// EXERCISE 2: Wrap a Promise with Effect.tryPromise (success case)
// =============================================================================
/**
 * Create an effect that wraps a Promise which resolves to a number.
 *
 * Hints:
 * - Use Effect.tryPromise({ try: () => promise, catch: (e) => error })
 * - The catch function transforms errors
 */
function exercise2(): Effect.Effect<number, string, never> {
  // TODO: Wrap Promise.resolve(42) in an Effect
  // If it fails (it won't), return the error message as string
  throw new Error("Not implemented");
}

await testAsync("Exercise 2: Effect.tryPromise success", async () => {
  const result = await Effect.runPromise(exercise2());
  return result === 42;
});

// =============================================================================
// EXERCISE 3: Wrap a Promise with Effect.tryPromise (failure case)
// =============================================================================
/**
 * Create an effect that wraps a Promise which rejects.
 *
 * Hints:
 * - Use Effect.tryPromise with Promise.reject
 * - Transform the error to a string message
 */
function exercise3(): Effect.Effect<never, string, never> {
  // TODO: Wrap Promise.reject(new Error("Failed")) in an Effect
  // Transform the error to the string "Promise failed"
  throw new Error("Not implemented");
}

await testAsync("Exercise 3: Effect.tryPromise failure", async () => {
  const result = await Effect.runPromise(exercise3().pipe(Effect.result));
  return Result.isFailure(result) && result.failure === "Promise failed";
});

// =============================================================================
// EXERCISE 4: Create a custom TaggedError for network failures
// =============================================================================
/**
 * Create a tagged error class for network failures.
 *
 * It should have:
 * - _tag = "NetworkError"
 * - url: string (the URL that failed)
 * - cause: string (the error message)
 */

// TODO: Replace this placeholder with:
// class NetworkError extends Data.TaggedError("NetworkError")<{
//   url: string;
//   cause: string;
// }> {}
class NetworkError extends Data.TaggedError("TODO_REPLACE_THIS_TAG")<{
  url: string;
  cause: string;
}> {}

test("Exercise 4: Create NetworkError TaggedError", () => {
  const error = new NetworkError({
    url: "https://api.test.com",
    cause: "Connection refused",
  });
  return (
    (error as { _tag: string })._tag === "NetworkError" &&
    error.url === "https://api.test.com" &&
    error.cause === "Connection refused" &&
    error instanceof Error
  );
});

// =============================================================================
// EXERCISE 5: Fetch data with Effect.tryPromise
// =============================================================================
/**
 * Create an effect that fetches a user from JSONPlaceholder API.
 *
 * Steps:
 * 1. Use Effect.tryPromise to wrap fetch
 * 2. If fetch fails, return NetworkError
 * 3. Parse the JSON response
 * 4. Return the User object
 *
 * Hints:
 * - Use fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
 * - Use Effect.flatMap to chain effects
 * - Note: You must first complete Exercise 4 for this to work!
 */
function exercise5(id: number): Effect.Effect<User, NetworkError, never> {
  // TODO: Implement fetching a user
  // 1. Effect.tryPromise to fetch
  // 2. Effect.flatMap to parse JSON
  // 3. Return User object
  throw new Error("Not implemented");
}

await testAsync("Exercise 5: Fetch user with Effect.tryPromise", async () => {
  const result = await Effect.runPromise(exercise5(1).pipe(Effect.result));
  if (Result.isFailure(result)) return false;
  return result.success.id === 1 && typeof result.success.name === "string";
});

// =============================================================================
// EXERCISE 6: Transform effect result with Effect.map
// =============================================================================
/**
 * Use Effect.map to transform the result of an effect.
 *
 * Given an effect that returns a User, extract just the user's name.
 *
 * Hints:
 * - effect.pipe(Effect.map(user => user.name))
 * - Note: You must first complete Exercise 5 for this to work!
 */
function exercise6(id: number): Effect.Effect<string, NetworkError, never> {
  // TODO: Fetch user and return only their name
  throw new Error("Not implemented");
}

await testAsync("Exercise 6: Effect.map to transform result", async () => {
  const result = await Effect.runPromise(exercise6(1).pipe(Effect.result));
  if (Result.isFailure(result)) return false;
  return typeof result.success === "string" && result.success.length > 0;
});

// =============================================================================
// EXERCISE 7: Chain effects with Effect.flatMap
// =============================================================================
/**
 * Use Effect.flatMap to chain two effects sequentially.
 *
 * Fetch a user, then fetch their first post.
 *
 * Hints:
 * - Use fetchUser(id) then fetchPost(1) (placeholder for user's first post)
 * - effect.pipe(Effect.flatMap(user => anotherEffect))
 * - Note: You must first complete Exercise 5 for this to work!
 */
function fetchPost(id: number): Effect.Effect<Post, NetworkError, never> {
  return Effect.tryPromise({
    try: () => fetch(`https://jsonplaceholder.typicode.com/posts/${id}`),
    catch: () => new NetworkError({ url: "posts", cause: "Fetch failed" }),
  }).pipe(
    Effect.flatMap((response) =>
      Effect.tryPromise({
        try: () => response.json() as Promise<Post>,
        catch: () => new NetworkError({ url: "posts", cause: "Parse failed" }),
      })
    )
  );
}

function exercise7(
  userId: number
): Effect.Effect<{ user: User; post: Post }, NetworkError, never> {
  // TODO: Fetch user, then fetch post, return both
  throw new Error("Not implemented");
}

await testAsync("Exercise 7: Effect.flatMap to chain effects", async () => {
  const result = await Effect.runPromise(exercise7(1).pipe(Effect.result));
  if (Result.isFailure(result)) return false;
  return (
    result.success.user.id === 1 && typeof result.success.post.title === "string"
  );
});

// =============================================================================
// EXERCISE 8: Use Effect.gen for cleaner async code
// =============================================================================
/**
 * Rewrite exercise7 using Effect.gen for cleaner syntax.
 *
 * Effect.gen allows you to use yield* like async/await:
 *
 * Effect.gen(function* () {
 *   const a = yield* effectA;
 *   const b = yield* effectB;
 *   return { a, b };
 * })
 */
function exercise8(
  userId: number
): Effect.Effect<{ user: User; post: Post }, NetworkError, never> {
  // TODO: Same as exercise7, but using Effect.gen
  throw new Error("Not implemented");
}

await testAsync("Exercise 8: Effect.gen syntax", async () => {
  const result = await Effect.runPromise(exercise8(1).pipe(Effect.result));
  if (Result.isFailure(result)) return false;
  return (
    result.success.user.id === 1 && typeof result.success.post.title === "string"
  );
});

// =============================================================================
// EXERCISE 9: Parallel execution with Effect.all
// =============================================================================
/**
 * Fetch multiple users in parallel using Effect.all.
 *
 * Hints:
 * - Create an array of effects: ids.map(id => exercise5(id))
 * - Use Effect.all(effects, { concurrency: "unbounded" })
 */
function exercise9(ids: number[]): Effect.Effect<User[], NetworkError, never> {
  // TODO: Fetch all users in parallel
  throw new Error("Not implemented");
}

await testAsync("Exercise 9: Effect.all parallel execution", async () => {
  const result = await Effect.runPromise(
    exercise9([1, 2, 3]).pipe(Effect.result)
  );
  if (Result.isFailure(result)) return false;
  return result.success.length === 3 && result.success[0]!.id === 1;
});

// =============================================================================
// EXERCISE 10: Handle partial failures with Effect.result
// =============================================================================
/**
 * Fetch multiple users, handling failures gracefully.
 *
 * Use Effect.result to convert each fetch to Result<User, Error>,
 * then collect successful results.
 *
 * Hints:
 * - effect.pipe(Effect.result) returns Effect<Result<E, A>>
 * - Result.isSuccess(result) checks for success
 */
function exercise10(
  ids: number[]
): Effect.Effect<{ successful: User[]; failed: number[] }, never, never> {
  // TODO: Fetch users, return successful ones and list of failed IDs
  throw new Error("Not implemented");
}

await testAsync("Exercise 10: Partial failure handling", async () => {
  // ID 9999 doesn't exist, should fail
  const result = await Effect.runPromise(exercise10([1, 9999, 2]));
  // Note: JSONPlaceholder returns empty object for non-existent users, not 404
  // So this test checks structure, not actual failures
  return Array.isArray(result.successful) && Array.isArray(result.failed);
});

// =============================================================================
// EXERCISE 11: Race effects with Effect.race
// =============================================================================
/**
 * Create an effect that returns the result of the first effect to complete.
 *
 * Hints:
 * - Effect.raceAll(effects) returns the first to complete (takes an array)
 * - Losing effects are automatically interrupted
 */
function exercise11(ids: number[]): Effect.Effect<User, NetworkError, never> {
  // TODO: Return the first user to be fetched
  throw new Error("Not implemented");
}

await testAsync("Exercise 11: Effect.raceAll", async () => {
  const result = await Effect.runPromise(
    exercise11([1, 2, 3]).pipe(Effect.result)
  );
  if (Result.isFailure(result)) return false;
  return typeof result.success.name === "string";
});

// =============================================================================
// EXERCISE 12: Add timeout to an effect
// =============================================================================
/**
 * Create a TimeoutError class and add timeout to an effect.
 *
 * Hints:
 * - Create class TimeoutError extends Data.TaggedError("TimeoutError")<{ ms: number }>
 * - Use Effect.timeoutOrElse({ duration: Duration.millis(ms), orElse: () => Effect.fail(error) })
 */

// TODO: Create TimeoutError class
class TimeoutError extends Data.TaggedError("TODO_REPLACE_THIS_TAG")<{
  ms: number;
}> {}

function exercise12(
  id: number,
  timeoutMs: number
): Effect.Effect<User, NetworkError | TimeoutError, never> {
  // TODO: Fetch user with timeout
  // If timeout occurs, fail with TimeoutError
  throw new Error("Not implemented");
}

await testAsync("Exercise 12: Effect.timeoutOrElse", async () => {
  // Test with long timeout (should succeed)
  const result = await Effect.runPromise(
    exercise12(1, 10000).pipe(Effect.result)
  );
  if (Result.isFailure(result)) return false;
  return result.success.id === 1;
});

await testAsync("Exercise 12b: Timeout actually works", async () => {
  // Test with very short timeout (should fail)
  const result = await Effect.runPromise(exercise12(1, 1).pipe(Effect.result));
  if (Result.isSuccess(result)) return false; // Should have timed out
  return (result.failure as { _tag: string })._tag === "TimeoutError";
});

// =============================================================================
// EXERCISE 13: Retry failed effects
// =============================================================================
/**
 * Create an effect that retries on failure.
 *
 * Hints:
 * - Use Effect.retry(Schedule.recurs(n - 1))
 * - Schedule.recurs(n) retries n times (total n+1 attempts)
 */
let exercise13Attempts = 0;

function resetExercise13(): void {
  exercise13Attempts = 0;
}

function failingEffect(): Effect.Effect<string, string, never> {
  exercise13Attempts++;
  if (exercise13Attempts < 3) {
    return Effect.fail("Still failing");
  }
  return Effect.succeed("Success on attempt 3");
}

function exercise13(maxRetries: number): Effect.Effect<string, string, never> {
  // TODO: Wrap failingEffect() with retry logic
  // Should retry up to maxRetries times
  throw new Error("Not implemented");
}

await testAsync("Exercise 13: Effect.retry", async () => {
  resetExercise13();
  const result = await Effect.runPromise(exercise13(3).pipe(Effect.result));
  if (Result.isFailure(result)) return false;
  return result.success === "Success on attempt 3" && exercise13Attempts === 3;
});

// =============================================================================
// EXERCISE 14: Retry with delay between attempts
// =============================================================================
/**
 * Create an effect that retries with a delay between attempts.
 *
 * Hints:
 * - Schedule.recurs(n).pipe(Schedule.addDelay(() => Duration.millis(ms)))
 * - Or use Schedule.spaced(Duration.millis(ms)) with Schedule.intersect
 */
function exercise14(
  maxRetries: number,
  delayMs: number
): Effect.Effect<string, string, never> {
  // TODO: Retry with delay between attempts
  // Use failingEffect() - reset it first with resetExercise13()
  throw new Error("Not implemented");
}

await testAsync("Exercise 14: Retry with delay", async () => {
  resetExercise13();
  const start = Date.now();
  const result = await Effect.runPromise(exercise14(3, 50).pipe(Effect.result));
  const elapsed = Date.now() - start;
  if (Result.isFailure(result)) return false;
  // Should have delayed at least 100ms (2 retries * 50ms)
  return result.success === "Success on attempt 3" && elapsed >= 80;
});

// =============================================================================
// EXERCISE 15: Use Effect.tap for logging/side effects
// =============================================================================
/**
 * Add logging to an effect without changing its result.
 *
 * Hints:
 * - effect.pipe(Effect.tap(value => Effect.log(...)))
 * - Effect.tap runs a side effect but returns the original value
 */
const exercise15Logs: string[] = [];

function exercise15(id: number): Effect.Effect<User, NetworkError, never> {
  // TODO: Fetch user and log "Fetched user: {name}" to exercise15Logs
  // Use exercise15Logs.push(...) in Effect.sync or Effect.tap
  throw new Error("Not implemented");
}

await testAsync("Exercise 15: Effect.tap for side effects", async () => {
  exercise15Logs.length = 0;
  const result = await Effect.runPromise(exercise15(1).pipe(Effect.result));
  if (Result.isFailure(result)) return false;
  return (
    exercise15Logs.length === 1 &&
    exercise15Logs[0]!.startsWith("Fetched user:")
  );
});

// =============================================================================
// EXERCISE 16: Use Effect.tapError for error logging
// =============================================================================
/**
 * Add error logging to an effect.
 *
 * Hints:
 * - effect.pipe(Effect.tapError(error => Effect.log(...)))
 * - Effect.tapError runs a side effect on errors
 */
const exercise16Errors: string[] = [];

function exercise16(id: number): Effect.Effect<User, NetworkError, never> {
  // TODO: Create an effect that always fails with NetworkError
  // Use Effect.tapError to log "Error: {cause}" to exercise16Errors
  throw new Error("Not implemented");
}

await testAsync("Exercise 16: Effect.tapError", async () => {
  exercise16Errors.length = 0;
  const result = await Effect.runPromise(exercise16(1).pipe(Effect.result));
  if (Result.isSuccess(result)) return false; // Should fail
  return (
    exercise16Errors.length === 1 && exercise16Errors[0]!.startsWith("Error:")
  );
});

// =============================================================================
// EXERCISE 17: Combine errors with catchTag
// =============================================================================
/**
 * Handle specific errors with Effect.catchTag.
 *
 * Create an effect that:
 * - Tries to fetch a user
 * - If NetworkError occurs, return a default user
 *
 * Hints:
 * - effect.pipe(Effect.catchTag("NetworkError", (error) => Effect.succeed(defaultValue)))
 */
function exercise17(id: number): Effect.Effect<User, never, never> {
  // TODO: Fetch user, but return default user on NetworkError
  const defaultUser: User = {
    id: 0,
    name: "Default User",
    email: "default@example.com",
  };
  throw new Error("Not implemented");
}

await testAsync("Exercise 17: Effect.catchTag", async () => {
  // This should succeed with real user
  const result = await Effect.runPromise(exercise17(1));
  return result.id === 1 || result.id === 0; // Result real user or default
});

// =============================================================================
// EXERCISE 18: Use Effect.all with named object
// =============================================================================
/**
 * Use Effect.all with an object of named effects.
 *
 * Instead of Effect.all([effectA, effectB]), use:
 * Effect.all({ user: effectA, post: effectB })
 *
 * This returns { user: A, post: B }
 */
function exercise18(
  userId: number,
  postId: number
): Effect.Effect<{ user: User; post: Post }, NetworkError, never> {
  // TODO: Use Effect.all with named effects
  throw new Error("Not implemented");
}

await testAsync("Exercise 18: Effect.all with named object", async () => {
  const result = await Effect.runPromise(exercise18(1, 1).pipe(Effect.result));
  if (Result.isFailure(result)) return false;
  return result.success.user.id === 1 && result.success.post.id === 1;
});

// =============================================================================
// EXERCISE 19: Conditional effect execution
// =============================================================================
/**
 * Execute an effect conditionally.
 *
 * If id > 0, fetch the user. Otherwise return null.
 *
 * Hints:
 * - Simple: if (condition) { return effectA } else { return Effect.succeed(null) }
 * - Or use Effect.if
 */
function exercise19(
  id: number
): Effect.Effect<User | null, NetworkError, never> {
  // TODO: Fetch user if id > 0, otherwise return null
  throw new Error("Not implemented");
}

await testAsync("Exercise 19a: Conditional - valid ID", async () => {
  const result = await Effect.runPromise(exercise19(1).pipe(Effect.result));
  if (Result.isFailure(result)) return false;
  return result.success !== null && result.success.id === 1;
});

await testAsync("Exercise 19b: Conditional - invalid ID", async () => {
  const result = await Effect.runPromise(exercise19(-1).pipe(Effect.result));
  if (Result.isFailure(result)) return false;
  return result.success === null;
});

// =============================================================================
// EXERCISE 20: Complete async workflow
// =============================================================================
/**
 * Build a complete async workflow that:
 * 1. Fetches a user (with timeout of 5 seconds)
 * 2. Fetches the user's first post (post ID 1)
 * 3. Returns a summary object
 *
 * Handle all errors gracefully - return a default response on any error.
 *
 * This exercise combines multiple concepts:
 * - Effect.gen
 * - Effect.timeoutOrElse
 * - Effect.catch or Effect.result
 * - Multiple sequential operations
 */
interface WorkflowResult {
  success: boolean;
  userName: string;
  postTitle: string;
}

function exercise20(
  userId: number
): Effect.Effect<WorkflowResult, never, never> {
  // TODO: Implement the complete workflow
  // On success: { success: true, userName: user.name, postTitle: post.title }
  // On any error: { success: false, userName: "Unknown", postTitle: "Unknown" }
  throw new Error("Not implemented");
}

await testAsync("Exercise 20a: Complete workflow - success", async () => {
  const result = await Effect.runPromise(exercise20(1));
  return (
    result.success === true &&
    typeof result.userName === "string" &&
    result.userName.length > 0 &&
    typeof result.postTitle === "string"
  );
});

await testAsync(
  "Exercise 20b: Complete workflow - handles errors",
  async () => {
    // Test with invalid user ID (will fail)
    const result = await Effect.runPromise(exercise20(99999));
    // Should return default values, not throw
    return typeof result.success === "boolean";
  }
);

// =============================================================================
// PRINT SUMMARY
// =============================================================================

printSummary();

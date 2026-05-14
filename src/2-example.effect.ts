/**
 * 2-example.effect.ts
 *
 * Async Operations in Effect (Converting from Traditional Approach)
 *
 * This file demonstrates how to implement async patterns using Effect:
 * - Effect.sleep for delays
 * - Effect.tryPromise for HTTP requests with fetch
 * - Effect.flatMap / Effect.map for chaining
 * - Effect.all for parallel execution
 * - Effect.race for racing
 * - Effect.timeout for timeouts
 * - Effect.retry for retries
 * - Effect.either for error handling
 * - Custom error types with Data.TaggedError
 *
 * Key Concepts:
 * 1. Effect.tryPromise - Wraps Promise-returning functions into Effects
 * 2. Effect.sleep - Creates a delay (like setTimeout wrapped in Effect)
 * 3. Effect.all - Runs multiple effects in parallel (like Promise.all)
 * 4. Effect.race - Returns the first effect to complete (like Promise.race)
 * 5. Effect.timeout - Adds timeout to an effect
 * 6. Effect.retry - Automatically retries failed effects
 * 7. Effect.either - Converts errors to Either type for safe handling
 */

import { Effect, Data, Duration, Schedule, Either } from "effect";

// =============================================================================
// TYPES
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
// CUSTOM ERRORS - Using Data.TaggedError
// =============================================================================

/**
 * Error when HTTP request fails
 */
class HttpError extends Data.TaggedError("HttpError")<{
  message: string;
  status: number;
}> {}

/**
 * Error when user is not found
 */
class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: number;
}> {}

/**
 * Error when post is not found
 */
class PostNotFoundError extends Data.TaggedError("PostNotFoundError")<{
  postId: number;
}> {}

/**
 * Error when request times out
 */
class TimeoutError extends Data.TaggedError("TimeoutError")<{
  operation: string;
  timeoutMs: number;
}> {}

/**
 * Error for network failures
 */
class NetworkError extends Data.TaggedError("NetworkError")<{
  cause: string;
}> {}

// =============================================================================
// 1. BASIC ASYNC FUNCTION - Delay with Effect.sleep
// =============================================================================
/**
 * Effect.sleep creates a delay for the specified duration.
 *
 * Unlike setTimeout, Effect.sleep:
 * - Is cancellable
 * - Can be composed with other effects
 * - Tracks the delay in the type system
 *
 * Duration.millis(ms) creates a Duration from milliseconds
 * You can also use Duration.seconds, Duration.minutes, etc.
 */
function delay(ms: number): Effect.Effect<void, never, never> {
  return Effect.sleep(Duration.millis(ms));
}

// Example usage with Effect:
const delayExample: Effect.Effect<string, never, never> = Effect.gen(
  function* () {
    console.log("Starting delay...");
    yield* delay(1000);
    console.log("Delay complete!");
    return "Done";
  }
);

// =============================================================================
// 2. HTTP REQUEST - Fetch a single user with Effect.tryPromise
// =============================================================================
/**
 * Effect.tryPromise wraps a Promise-returning function into an Effect.
 *
 * Syntax:
 * Effect.tryPromise({
 *   try: () => somePromise,          // The Promise to wrap
 *   catch: (error) => new MyError()  // Transform errors
 * })
 *
 * Benefits over raw Promises:
 * - Errors are typed and tracked in the Effect signature
 * - Can be retried, timed out, etc.
 * - Integrates with Effect's interruption system
 */
function fetchUser(
  id: number
): Effect.Effect<User, HttpError | UserNotFoundError, never> {
  return Effect.tryPromise({
    try: () => fetch(`https://jsonplaceholder.typicode.com/users/${id}`),
    catch: (error) =>
      new NetworkError({
        cause: error instanceof Error ? error.message : String(error),
      }),
  }).pipe(
    // Check if response is ok
    Effect.flatMap((response) => {
      if (!response.ok) {
        return Effect.fail(
          new HttpError({
            message: `Failed to fetch user`,
            status: response.status,
          })
        );
      }
      return Effect.succeed(response);
    }),
    // Parse JSON
    Effect.flatMap((response) =>
      Effect.tryPromise({
        try: () =>
          response.json() as Promise<{
            id?: number;
            name?: string;
            email?: string;
          }>,
        catch: () =>
          new HttpError({ message: "Failed to parse response", status: 500 }),
      })
    ),
    // Validate user data
    Effect.flatMap((data) => {
      if (!data.id) {
        return Effect.fail(new UserNotFoundError({ userId: id }));
      }
      return Effect.succeed({
        id: data.id,
        name: data.name ?? "",
        email: data.email ?? "",
      } as User);
    }),
    // Map network errors to HTTP errors
    Effect.catchTag("NetworkError", (e) =>
      Effect.fail(new HttpError({ message: e.cause, status: 0 }))
    )
  );
}

// =============================================================================
// 3. HTTP REQUEST - Fetch a post
// =============================================================================
/**
 * Similar pattern for fetching posts
 */
function fetchPost(
  id: number
): Effect.Effect<Post, HttpError | PostNotFoundError, never> {
  return Effect.tryPromise({
    try: () => fetch(`https://jsonplaceholder.typicode.com/posts/${id}`),
    catch: (error) =>
      new NetworkError({
        cause: error instanceof Error ? error.message : String(error),
      }),
  }).pipe(
    Effect.flatMap((response) => {
      if (!response.ok) {
        return Effect.fail(
          new HttpError({
            message: `Failed to fetch post`,
            status: response.status,
          })
        );
      }
      return Effect.succeed(response);
    }),
    Effect.flatMap((response) =>
      Effect.tryPromise({
        try: () =>
          response.json() as Promise<{
            id: number;
            userId: number;
            title: string;
            body: string;
          }>,
        catch: () =>
          new HttpError({ message: "Failed to parse response", status: 500 }),
      })
    ),
    Effect.flatMap((data) => {
      if (!data.id) {
        return Effect.fail(new PostNotFoundError({ postId: id }));
      }
      return Effect.succeed({
        id: data.id,
        userId: data.userId,
        title: data.title,
        body: data.body,
      } as Post);
    }),
    Effect.catchTag("NetworkError", (e) =>
      Effect.fail(new HttpError({ message: e.cause, status: 0 }))
    )
  );
}

// =============================================================================
// 4. SEQUENTIAL ASYNC - Fetch user then their posts with Effect.flatMap
// =============================================================================
/**
 * Effect.flatMap chains effects sequentially.
 * The result of the first effect is passed to the next.
 *
 * This is similar to:
 *   const user = await fetchUser(id);
 *   const posts = await fetchPosts(user.id);
 *
 * But with full type safety and error tracking.
 */
function fetchUserWithPosts(
  userId: number
): Effect.Effect<
  { user: User; posts: Post[] },
  HttpError | UserNotFoundError | PostNotFoundError,
  never
> {
  return Effect.gen(function* () {
    // First fetch the user
    const user = yield* fetchUser(userId);

    // Then fetch posts for that user
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(`https://jsonplaceholder.typicode.com/posts?userId=${userId}`),
      catch: () =>
        new HttpError({ message: "Failed to fetch posts", status: 0 }),
    });

    if (!response.ok) {
      return yield* Effect.fail(
        new HttpError({
          message: "Failed to fetch posts",
          status: response.status,
        })
      );
    }

    const postsData = yield* Effect.tryPromise({
      try: () =>
        response.json() as Promise<
          Array<{ id: number; userId: number; title: string; body: string }>
        >,
      catch: () =>
        new HttpError({ message: "Failed to parse posts", status: 500 }),
    });

    const posts: Post[] = postsData.map((p) => ({
      id: p.id,
      userId: p.userId,
      title: p.title,
      body: p.body,
    }));

    return { user, posts };
  });
}

// =============================================================================
// 5. PARALLEL ASYNC - Fetch multiple users at once with Effect.all
// =============================================================================
/**
 * Effect.all runs multiple effects in parallel.
 *
 * By default, if any effect fails, the entire operation fails.
 * Use { concurrency: "unbounded" } for true parallelism.
 *
 * Options:
 * - { concurrency: number } - Limit concurrent operations
 * - { concurrency: "unbounded" } - No limit (like Promise.all)
 * - { mode: "either" } - Return Either for each result
 */
function fetchUsersParallel(
  ids: number[]
): Effect.Effect<User[], HttpError | UserNotFoundError, never> {
  const effects = ids.map((id) => fetchUser(id));

  return Effect.all(effects, { concurrency: "unbounded" });
}

// =============================================================================
// 6. PARALLEL ASYNC - Fetch with partial failure handling
// =============================================================================
/**
 * Effect.either converts an Effect<A, E> into Effect<Either<E, A>>
 * This allows handling errors without failing the entire operation.
 *
 * Combined with Effect.all, this mimics Promise.allSettled behavior.
 */
function fetchUsersWithPartialFailure(ids: number[]): Effect.Effect<
  { successful: User[]; failed: number[] },
  never, // No errors - we handle them all
  never
> {
  const effects = ids.map((id, index) =>
    fetchUser(id).pipe(
      Effect.either,
      Effect.map((result) => ({ id: ids[index]!, result }))
    )
  );

  return Effect.all(effects, { concurrency: "unbounded" }).pipe(
    Effect.map((results) => {
      const successful: User[] = [];
      const failed: number[] = [];

      for (const { id, result } of results) {
        if (Either.isRight(result)) {
          successful.push(result.right);
        } else {
          failed.push(id);
        }
      }

      return { successful, failed };
    })
  );
}

// =============================================================================
// 7. RACE - First response wins with Effect.race
// =============================================================================
/**
 * Effect.race returns the result of the first effect to complete.
 * The other effects are interrupted.
 *
 * Unlike Promise.race, Effect.race properly cleans up
 * the losing effects (interruption).
 */
function fetchFirstAvailable(
  ids: number[]
): Effect.Effect<User, HttpError | UserNotFoundError, never> {
  const effects = ids.map((id) => fetchUser(id));

  return Effect.raceAll(effects);
}

// =============================================================================
// 8. TIMEOUT - Fetch with timeout using Effect.timeout
// =============================================================================
/**
 * Effect.timeout adds a timeout to an effect.
 *
 * If the effect doesn't complete in time, it returns Option.none().
 * Use Effect.timeoutFail to fail with a custom error instead.
 *
 * The effect is properly interrupted when timeout occurs.
 */
function fetchUserWithTimeout(
  id: number,
  timeoutMs: number
): Effect.Effect<User, HttpError | UserNotFoundError | TimeoutError, never> {
  return fetchUser(id).pipe(
    Effect.timeoutFail({
      duration: Duration.millis(timeoutMs),
      onTimeout: () => new TimeoutError({ operation: "fetchUser", timeoutMs }),
    })
  );
}

// =============================================================================
// 9. RETRY - Fetch with retries using Effect.retry
// =============================================================================
/**
 * Effect.retry automatically retries failed effects.
 *
 * Schedule defines the retry policy:
 * - Schedule.recurs(n) - Retry n times
 * - Schedule.spaced(duration) - Wait between retries
 * - Schedule.exponential(duration) - Exponential backoff
 *
 * You can combine schedules with pipe:
 *   Schedule.recurs(3).pipe(Schedule.addDelay(() => Duration.seconds(1)))
 */
function fetchUserWithRetry(
  id: number,
  maxRetries: number = 3,
  delayMs: number = 1000
): Effect.Effect<User, HttpError | UserNotFoundError, never> {
  return fetchUser(id).pipe(
    Effect.retry(
      Schedule.recurs(maxRetries - 1).pipe(
        Schedule.addDelay(() => Duration.millis(delayMs))
      )
    ),
    Effect.tapError((error) =>
      Effect.log(`All ${maxRetries} attempts failed: ${error._tag}`)
    )
  );
}

// =============================================================================
// 10. ERROR HANDLING - Typed error handling with Effect.either
// =============================================================================
/**
 * Effect.either converts Effect<A, E> to Effect<Either<E, A>>
 *
 * This is useful when you want to handle errors without
 * losing the error information or transforming the type.
 *
 * Either.isRight(result) - Check if successful
 * Either.isLeft(result) - Check if failed
 */
function fetchUserSafe(
  id: number
): Effect.Effect<
  | { success: true; data: User }
  | { success: false; error: { message: string; status: number } },
  never,
  never
> {
  return fetchUser(id).pipe(
    Effect.either,
    Effect.map((result) => {
      if (Either.isRight(result)) {
        return { success: true as const, data: result.right };
      } else {
        const error = result.left;
        return {
          success: false as const,
          error: {
            message: error._tag,
            status: error._tag === "HttpError" ? error.status : 404,
          },
        };
      }
    })
  );
}

// =============================================================================
// 11. CHAINING - Transform async results with Effect.map
// =============================================================================
/**
 * Effect.map transforms the success value of an effect.
 *
 * Unlike flatMap, map doesn't return an Effect - just a transformed value.
 * Use map for pure transformations, flatMap for effectful operations.
 */
function fetchUserDisplayName(
  id: number
): Effect.Effect<string, HttpError | UserNotFoundError, never> {
  return fetchUser(id).pipe(
    Effect.map((user) => `${user.name} <${user.email}>`)
  );
}

// =============================================================================
// 12. CONDITIONAL ASYNC - Fetch based on condition
// =============================================================================
/**
 * Effect.if_ or simple conditional logic with Effect.
 *
 * You can also use Effect.when for optional execution.
 */
function fetchUserIfValid(
  id: number
): Effect.Effect<User | null, HttpError | UserNotFoundError, never> {
  if (id <= 0) {
    return Effect.succeed(null);
  }
  return fetchUser(id);
}

// =============================================================================
// 13. ADVANCED: Combining multiple operations with Effect.gen
// =============================================================================
/**
 * Effect.gen provides a generator-based syntax for combining effects.
 *
 * This is often more readable than chains of flatMap/map:
 *
 * Effect.gen(function* () {
 *   const a = yield* effectA;
 *   const b = yield* effectB;
 *   return a + b;
 * })
 *
 * yield* is used to "unwrap" effects (similar to await for Promises)
 */
function complexOperation(
  userId: number
): Effect.Effect<
  { user: User; firstPost: Post | null; displayName: string },
  HttpError | UserNotFoundError | PostNotFoundError,
  never
> {
  return Effect.gen(function* () {
    // Fetch user first
    const user = yield* fetchUser(userId);

    // Try to fetch first post (may not exist)
    const firstPostResult = yield* fetchPost(1).pipe(Effect.either);
    const firstPost = Either.isRight(firstPostResult)
      ? firstPostResult.right
      : null;

    // Create display name
    const displayName = `${user.name} <${user.email}>`;

    return { user, firstPost, displayName };
  });
}

// =============================================================================
// 14. Interruptible operations
// =============================================================================
/**
 * Effects are interruptible by default.
 * Use Effect.uninterruptible to prevent interruption.
 *
 * This is useful for critical sections that must complete.
 */
function criticalFetch(
  id: number
): Effect.Effect<User, HttpError | UserNotFoundError, never> {
  return fetchUser(id).pipe(Effect.uninterruptible);
}

// =============================================================================
// 15. Tapping for side effects
// =============================================================================
/**
 * Effect.tap allows running side effects without changing the result.
 * Effect.tapError does the same for errors.
 *
 * Useful for logging, metrics, etc.
 */
function fetchUserWithLogging(
  id: number
): Effect.Effect<User, HttpError | UserNotFoundError, never> {
  return fetchUser(id).pipe(
    Effect.tap((user) => Effect.log(`Fetched user: ${user.name}`)),
    Effect.tapError((error) => Effect.log(`Error fetching user: ${error._tag}`))
  );
}

// =============================================================================
// DEMO - Run all examples
// =============================================================================
const runExamples: Effect.Effect<void, never, never> = Effect.gen(function* () {
  console.log("=== 2-example.effect.ts: Async Operations with Effect ===\n");

  // Example 1: Basic delay
  console.log("1. Delay example:");
  yield* delay(500);
  console.log("   Delayed for 500ms\n");

  // Example 2: Fetch single user
  console.log("2. Fetch single user:");
  const userResult = yield* fetchUser(1).pipe(Effect.either);
  if (Either.isRight(userResult)) {
    console.log(
      `   User: ${userResult.right.name} (${userResult.right.email})\n`
    );
  } else {
    console.log(`   Error: ${userResult.left._tag}\n`);
  }

  // Example 3: Fetch post
  console.log("3. Fetch post:");
  const postResult = yield* fetchPost(1).pipe(Effect.either);
  if (Either.isRight(postResult)) {
    console.log(`   Post: ${postResult.right.title.substring(0, 50)}...\n`);
  } else {
    console.log(`   Error: ${postResult.left._tag}\n`);
  }

  // Example 4: Sequential fetch
  console.log("4. Sequential fetch (user + posts):");
  const seqResult = yield* fetchUserWithPosts(1).pipe(Effect.either);
  if (Either.isRight(seqResult)) {
    console.log(
      `   User: ${seqResult.right.user.name}, Posts: ${seqResult.right.posts.length}\n`
    );
  } else {
    console.log(`   Error: ${seqResult.left._tag}\n`);
  }

  // Example 5: Parallel fetch
  console.log("5. Parallel fetch (3 users):");
  const parallelResult = yield* fetchUsersParallel([1, 2, 3]).pipe(
    Effect.either
  );
  if (Either.isRight(parallelResult)) {
    console.log(
      `   Fetched ${parallelResult.right.length} users: ${parallelResult.right
        .map((u) => u.name)
        .join(", ")}\n`
    );
  } else {
    console.log(`   Error: ${parallelResult.left._tag}\n`);
  }

  // Example 6: Partial failure handling
  console.log("6. Partial failure handling (valid + invalid IDs):");
  const partialResult = yield* fetchUsersWithPartialFailure([1, 9999, 2]);
  console.log(
    `   Successful: ${partialResult.successful.length}, Failed: ${partialResult.failed.length}\n`
  );

  // Example 7: Fetch with timeout
  console.log("7. Fetch with timeout (5s timeout):");
  const timeoutResult = yield* fetchUserWithTimeout(1, 5000).pipe(
    Effect.either
  );
  if (Either.isRight(timeoutResult)) {
    console.log(`   User: ${timeoutResult.right.name}\n`);
  } else {
    console.log(`   Error: ${timeoutResult.left._tag}\n`);
  }

  // Example 8: Safe fetch with typed errors
  console.log("8. Safe fetch with typed errors:");
  const safeResult = yield* fetchUserSafe(1);
  if (safeResult.success) {
    console.log(`   User: ${safeResult.data.name}\n`);
  } else {
    console.log(`   Error: ${safeResult.error.message}\n`);
  }

  // Example 9: Transform result
  console.log("9. Transform result:");
  const displayResult = yield* fetchUserDisplayName(1).pipe(Effect.either);
  if (Either.isRight(displayResult)) {
    console.log(`   Display name: ${displayResult.right}\n`);
  } else {
    console.log(`   Error: ${displayResult.left._tag}\n`);
  }

  // Example 10: Conditional fetch
  console.log("10. Conditional fetch:");
  const validUser = yield* fetchUserIfValid(1).pipe(Effect.either);
  const invalidUser = yield* fetchUserIfValid(-1).pipe(Effect.either);
  console.log(
    `   Valid ID (1): ${
      Either.isRight(validUser) ? validUser.right?.name ?? "null" : "error"
    }`
  );
  console.log(
    `   Invalid ID (-1): ${
      Either.isRight(invalidUser) ? invalidUser.right?.name ?? "null" : "error"
    }\n`
  );

  console.log("=== Demo Complete ===");
});

// Run the demo
Effect.runPromise(runExamples).catch(console.error);

// =============================================================================
// EXPORTS
// =============================================================================

export {
  delay,
  fetchUser,
  fetchPost,
  fetchUserWithPosts,
  fetchUsersParallel,
  fetchUsersWithPartialFailure,
  fetchFirstAvailable,
  fetchUserWithTimeout,
  fetchUserWithRetry,
  fetchUserSafe,
  fetchUserDisplayName,
  fetchUserIfValid,
  complexOperation,
  criticalFetch,
  fetchUserWithLogging,
};

export {
  HttpError,
  UserNotFoundError,
  PostNotFoundError,
  TimeoutError,
  NetworkError,
};

export type { User, Post };

// =============================================================================
// SUMMARY OF CONCEPTS COVERED
// =============================================================================

/**
 * Key takeaways from this example:
 *
 * 1. Effect.tryPromise - Wrap Promises in Effects:
 *    Effect.tryPromise({
 *      try: () => fetch(url),
 *      catch: (error) => new MyError(...)
 *    })
 *
 * 2. Effect.sleep - Create delays:
 *    Effect.sleep(Duration.millis(1000))
 *
 * 3. Effect.flatMap / Effect.map - Chain operations:
 *    effect.pipe(Effect.map(x => x * 2))
 *    effect.pipe(Effect.flatMap(x => anotherEffect))
 *
 * 4. Effect.gen - Generator syntax for cleaner code:
 *    Effect.gen(function* () {
 *      const a = yield* effectA;
 *      return a;
 *    })
 *
 * 5. Effect.all - Parallel execution:
 *    Effect.all(effects, { concurrency: "unbounded" })
 *
 * 6. Effect.raceAll - First to complete wins:
 *    Effect.raceAll(effects)
 *
 * 7. Effect.timeout / Effect.timeoutFail - Add timeouts:
 *    effect.pipe(Effect.timeoutFail({ duration, onTimeout }))
 *
 * 8. Effect.retry - Automatic retries:
 *    effect.pipe(Effect.retry(Schedule.recurs(3)))
 *
 * 9. Effect.either - Handle errors as values:
 *    effect.pipe(Effect.either)
 *
 * 10. Effect.tap / Effect.tapError - Side effects:
 *     effect.pipe(Effect.tap(x => Effect.log(x)))
 *
 * 11. Custom errors with Data.TaggedError:
 *     class MyError extends Data.TaggedError("MyError")<{ field: Type }> {}
 *
 * Benefits over raw Promises:
 * - Full type safety for errors
 * - Automatic resource cleanup
 * - Built-in retry, timeout, and interruption
 * - Composable and testable
 * - Better error messages and stack traces
 */

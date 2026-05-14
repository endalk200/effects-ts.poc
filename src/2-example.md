# Effect-TS Async Operations: Promises Done Right

> **Learning Path**: Read this → Study `2-example.effect.ts` → Practice with `2-example.problem.ts`

## Introduction

In `2-example.ts`, you saw traditional async patterns:

- `async/await` and Promises
- `fetch` for HTTP requests
- `Promise.all` for parallel execution
- `Promise.race` for racing
- Manual retry logic
- Try/catch error handling

**Problems with Traditional Async:**

```typescript
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error(`Failed: ${response.status}`);
  }
  return response.json();
}
```

Looking at `Promise<User>`, you have no idea:

- What errors can occur?
- Will this timeout?
- How should retries work?
- Is it cancellable?

**Effect makes all of this explicit and composable.**

---

## Wrapping Promises with `Effect.tryPromise`

The bridge between Promise-land and Effect-land:

```typescript
import { Effect } from "effect";

function fetchUser(id: number): Effect.Effect<User, FetchError, never> {
  return Effect.tryPromise({
    try: () => fetch(`/api/users/${id}`).then((r) => r.json()),
    catch: (error) => new FetchError({ cause: String(error) }),
  });
}
```

**Key points:**

- `try` – The Promise-returning function
- `catch` – Transform unknown errors into your typed error
- The result is a proper Effect with typed errors!

### Why Transform Errors?

Promises reject with `unknown` – you never know what you'll get. The `catch` function lets you:

1. Inspect the error
2. Convert to your typed error class
3. Get full type safety downstream

```typescript
Effect.tryPromise({
  try: () => fetch(url),
  catch: (error) => {
    // error is 'unknown' here
    if (error instanceof TypeError) {
      return new NetworkError({ cause: "Network failure" });
    }
    return new NetworkError({ cause: String(error) });
  },
});
```

---

## Delays with `Effect.sleep`

Unlike `setTimeout`, Effect's sleep is:

- Cancellable
- Composable
- Type-safe

```typescript
import { Effect, Duration } from "effect";

// Create a 1 second delay
const delay = Effect.sleep(Duration.seconds(1));

// Use it in a sequence
const withDelay = Effect.gen(function* () {
  console.log("Starting...");
  yield* Effect.sleep(Duration.millis(500));
  console.log("Done!");
});
```

### Duration Helpers

```typescript
Duration.millis(500); // 500 milliseconds
Duration.seconds(5); // 5 seconds
Duration.minutes(1); // 1 minute
Duration.hours(2); // 2 hours
```

---

## Chaining: `map` vs `flatMap`

### `Effect.map` – Transform the Success Value

When you want to transform the result without introducing new effects:

```typescript
const userEffect: Effect.Effect<User, Error, never> = fetchUser(1);

const nameEffect: Effect.Effect<string, Error, never> = userEffect.pipe(
  Effect.map((user) => user.name) // Just transform the value
);
```

### `Effect.flatMap` – Chain to Another Effect

When the transformation itself needs to be an effect:

```typescript
const postEffect: Effect.Effect<Post, Error, never> = userEffect.pipe(
  Effect.flatMap((user) => fetchPostsForUser(user.id))
);
```

**Rule of thumb:**

- `map`: `A → B` (pure transformation)
- `flatMap`: `A → Effect<B>` (effectful transformation)

---

## Generator Syntax with `Effect.gen`

Tired of chaining? Use generators for async/await-like syntax:

```typescript
const program = Effect.gen(function* () {
  // yield* "unwraps" effects (like await for Promises)
  const user = yield* fetchUser(1);
  const posts = yield* fetchPostsForUser(user.id);

  // You can use regular JS logic
  if (posts.length === 0) {
    return { user, posts: [], message: "No posts" };
  }

  return { user, posts, message: `Found ${posts.length} posts` };
});
```

**Benefits:**

- Reads like synchronous code
- Full type inference
- Error types automatically union together
- Early returns work naturally

---

## Parallel Execution with `Effect.all`

### Basic Parallel – Like `Promise.all`

```typescript
const userEffects = [fetchUser(1), fetchUser(2), fetchUser(3)];

const allUsers: Effect.Effect<User[], Error, never> = Effect.all(
  userEffects,
  { concurrency: "unbounded" } // Run all in parallel
);
```

### Concurrency Options

```typescript
// All at once (default for unbounded)
Effect.all(effects, { concurrency: "unbounded" });

// Limit concurrent operations
Effect.all(effects, { concurrency: 3 });

// Sequential (one at a time)
Effect.all(effects, { concurrency: 1 });
// Or simply:
Effect.all(effects); // Sequential by default
```

### Named Object Pattern

Instead of arrays, use objects for clearer code:

```typescript
const result =
  yield *
  Effect.all({
    user: fetchUser(1),
    posts: fetchPosts(1),
    comments: fetchComments(1),
  });

// result: { user: User, posts: Post[], comments: Comment[] }
console.log(result.user.name);
```

---

## Racing Effects with `Effect.raceAll`

Get the result of the first effect to complete:

```typescript
const fastest = Effect.raceAll([
  fetchFromServer1(id),
  fetchFromServer2(id),
  fetchFromServer3(id),
]);
// Returns whichever completes first
```

**Key difference from `Promise.race`:**

- Effect automatically **interrupts** the losing effects
- Resources are properly cleaned up
- No dangling operations

---

## Timeouts with `Effect.timeout`

### Basic Timeout – Returns `Option`

```typescript
import { Option } from "effect";

const withTimeout = fetchUser(1).pipe(Effect.timeout(Duration.seconds(5)));
// Type: Effect<Option<User>, Error, never>
// Returns None if timeout, Some(user) if success
```

### Timeout with Custom Error – `Effect.timeoutOrElse`

```typescript
class TimeoutError extends Data.TaggedError("TimeoutError")<{
  operation: string;
  timeoutMs: number;
}> {}

const withTimeout = fetchUser(1).pipe(
  Effect.timeoutOrElse({
    duration: Duration.seconds(5),
    orElse: () =>
      Effect.fail(new TimeoutError({
        operation: "fetchUser",
        timeoutMs: 5000,
      })),
  })
);
// Type: Effect<User, Error | TimeoutError, never>
```

---

## Retries with `Effect.retry`

### Basic Retry

```typescript
import { Schedule } from "effect";

const withRetry = fetchUser(1).pipe(
  Effect.retry(Schedule.recurs(3)) // Retry up to 3 times
);
```

### Retry with Delay

```typescript
const withRetryAndDelay = fetchUser(1).pipe(
  Effect.retry(
    Schedule.recurs(3).pipe(Schedule.addDelay(() => Duration.seconds(1)))
  )
);
// Retries 3 times, waiting 1 second between attempts
```

### Exponential Backoff

```typescript
const withExponentialBackoff = fetchUser(1).pipe(
  Effect.retry(
    Schedule.exponential(Duration.millis(100)) // 100ms, 200ms, 400ms...
      .pipe(Schedule.upTo(Duration.seconds(10))) // Max 10 seconds total
  )
);
```

### Common Schedule Patterns

```typescript
Schedule.recurs(n); // Retry n times
Schedule.spaced(duration); // Fixed delay between retries
Schedule.exponential(base); // Exponential backoff
Schedule.forever; // Retry indefinitely
Schedule.once; // Retry exactly once
```

---

## Error Handling as Values with `Effect.result`

Convert errors to values for graceful handling:

```typescript
import { Result } from "effect";

const safeResult = yield * fetchUser(1).pipe(Effect.result);
// Type: Result<User, Error>

if (Result.isSuccess(safeResult)) {
  console.log("Success:", safeResult.success.name);
} else {
  console.log("Failed:", safeResult.failure.message);
}
```

### Handling Partial Failures

Like `Promise.allSettled`:

```typescript
const fetchAllSafe = (ids: number[]) => {
  const effects = ids.map((id) =>
    fetchUser(id).pipe(
      Effect.result,
      Effect.map((result) => ({ id, result }))
    )
  );

  return Effect.all(effects, { concurrency: "unbounded" }).pipe(
    Effect.map((results) => {
      const successful = results
        .filter((r) => Result.isSuccess(r.result))
        .map((r) => r.result.success);
      const failed = results
        .filter((r) => Result.isFailure(r.result))
        .map((r) => r.id);
      return { successful, failed };
    })
  );
};
```

---

## Side Effects with `tap` and `tapError`

Run side effects without changing the result:

### `Effect.tap` – On Success

```typescript
const withLogging = fetchUser(1).pipe(
  Effect.tap((user) => Effect.log(`Fetched: ${user.name}`))
);
// Still returns User, but logs along the way
```

### `Effect.tapError` – On Error

```typescript
const withErrorLogging = fetchUser(1).pipe(
  Effect.tapError((error) =>
    Effect.log(`Failed to fetch user: ${error.message}`)
  )
);
// Still fails with original error, but logs it
```

### Combining Both

```typescript
const withFullLogging = fetchUser(1).pipe(
  Effect.tap((user) => Effect.log(`Success: ${user.name}`)),
  Effect.tapError((error) => Effect.log(`Error: ${error.message}`))
);
```

---

## Custom Errors for Async Operations

Best practice: Create specific error types for different failures:

```typescript
class NetworkError extends Data.TaggedError("NetworkError")<{
  url: string;
  cause: string;
}> {}

class TimeoutError extends Data.TaggedError("TimeoutError")<{
  operation: string;
  durationMs: number;
}> {}

class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

// Now your effects have precise error types
function fetchUser(
  id: number
): Effect.Effect<User, NetworkError | ValidationError, never> {
  // ...
}
```

---

## Complete Example: Robust API Call

```typescript
class HttpError extends Data.TaggedError("HttpError")<{
  status: number;
  message: string;
}> {}

class TimeoutError extends Data.TaggedError("TimeoutError")<{
  url: string;
}> {}

function fetchUserRobust(
  id: number
): Effect.Effect<User, HttpError | TimeoutError, never> {
  return Effect.tryPromise({
    try: () => fetch(`/api/users/${id}`),
    catch: () => new HttpError({ status: 0, message: "Network error" }),
  }).pipe(
    // Check response status
    Effect.flatMap((response) =>
      response.ok
        ? Effect.tryPromise({
            try: () => response.json() as Promise<User>,
            catch: () => new HttpError({ status: 500, message: "Parse error" }),
          })
        : Effect.fail(
            new HttpError({
              status: response.status,
              message: "Request failed",
            })
          )
    ),
    // Add timeout
    Effect.timeoutOrElse({
      duration: Duration.seconds(5),
      orElse: () => Effect.fail(new TimeoutError({ url: `/api/users/${id}` })),
    }),
    // Add retry
    Effect.retry(Schedule.recurs(3)),
    // Log progress
    Effect.tap((user) => Effect.log(`Fetched user: ${user.name}`)),
    Effect.tapError((error) => Effect.log(`Error: ${error._tag}`))
  );
}
```

---

## Summary: Async Comparison

| Pattern       | Traditional            | Effect-TS                         |
| ------------- | ---------------------- | --------------------------------- |
| Wrap Promise  | `new Promise()`        | `Effect.tryPromise()`             |
| Delay         | `setTimeout` + Promise | `Effect.sleep(Duration)`          |
| Transform     | `.then(x => ...)`      | `Effect.map()`                    |
| Chain async   | `await a; await b;`    | `Effect.flatMap()` / `Effect.gen` |
| Parallel      | `Promise.all()`        | `Effect.all({ concurrency })`     |
| Race          | `Promise.race()`       | `Effect.raceAll()`                |
| Timeout       | Manual `Promise.race`  | `Effect.timeout()`                |
| Retry         | Manual loop            | `Effect.retry(Schedule)`          |
| Result result | Manual try/catch       | `Effect.result`                   |

---

## Key Takeaways Before the Code

1. **`Effect.tryPromise`** – Bridge from Promises to Effects with typed errors
2. **`Effect.sleep`** – Cancellable, composable delays
3. **`Effect.map`** – Transform success values (pure)
4. **`Effect.flatMap`** – Chain to another Effect
5. **`Effect.gen`** – Generator syntax for sequential code
6. **`Effect.all`** – Parallel execution with concurrency control
7. **`Effect.raceAll`** – First to complete wins (others interrupted)
8. **`Effect.timeout`** – Add timeouts to any effect
9. **`Effect.retry`** – Automatic retries with Schedule
10. **`Effect.result`** – Convert errors to values

---

## What's Next?

Now you're ready to:

1. **Study** `2-example.effect.ts` – See async patterns with Effect
2. **Practice** `2-example.problem.ts` – Build your async skills

The exercises will have you fetch data, handle timeouts, implement retries, and compose complex async workflows!

---

## Quick Reference

```typescript
import { Effect, Duration, Schedule, Result, Data } from "effect";

// Wrap Promises
Effect.tryPromise({
  try: () => fetch(url),
  catch: (e) => new MyError({ cause: String(e) }),
});

// Delays
Effect.sleep(Duration.seconds(5));

// Chaining
effect.pipe(
  Effect.map((x) => transform(x)), // Pure transform
  Effect.flatMap((x) => otherEffect(x)) // Effect chain
);

// Generator syntax
Effect.gen(function* () {
  const a = yield* effectA;
  const b = yield* effectB;
  return { a, b };
});

// Parallel execution
Effect.all(effects, { concurrency: "unbounded" });
Effect.all({ user: fetchUser(1), post: fetchPost(1) });

// Racing
Effect.raceAll([effectA, effectB, effectC]);

// Timeouts
effect.pipe(
  Effect.timeout(Duration.seconds(5)), // Returns Option
  Effect.timeoutOrElse({
    // Custom error
    duration: Duration.seconds(5),
    orElse: () => Effect.fail(new TimeoutError()),
  })
);

// Retries
effect.pipe(
  Effect.retry(Schedule.recurs(3)),
  Effect.retry(Schedule.exponential(Duration.millis(100)))
);

// Error as value
Effect.result; // Effect<A, E> -> Effect<Result<A, E>, never>

// Side effects
effect.pipe(
  Effect.tap((value) => Effect.log(`Got: ${value}`)),
  Effect.tapError((error) => Effect.log(`Error: ${error}`))
);
```

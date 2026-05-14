# Effect-TS Fundamentals: Your First Steps

> **Learning Path**: Read this → Study `1-example.effect.ts` → Practice with `1-example.problem.ts`

## Introduction

In `1-example.ts`, you saw simple arithmetic functions in TypeScript. Some always succeed (`add`, `subtract`, `multiply`), while others can fail (`divide` throws when dividing by zero).

**The Problem with Traditional TypeScript:**

```typescript
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error("Cannot divide by zero");
  }
  return a / b;
}
```

Looking at this function signature `(a: number, b: number): number`, you'd never know it can throw. The error is **hidden** from the type system. This leads to:

- Runtime surprises when errors aren't caught
- No compiler help ensuring you handle errors
- Unclear what errors a function can produce

**Effect solves this** by making errors explicit in the type system.

---

## Core Concept: The `Effect<A, E, R>` Type

The heart of Effect-TS is a single type: `Effect<A, E, R>`

Think of it as a **description of a computation** that:

- **A** (Success) – The type returned when successful
- **E** (Error) – The type of errors that can occur
- **R** (Requirements) – Dependencies/services needed to run

```
Effect<A, E, R>
        ↑  ↑  ↑
        │  │  └── Requirements (what services this needs)
        │  └───── Error (what can go wrong)
        └──────── Success (what you get when it works)
```

### Key Insight: Effects are Descriptions, Not Executions

```typescript
// This does NOT run yet - it's just a description
const myEffect = Effect.succeed(42);

// To actually run it:
const result = Effect.runSync(myEffect); // Now it runs!
```

This separation is powerful. You can compose, transform, and combine effects before running them.

---

## Creating Effects

### `Effect.succeed` – For Values That Always Work

When an operation cannot fail, wrap it with `Effect.succeed`:

```typescript
import { Effect } from "effect";

function add(a: number, b: number): Effect.Effect<number, never, never> {
  return Effect.succeed(a + b);
}
```

**Type breakdown:**

- `number` – Success type (the sum)
- `never` – This effect cannot fail
- `never` – This effect needs no dependencies

The `never` type in TypeScript means "this is impossible" – the effect can **never** produce an error.

### `Effect.fail` – For Errors

When something goes wrong, use `Effect.fail`:

```typescript
function divide(a: number, b: number): Effect.Effect<number, string, never> {
  if (b === 0) {
    return Effect.fail("Cannot divide by zero");
  }
  return Effect.succeed(a / b);
}
```

**Type breakdown:**

- `number` – Success type (the quotient)
- `string` – Error type (error message)
- `never` – No dependencies

Now the **type signature tells the truth**: this function might fail with a string error.

---

## Running Effects

Effects are lazy – you must explicitly run them:

### `Effect.runSync` – Synchronous Execution

```typescript
const result = Effect.runSync(add(2, 3));
console.log(result); // 5
```

⚠️ **Warning**: If the effect can fail and you use `runSync`, it will throw!

```typescript
// This throws if b is 0
const result = Effect.runSync(divide(6, 0)); // 💥 throws
```

### `Effect.runPromise` – Async/Promise Execution

```typescript
Effect.runPromise(divide(10, 2))
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
```

---

## Typed Errors with `Data.TaggedError`

Using plain strings for errors works, but Effect provides a better way: **tagged errors**.

### What is a Tagged Error?

A tagged error is a class that:

1. Extends `Error` (so you get stack traces)
2. Has a `_tag` property for discrimination
3. Can carry additional data about the error
4. Works with TypeScript's type system

### Creating Tagged Errors

```typescript
import { Data } from "effect";

class ErrorDivideByZero extends Data.TaggedError("ErrorDivideByZero")<{
  dividend: number;
  divisor: number;
}> {}
```

**Syntax breakdown:**

- `Data.TaggedError("ErrorDivideByZero")` – The string becomes the `_tag` value
- `<{ dividend: number; divisor: number }>` – Additional fields on the error

### Using Tagged Errors

```typescript
function divideWithCustomError(
  a: number,
  b: number
): Effect.Effect<number, ErrorDivideByZero, never> {
  if (b === 0) {
    return Effect.fail(new ErrorDivideByZero({ dividend: a, divisor: b }));
  }
  return Effect.succeed(a / b);
}
```

Now the type signature says **exactly** what error can occur.

---

## Handling Errors

### `Effect.catch` – Handle Any Error

`Effect.catch` catches any error and lets you recover:

```typescript
const safeDivide = divideWithCustomError(6, 0).pipe(
  Effect.catch((error) => {
    console.log(`Caught: ${error._tag}`);
    console.log(`Tried: ${error.dividend} / ${error.divisor}`);
    return Effect.succeed(0); // Recover with default value
  })
);

const result = Effect.runSync(safeDivide); // 0 (no throw!)
```

**Key points:**

- The handler receives the error with full type information
- You must return an Effect (recover or re-fail)
- After `Effect.catch`, the error type becomes `never` (if you recovered)

### `Effect.catchTag` – Handle Specific Errors

When you have multiple error types, handle them individually:

```typescript
class ErrorNegativeNumber extends Data.TaggedError("ErrorNegativeNumber")<{
  value: number;
}> {}

const result = someEffect.pipe(
  Effect.catchTag("ErrorDivideByZero", (error) => {
    // Only handles ErrorDivideByZero
    return Effect.succeed(-1);
  }),
  Effect.catchTag("ErrorNegativeNumber", (error) => {
    // Only handles ErrorNegativeNumber
    return Effect.succeed(0);
  })
);
```

**Why is this better than try/catch?**

- TypeScript knows exactly which errors you're handling
- The compiler ensures you handle (or propagate) all error types
- No need to check `instanceof` – the tag does it for you

---

## The Pipe Pattern

Effect uses **pipe** for chaining operations:

```typescript
// Instead of nested calls:
// Effect.catch(Effect.map(divide(10, 2), x => x * 2), handleError)

// Use pipe:
divide(10, 2).pipe(
  Effect.map((x) => x * 2),
  Effect.catch(handleError)
);
```

This reads top-to-bottom, left-to-right – much cleaner!

---

## Composing Effects with `flatMap`

When one operation depends on another's result:

```typescript
// Two effects that might fail differently
function divide(a: number, b: number): Effect.Effect<number, ErrorDivideByZero, never> { ... }
function sqrt(n: number): Effect.Effect<number, ErrorNegativeNumber, never> { ... }

// Compose them: divide, then take square root
const combined = divide(16, 2).pipe(
  Effect.flatMap(result => sqrt(result))
);

// Type: Effect<number, ErrorDivideByZero | ErrorNegativeNumber, never>
```

**Important:** The error type automatically becomes a **union** of both error types!

---

## Summary: The Effect Mental Model

| Concept        | Traditional TS        | Effect-TS                           |
| -------------- | --------------------- | ----------------------------------- |
| Success value  | Return type           | `A` in `Effect<A, E, R>`            |
| Errors         | Hidden (throws)       | Explicit `E` in `Effect<A, E, R>`   |
| Error handling | try/catch             | `Effect.catch`, `catchTag`              |
| Custom errors  | `class extends Error` | `Data.TaggedError`                  |
| Composition    | Nested calls          | `.pipe()` chain                     |
| Execution      | Immediate             | Lazy (needs `runSync`/`runPromise`) |

---

## Key Takeaways Before the Code

1. **`Effect<A, E, R>`** is the core type – success, error, and requirements
2. **Effects are descriptions** – they don't run until you tell them to
3. **`Effect.succeed(value)`** – wrap successful values
4. **`Effect.fail(error)`** – create failed effects
5. **`Data.TaggedError`** – the idiomatic way to create typed errors
6. **`Effect.catch`** – handle any error
7. **`Effect.catchTag`** – handle specific tagged errors
8. **`.pipe()`** – chain operations cleanly
9. **`Effect.runSync`** / **`Effect.runPromise`** – actually execute effects

---

## What's Next?

Now you're ready to:

1. **Study** `1-example.effect.ts` – See these concepts in action
2. **Practice** `1-example.problem.ts` – Reinforce with exercises

The exercises will have you create effects, handle errors, and compose operations. You now have the mental model to understand what's happening!

---

## Quick Reference

```typescript
import { Effect, Data } from "effect";

// Creating effects
Effect.succeed(value); // Always succeeds
Effect.fail(error); // Always fails
Effect.sync(() => computation); // Wrap sync computation

// Running effects
Effect.runSync(effect); // Run synchronously (throws on error)
Effect.runPromise(effect); // Run as Promise

// Custom errors
class MyError extends Data.TaggedError("MyError")<{
  field: Type;
}> {}

// Error handling
effect.pipe(
  Effect.catch((error) => Effect.succeed(defaultValue)),
  Effect.catchTag("SpecificError", (error) => Effect.succeed(fallback))
);

// Composition
effect.pipe(
  Effect.map((value) => transform(value)), // Transform success
  Effect.flatMap((value) => anotherEffect(value)) // Chain effects
);
```

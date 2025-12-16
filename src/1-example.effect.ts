/**
 * 1-example.effect.ts
 *
 * This file demonstrates how to implement basic arithmetic operations using Effect.
 * It covers the fundamental concepts needed to understand Effect:
 *
 * 1. Effect<A, E, R> - The core type representing a computation that:
 *    - A = Success type (the value returned on success)
 *    - E = Error type (the error returned on failure)
 *    - R = Requirements/Dependencies (services needed to run)
 *
 * 2. Creating Effects:
 *    - Effect.succeed(value) - Creates an effect that succeeds with a value
 *    - Effect.fail(error) - Creates an effect that fails with an error
 *    - Effect.sync(() => value) - Creates an effect from a synchronous computation
 *
 * 3. Running Effects:
 *    - Effect.runSync(effect) - Runs an effect synchronously (throws on failure)
 *    - Effect.runPromise(effect) - Runs an effect and returns a Promise
 *
 * 4. Error Handling:
 *    - Typed errors - Effect tracks error types at compile time
 *    - Custom error classes - Define domain-specific errors
 *    - Effect.catchAll - Handle all errors
 *    - Effect.catchTag - Handle specific tagged errors
 */

import { Effect } from "effect";

// =============================================================================
// PART 1: Basic Operations with Effect.succeed
// =============================================================================

/**
 * Effect.succeed creates an effect that immediately succeeds with the given value.
 *
 * Type signature: Effect.succeed<A>(value: A): Effect<A, never, never>
 * - A = the type of the success value
 * - never for Error means this effect cannot fail
 * - never for Requirements means this effect needs no dependencies
 *
 * In the original code, `add` was a pure function that always succeeds.
 * We wrap it in Effect.succeed to lift it into the Effect world.
 */
function add(a: number, b: number): Effect.Effect<number, never, never> {
  // Effect.succeed wraps a pure value in an Effect
  // The computation is lazy - nothing happens until we run it
  return Effect.succeed(a + b);
}

// Using the Effect version of add
// Effect.runSync executes the effect synchronously and returns the result
// If the effect could fail, runSync would throw an exception
const sum = Effect.runSync(add(1, 2));
console.log("Sum:", sum); // Output: Sum: 3

/**
 * subtract - Another operation that always succeeds
 */
function subtract(a: number, b: number): Effect.Effect<number, never, never> {
  return Effect.succeed(a - b);
}

const difference = Effect.runSync(subtract(5, 2));
console.log("Difference:", difference); // Output: Difference: 3

/**
 * multiply - Another operation that always succeeds
 */
function multiply(a: number, b: number): Effect.Effect<number, never, never> {
  return Effect.succeed(a * b);
}

const product = Effect.runSync(multiply(3, 4));
console.log("Product:", product); // Output: Product: 12

// =============================================================================
// PART 2: Operations That Can Fail with Effect.fail
// =============================================================================

/**
 * Effect.fail creates an effect that immediately fails with the given error.
 *
 * Type signature: Effect.fail<E>(error: E): Effect<never, E, never>
 * - never for Success means this effect never succeeds
 * - E = the type of the error
 *
 * When a function can fail, we use a conditional to return either
 * Effect.fail (for error case) or Effect.succeed (for success case).
 *
 * The return type becomes: Effect<number, string, never>
 * - number = success type (the division result)
 * - string = error type (the error message)
 */
function divide(a: number, b: number): Effect.Effect<number, string, never> {
  // Check for division by zero
  if (b === 0) {
    // Effect.fail creates an effect that fails with the given error
    // The error type here is 'string'
    return Effect.fail("Cannot divide by zero");
  }

  // Effect.succeed creates an effect that succeeds with the division result
  return Effect.succeed(a / b);
}

// For operations that can fail, we have multiple ways to run them:

// Option 1: Effect.runSync - This will throw if the effect fails
// Only use this when you know the effect will succeed
const quotient = Effect.runSync(divide(6, 3));
console.log("Quotient:", quotient); // Output: Quotient: 2

// Option 2: Effect.runPromise - Returns a Promise, rejects on failure
// This is useful for async contexts
Effect.runPromise(divide(10, 2))
  .then((result) => console.log("Async quotient:", result))
  .catch((error) => console.error("Error:", error));

// =============================================================================
// PART 3: Custom Error Types with Tagged Errors
// =============================================================================

/**
 * In Effect, we use tagged errors (discriminated unions) for type-safe error handling.
 *
 * A tagged error has a `_tag` property that uniquely identifies the error type.
 * This allows Effect to:
 * 1. Track all possible error types at compile time
 * 2. Use `Effect.catchTag` to handle specific errors
 * 3. Provide exhaustive error handling
 *
 * Convention: Name your error classes with "Error" prefix or suffix
 * and use the class name as the _tag value.
 */

/**
 * ErrorDivideByZero - A custom tagged error for division by zero
 *
 * The `readonly _tag` property is required for Effect's error handling.
 * It acts as a discriminator for TypeScript's type narrowing.
 */
class ErrorDivideByZero {
  // The _tag property uniquely identifies this error type
  // 'readonly' ensures it can't be changed, which helps TypeScript narrow types
  readonly _tag = "ErrorDivideByZero";

  // You can add additional properties to provide context about the error
  readonly message = "Cannot divide by zero";

  // Optional: store the values that caused the error for debugging
  constructor(
    readonly dividend: number,
    readonly divisor: number,
  ) {}
}

/**
 * divideWithCustomError - Division using a custom typed error
 *
 * Return type: Effect<number, ErrorDivideByZero, never>
 * - number = success type
 * - ErrorDivideByZero = the specific error type (not just string)
 *
 * This is more type-safe than using string errors because:
 * 1. TypeScript knows exactly what errors can occur
 * 2. You can handle specific errors with Effect.catchTag
 * 3. The compiler ensures you handle all error cases
 */
function divideWithCustomError(
  a: number,
  b: number,
): Effect.Effect<number, ErrorDivideByZero, never> {
  if (b === 0) {
    // Create and fail with our custom error, including context
    return Effect.fail(new ErrorDivideByZero(a, b));
  }

  return Effect.succeed(a / b);
}

// =============================================================================
// PART 4: Error Handling with Effect
// =============================================================================

/**
 * Effect.catchAll - Handle any error and recover with a new Effect
 *
 * Type signature:
 * catchAll<A, E, R, A2, E2, R2>(
 *   self: Effect<A, E, R>,
 *   handler: (e: E) => Effect<A2, E2, R2>
 * ): Effect<A | A2, E2, R | R2>
 *
 * This is similar to try/catch, but:
 * 1. It's type-safe - you know exactly what errors you're handling
 * 2. It's composable - the handler returns an Effect, not void
 * 3. You can recover with a different value or re-fail with a different error
 */

// Example: Handling division by zero and recovering with a default value
const safeDivide = divideWithCustomError(6, 0).pipe(
  // catchAll receives the error and must return an Effect
  Effect.catchAll((error) => {
    console.log(`Caught error: ${error._tag} - ${error.message}`);
    console.log(`Attempted: ${error.dividend} / ${error.divisor}`);
    // Recover by returning a default value
    return Effect.succeed(0);
  }),
);

// Now this won't throw because we handled the error
const safeResult = Effect.runSync(safeDivide);
console.log("Safe result:", safeResult); // Output: Safe result: 0

/**
 * Effect.catchTag - Handle a specific tagged error
 *
 * This is more precise than catchAll - it only handles errors with the specified tag.
 * Other errors pass through unchanged.
 *
 * This is useful when you have multiple error types and want to handle them differently.
 */
const handleSpecificError = divideWithCustomError(10, 0).pipe(
  // Only handle ErrorDivideByZero, other errors would pass through
  Effect.catchTag("ErrorDivideByZero", (error) => {
    console.log(`Specific handler for: ${error._tag}`);
    return Effect.succeed(-1); // Return -1 as a sentinel value
  }),
);

const specificResult = Effect.runSync(handleSpecificError);
console.log("Specific error result:", specificResult); // Output: Specific error result: -1

// =============================================================================
// PART 5: Successful Division (No Error)
// =============================================================================

// When division succeeds, it works just like before
const validDivision = divideWithCustomError(12, 4);
const validResult = Effect.runSync(validDivision);
console.log("Valid division:", validResult); // Output: Valid division: 3

// =============================================================================
// SUMMARY OF CONCEPTS COVERED
// =============================================================================

/**
 * Key takeaways from this example:
 *
 * 1. Effect<A, E, R> is the core type:
 *    - A = Success value type
 *    - E = Error type (use `never` if it can't fail)
 *    - R = Requirements/Dependencies (use `never` if none needed)
 *
 * 2. Creating Effects:
 *    - Effect.succeed(value) - Wrap a successful value
 *    - Effect.fail(error) - Create a failed effect
 *    - Use conditionals to choose between succeed/fail
 *
 * 3. Running Effects:
 *    - Effect.runSync(effect) - Run synchronously (throws on failure)
 *    - Effect.runPromise(effect) - Run as Promise (rejects on failure)
 *
 * 4. Error Handling:
 *    - Use tagged errors (classes with _tag property) for type safety
 *    - Effect.catchAll - Handle any error
 *    - Effect.catchTag - Handle specific errors by tag
 *
 * 5. Benefits over try/catch:
 *    - Errors are tracked in the type system
 *    - Compiler ensures error handling
 *    - Composable error recovery
 *    - Clear function signatures showing what can fail
 */

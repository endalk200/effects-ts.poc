/**
 * 1-example.problem.ts
 *
 * 20 Exercises covering the concepts from 1-example.effect.ts
 *
 * Topics covered:
 * - Effect.succeed
 * - Effect.fail
 * - Effect<A, E, R> type signatures
 * - Effect.runSync
 * - Effect.runPromise
 * - Data.TaggedError - Effect's idiomatic way to create typed errors
 * - Effect.catch
 * - Effect.catchTag
 *
 * Instructions:
 * 1. Copy this file to 1-example.solution.ts
 * 2. Implement each TODO
 * 3. Run the file to verify your solutions
 * 4. Each exercise has a test that will print PASS or FAIL
 *
 * Run with: bun run src/1-example.solution.ts
 */

import { Effect, Data } from "effect";

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

function testAsync(name: string, fn: () => Promise<boolean>): Promise<void> {
  return fn()
    .then((result) => {
      if (result) {
        console.log(`✓ PASS: ${name}`);
        passCount++;
      } else {
        console.log(`✗ FAIL: ${name}`);
        failCount++;
      }
    })
    .catch((e) => {
      console.log(`✗ FAIL: ${name} - Error: ${e}`);
      failCount++;
    });
}

function printSummary(): void {
  console.log("\n========================================");
  console.log(`RESULTS: ${passCount} passed, ${failCount} failed`);
  console.log("========================================\n");
}

// =============================================================================
// EXERCISE 1: Create a successful effect
// =============================================================================
/**
 * Create an effect that succeeds with the number 42
 *
 * Hint: Use Effect.succeed()
 */
function exercise1(): Effect.Effect<number, never, never> {
  // TODO: Return an effect that succeeds with 42
  throw new Error("Not implemented");
}

test("Exercise 1: Effect.succeed with number", () => {
  const result = Effect.runSync(exercise1());
  return result === 42;
});

// =============================================================================
// EXERCISE 2: Create a successful effect with a string
// =============================================================================
/**
 * Create an effect that succeeds with the string "Hello, Effect!"
 */
function exercise2(): Effect.Effect<string, never, never> {
  // TODO: Return an effect that succeeds with "Hello, Effect!"
  throw new Error("Not implemented");
}

test("Exercise 2: Effect.succeed with string", () => {
  const result = Effect.runSync(exercise2());
  return result === "Hello, Effect!";
});

// =============================================================================
// EXERCISE 3: Create a failing effect
// =============================================================================
/**
 * Create an effect that fails with the string "Something went wrong"
 *
 * Hint: Use Effect.fail()
 */
function exercise3(): Effect.Effect<never, string, never> {
  // TODO: Return an effect that fails with "Something went wrong"
  throw new Error("Not implemented");
}

test("Exercise 3: Effect.fail with string", () => {
  try {
    Effect.runSync(exercise3());
    return false; // Should not reach here
  } catch (e: any) {
    // In Effect v4, runSync throws the typed failure value directly.
    return e === "Something went wrong";
  }
});

// =============================================================================
// EXERCISE 4: Implement a pure addition function with Effect
// =============================================================================
/**
 * Implement an addition function that returns an Effect
 * The function should always succeed with the sum of a and b
 */
function exercise4(a: number, b: number): Effect.Effect<number, never, never> {
  // TODO: Return an effect that succeeds with a + b
  throw new Error("Not implemented");
}

test("Exercise 4: Addition with Effect.succeed", () => {
  const result = Effect.runSync(exercise4(10, 5));
  return result === 15;
});

// =============================================================================
// EXERCISE 5: Implement a modulo function with Effect
// =============================================================================
/**
 * Implement a modulo function (a % b) that:
 * - Fails with "Cannot modulo by zero" if b is 0
 * - Succeeds with a % b otherwise
 */
function exercise5(a: number, b: number): Effect.Effect<number, string, never> {
  // TODO: Implement modulo with error handling
  throw new Error("Not implemented");
}

test("Exercise 5a: Modulo success", () => {
  const result = Effect.runSync(exercise5(10, 3));
  return result === 1;
});

test("Exercise 5b: Modulo by zero fails", () => {
  try {
    Effect.runSync(exercise5(10, 0));
    return false;
  } catch (e: any) {
    return e === "Cannot modulo by zero";
  }
});

// =============================================================================
// EXERCISE 6: Implement a square root function
// =============================================================================
/**
 * Implement a square root function that:
 * - Fails with "Cannot take square root of negative number" if n < 0
 * - Succeeds with Math.sqrt(n) otherwise
 */
function exercise6(n: number): Effect.Effect<number, string, never> {
  // TODO: Implement square root with error handling
  throw new Error("Not implemented");
}

test("Exercise 6a: Square root success", () => {
  const result = Effect.runSync(exercise6(16));
  return result === 4;
});

test("Exercise 6b: Square root of negative fails", () => {
  try {
    Effect.runSync(exercise6(-4));
    return false;
  } catch (e: any) {
    return e === "Cannot take square root of negative number";
  }
});

// =============================================================================
// EXERCISE 7: Understand Data.TaggedError
// =============================================================================
/**
 * STUDY THIS EXAMPLE - Then create your own in Exercise 8
 *
 * Data.TaggedError is Effect's idiomatic way to create typed errors.
 *
 * Syntax:
 *   class MyError extends Data.TaggedError("MyError")<{ field1: Type1 }> {}
 *
 * Benefits:
 * - Automatically adds _tag property (set to the string you provide)
 * - Extends Error, so it has stack traces
 * - Provides structural equality
 * - Works seamlessly with Effect.catchTag
 *
 * This error class is provided because it's used by later exercises.
 */
class ErrorNegativeNumber extends Data.TaggedError("ErrorNegativeNumber")<{
  value: number;
}> {}

// This test verifies you understand the structure of Data.TaggedError
test("Exercise 7: Understand Data.TaggedError structure", () => {
  const error = new ErrorNegativeNumber({ value: -5 });
  // Verify: Does the error have the correct _tag?
  const hasCorrectTag = error._tag === "ErrorNegativeNumber";
  // Verify: Does the error store the value?
  const hasCorrectValue = error.value === -5;
  // Verify: Is it an instance of Error?
  const isError = error instanceof Error;
  return hasCorrectTag && hasCorrectValue && isError;
});

// =============================================================================
// EXERCISE 8: Create a Data.TaggedError for empty string
// =============================================================================
/**
 * Create a tagged error class called ErrorEmptyString using Data.TaggedError
 *
 * Syntax: class ErrorEmptyString extends Data.TaggedError("ErrorEmptyString")<{}> {}
 *
 * This error has no additional fields (empty object {} in the type parameter)
 */

// TODO: Replace this placeholder with:
// class ErrorEmptyString extends Data.TaggedError("ErrorEmptyString")<{}> {}
class ErrorEmptyString extends Data.TaggedError("TODO_REPLACE_THIS_TAG")<{}> {}

test("Exercise 8: Create Data.TaggedError for empty string", () => {
  const error = new ErrorEmptyString();
  return (
    (error as { _tag: string })._tag === "ErrorEmptyString" &&
    error instanceof Error
  );
});

// =============================================================================
// EXERCISE 9: Use a tagged error in a function
// =============================================================================
/**
 * Implement a function that checks if a number is non-negative:
 * - If the number is negative, fail with ErrorNegativeNumber
 * - Otherwise succeed with the number
 *
 * Remember: Data.TaggedError uses object syntax in constructor:
 *   new ErrorNegativeNumber({ value: n })
 */
function exercise9(
  n: number
): Effect.Effect<number, ErrorNegativeNumber, never> {
  // TODO: If n < 0, return Effect.fail(new ErrorNegativeNumber({ value: n }))
  // TODO: Otherwise, return Effect.succeed(n)
  throw new Error("Not implemented");
}

test("Exercise 9a: Positive number succeeds", () => {
  const result = Effect.runSync(exercise9(5));
  return result === 5;
});

test("Exercise 9b: Zero succeeds", () => {
  const result = Effect.runSync(exercise9(0));
  return result === 0;
});

test("Exercise 9c: Negative number fails with tagged error", () => {
  try {
    Effect.runSync(exercise9(-3));
    return false;
  } catch (e: any) {
    return e._tag === "ErrorNegativeNumber" && e.value === -3;
  }
});

// =============================================================================
// EXERCISE 10: Use Effect.catch to handle errors
// =============================================================================
/**
 * Given a function that might fail, use Effect.catch to:
 * - Return 0 if the effect fails
 * - Return the success value otherwise
 *
 * Note: You must first complete Exercise 6 for this to work correctly!
 */
function exercise10(n: number): Effect.Effect<number, never, never> {
  // This effect fails for negative numbers (uses exercise6 - square root)
  const riskyEffect = exercise6(n);

  // TODO: Use riskyEffect.pipe(Effect.catch(...)) to handle the error
  // The Effect.catch handler should return Effect.succeed(0)
  throw new Error("Not implemented");
}

test("Exercise 10a: Effect.catch with success", () => {
  const result = Effect.runSync(exercise10(9));
  return result === 3;
});

test("Exercise 10b: Effect.catch handles error", () => {
  const result = Effect.runSync(exercise10(-9));
  return result === 0;
});

// =============================================================================
// EXERCISE 11: Use Effect.catchTag to handle specific errors
// =============================================================================
/**
 * Implement a function that:
 * - Uses exercise9 to check if a number is non-negative
 * - Use catchTag to catch only "ErrorNegativeNumber" and return -1
 *
 * Syntax: effect.pipe(Effect.catchTag("TagName", (error) => Effect.succeed(value)))
 */
function exercise11(n: number): Effect.Effect<number, never, never> {
  // TODO: Use exercise9(n).pipe(Effect.catchTag("ErrorNegativeNumber", ...))
  // The handler should return Effect.succeed(-1)
  throw new Error("Not implemented");
}

test("Exercise 11a: catchTag with success", () => {
  const result = Effect.runSync(exercise11(10));
  return result === 10;
});

test("Exercise 11b: catchTag catches specific error", () => {
  const result = Effect.runSync(exercise11(-10));
  return result === -1;
});

// =============================================================================
// EXERCISE 12: Implement power function
// =============================================================================
/**
 * Implement a power function (base^exponent) that always succeeds
 * Use Math.pow(base, exponent)
 */
function exercise12(
  base: number,
  exponent: number
): Effect.Effect<number, never, never> {
  // TODO: Return an effect that succeeds with Math.pow(base, exponent)
  throw new Error("Not implemented");
}

test("Exercise 12: Power function", () => {
  const result = Effect.runSync(exercise12(2, 3));
  return result === 8;
});

// =============================================================================
// EXERCISE 13: Implement integer division
// =============================================================================
/**
 * Implement integer division (Math.floor(a / b)) that:
 * - Fails with "Division by zero" if b is 0
 * - Succeeds with the floored division result otherwise
 */
function exercise13(
  a: number,
  b: number
): Effect.Effect<number, string, never> {
  // TODO: Implement integer division with error handling
  throw new Error("Not implemented");
}

test("Exercise 13a: Integer division success", () => {
  const result = Effect.runSync(exercise13(7, 2));
  return result === 3;
});

test("Exercise 13b: Integer division by zero fails", () => {
  try {
    Effect.runSync(exercise13(7, 0));
    return false;
  } catch (e: any) {
    return e === "Division by zero";
  }
});

// =============================================================================
// EXERCISE 14: Create a Data.TaggedError for division by zero
// =============================================================================
/**
 * Create a tagged error class called ErrorDivisionByZero using Data.TaggedError
 *
 * It should have:
 * - _tag = "ErrorDivisionByZero" (automatic from Data.TaggedError)
 * - dividend: number (the number we tried to divide)
 */

// TODO: Replace this placeholder with:
// class ErrorDivisionByZero extends Data.TaggedError("ErrorDivisionByZero")<{
//   dividend: number;
// }> {}
class ErrorDivisionByZero extends Data.TaggedError("TODO_REPLACE_THIS_TAG")<{
  dividend: number;
}> {}

test("Exercise 14: ErrorDivisionByZero class", () => {
  const error = new ErrorDivisionByZero({ dividend: 10 });
  return (
    (error as { _tag: string })._tag === "ErrorDivisionByZero" &&
    error.dividend === 10 &&
    error instanceof Error
  );
});

// =============================================================================
// EXERCISE 15: Use typed error in division
// =============================================================================
/**
 * Re-implement division using the ErrorDivisionByZero type
 * - If b is 0, fail with ErrorDivisionByZero (passing a as dividend)
 * - Otherwise succeed with a / b
 *
 * Note: You must first complete Exercise 14 for this to work correctly!
 */
function exercise15(
  a: number,
  b: number
): Effect.Effect<number, ErrorDivisionByZero, never> {
  // TODO: Implement division with ErrorDivisionByZero
  // Use: new ErrorDivisionByZero({ dividend: a })
  throw new Error("Not implemented");
}

test("Exercise 15a: Typed division success", () => {
  const result = Effect.runSync(exercise15(10, 2));
  return result === 5;
});

test("Exercise 15b: Typed division fails with correct error", () => {
  try {
    Effect.runSync(exercise15(10, 0));
    return false;
  } catch (e: any) {
    return e._tag === "ErrorDivisionByZero" && e.dividend === 10;
  }
});

// =============================================================================
// EXERCISE 16: Handle typed error with Effect.catch
// =============================================================================
/**
 * Use exercise15 and Effect.catch to return Infinity when division by zero occurs
 *
 * Note: You must first complete Exercise 14 and 15 for this to work correctly!
 */
function exercise16(a: number, b: number): Effect.Effect<number, never, never> {
  // TODO: Use exercise15(a, b).pipe(Effect.catch(...))
  // Return Effect.succeed(Infinity) in the error handler
  throw new Error("Not implemented");
}

test("Exercise 16a: Handles success", () => {
  const result = Effect.runSync(exercise16(10, 2));
  return result === 5;
});

test("Exercise 16b: Returns Infinity on error", () => {
  const result = Effect.runSync(exercise16(10, 0));
  return result === Infinity;
});

// =============================================================================
// EXERCISE 17: Use Effect.runPromise
// =============================================================================
/**
 * Use Effect.runPromise to run an effect and verify the result
 * This test is async
 */
async function exercise17(): Promise<number> {
  const effect = Effect.succeed(100);
  // TODO: Use Effect.runPromise(effect) to run and return the result
  throw new Error("Not implemented");
}

await testAsync("Exercise 17: Effect.runPromise", async () => {
  const result = await exercise17();
  return result === 100;
});

// =============================================================================
// EXERCISE 18: Multiple operations with succeed
// =============================================================================
/**
 * Implement a function that calculates (a + b) * c using Effect.succeed
 * All operations always succeed
 */
function exercise18(
  a: number,
  b: number,
  c: number
): Effect.Effect<number, never, never> {
  // TODO: Return an effect that succeeds with (a + b) * c
  throw new Error("Not implemented");
}

test("Exercise 18: Combined arithmetic", () => {
  const result = Effect.runSync(exercise18(2, 3, 4));
  return result === 20; // (2 + 3) * 4 = 20
});

// =============================================================================
// EXERCISE 19: Effect.catch with error recovery
// =============================================================================
/**
 * Use Effect.catch to handle errors and return a default value
 * - Use the modulo function from exercise 5
 * - Return -999 when an error occurs
 *
 * Note: You must first complete Exercise 5 for this to work correctly!
 */
function exercise19(a: number, b: number): Effect.Effect<number, never, never> {
  // TODO: Use exercise5(a, b).pipe(Effect.catch(...))
  // Return Effect.succeed(-999) in the error handler
  throw new Error("Not implemented");
}

test("Exercise 19a: Success case", () => {
  const result = Effect.runSync(exercise19(10, 3));
  return result === 1;
});

test("Exercise 19b: Error case returns default", () => {
  const result = Effect.runSync(exercise19(10, 0));
  return result === -999;
});

// =============================================================================
// EXERCISE 20: Implement a safe calculator operation
// =============================================================================
/**
 * Create a tagged error class ErrorInvalidOperation and implement a calculator
 *
 * ErrorInvalidOperation should have:
 * - _tag = "ErrorInvalidOperation"
 * - operation: string (the invalid operation that was attempted)
 *
 * calculator should:
 * - Support operations: "add", "subtract", "multiply", "divide"
 * - Return ErrorInvalidOperation for unknown operations
 * - Return ErrorDivisionByZero (from exercise 14) for divide by zero
 * - Return the result for valid operations
 *
 * Note: You must first complete Exercise 14 for this to work correctly!
 */

// TODO: Replace this placeholder with:
// class ErrorInvalidOperation extends Data.TaggedError("ErrorInvalidOperation")<{
//   operation: string;
// }> {}
class ErrorInvalidOperation extends Data.TaggedError("TODO_REPLACE_THIS_TAG")<{
  operation: string;
}> {}

function calculator(
  a: number,
  b: number,
  operation: string
): Effect.Effect<number, ErrorInvalidOperation | ErrorDivisionByZero, never> {
  // TODO: Implement the calculator using a switch or if/else:
  // - "add" -> Effect.succeed(a + b)
  // - "subtract" -> Effect.succeed(a - b)
  // - "multiply" -> Effect.succeed(a * b)
  // - "divide" -> if b is 0, Effect.fail(new ErrorDivisionByZero({ dividend: a }))
  //               else Effect.succeed(a / b)
  // - anything else -> Effect.fail(new ErrorInvalidOperation({ operation }))
  throw new Error("Not implemented");
}

test("Exercise 20a: Calculator add", () => {
  const result = Effect.runSync(calculator(5, 3, "add"));
  return result === 8;
});

test("Exercise 20b: Calculator subtract", () => {
  const result = Effect.runSync(calculator(5, 3, "subtract"));
  return result === 2;
});

test("Exercise 20c: Calculator multiply", () => {
  const result = Effect.runSync(calculator(5, 3, "multiply"));
  return result === 15;
});

test("Exercise 20d: Calculator divide", () => {
  const result = Effect.runSync(calculator(6, 2, "divide"));
  return result === 3;
});

test("Exercise 20e: Calculator divide by zero", () => {
  try {
    Effect.runSync(calculator(6, 0, "divide"));
    return false;
  } catch (e: any) {
    return e._tag === "ErrorDivisionByZero";
  }
});

test("Exercise 20f: Calculator invalid operation", () => {
  try {
    Effect.runSync(calculator(6, 2, "power"));
    return false;
  } catch (e: any) {
    return e._tag === "ErrorInvalidOperation" && e.operation === "power";
  }
});

// =============================================================================
// PRINT SUMMARY
// =============================================================================

printSummary();

# Effect-TS POC

A proof-of-concept project for experimenting with the [Effect](https://effect.website/) library in TypeScript.

## Goal

This project serves as a playground to explore and learn the Effect library - a powerful TypeScript library for building type-safe, composable, and concurrent applications with first-class support for error handling, dependency injection, and resource management.

## Prerequisites

- [Devbox](https://www.jetpack.io/devbox/) installed

## Setup

```bash
# Enter devbox shell (installs bun automatically)
devbox shell

# Install dependencies
bun install
```

## Running

```bash
# Run the application
bun run start

# Run in watch mode (auto-reload on changes)
bun run dev
```

## Project Structure

The `src/` directory contains progressive learning examples:

```
src/
├── 1-example.ts          # Traditional TS: Basic arithmetic operations
├── 1-example.md          # 📖 Learn: Effect fundamentals
├── 1-example.effect.ts   # Effect version of 1-example
├── 1-example.problem.ts  # Practice exercises
├── 1-example.solution.ts # Your solutions go here
│
├── 2-example.ts          # Traditional TS: Async operations (fetch, Promise.all)
├── 2-example.md          # 📖 Learn: Async patterns with Effect
├── 2-example.effect.ts   # Effect version of 2-example
├── 2-example.problem.ts  # Practice exercises
│
├── 3-example.ts          # Traditional TS: Dependency injection patterns
├── 3-example.md          # 📖 Learn: Services and Layers
├── 3-example.effect.ts   # Effect version of 3-example
└── 3-example.problem.ts  # Practice exercises
```

## Learning Path

For each example (1, 2, 3), follow this sequence:

| Step | File                   | Purpose                                    |
| ---- | ---------------------- | ------------------------------------------ |
| 1    | `X-example.ts`         | Understand the traditional TypeScript code |
| 2    | `X-example.md`         | Read the concepts introduction             |
| 3    | `X-example.effect.ts`  | Study the Effect implementation            |
| 4    | `X-example.problem.ts` | Practice with exercises                    |

### Example 1: Effect Fundamentals

- `Effect<A, E, R>` type
- `Effect.succeed` / `Effect.fail`
- `Data.TaggedError`
- `Effect.catch` / `Effect.catchTag`

### Example 2: Async Operations

- `Effect.tryPromise`
- `Effect.sleep`
- `Effect.all` (parallel)
- `Effect.timeout` / `Effect.retry`
- `Effect.result`

### Example 3: Dependency Injection

- `Context.Service`
- `Layer.succeed` / `Layer.effect`
- `Layer.merge` / `Layer.provide`
- Testing with mock layers

## Running Examples

```bash
# Run a specific example
bun run src/1-example.ts
bun run src/1-example.effect.ts

# Run the problem exercises (after implementing solutions)
bun run src/1-example.problem.ts
```

## Exercises

Each `*-problem.ts` file contains 20 exercises with automated tests:

1. Copy the problem file to a solution file (e.g., `1-example.solution.ts`)
2. Implement each `TODO`
3. Run the file to verify your solutions
4. Each exercise prints PASS or FAIL with a summary at the end

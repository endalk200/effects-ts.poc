/**
 * 2-example.ts
 *
 * Async Operations in TypeScript (Traditional Approach)
 *
 * This file demonstrates common async patterns:
 * - Promises and async/await
 * - HTTP requests (fetch)
 * - Delays/timeouts
 * - Parallel execution
 * - Sequential execution
 * - Error handling in async code
 * - Retries
 *
 * These patterns will be converted to Effect in 2-example.effect.ts
 */

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

interface ApiError {
  message: string;
  status: number;
}

// =============================================================================
// 1. BASIC ASYNC FUNCTION - Delay
// =============================================================================
/**
 * Creates a delay for the specified milliseconds
 */
async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Example usage:
async function delayExample(): Promise<string> {
  console.log("Starting delay...");
  await delay(1000);
  console.log("Delay complete!");
  return "Done";
}

// =============================================================================
// 2. HTTP REQUEST - Fetch a single user
// =============================================================================
/**
 * Fetches a user by ID from JSONPlaceholder API
 * Throws an error if the request fails or user not found
 */
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/users/${id}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }

  const user = (await response.json()) as { id?: number; name?: string; email?: string };

  if (!user.id) {
    throw new Error(`User not found: ${id}`);
  }

  return {
    id: user.id,
    name: user.name ?? "",
    email: user.email ?? "",
  };
}

// =============================================================================
// 3. HTTP REQUEST - Fetch a post
// =============================================================================
/**
 * Fetches a post by ID from JSONPlaceholder API
 */
async function fetchPost(id: number): Promise<Post> {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${id}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch post: ${response.status}`);
  }

  const post = (await response.json()) as { id: number; userId: number; title: string; body: string };
  return {
    id: post.id,
    userId: post.userId,
    title: post.title,
    body: post.body,
  };
}

// =============================================================================
// 4. SEQUENTIAL ASYNC - Fetch user then their posts
// =============================================================================
/**
 * Fetches a user and then fetches all their posts
 * Operations happen in sequence (one after another)
 */
async function fetchUserWithPosts(
  userId: number
): Promise<{ user: User; posts: Post[] }> {
  // First fetch the user
  const user = await fetchUser(userId);

  // Then fetch posts for that user
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts?userId=${userId}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.status}`);
  }

  const postsData = (await response.json()) as Array<{ id: number; userId: number; title: string; body: string }>;
  const posts: Post[] = postsData.map((p) => ({
    id: p.id,
    userId: p.userId,
    title: p.title,
    body: p.body,
  }));

  return { user, posts };
}

// =============================================================================
// 5. PARALLEL ASYNC - Fetch multiple users at once
// =============================================================================
/**
 * Fetches multiple users in parallel using Promise.all
 * All requests start at the same time
 */
async function fetchUsersParallel(ids: number[]): Promise<User[]> {
  const promises = ids.map((id) => fetchUser(id));
  return Promise.all(promises);
}

// =============================================================================
// 6. PARALLEL ASYNC - Fetch with partial failure handling
// =============================================================================
/**
 * Fetches multiple users, returning results even if some fail
 * Uses Promise.allSettled to handle partial failures
 */
async function fetchUsersWithPartialFailure(
  ids: number[]
): Promise<{ successful: User[]; failed: number[] }> {
  const promises = ids.map((id) => fetchUser(id));
  const results = await Promise.allSettled(promises);

  const successful: User[] = [];
  const failed: number[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successful.push(result.value);
    } else {
      const id = ids[index];
      if (id !== undefined) {
        failed.push(id);
      }
    }
  });

  return { successful, failed };
}

// =============================================================================
// 7. RACE - First response wins
// =============================================================================
/**
 * Fetches from multiple endpoints, returns the first successful response
 */
async function fetchFirstAvailable(ids: number[]): Promise<User> {
  const promises = ids.map((id) => fetchUser(id));
  return Promise.race(promises);
}

// =============================================================================
// 8. TIMEOUT - Fetch with timeout
// =============================================================================
/**
 * Fetches a user with a timeout
 * Throws if the request takes longer than the specified timeout
 */
async function fetchUserWithTimeout(
  id: number,
  timeoutMs: number
): Promise<User> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), timeoutMs);
  });

  return Promise.race([fetchUser(id), timeoutPromise]);
}

// =============================================================================
// 9. RETRY - Fetch with retries
// =============================================================================
/**
 * Fetches a user with automatic retries on failure
 */
async function fetchUserWithRetry(
  id: number,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<User> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchUser(id);
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt} failed: ${lastError.message}`);

      if (attempt < maxRetries) {
        await delay(delayMs);
      }
    }
  }

  throw new Error(
    `Failed after ${maxRetries} attempts: ${lastError?.message}`
  );
}

// =============================================================================
// 10. ERROR HANDLING - Typed error handling
// =============================================================================
/**
 * Fetches a user with proper error typing
 * Returns either the user or an ApiError
 */
async function fetchUserSafe(
  id: number
): Promise<{ success: true; data: User } | { success: false; error: ApiError }> {
  try {
    const user = await fetchUser(id);
    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: {
        message: (error as Error).message,
        status: 500,
      },
    };
  }
}

// =============================================================================
// 11. CHAINING - Transform async results
// =============================================================================
/**
 * Fetches a user and transforms the result
 */
async function fetchUserDisplayName(id: number): Promise<string> {
  const user = await fetchUser(id);
  return `${user.name} <${user.email}>`;
}

// =============================================================================
// 12. CONDITIONAL ASYNC - Fetch based on condition
// =============================================================================
/**
 * Fetches user details only if the user ID is valid
 */
async function fetchUserIfValid(
  id: number
): Promise<User | null> {
  if (id <= 0) {
    return null;
  }
  return fetchUser(id);
}

// =============================================================================
// DEMO - Run all examples
// =============================================================================
async function runExamples(): Promise<void> {
  console.log("=== 2-example.ts: Async Operations Demo ===\n");

  // Example 1: Basic delay
  console.log("1. Delay example:");
  await delay(500);
  console.log("   Delayed for 500ms\n");

  // Example 2: Fetch single user
  console.log("2. Fetch single user:");
  try {
    const user = await fetchUser(1);
    console.log(`   User: ${user.name} (${user.email})\n`);
  } catch (error) {
    console.log(`   Error: ${(error as Error).message}\n`);
  }

  // Example 3: Fetch post
  console.log("3. Fetch post:");
  try {
    const post = await fetchPost(1);
    console.log(`   Post: ${post.title.substring(0, 50)}...\n`);
  } catch (error) {
    console.log(`   Error: ${(error as Error).message}\n`);
  }

  // Example 4: Sequential fetch
  console.log("4. Sequential fetch (user + posts):");
  try {
    const result = await fetchUserWithPosts(1);
    console.log(`   User: ${result.user.name}, Posts: ${result.posts.length}\n`);
  } catch (error) {
    console.log(`   Error: ${(error as Error).message}\n`);
  }

  // Example 5: Parallel fetch
  console.log("5. Parallel fetch (3 users):");
  try {
    const users = await fetchUsersParallel([1, 2, 3]);
    console.log(`   Fetched ${users.length} users: ${users.map((u) => u.name).join(", ")}\n`);
  } catch (error) {
    console.log(`   Error: ${(error as Error).message}\n`);
  }

  // Example 6: Partial failure handling
  console.log("6. Partial failure handling (valid + invalid IDs):");
  const partialResult = await fetchUsersWithPartialFailure([1, 9999, 2]);
  console.log(`   Successful: ${partialResult.successful.length}, Failed: ${partialResult.failed.length}\n`);

  // Example 7: Fetch with timeout
  console.log("7. Fetch with timeout (5s timeout):");
  try {
    const user = await fetchUserWithTimeout(1, 5000);
    console.log(`   User: ${user.name}\n`);
  } catch (error) {
    console.log(`   Error: ${(error as Error).message}\n`);
  }

  // Example 8: Safe fetch with typed errors
  console.log("8. Safe fetch with typed errors:");
  const safeResult = await fetchUserSafe(1);
  if (safeResult.success) {
    console.log(`   User: ${safeResult.data.name}\n`);
  } else {
    console.log(`   Error: ${safeResult.error.message}\n`);
  }

  // Example 9: Transform result
  console.log("9. Transform result:");
  try {
    const displayName = await fetchUserDisplayName(1);
    console.log(`   Display name: ${displayName}\n`);
  } catch (error) {
    console.log(`   Error: ${(error as Error).message}\n`);
  }

  // Example 10: Conditional fetch
  console.log("10. Conditional fetch:");
  const validUser = await fetchUserIfValid(1);
  const invalidUser = await fetchUserIfValid(-1);
  console.log(`   Valid ID (1): ${validUser?.name ?? "null"}`);
  console.log(`   Invalid ID (-1): ${invalidUser?.name ?? "null"}\n`);

  console.log("=== Demo Complete ===");
}

// Run the demo
runExamples();

// Export for use in other files
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
};

export type { User, Post, ApiError };

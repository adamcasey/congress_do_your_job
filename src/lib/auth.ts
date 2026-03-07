import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Returns the authenticated Clerk user from the current request context.
 * Returns null when Clerk is not configured or the user is not signed in.
 * For use in Server Components and Route Handlers only.
 */
export async function getAuthUser() {
  if (!process.env.CLERK_SECRET_KEY) return null;
  try {
    return await currentUser();
  } catch {
    return null;
  }
}

/**
 * Returns { userId } from the current session.
 * userId is null when Clerk is not configured or the user is not signed in.
 * For use in Server Components and Route Handlers only.
 */
export async function getAuthSession(): Promise<{ userId: string | null }> {
  if (!process.env.CLERK_SECRET_KEY) return { userId: null };
  try {
    const { userId } = await auth();
    return { userId };
  } catch {
    return { userId: null };
  }
}

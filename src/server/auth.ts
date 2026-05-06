import NextAuth from "next-auth";
import { authConfig } from "~/lib/auth";

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session.user as { id: string; email: string; name?: string | null };
}

import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // ignore Next.js internals + static files
    "/((?!_next|.*\\..*).*)",
    // always run for API routes
    "/(api|trpc)(.*)",
  ],
};
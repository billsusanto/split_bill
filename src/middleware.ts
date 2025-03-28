import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define routes that should be public (accessible without authentication)
const isPublicRoute = createRouteMatcher([
  '/', // Landing page
  '/sign-in(.*)', // Sign-in page and any potential sub-routes
  '/sign-up(.*)', // Sign-up page and any potential sub-routes
  '/api/webhook/clerk(.*)', // Clerk webhook route should also be public
]);

// Updated middleware setup to handle public routes
export default clerkMiddleware((auth, req) => {
  // Protect routes that are NOT public
  if (!isPublicRoute(req)) {
    // If the route is not public, protect it using the provided auth object
    auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 
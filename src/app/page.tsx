'use client';

import Link from "next/link";
import { useUser } from '@clerk/nextjs';
// import { useRouter } from 'next/navigation';
// import { useEffect } from "react";

export default function Home() {
  const { isSignedIn } = useUser();
  // const router = useRouter();
  
  // Redirect to dashboard if already signed in
  // useEffect(() => {
  //   if (isLoaded && isSignedIn) {
  //     router.push('/dashboard');
  //   }
  // }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-grow flex items-center justify-center bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Split bills with friends</span>
            <span className="block text-blue-600">without the hassle</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Easily create trips, add expenses, and see who owes what. No more awkward money conversations.
          </p>
          <div className="mt-10 flex justify-center gap-x-6">
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  Sign Up
                </Link>
                <Link
                  href="/sign-in"
                  className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 md:py-4 md:text-lg md:px-10"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
          <p className="mt-2 text-center text-base text-gray-500">
            &copy; {new Date().getFullYear()} Split Bill App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

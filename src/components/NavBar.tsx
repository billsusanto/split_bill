'use client';

import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';

export default function NavBar() {
  const { user, isLoaded } = useUser();

  return (
    <nav className="bg-blue-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-white text-xl font-bold">
                Split Bill
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {isLoaded && user && (
              <div className="ml-3 relative flex items-center space-x-4">
                <span className="text-white">{user.firstName || user.username}</span>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-8 w-8 rounded-full",
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 
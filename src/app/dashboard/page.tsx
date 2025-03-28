'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import NavBar from '@/components/NavBar';
import { getUserTrips, createTrip, joinTrip, createUser, getUserByName, getUserByClerkId } from '@/lib/db/utils';
import Link from 'next/link';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewTripForm, setShowNewTripForm] = useState(false);
  const [showJoinTripForm, setShowJoinTripForm] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [newTripPassword, setNewTripPassword] = useState('');
  const [joinTripId, setJoinTripId] = useState('');
  const [joinTripPassword, setJoinTripPassword] = useState('');
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isJoiningTrip, setIsJoiningTrip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{success: boolean, message: string} | null>(null);
  const [localUserId, setLocalUserId] = useState<number | null>(null);

  // Check database connection
  useEffect(() => {
    const checkDbConnection = async () => {
      try {
        const response = await fetch('/api/test-db');
        const data = await response.json();
        setDbStatus(data);
        
        if (!data.success) {
          setError(`Database connection error: ${data.error}`);
        }
      } catch (err) {
        console.error('Failed to check database connection:', err);
        setDbStatus({
          success: false,
          message: 'Failed to check database connection'
        });
      }
    };
    
    checkDbConnection();
  }, []);

  // Create or fetch user in the database
  useEffect(() => {
    const syncUser = async () => {
      if (!user || !isLoaded || !dbStatus?.success) return;
      
      try {
        // Try to find user by Clerk ID
        const dbUser = await getUserByClerkId(user.id);
        
        if (dbUser) {
          // User exists, set the local user ID
          setLocalUserId(dbUser.id);
        } else {
          // User doesn't exist, create a new one with the Clerk ID
          const displayName = user.fullName || 
                            user.username || 
                            user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 
                            'Clerk User';
          const newUser = await createUser(displayName, user.id);
          setLocalUserId(newUser.id);
        }
      } catch (error) {
        console.error('Error syncing user to database:', error);
        setError('Failed to sync user. Please try again.');
      }
    };
    
    syncUser();
  }, [user, isLoaded, dbStatus]);

  // Check if user is authenticated and fetch trips
  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      router.push('/sign-in');
      return;
    }
    
    const fetchTrips = async () => {
      if (!user || !localUserId) return;

      if (!dbStatus?.success) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Use the local user ID from our database
        const userTrips = await getUserTrips(localUserId);
        setTrips(userTrips);
      } catch (error: any) {
        console.error('Error fetching trips:', error);
        setError(`Failed to load trips: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (dbStatus !== null && localUserId) {
      fetchTrips();
    }
  }, [user, isLoaded, router, dbStatus, localUserId]);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !localUserId || !newTripName.trim() || !newTripPassword.trim()) return;

    setIsCreatingTrip(true);
    setError(null);
    try {
      const trip = await createTrip(newTripName, newTripPassword, localUserId);
      setTrips((prev) => [...prev, trip]);
      setNewTripName('');
      setNewTripPassword('');
      setShowNewTripForm(false);
    } catch (error) {
      console.error('Error creating trip:', error);
      setError('Failed to create trip');
    } finally {
      setIsCreatingTrip(false);
    }
  };

  const handleJoinTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !localUserId || !joinTripId.trim() || !joinTripPassword.trim()) return;

    setIsJoiningTrip(true);
    setError(null);
    try {
      const result = await joinTrip(localUserId, joinTripId, joinTripPassword);
      
      if (result.success && result.trip) {
        setTrips((prev) => {
          // Check if the trip is already in the list
          const exists = prev.some(trip => trip.id === result.trip.id);
          if (!exists) {
            return [...prev, result.trip];
          }
          return prev;
        });
        setJoinTripId('');
        setJoinTripPassword('');
        setShowJoinTripForm(false);
      } else {
        setError(result.message || 'Failed to join trip');
      }
    } catch (error) {
      console.error('Error joining trip:', error);
      setError('Failed to join trip');
    } finally {
      setIsJoiningTrip(false);
    }
  };

  if (!isLoaded || (isLoaded && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Your Trips</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowNewTripForm(!showNewTripForm);
                  setShowJoinTripForm(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {showNewTripForm ? 'Cancel' : 'New Trip'}
              </button>
              <button
                onClick={() => {
                  setShowJoinTripForm(!showJoinTripForm);
                  setShowNewTripForm(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                {showJoinTripForm ? 'Cancel' : 'Join Trip'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {dbStatus && !dbStatus.success && (
            <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
              <p className="font-medium">Database Connection Issue</p>
              <p className="text-sm mt-1">The application is unable to connect to the database. Some features may not work correctly.</p>
              <p className="text-xs mt-2 text-yellow-700">Technical details: {dbStatus.message}</p>
            </div>
          )}

          {showNewTripForm && (
            <div className="mb-8 bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Trip</h2>
              <form onSubmit={handleCreateTrip} className="space-y-4">
                <div>
                  <label htmlFor="tripName" className="block text-sm font-medium text-gray-700">
                    Trip Name
                  </label>
                  <input
                    id="tripName"
                    type="text"
                    value={newTripName}
                    onChange={(e) => setNewTripName(e.target.value)}
                    placeholder="e.g., Summer Vacation 2024"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                  />
                </div>
                <div>
                  <label htmlFor="tripPassword" className="block text-sm font-medium text-gray-700">
                    Trip Password
                  </label>
                  <input
                    id="tripPassword"
                    type="password"
                    value={newTripPassword}
                    onChange={(e) => setNewTripPassword(e.target.value)}
                    placeholder="This will be used by others to join your trip"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isCreatingTrip || !newTripName.trim() || !newTripPassword.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingTrip ? 'Creating...' : 'Create Trip'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {showJoinTripForm && (
            <div className="mb-8 bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Join Existing Trip</h2>
              <form onSubmit={handleJoinTrip} className="space-y-4">
                <div>
                  <label htmlFor="joinTripId" className="block text-sm font-medium text-gray-700">
                    Trip ID
                  </label>
                  <input
                    id="joinTripId"
                    type="text"
                    value={joinTripId}
                    onChange={(e) => setJoinTripId(e.target.value)}
                    placeholder="Enter the Trip ID shared with you"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                  />
                </div>
                <div>
                  <label htmlFor="joinTripPassword" className="block text-sm font-medium text-gray-700">
                    Trip Password
                  </label>
                  <input
                    id="joinTripPassword"
                    type="password"
                    value={joinTripPassword}
                    onChange={(e) => setJoinTripPassword(e.target.value)}
                    placeholder="Enter the Trip Password"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isJoiningTrip || !joinTripId.trim() || !joinTripPassword.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isJoiningTrip ? 'Joining...' : 'Join Trip'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {isLoading ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
              <p className="text-gray-500">Loading your trips...</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
              <p className="text-gray-500">You don't have any trips yet.</p>
              <p className="text-sm text-gray-400 mt-2">Create a new trip or join an existing one to get started.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {trips.map((trip) => (
                  <li key={trip.id}>
                    <Link href={`/trips/${trip.id}`} className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">{trip.name}</p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {trip.uniqueId}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              View trip details
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>
                              Created: {new Date(trip.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 
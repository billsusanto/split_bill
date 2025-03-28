'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import NavBar from '@/components/NavBar';
import Link from 'next/link';
import { 
  getTripById, 
  createBill, 
  updateBill, 
  getTripBills, 
  deleteBill, 
  getUserById, 
  getUserByName, 
  createUser,
  getUserByClerkId,
  isUserInTrip
} from '@/lib/db/utils';

export default function TripDetail() {
  const { user, isSignedIn, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const tripId = Number(params.id);
  
  const [trip, setTrip] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewBillForm, setShowNewBillForm] = useState(false);
  const [newBillName, setNewBillName] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillType, setNewBillType] = useState('items');
  const [isCreatingBill, setIsCreatingBill] = useState(false);
  const [isDeletingBill, setIsDeletingBill] = useState<number | null>(null);
  const [editingBill, setEditingBill] = useState<number | null>(null);
  const [editBillName, setEditBillName] = useState('');
  const [editBillAmount, setEditBillAmount] = useState('');
  const [editBillType, setEditBillType] = useState('');
  const [isUpdatingBill, setIsUpdatingBill] = useState(false);
  const [billCreators, setBillCreators] = useState<Record<number, string>>({});
  const [localUserId, setLocalUserId] = useState<number | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isSignedIn, isLoaded, router]);

  // Get or create local user ID for database operations
  useEffect(() => {
    const syncUser = async () => {
      if (!isSignedIn || !isLoaded || !user) return;
      
      try {
        // Try to find user by Clerk ID
        const dbUser = await getUserByClerkId(user.id);
        
        if (dbUser) {
          // User exists, set the local user ID
          setLocalUserId(dbUser.id);
        } else {
          // User doesn't exist, create a new one with the Clerk ID
          const displayName = user.fullName || user.username || 'Clerk User';
          const newUser = await createUser(displayName, user.id);
          setLocalUserId(newUser.id);
        }
      } catch (error) {
        console.error('Error syncing user to database:', error);
      }
    };
    
    syncUser();
  }, [isSignedIn, isLoaded, user]);

  // Fetch trip and bills data
  useEffect(() => {
    const fetchTripData = async () => {
      if (!localUserId || isNaN(tripId)) return;

      setIsLoading(true);
      try {
        // Get trip details
        const tripData = await getTripById(tripId);
        if (!tripData) {
          router.push('/dashboard');
          return;
        }
        
        // Check if user has access to this trip
        const hasAccess = await isUserInTrip(localUserId, tripId);
        if (!hasAccess) {
          router.push('/dashboard');
          return;
        }
        
        setTrip(tripData);

        // Get bills for this trip
        const tripBills = await getTripBills(tripId);
        setBills(tripBills);
        
        // Get bill creators
        const creatorsMap: Record<number, string> = {};
        for (const bill of tripBills) {
          if (bill.addedById) {
            const creator = await getUserById(bill.addedById);
            if (creator) {
              creatorsMap[bill.id] = creator.name;
            }
          }
        }
        setBillCreators(creatorsMap);
      } catch (error) {
        console.error('Error fetching trip data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (localUserId) {
      fetchTripData();
    }
  }, [localUserId, tripId, router]);

  // Handle create bill form submission
  const handleCreateBill = async (e: FormEvent) => {
    e.preventDefault();
    if (!localUserId || !newBillName.trim() || !newBillAmount.trim() || isNaN(Number(newBillAmount))) return;

    setIsCreatingBill(true);
    try {
      const amount = parseFloat(newBillAmount);
      const newBill = await createBill(tripId, localUserId, newBillName, amount, newBillType);
      setBills((prev) => [...prev, newBill]);
      setNewBillName('');
      setNewBillAmount('');
      setNewBillType('items');
      setShowNewBillForm(false);
    } catch (error) {
      console.error('Error creating bill:', error);
      alert('Failed to create bill. Please try again.');
    } finally {
      setIsCreatingBill(false);
    }
  };

  // Handle edit bill mode
  const startEditingBill = (bill: any) => {
    setEditingBill(bill.id);
    setEditBillName(bill.name);
    setEditBillAmount(bill.totalAmount.toString());
    setEditBillType(bill.billType || 'items');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingBill(null);
    setEditBillName('');
    setEditBillAmount('');
    setEditBillType('');
  };

  // Handle update bill
  const handleUpdateBill = async (billId: number) => {
    if (!editBillName.trim() || !editBillAmount.trim() || isNaN(Number(editBillAmount))) return;

    setIsUpdatingBill(true);
    try {
      const amount = parseFloat(editBillAmount);
      const updatedBill = await updateBill(billId, editBillName, amount, editBillType);
      
      setBills((prev) => prev.map((bill) => 
        bill.id === billId ? updatedBill : bill
      ));
      
      setEditingBill(null);
      setEditBillName('');
      setEditBillAmount('');
      setEditBillType('');
    } catch (error) {
      console.error('Error updating bill:', error);
      alert('Failed to update bill. Please try again.');
    } finally {
      setIsUpdatingBill(false);
    }
  };

  // Handle delete bill
  const handleDeleteBill = async (billId: number) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;

    setIsDeletingBill(billId);
    try {
      await deleteBill(billId);
      setBills((prev) => prev.filter(bill => bill.id !== billId));
    } catch (error) {
      console.error('Error deleting bill:', error);
      alert('Failed to delete bill. Please try again.');
    } finally {
      setIsDeletingBill(null);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (isLoaded && !isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Please sign in to view this page</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{trip?.name}</h1>
              <p className="text-sm text-gray-500">
                Trip ID: <span className="font-mono">{trip?.uniqueId}</span>
              </p>
            </div>
            <button
              onClick={() => setShowNewBillForm(!showNewBillForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {showNewBillForm ? 'Cancel' : 'Add Bill'}
            </button>
          </div>

          {/* New Bill Form */}
          {showNewBillForm && (
            <div className="mb-8 bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Bill</h2>
              <form onSubmit={handleCreateBill} className="space-y-4">
                <div>
                  <label htmlFor="billName" className="block text-sm font-medium text-gray-700">
                    Bill Name
                  </label>
                  <input
                    id="billName"
                    type="text"
                    value={newBillName}
                    onChange={(e) => setNewBillName(e.target.value)}
                    placeholder="e.g., Dinner at Restaurant"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                  />
                </div>
                <div>
                  <label htmlFor="billAmount" className="block text-sm font-medium text-gray-700">
                    Total Amount
                  </label>
                  <input
                    id="billAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newBillAmount}
                    onChange={(e) => setNewBillAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                  />
                </div>
                <div>
                  <label htmlFor="billType" className="block text-sm font-medium text-gray-700">
                    Bill Type
                  </label>
                  <div className="mt-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          id="items"
                          name="billType"
                          type="radio"
                          value="items"
                          checked={newBillType === 'items'}
                          onChange={() => setNewBillType('items')}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="items" className="ml-2 block text-sm text-gray-700">
                          Select Individual Items
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="even"
                          name="billType"
                          type="radio"
                          value="even"
                          checked={newBillType === 'even'}
                          onChange={() => setNewBillType('even')}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="even" className="ml-2 block text-sm text-gray-700">
                          Split Evenly
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isCreatingBill || !newBillName.trim() || !newBillAmount.trim() || isNaN(Number(newBillAmount))}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingBill ? 'Adding...' : 'Add Bill'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bills List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Bills</h3>
            </div>
            {bills.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">No bills added to this trip yet.</p>
                <p className="text-sm text-gray-400 mt-2">Add a bill to get started.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {bills.map((bill) => (
                  <li key={bill.id} className="relative">
                    {editingBill === bill.id ? (
                      <div className="px-4 py-4 sm:px-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Edit Bill</h4>
                        <div className="space-y-3">
                          <div>
                            <label htmlFor={`editBillName-${bill.id}`} className="block text-xs font-medium text-gray-700">
                              Bill Name
                            </label>
                            <input
                              id={`editBillName-${bill.id}`}
                              type="text"
                              value={editBillName}
                              onChange={(e) => setEditBillName(e.target.value)}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-xs text-black"
                            />
                          </div>
                          <div>
                            <label htmlFor={`editBillAmount-${bill.id}`} className="block text-xs font-medium text-gray-700">
                              Total Amount
                            </label>
                            <input
                              id={`editBillAmount-${bill.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={editBillAmount}
                              onChange={(e) => setEditBillAmount(e.target.value)}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-xs text-black"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Bill Type</label>
                            <div className="mt-1 flex items-center space-x-4">
                              <div className="flex items-center">
                                <input
                                  id={`items-${bill.id}`}
                                  name={`billType-${bill.id}`}
                                  type="radio"
                                  value="items"
                                  checked={editBillType === 'items'}
                                  onChange={() => setEditBillType('items')}
                                  className="h-3 w-3 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor={`items-${bill.id}`} className="ml-2 block text-xs text-gray-700">
                                  Select Individual Items
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  id={`even-${bill.id}`}
                                  name={`billType-${bill.id}`}
                                  type="radio"
                                  value="even"
                                  checked={editBillType === 'even'}
                                  onChange={() => setEditBillType('even')}
                                  className="h-3 w-3 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor={`even-${bill.id}`} className="ml-2 block text-xs text-gray-700">
                                  Split Evenly
                                </label>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => cancelEditing()}
                              className="px-3 py-1 text-xs bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdateBill(bill.id)}
                              disabled={isUpdatingBill}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                              {isUpdatingBill ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Link href={`/bills/${bill.id}`} className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-blue-600 truncate">
                                  {bill.name} {billCreators[bill.id] && <span className="text-xs text-gray-500">by {billCreators[bill.id]}</span>}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Total: {Number(bill.totalAmount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {bill.billType === 'even' ? 'Split Evenly' : 'Individual Items'}
                                  </span>
                                </p>
                              </div>

                            </div>
                          </div>
                        </Link>
                        <div className="absolute top-5 right-5 flex space-x-2">
                          <button
                            onClick={() => startEditingBill(bill)}
                            className="text-blue-600 hover:text-blue-800 focus:outline-none text-md"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBill(bill.id)}
                            disabled={isDeletingBill === bill.id}
                            className="text-red-600 hover:text-red-800 focus:outline-none text-md"
                          >
                            {isDeletingBill === bill.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 
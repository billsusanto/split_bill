'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import NavBar from '@/components/NavBar';
import Link from 'next/link';
import { 
  getBillById, 
  getTripById,
  getBillItems, 
  createBillItem, 
  updateBillItem,
  deleteBillItem,
  assignUserToBillItem,
  removeUserFromBillItem,
  getUsersForBillItem,
  getBillItemsForUser,
  assignUserToBill,
  removeUserFromBill,
  getUsersForBill,
  createUser,
  getUserByClerkId,
  isUserInTrip
} from '@/lib/db/utils';

// Define interfaces for our data types
interface Bill {
  id: number;
  name: string;
  totalAmount: string;
  tripId: number;
  addedById: number;
  billType: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Trip {
  id: number;
  name: string;
  uniqueId: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

interface BillItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  billId: number;
  createdAt: Date;
}

interface User {
  id: number;
  name: string;
  clerkId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function BillDetail() {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const billId = Number(params.id);
  
  const [bill, setBill] = useState<Bill | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState<number | null>(null);
  const [itemUsers, setItemUsers] = useState<Record<number, User[]>>({});
  const [userItems, setUserItems] = useState<number[]>([]);
  const [isTogglingItem, setIsTogglingItem] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemQuantity, setEditItemQuantity] = useState('1');
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);
  const [evenSplitUsers, setEvenSplitUsers] = useState<User[]>([]);
  const [isTogglingEvenSplit, setIsTogglingEvenSplit] = useState(false);
  const [localUserId, setLocalUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    if (!isLoaded && !user) {
      router.push('/');
    }
  }, [user, isLoaded, router]);

  // Synchronize user with database
  useEffect(() => {
    const syncUser = async () => {
      if (!user) return;
      
      try {
        // Try to find user by Clerk ID
        const dbUser = await getUserByClerkId(user.id);
        
        if (dbUser) {
          // User exists, set the local user ID
          setLocalUserId(dbUser.id);
        } else {
          // User doesn't exist, create a new one with the Clerk ID
          const newUser = await createUser(user.fullName || 'Unknown User', user.id);
          setLocalUserId(newUser.id);
        }
      } catch (error) {
        console.error('Error synchronizing user:', error);
        setError('Failed to sync user. Please refresh the page.');
      }
    };
    
    if (user) {
      syncUser();
    }
  }, [user]);

  // Fetch bill data
  useEffect(() => {
    const fetchBillData = async () => {
      if (!localUserId || isNaN(billId)) return;

      setIsLoading(true);
      try {
        // Get bill details
        const billData = await getBillById(billId);
        if (!billData) {
          router.push('/dashboard');
          return;
        }
        
        // Check if user has access to this bill's trip
        const hasAccess = await isUserInTrip(localUserId, billData.tripId);
        if (!hasAccess) {
          setError('You do not have access to this bill. Please join the trip first.');
          setIsLoading(false);
          return;
        }
        
        setBill(billData);

        // Get trip details
        const tripData = await getTripById(billData.tripId);
        setTrip(tripData);
        
        // For even split bills, get participating users
        if (billData.billType === 'even') {
          const billUsers = await getUsersForBill(billId);
          setEvenSplitUsers(billUsers);
        }

        // Get bill items
        const items = await getBillItems(billId);
        setBillItems(items);

        // Get user's bill items
        const userItemIds = await getBillItemsForUser(localUserId, billId);
        setUserItems(userItemIds.map(item => item.id));

        // For each bill item, get the users who are paying for it
        const usersMap: Record<number, User[]> = {};
        for (const item of items) {
          const itemUsersList = await getUsersForBillItem(item.id);
          usersMap[item.id] = itemUsersList;
        }
        setItemUsers(usersMap);

      } catch (error) {
        console.error('Error fetching bill data:', error);
        setError('Failed to load bill data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (localUserId) {
      fetchBillData();
    }
  }, [localUserId, billId, router]);

  // Handle create bill item form submission
  const handleCreateBillItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!localUserId || !newItemName.trim() || !newItemPrice.trim() || isNaN(Number(newItemPrice)) || !newItemQuantity.trim() || isNaN(Number(newItemQuantity))) return;

    setIsCreatingItem(true);
    try {
      const price = parseFloat(newItemPrice);
      const quantity = parseInt(newItemQuantity, 10);
      const newItem = await createBillItem(billId, newItemName, price, quantity);
      setBillItems((prev) => [...prev, newItem]);
      
      // Initialize empty users array for this item
      setItemUsers(prev => ({
        ...prev,
        [newItem.id]: []
      }));
      
      setNewItemName('');
      setNewItemPrice('');
      setNewItemQuantity('1');
      setShowNewItemForm(false);
    } catch (error) {
      console.error('Error creating bill item:', error);
      alert('Failed to create bill item. Please try again.');
    } finally {
      setIsCreatingItem(false);
    }
  };

  // Handle delete bill item
  const handleDeleteBillItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setIsDeletingItem(itemId);
    try {
      await deleteBillItem(itemId);
      setBillItems((prev) => prev.filter(item => item.id !== itemId));
      
      // Remove from itemUsers and userItems
      const newItemUsers = { ...itemUsers };
      delete newItemUsers[itemId];
      setItemUsers(newItemUsers);
      
      setUserItems(prev => prev.filter(id => id !== itemId));
    } catch (error) {
      console.error('Error deleting bill item:', error);
      alert('Failed to delete bill item. Please try again.');
    } finally {
      setIsDeletingItem(null);
    }
  };

  // Toggle whether the current user is paying for an item
  const toggleUserItem = async (itemId: number) => {
    if (!localUserId) return;
    
    setIsTogglingItem(itemId);
    try {
      const isPaying = userItems.includes(itemId);
      
      if (isPaying) {
        // Remove user from item
        await removeUserFromBillItem(localUserId, itemId);
        setUserItems(prev => prev.filter(id => id !== itemId));
        
        // Update itemUsers
        setItemUsers(prev => ({
          ...prev,
          [itemId]: prev[itemId].filter(u => u.id !== localUserId)
        }));
      } else {
        // Add user to item
        await assignUserToBillItem(localUserId, itemId);
        setUserItems(prev => [...prev, itemId]);
        
        // Update itemUsers
        const existingUsers = itemUsers[itemId] || [];
        if (!existingUsers.find(u => u.id === localUserId)) {
          setItemUsers(prev => ({
            ...prev,
            [itemId]: [...prev[itemId], { id: localUserId, name: user?.fullName || 'You' }]
          }));
        }
      }
    } catch (error) {
      console.error('Error toggling bill item:', error);
      alert('Failed to update payment. Please try again.');
    } finally {
      setIsTogglingItem(null);
    }
  };

  // Toggle participation in even split
  const toggleEvenSplit = async () => {
    if (!localUserId) return;
    
    setIsTogglingEvenSplit(true);
    try {
      const isParticipating = evenSplitUsers.some(u => u.id === localUserId);
      
      if (isParticipating) {
        // Remove user from even split
        await removeUserFromBill(localUserId, billId);
        setEvenSplitUsers(prev => prev.filter(u => u.id !== localUserId));
      } else {
        // Add user to even split
        await assignUserToBill(localUserId, billId);
        setEvenSplitUsers(prev => [...prev, { id: localUserId, name: user?.fullName || 'You' }]);
      }
    } catch (error) {
      console.error('Error toggling even split participation:', error);
      alert('Failed to update participation. Please try again.');
    } finally {
      setIsTogglingEvenSplit(false);
    }
  };

  // Calculate even split amount
  const calculateEvenSplitAmount = () => {
    if (!bill || evenSplitUsers.length === 0) return 0;
    return Number(bill.totalAmount) / evenSplitUsers.length;
  };

  // Calculate total amount user is paying
  const calculateUserTotal = () => {
    if (bill?.billType === 'even' && evenSplitUsers.some(u => u.id === localUserId)) {
      return calculateEvenSplitAmount();
    }
    
    return billItems
      .filter(item => userItems.includes(item.id))
      .reduce((total, item) => {
        const userCount = (itemUsers[item.id] || []).length || 1;
        return total + ((Number(item.price) * (item.quantity || 1)) / userCount);
      }, 0);
  };

  // Start editing an item
  const startEditingItem = (item: BillItem) => {
    setEditingItem(item.id);
    setEditItemName(item.name);
    setEditItemPrice(item.price.toString());
    setEditItemQuantity((item.quantity || 1).toString());
  };

  // Cancel editing
  const cancelEditingItem = () => {
    setEditingItem(null);
    setEditItemName('');
    setEditItemPrice('');
    setEditItemQuantity('1');
  };

  // Handle update bill item
  const handleUpdateBillItem = async (itemId: number) => {
    if (!editItemName.trim() || !editItemPrice.trim() || isNaN(Number(editItemPrice))) return;

    setIsUpdatingItem(true);
    try {
      const price = parseFloat(editItemPrice);
      const quantity = parseInt(editItemQuantity, 10);
      const updatedItem = await updateBillItem(itemId, editItemName, price, quantity);
      
      setBillItems((prev) => prev.map((item) => 
        item.id === itemId ? updatedItem : item
      ));
      
      setEditingItem(null);
      setEditItemName('');
      setEditItemPrice('');
      setEditItemQuantity('1');
    } catch (error) {
      console.error('Error updating bill item:', error);
      alert('Failed to update bill item. Please try again.');
    } finally {
      setIsUpdatingItem(false);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col">
        <p className="text-lg text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p>Bill not found or you don&apos;t have access to this bill.</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link href={`/trips/${trip?.id}`} className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
              ← Back to Trip
            </Link>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{bill.name}</h1>
                <p className="text-sm text-gray-500">
                  Total: {Number(bill.totalAmount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {bill.billType === 'even' ? 'Split Evenly' : 'Individual Items'}
                  </span>
                </p>
              </div>
              {bill.billType !== 'even' && (
                <button
                  onClick={() => setShowNewItemForm(!showNewItemForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {showNewItemForm ? 'Cancel' : 'Add Item'}
                </button>
              )}
            </div>
          </div>

          {/* Your contribution summary */}
          <div className="mb-8 bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Contribution</h2>
            <div className="flex justify-between items-center">
              <p className="text-3xl font-bold text-gray-900">
                {calculateUserTotal().toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
              {bill.billType === 'even' && (
                <button
                  onClick={toggleEvenSplit}
                  disabled={isTogglingEvenSplit}
                  className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    evenSplitUsers.some(u => u.id === localUserId)
                      ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                      : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                  }`}
                >
                  {isTogglingEvenSplit
                    ? 'Updating...'
                    : evenSplitUsers.some(u => u.id === localUserId)
                    ? 'Opt-out'
                    : 'Participate'}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {bill.billType === 'even'
                ? `Split evenly with ${evenSplitUsers.length} ${evenSplitUsers.length === 1 ? 'person' : 'people'}`
                : `Based on your selected items (${userItems.length} ${userItems.length === 1 ? 'item' : 'items'})`}
            </p>
          </div>

          {/* Render different UI based on bill type */}
          {bill.billType === 'even' ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Even Split Details</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Total amount split evenly among all participants.
                </p>
              </div>
              <div className="px-4 py-5 sm:px-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Amount per person</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {calculateEvenSplitAmount().toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Participants</p>
                    <p className="text-2xl font-bold text-gray-900">{evenSplitUsers.length}</p>
                  </div>
                </div>
                
                {/* Participants list */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Participants</h4>
                  {evenSplitUsers.length === 0 ? (
                    <p className="text-sm text-gray-500">No participants yet. Be the first to join!</p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {evenSplitUsers.map(participant => (
                        <li key={participant.id} className="py-3 flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{participant.name}</p>
                          <p className="text-sm text-gray-500">
                            {calculateEvenSplitAmount().toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* New Item Form */}
              {showNewItemForm && (
                <div className="mb-8 bg-white shadow sm:rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Item</h2>
                  <form onSubmit={handleCreateBillItem} className="space-y-4">
                    <div>
                      <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">
                        Item Name
                      </label>
                      <input
                        id="itemName"
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="e.g., Pizza"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                      />
                    </div>
                    <div>
                      <label htmlFor="itemPrice" className="block text-sm font-medium text-gray-700">
                        Price
                      </label>
                      <input
                        id="itemPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="0.00"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                      />
                    </div>
                    <div>
                      <label htmlFor="itemQuantity" className="block text-sm font-medium text-gray-700">
                        Quantity
                      </label>
                      <input
                        id="itemQuantity"
                        type="number"
                        step="1"
                        min="1"
                        value={newItemQuantity}
                        onChange={(e) => setNewItemQuantity(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isCreatingItem || !newItemName.trim() || !newItemPrice.trim() || isNaN(Number(newItemPrice)) || !newItemQuantity.trim() || isNaN(Number(newItemQuantity))}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreatingItem ? 'Adding...' : 'Add Item'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Bill Items List */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Bill Items</h3>
                  <p className="mt-1 text-sm text-gray-500">Select the items you want to pay for.</p>
                </div>
                {billItems.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">No items added to this bill yet.</p>
                    <p className="text-sm text-gray-400 mt-2">Add items to start splitting the bill.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {billItems.map((item) => {
                      const isPaying = userItems.includes(item.id);
                      const itemUsersList = itemUsers[item.id] || [];
                      const userCount = itemUsersList.length || 1;
                      const perPersonCost = (Number(item.price) * (item.quantity || 1)) / userCount;
                      
                      if (editingItem === item.id) {
                        return (
                          <li key={item.id} className="relative px-4 py-4 sm:px-6">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Edit Item</h4>
                            <div className="space-y-3">
                              <div>
                                <label htmlFor={`editItemName-${item.id}`} className="block text-xs font-medium text-gray-700">
                                  Item Name
                                </label>
                                <input
                                  id={`editItemName-${item.id}`}
                                  type="text"
                                  value={editItemName}
                                  onChange={(e) => setEditItemName(e.target.value)}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-xs text-black"
                                />
                              </div>
                              <div>
                                <label htmlFor={`editItemPrice-${item.id}`} className="block text-xs font-medium text-gray-700">
                                  Price
                                </label>
                                <input
                                  id={`editItemPrice-${item.id}`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editItemPrice}
                                  onChange={(e) => setEditItemPrice(e.target.value)}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-xs text-black"
                                />
                              </div>
                              <div>
                                <label htmlFor={`editItemQuantity-${item.id}`} className="block text-xs font-medium text-gray-700">
                                  Quantity
                                </label>
                                <input
                                  id={`editItemQuantity-${item.id}`}
                                  type="number"
                                  step="1"
                                  min="1"
                                  value={editItemQuantity}
                                  onChange={(e) => setEditItemQuantity(e.target.value)}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-xs text-black"
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => cancelEditingItem()}
                                  className="px-3 py-1 text-xs bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleUpdateBillItem(item.id)}
                                  disabled={isUpdatingItem}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {isUpdatingItem ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      }
                      
                      return (
                        <li key={item.id} className="relative">
                          <div className="px-4 py-4 sm:px-6 flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="mr-4">
                                <button
                                  onClick={() => toggleUserItem(item.id)}
                                  disabled={isTogglingItem === item.id}
                                  className={`h-5 w-5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    isPaying ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                                  }`}
                                >
                                  {isPaying && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-4 w-4">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-500">
                                  Price: {Number(item.price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                  {item.quantity > 1 && <span> | Quantity: {item.quantity}</span>}
                                  {userCount > 1 && (
                                    <span> | Per person: {perPersonCost.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                                  )}
                                </p>
                                {itemUsersList.length > 0 && (
                                  <div className="mt-1">
                                    <p className="text-xs text-gray-500">
                                      Paid by: {itemUsersList.map(u => u.name).join(', ')}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => startEditingItem(item)}
                                className="text-blue-600 hover:text-blue-800 focus:outline-none text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteBillItem(item.id)}
                                disabled={isDeletingItem === item.id}
                                className="text-red-600 hover:text-red-800 focus:outline-none text-sm"
                              >
                                {isDeletingItem === item.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
} 
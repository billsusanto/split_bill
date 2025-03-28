'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserByName, createUser } from '../lib/db/utils';

type User = {
  id: number;
  name: string;
};

type UserContextType = {
  user: User | null;
  loading: boolean;
  login: (name: string) => Promise<User>;
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is stored in local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (name: string): Promise<User> => {
    setLoading(true);
    try {
      // Check if user exists, if not create it
      let user = await getUserByName(name);
      if (!user) {
        user = await createUser(name);
      }
      
      // Save user to state and local storage
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 
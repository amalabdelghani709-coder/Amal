import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  phone: string;
  name: string;
  role: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  points: number;
  total_orders: number;
  is_active: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  loadUser: () => Promise<void>;
}

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (phone: string, name?: string) => {
    try {
      set({ isLoading: true });
      const response = await fetch(
        `${API_URL}/api/auth/login?phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name || '')}`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        throw new Error('فشل تسجيل الدخول');
      }
      
      const user = await response.json();
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (data: Partial<User>) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, ...data };
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        // Refresh user data from server
        const response = await fetch(`${API_URL}/api/auth/user/${user.id}`);
        if (response.ok) {
          const freshUser = await response.json();
          await AsyncStorage.setItem('user', JSON.stringify(freshUser));
          set({ user: freshUser, isAuthenticated: true, isLoading: false });
        } else {
          set({ user, isAuthenticated: true, isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },
}));

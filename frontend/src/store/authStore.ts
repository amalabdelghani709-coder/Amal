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
  is_approved: boolean;
  created_at: string;
}

interface LoginResult {
  needs_approval: boolean;
  is_new_registration: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, name?: string, latitude?: number, longitude?: number) => Promise<LoginResult | undefined>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  loadUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Use relative URL for API calls - works with proxy configuration
const API_URL = '';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (phone: string, name?: string, latitude?: number, longitude?: number) => {
    try {
      set({ isLoading: true });
      
      // Build query string with location if available
      let url = `${API_URL}/api/auth/login?phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name || '')}`;
      if (latitude !== undefined && longitude !== undefined) {
        url += `&latitude=${latitude}&longitude=${longitude}`;
      }
      
      const response = await fetch(url, { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('فشل تسجيل الدخول');
      }
      
      const data = await response.json();
      const { is_new_registration, needs_approval, ...user } = data;
      
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Only set authenticated if approved
      if (user.is_approved) {
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
      
      return { needs_approval, is_new_registration };
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

  refreshUser: async () => {
    const { user } = get();
    if (user) {
      try {
        const response = await fetch(`${API_URL}/api/auth/user/${user.id}`);
        if (response.ok) {
          const freshUser = await response.json();
          await AsyncStorage.setItem('user', JSON.stringify(freshUser));
          set({ user: freshUser, isAuthenticated: freshUser.is_approved });
        }
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
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
          
          // Only authenticate if approved
          if (freshUser.is_approved) {
            set({ user: freshUser, isAuthenticated: true, isLoading: false });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } else {
          // User might have been deleted
          await AsyncStorage.removeItem('user');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },
}));

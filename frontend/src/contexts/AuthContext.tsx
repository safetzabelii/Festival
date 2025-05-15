'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/types/user';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to get API URL - use proxy in production, localhost in development
const getApiUrl = (path: string) => {
  // In browser environment
  if (typeof window !== 'undefined') {
    // Use the proxy in production
    if (process.env.NODE_ENV === 'production') {
      return `/api/proxy/${path}`;
    }
  }
  // Fallback to direct URL (for development)
  return `http://localhost:5000/api/${path}`;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingNav, setLoadingNav] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only check the user once client side
    if (typeof window !== 'undefined' && !initialized) {
      checkUser();
      setInitialized(true);
    }
  }, [initialized]);

  const checkUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await fetch(getApiUrl('users/me'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        if (userData && userData._id) {
          localStorage.setItem('userId', userData._id);
        }
      } else {
        // Only clear token if there's an auth error (401)
        if (response.status === 401) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
      // Don't clear token on network errors
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrentPage = () => {
    router.refresh();
    if (pathname === '/login' || pathname === '/register') {
      router.push('/');
    }
  };

  const login = async (email: string, password: string) => {
    setLoadingNav(true);
    try {
      const response = await fetch(getApiUrl('auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      if (data.user && data.user._id) {
        localStorage.setItem('userId', data.user._id);
      }
      await checkUser();
      refreshCurrentPage();
    } catch (error) {
      throw error;
    } finally {
      setLoadingNav(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoadingNav(true);
    try {
      const response = await fetch(getApiUrl('auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      if (data.user && data.user._id) {
        localStorage.setItem('userId', data.user._id);
      }
      await checkUser();
      refreshCurrentPage();
    } catch (error) {
      throw error;
    } finally {
      setLoadingNav(false);
    }
  };

  const logout = async () => {
    setLoadingNav(true);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      setUser(null);
      router.push('/');
      router.refresh();
    } finally {
      setLoadingNav(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {loading && !loadingNav && (
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)',
          opacity: 0,
          animation: 'fadeIn 0.3s forwards',
          animationDelay: '0.3s'
        }}>
          <LoadingSpinner />
          <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
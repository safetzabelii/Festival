'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/types/user';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingNav, setLoadingNav] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await api.get('/api/users/me');
      setUser(response.data);
      if (response.data && response.data._id) {
        localStorage.setItem('userId', response.data._id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
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
      const response = await api.post('/api/auth/login', { email, password });
      
      localStorage.setItem('token', response.data.token);
      if (response.data.user && response.data.user._id) {
        localStorage.setItem('userId', response.data.user._id);
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
      const response = await api.post('/api/auth/register', { name, email, password });
      
      localStorage.setItem('token', response.data.token);
      if (response.data.user && response.data.user._id) {
        localStorage.setItem('userId', response.data.user._id);
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
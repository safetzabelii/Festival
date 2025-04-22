'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';

interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  liked: string[];
  goingTo: string[];
  lastLogin: string;
  status: 'active' | 'inactive' | 'suspended';
  totalActions: number;
  profileCompleted: boolean;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'user' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt' | 'totalActions'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { user } = useAuth();
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.headers.get('content-type')?.includes('text/html')) {
          throw new Error('Server error: Please check if the backend server is running');
        }
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch users' }));
        throw new Error(errorData.message || 'Failed to fetch users');
      }

      const data = await response.json().catch(() => {
        throw new Error('Invalid response format from server');
      });

      if (!Array.isArray(data)) {
        throw new Error('Invalid data received from server');
      }

      const processedData = data.map(user => ({
        ...user,
        status: user.status || 'active',
        lastLogin: user.lastLogin || user.createdAt,
        totalActions: user.totalActions || 0,
        profileCompleted: user.profileCompleted ?? true,
        liked: user.liked || [],
        goingTo: user.goingTo || []
      }));

      setUsers(processedData);
    } catch (err) {
      console.error('Users fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    try {
      setActionLoading(userId);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/toggle-admin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ isAdmin: !currentIsAdmin })
      });

      if (!response.ok) {
        if (response.headers.get('content-type')?.includes('text/html')) {
          throw new Error('Server error: Please check if the backend server is running');
        }
        const errorData = await response.json().catch(() => ({ message: 'Failed to update user role' }));
        throw new Error(errorData.message || 'Failed to update user role');
      }

      await fetchUsers();
    } catch (err) {
      console.error('Toggle admin error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while updating user role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      setActionLoading(userId);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        if (response.headers.get('content-type')?.includes('text/html')) {
          throw new Error('Server error: Please check if the backend server is running');
        }
        const errorData = await response.json().catch(() => ({ message: 'Failed to update user status' }));
        throw new Error(errorData.message || 'Failed to update user status');
      }

      await fetchUsers();
    } catch (err) {
      console.error('Toggle status error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while updating user status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(userId);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.headers.get('content-type')?.includes('text/html')) {
          throw new Error('Server error: Please check if the backend server is running');
        }
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete user' }));
        throw new Error(errorData.message || 'Failed to delete user');
      }

      await fetchUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting user');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users
    .filter(u => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return u.name.toLowerCase().includes(searchLower) || 
               u.email.toLowerCase().includes(searchLower);
      }
      return true;
    })
    .filter(u => {
      switch (filter) {
        case 'admin': return u.isAdmin;
        case 'user': return !u.isAdmin;
        case 'active': return u.status === 'active';
        case 'inactive': return u.status === 'inactive' || u.status === 'suspended';
        default: return true;
      }
    })
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name': return order * a.name.localeCompare(b.name);
        case 'email': return order * a.email.localeCompare(b.email);
        case 'totalActions': return order * (a.totalActions - b.totalActions);
        default: return order * (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    });

  if (!user || !user.isAdmin) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
        <Navbar />
        <div style={{ 
          maxWidth: '80rem',
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: '3rem 1rem',
          textAlign: 'center'
        }}>
          <p style={{ color: '#dc2626' }}>Access Denied: Admin privileges required</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
      <Navbar />
      <div style={{ 
        maxWidth: '80rem',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '3rem 1rem'
      }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{ 
            fontSize: '2.25rem',
            fontWeight: 'bold',
            color: 'var(--text-color)'
          }}>
            User Management
          </h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                width: '250px'
              }}
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'white'
              }}
            >
              <option value="all">All Users</option>
              <option value="admin">Admins</option>
              <option value="user">Regular Users</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'white'
              }}
            >
              <option value="createdAt">Join Date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="totalActions">Activity</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            padding: '0.75rem 1rem',
            borderRadius: '0.375rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ 
                backgroundColor: 'var(--background-color)',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>User Info</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Role</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Activity</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Profile</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '500' }}>{user.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span
                      style={{
                        backgroundColor: user.status === 'active' ? '#059669' : '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        padding: '0.25rem 0.5rem',
                        display: 'inline-block'
                      }}
                    >
                      {user.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span
                      style={{
                        backgroundColor: user.isAdmin ? 'var(--primary-color)' : 'transparent',
                        color: user.isAdmin ? 'white' : 'var(--text-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.375rem',
                        padding: '0.25rem 0.5rem',
                        display: 'inline-block'
                      }}
                    >
                      {user.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div>Actions: {user.totalActions}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Last active: {new Date(user.lastLogin).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      alignItems: 'center'
                    }}>
                      <div style={{ 
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: user.profileCompleted ? '#059669' : '#dc2626'
                      }} />
                      <span style={{ fontSize: '0.875rem' }}>
                        {user.profileCompleted ? 'Complete' : 'Incomplete'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={actionLoading === user._id}
                      style={{
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        padding: '0.25rem 0.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      {actionLoading === user._id ? (
                        <div style={{ width: '16px', height: '16px' }}>
                          <LoadingSpinner />
                        </div>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 
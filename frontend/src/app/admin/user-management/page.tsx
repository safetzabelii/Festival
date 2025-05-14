'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '../../../components/Modal';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import api from '@/services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
  liked?: string[];
  goingTo?: string[];
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(getImageUrl(imageUrl), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = response.data;
        throw new Error(errorData.message || 'Failed to fetch users');
      }

      const data = response.data;
      setUsers(data);
    } catch (err) {
      console.error('Users fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user === null) {
      // User is still loading, do nothing
      return;
    }
    
    if (user && !user.isAdmin) {
      // Use window.location for immediate redirection
      window.location.href = '/';
      return;
    }
    
    fetchUsers();
  }, [user, router]);

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await api.get(`/api/admin/users/${userToDelete._id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete user');
      
      setUsers(users.filter(u => u._id !== userToDelete._id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await api.get(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isAdmin: !currentStatus })
      });

      if (!response.ok) {
        const errorData = response.data;
        throw new Error(errorData.message || 'Failed to update user role');
      }

      const updatedUser = await response.json();
      setUsers(users.map(u => u._id === userId ? updatedUser : u));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
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
        default: return true;
      }
    })
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name': return order * a.name.localeCompare(b.name);
        case 'email': return order * a.email.localeCompare(b.email);
        default: return order * (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    });

  // Redirect non-admin users immediately
  if (!user || !user.isAdmin) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
      return null;
    }
    return null;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-black">
        <Navbar />
        <main className="relative z-10 max-w-7xl mx-auto px-4 py-20">
          <h1 className="text-4xl font-black tracking-tighter text-white text-center mb-4">
            User Management
          </h1>
          <p className="text-lg text-[#FFB4A2] text-center mb-8 font-black tracking-tight lowercase">
            manage users
          </p>

          <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white placeholder-[#FFB4A2] focus:outline-none focus:border-[#FF7A00]"
                />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white focus:outline-none focus:border-[#FF7A00]"
                >
                  <option value="all">All Users</option>
                  <option value="admin">Admins</option>
                  <option value="user">Regular Users</option>
                </select>
              </div>
              <div className="flex gap-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white focus:outline-none focus:border-[#FF7A00]"
                >
                  <option value="createdAt">Sort by Created Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="email">Sort by Email</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2 bg-[#FF7A00] text-black font-black tracking-tighter rounded-lg hover:bg-[#FF3366] hover:text-white transition-all duration-300"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[#FF7A00]/20">
                    <th className="text-left py-4 px-4 text-[#FFB4A2] font-black tracking-tighter">User Info</th>
                    <th className="text-center py-4 px-4 text-[#FFB4A2] font-black tracking-tighter">Role</th>
                    <th className="text-center py-4 px-4 text-[#FFB4A2] font-black tracking-tighter">Activity</th>
                    <th className="text-center py-4 px-4 text-[#FFB4A2] font-black tracking-tighter">Created At</th>
                    <th className="text-center py-4 px-4 text-[#FFB4A2] font-black tracking-tighter">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user._id} className="border-b border-[#FF7A00]/20">
                      <td className="py-4 px-4">
                        <div className="text-white font-black tracking-tighter">{user.name}</div>
                        <div className="text-[#FFB4A2] text-sm">{user.email}</div>
                        {user.socialLinks && (
                          <div className="flex gap-2 mt-2">
                            {user.socialLinks.instagram && (
                              <a href={user.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-[#FFB4A2] hover:text-[#FF7A00]">
                                <i className="fab fa-instagram"></i>
                              </a>
                            )}
                            {user.socialLinks.twitter && (
                              <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-[#FFB4A2] hover:text-[#FF7A00]">
                                <i className="fab fa-twitter"></i>
                              </a>
                            )}
                            {user.socialLinks.website && (
                              <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-[#FFB4A2] hover:text-[#FF7A00]">
                                <i className="fas fa-globe"></i>
                              </a>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className={`inline-block px-3 py-1 rounded-full text-sm font-black tracking-tighter ${
                            user.isAdmin 
                              ? 'bg-[#FFD600]/20 text-[#FFD600]' 
                              : 'bg-[#FF7A00]/20 text-[#FF7A00]'
                          }`}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </div>
                          <button
                            onClick={() => handleToggleAdmin(user._id, user.isAdmin)}
                            className="text-sm text-[#FFB4A2] hover:text-[#FF7A00] transition-colors"
                          >
                            {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col gap-1">
                          <div className="text-[#FFB4A2] text-sm">
                            <i className="fas fa-heart mr-1"></i>
                            {user.liked?.length || 0} Likes
                          </div>
                          <div className="text-[#FFB4A2] text-sm">
                            <i className="fas fa-calendar-check mr-1"></i>
                            {user.goingTo?.length || 0} Going
                          </div>
                          {user.lastLogin && (
                            <div className="text-[#FFB4A2] text-sm">
                              <i className="fas fa-clock mr-1"></i>
                              Last login: {formatDate(user.lastLogin)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-[#FFB4A2] text-sm">
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="px-4 py-2 rounded-lg font-black tracking-tighter bg-[#FF3366] text-white hover:bg-[#FF3366]/80 transition-all duration-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
        >
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Delete User
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete the user {userToDelete?.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminProtectedRoute>
  );
} 

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { UserButton } from "@clerk/clerk-react";

interface Blog {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  published: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  createdAt: string;
  blogCount: number;
}

export default function UserProfile() {
  const URL = import.meta.env.VITE_URL;
  const { getToken } = useAuth();
  const [userBlogs, setUserBlogs] = useState<Blog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('blogs');

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      // Fetch user profile
      const profileResponse = await axios.get(`${URL}/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUserProfile(profileResponse.data);
      
      // Fetch user blogs
      const blogsResponse = await axios.get(`${URL}/api/user/blogs`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUserBlogs(blogsResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleDeleteBlog = async (blogId: string) => {
    try {
      setDeleteLoading(blogId);
      const token = await getToken();
      await axios.delete(`${URL}/api/user/blog/${blogId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Remove blog from state
      setUserBlogs(prevBlogs => prevBlogs.filter(blog => blog.id !== blogId));
      setDeleteLoading(null);
    } catch (error) {
      console.error('Error deleting blog:', error);
      setError('Failed to delete blog');
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-21">
        <Skeleton height={40} className="mb-6" />
        <Skeleton count={3} height={20} className="mb-2" />
        <div className="mt-8">
          <Skeleton count={5} height={100} className="mb-4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-21">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          <p className="font-medium">{error}</p>
          <Link 
            to="/blogs" 
            className="mt-4 inline-block text-sm text-red-700 hover:text-red-900"
          >
            ← Back to Blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-21">
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">My Profile</h1>
            <div className="mt-2 text-gray-600">
              <p>{userProfile?.email}</p>
              <p className="text-sm">Member since {userProfile && new Date(userProfile.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <Link 
            to="/create-blog" 
            className="px-4 sm:px-6 py-2 sm:py-3 bg-black text-white text-sm sm:text-base rounded-full shadow-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Create New Blog
          </Link>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('blogs')}
              className={`pb-4 px-1 border-b-2 font-medium ${
                activeTab === 'blogs'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Blogs ({userBlogs.length})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`pb-4 px-1 border-b-2 font-medium ${
                activeTab === 'stats'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Stats & Analytics
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-4 px-1 border-b-2 font-medium ${
                activeTab === 'settings'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Account Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'blogs' && (
            <div className="space-y-6">
              {userBlogs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No blogs yet</h3>
                  <p className="mt-1 text-gray-500">Get started by creating your first blog post.</p>
                </div>
              ) : (
                userBlogs.map(blog => (
                  <div key={blog.id} className="border-b border-gray-200 pb-8">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <span className={`px-2 py-1 rounded-full ${blog.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {blog.published ? 'Published' : 'Draft'}
                      </span>
                      <span>•</span>
                      <time>{new Date(blog.createdAt).toLocaleDateString()}</time>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                      <Link to={`/blog/${blog.id}`} className="hover:text-blue-600">
                        {blog.title}
                      </Link>
                    </h2>
                    <p className="text-gray-600 line-clamp-3">
                      {blog.content.replace(/<[^>]*>/g, '')}
                    </p>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleDeleteBlog(blog.id)}
                        disabled={deleteLoading === blog.id}
                        className="text-sm px-3 py-1 text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        {deleteLoading === blog.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Total Blogs</h3>
                  <p className="text-2xl font-bold mt-2">{userBlogs.length}</p>
                </div>
                <div className="border p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Published</h3>
                  <p className="text-2xl font-bold mt-2">
                    {userBlogs.filter(blog => blog.published).length}
                  </p>
                </div>
                <div className="border p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Member For</h3>
                  <p className="text-2xl font-bold mt-2">
                    {userProfile && Math.floor((new Date().getTime() - new Date(userProfile.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-8">
                <h3 className="text-lg font-bold mb-4">Activity Overview</h3>
                <p className="text-gray-500">
                  Detailed analytics coming soon - track views, engagement, and reader demographics.
                </p>
              </div>
            </div>
          )}

{activeTab === 'settings' && (
  <div className="space-y-6">
    <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Account Settings</h2>

      <div className="space-y-6">
        {/* Profile Info Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-800">Profile Information</h3>
            <p className="text-gray-600 text-sm max-w-md">
              Manage your personal details and access settings through Clerk's secure authentication platform.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <UserButton />
          </div>
        </div>

        {/* Add more settings sections here as needed */}
      </div>
    </div>
  </div>
)}

        </div>
      </div>
    </div>
  );
}

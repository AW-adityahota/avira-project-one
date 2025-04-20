import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'


interface Blog {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    email: string;
  };
}

type SortOption = 'newest' | 'oldest' | 'all';

export default function AllBlogs() {
  const URL = import.meta.env.VITE_URL;

  const { getToken } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [pages, setPages] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  const fetchBlogs = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${URL}/api/blogs?pages=${pages}&sort=${sortOption}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTotalPages(response.data.totalPages);
      setBlogs(response.data.all);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [pages, sortOption]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value as SortOption);
    setPages(1); // Reset to first page when changing sort
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-21">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Blog Posts</h1>
        <div className="flex items-center">
          <label htmlFor="sort-select" className="mr-2 text-gray-700">Sort by:</label>
          <select
            id="sort-select"
            value={sortOption}
            onChange={handleSortChange}
            className="border rounded py-1 px-3 bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="all">View All</option>
          </select>
        </div>
      </div>

      <div className="space-y-8">
        {blogs.map(blog => (
          <article key={blog.id} className="border-b border-gray-200 pb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span className="font-medium">{blog.author.email}</span>
              <span>•</span>
              <time>{new Date(blog.createdAt).toLocaleDateString()}</time>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              <Link to={`/blog/${blog.id}`} className="hover:text-blue-600">
                {blog.title}
              </Link>
            </h2>
            <p className="text-gray-600 line-clamp-3">
              {blog.content}
            </p>
          </article>
        ))}

        {blogs.length === 0 && (
          <Skeleton count={10} />
        )}

        {sortOption !== 'all' && (
          <div className="flex gap-4 mt-4 justify-center">
            <button
              className="border px-3 py-1 rounded disabled:opacity-50"
              disabled={pages === 1}
              onClick={() => setPages(pages - 1)}
            >
              Prev
            </button>
            <span>Page {pages} of {totalPages}</span>
            <button
              className="border px-3 py-1 rounded disabled:opacity-50"
              disabled={pages === totalPages}
              onClick={() => setPages(pages + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
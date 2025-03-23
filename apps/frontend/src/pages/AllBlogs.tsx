// AllBlogs.tsx
import { useState, useEffect } from 'react';
import { data, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

interface Blog {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    email: string;
  };
}

export default function AllBlogs() {
  const URL = import.meta.env.VITE_URL; 
  
  const { getToken } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [pages,setPages]=useState(1); 
  const [totalPages, setTotalPages]  = useState(1); 

  const fetchBlogs = async () => {
    try {
      const token = await getToken(); 
      const response = await axios.get(`${URL}/api/blogs?pages=${pages}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}` 
        }
      })
      setTotalPages(response.data.totalPages);
      setBlogs(response.data.all);

    } catch (error) {
      console.error('Error fetching blogs:', error);
    }
  };
  useEffect(() => {
    fetchBlogs();
  }, [pages]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-bold mb-8">Latest Blog Posts</h1>
      
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


            <div className="flex gap-4 mt-4">
                <button 
                    className="border px-3 py-1 rounded" 
                    disabled={pages === 1} 
                    onClick={() => setPages(pages - 1)}
                >
                    Prev
                </button>
                <span>Page {pages} of {totalPages}</span>
                <button 
                    className="border px-3 py-1 rounded" 
                    disabled={pages === totalPages} 
                    onClick={() => setPages(pages + 1)}
                >
                    Next
                </button>
            </div>



      </div>
    </div>
  );
}
  
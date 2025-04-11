import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import parse, { DOMNode, Element, Text } from 'html-react-parser';

interface Blog {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    email: string;
  };
}

// Type guards using html-react-parser types
const isElement = (node: DOMNode): node is Element => {
  return (node as Element).type === 'tag';
};

const isText = (node: DOMNode): node is Text => {
  return (node as Text).type === 'text';
};

export default function BlogDetails() {
  const URL = import.meta.env.VITE_URL;
  const { blogid } = useParams<{ blogid: string }>();
  const { getToken } = useAuth();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(`${URL}/api/blogs/${blogid}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.uniqueblog) {
          setBlog(response.data.uniqueblog);
        } else {
          setError('Blog not found');
        }
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError('Failed to load blog post');
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [blogid, getToken, URL]);

  const parseContentWithCodeBlocks = (content: string) => {
    return parse(content, {
      replace: (domNode) => {
        if (isElement(domNode) && domNode.name === 'pre') {
          // Cast children to DOMNode[]
          const children = domNode.children as DOMNode[];
          const codeElement = children.find(
            (child): child is Element =>
              isElement(child) && child.name === 'code'
          );
  
          if (codeElement) {
            // Cast children to DOMNode[] before filtering
            const code = (codeElement.children as DOMNode[])
              .filter(isText)
              .map((child) => child.data)
              .join('\n');
            
            // Check for a data-language attribute on the pre element
            const language = domNode.attribs && domNode.attribs['data-language']
              ? domNode.attribs['data-language']
              : 'javascript';
  
            return (
              <SyntaxHighlighter 
                language={language} 
                style={vscDarkPlus}
                customStyle={{
                  borderRadius: '8px',
                  padding: '1.5rem',
                  margin: '2rem 0',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  overflowX: 'auto'
                }}
                PreTag="div"
              >
                {code}
              </SyntaxHighlighter>
            );
          }
        }
        return domNode;
      }
    });
  };
  

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
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

  if (!blog) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <article className="prose lg:prose-xl max-w-none">
        <header className="mb-12">
          <Link 
            to="/blogs" 
            className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
          >
            ← Back to Blogs
          </Link>
          <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium">{blog.author.email}</span>
            <span>•</span>
            <time dateTime={blog.createdAt}>
              {new Date(blog.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>
        </header>

        <div className="text-lg leading-relaxed text-gray-800">
          {parseContentWithCodeBlocks(blog.content)}
        </div>
      </article>
    </div>
  );
}
// BlogEditor.tsx
import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';


export default function BlogEditor() {
  const URL = import.meta.env.VITE_URL; 

  const { getToken } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
        setFile(event.target.files[0]);
    }
};

const handleUpload = async () => {
  if (!file) {
    setMessage("Please select a file");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  const token = await getToken();

  try {
    const response = await axios.post(`${URL}/api/user/uploads`, formData, {
      headers: { 
        "Content-Type": "multipart/form-data", 
        Authorization: `Bearer ${token}` 
      },
    });
      setContent(response.data.text);
  } catch (error) {
    setMessage("Failed to upload file - check file format");
    console.error("Upload error:", error);
  }
};

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      setMessage('Please fill in both title and content');
      return;
    }

    try { 
      setLoading(true);
      const token = await getToken();
      
      const response = await fetch(`${URL}/api/user/blog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, content })
      });

      if (!response.ok) throw new Error('Publishing failed');
      
      setMessage('Blog published successfully!');
      setTitle('');
      setContent('');
    } catch (error) {
      console.error("Publish error:", error);
      setMessage(error instanceof Error ? error.message : "Failed to publish blog");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-4xl mx-auto px-4 py-21">
      <div className="mb-8">
        {message && (
          <div className={`p-4 rounded-lg ${message.includes('success') ? 
            'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}
      </div>

<input
  type="text"
  placeholder="Blog Title"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  className="w-full text-5xl font-bold mb-8 border-none 
           placeholder-gray-400 focus:outline-none
           focus:ring-0 p-2 rounded-lg"
/>

<div className="p-4 max-w-xl mx-auto flex items-center space-x-4">
<button 
    onClick={handleUpload} 
    className="bg-black text-white font-medium px-4 py-2 mb-3 rounded-full hover:bg-neutral-900 cursor-pointer"
  >
    Upload
  </button>
  <input
    type="file"
    onChange={handleFileChange}
    className="block w-full text-sm text-gray-500
      file:mr-4 file:py-2 file:px-4
      file:rounded-full file:border-0
      file:text-sm file:font-semibold
      file:bg-black/10 file:text-black
      hover:file:bg-black/20 mb-4"
  />
</div>

      <textarea
        placeholder="Write your story..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-96 text-xl leading-relaxed border-none 
                 placeholder-gray-400 focus:outline-none
                 focus:ring-0 p-2 rounded-lg resize-none"
      />

      <div className="flex justify-center items-center "> 
        <button
        className='bg-black text-white font-medium mt-12 px-4 py-2 rounded-full hover:bg-neutral-900 cursor-pointer'
          onClick={handlePublish}
          disabled={loading}>
          {loading ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  );
}

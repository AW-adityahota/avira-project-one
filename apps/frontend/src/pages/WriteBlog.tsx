import { useState, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import Editor from '@monaco-editor/react';

const WriteBlog = () => {
  const URL = import.meta.env.VITE_URL;
  const { getToken } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [code, setCode] = useState('');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const editorRef = useRef(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const insertCodeBlock = () => {
    if (code.trim()) {
      const formattedCode = `<pre class="code-block" data-language="${selectedLanguage}"><code>${code}</code></pre>`;
      setContent(prev => prev + formattedCode + '\n\n');
      setCode('');
      setShowCodeEditor(false);
    }
  };
  

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-22 sm:py-22">
        {message && (
          <div className={`mb-6 p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
            message.includes('success') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
  
          <input
          type="text"
          placeholder="Blog Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-3xl sm:text-5xl font-serif font-bold mb-6 sm:mb-8 p-2 sm:p-3 border-0 focus:ring-0 focus:outline-none placeholder-gray-400"
        />
  
        <div className="sticky top-0 bg-white z-10 py-3 sm:py-4 border-b">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <button
              onClick={() => setShowCodeEditor(!showCodeEditor)}
              className="px-3 py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              {showCodeEditor ? 'Hide Code' : 'Add Code'}
            </button>
            <input
              type="file"
              onChange={handleFileChange}
              className="text-xs sm:text-sm file:mr-2 sm:file:mr-4 file:py-2 file:px-3 sm:file:px-4 file:rounded file:border-0 file:text-xs sm:file:text-sm file:bg-gray-100 file:hover:bg-gray-200 w-full sm:w-auto mt-2 sm:mt-0"
            />
            <button 
              onClick={handleUpload} 
              className="px-3 py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded mt-2 sm:mt-0"
            >
              Upload
            </button>
          </div>
        </div>
  
        {showCodeEditor && (
          <div className="my-4 sm:my-6 border rounded-lg overflow-hidden">
            <Editor
              height="250px"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'off',
                scrollBeyondLastLine: false
              }}
            />
            <div className="bg-gray-100 p-3 sm:p-4">
              <div className="mb-3">
                <label htmlFor="language-select" className="mr-2 text-sm">Language:</label>
                <select
                  id="language-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-2 py-1 text-sm border rounded"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java</option>
                  <option value="rust">Rust</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 sm:gap-4">
                <button
                  onClick={() => setShowCodeEditor(false)}
                  className="px-3 py-2 text-xs sm:text-sm hover:bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={insertCodeBlock}
                  className="px-3 py-2 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800"
                >
                  Insert
                </button> 
              </div>
            </div>
          </div>
        )}
  
        <textarea
          placeholder="Write your story..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-screen text-lg sm:text-xl leading-relaxed font-serif text-gray-800 p-2 sm:p-3 focus:outline-none placeholder-gray-400 resize-none"
          style={{ lineHeight: '1.8' }}
        />
  
        <div className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8">
          <button
            onClick={handlePublish}
            disabled={loading}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-black text-white text-sm sm:text-base rounded-full shadow-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WriteBlog; 
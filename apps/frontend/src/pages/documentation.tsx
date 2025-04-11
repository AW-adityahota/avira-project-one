import { useAuth } from '@clerk/clerk-react';
import { useState } from 'react';

const URL = import.meta.env.VITE_URL;

export default function Documentation() {
  const { getToken } = useAuth();
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGetToken = async () => {
    const t = await getToken();
    setToken(t || '');
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-21">
      <h1 className="text-4xl font-bold mb-8">API Documentation</h1>
      
      <div className="prose mb-8">
        <p>
          Access our interactive API documentation using your JWT token. Follow these steps:
        </p>
        <ol>
          <li>Get your authentication token below</li>
          <li>Visit the <button onClick={()=>(
            window.location.href = `${URL}/documentation/`
          )} className="text-blue-600" >API Documentation</button></li>
          <li>Click the "Authorize" button and paste your token</li>
        </ol>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleGetToken}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            Generate API Token
          </button>
          {token && (
            <button
              onClick={copyToClipboard}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {copied ? 'Copied!' : 'Copy Token'}
            </button>
          )}
        </div>
        
        {token && (
          <div className="bg-white p-4 rounded border border-gray-200 break-all">
            <code className="text-sm">Bearer {token}</code>
          </div>
        )}

        <p className="text-sm text-gray-600 mt-4">
          Note: This token is valid for your current session only. 
          Keep it secure and never share it publicly.
        </p>
      </div>
    </div>
  );
}
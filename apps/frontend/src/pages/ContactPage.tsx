import { Link } from 'react-router-dom';

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-22">
      <div className="prose">
        <h1 className="text-4xl font-bold mb-8">Get in Touch</h1>
        
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-2 text-gray-600">
              <p>📍Ghatikia, Bhubaneswar, Odisha</p>
              <p>✉️ adityahota99@gmail.com</p>
            </div>
          </div>

        </div>

        <div className="mt-12 border-t pt-8">
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
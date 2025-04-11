import { Link } from 'react-router-dom';

export default function LegalPage() {

  return (
    <div className="max-w-4xl mx-auto px-4 py-21">
      <div className="prose">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy and Terms of Service</h1>
        
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Introduction</h2>
          <p className="text-gray-600">
            This governs your use of the InkWell platform.
            By accessing or using our services, you agree to comply with these terms.
          </p>

          <h2 className="text-2xl font-semibold">Data Collection</h2>
          <p className="text-gray-600">
            We collect minimal data necessary to provide our services, including:
          </p>
          <ul className="list-disc pl-6 text-gray-600">
            <li>Account information for registered users</li>
            <li>Content you create on our platform</li>
            <li>Technical data for service optimization</li>
          </ul>

          <h2 className="text-2xl font-semibold">Your Rights</h2>
          <p className="text-gray-600">
            You have the right to access, modify, or delete your personal data
            through your account settings or by contacting our support team.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </section>

        <div className="mt-12 border-t pt-8">
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
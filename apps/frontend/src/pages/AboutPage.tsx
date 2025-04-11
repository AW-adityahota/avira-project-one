import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-21">
      <div className="prose"> 

        <h1 className="text-4xl font-bold mb-8">Our Story</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold">From Idea to Ink</h2>
            <p className="text-gray-600">
            Founded in 2025, InkWell began as a passion project born from the idea that writing 
            and coding can coexist in perfect harmony. Our vision was to build a platform that truly meets the unique needs of both 
            writers and developers—a place where creativity and technology merge effortlessly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Our Mission</h2>
            <p className="text-gray-600">
            We empower creators by blending the art of storytelling with the precision of code. Our goal is to craft an open and accessible 
            platform that pushes the boundaries of digital publishing, inviting a community where ideas flourish through the fusion of 
            writing and modern technology
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">The Team</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">Founder and Tech Lead</h3>
                <p className="text-gray-600">Aditya Hota</p>
                <p className="text-sm text-gray-500">Full Stack Engineer</p>
              </div>
            </div>
          </section>
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
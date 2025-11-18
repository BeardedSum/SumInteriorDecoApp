import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-secondary-off-white">
      {/* Header */}
      <header className="bg-primary-navy text-white py-4 shadow-lg">
        <div className="container-custom">
          <h1 className="text-3xl font-montserrat font-bold">🎨 Sum Decor AI</h1>
          <p className="text-sm opacity-90 mt-1">Luxury Living Redefined with AI</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Card */}
          <div className="card-elevated text-center mb-8">
            <h2 className="text-4xl font-montserrat font-bold text-gradient mb-4">
              Welcome to Sum Decor AI
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              AI-Powered Interior Design & Virtual Staging Platform
            </p>
            <div className="flex gap-4 justify-center">
              <button className="btn-primary">Get Started</button>
              <button className="btn-secondary">Learn More</button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card text-center">
              <div className="text-4xl mb-3">🏠</div>
              <h3 className="text-xl font-semibold mb-2">Virtual Staging</h3>
              <p className="text-gray-600 text-sm">
                Fill empty rooms with AI-generated furniture
              </p>
            </div>
            <div className="card text-center">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="text-xl font-semibold mb-2">Style Transformation</h3>
              <p className="text-gray-600 text-sm">
                Transform your space with 15+ design styles
              </p>
            </div>
            <div className="card text-center">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Instant Results</h3>
              <p className="text-gray-600 text-sm">
                Get professional designs in 30 seconds
              </p>
            </div>
          </div>

          {/* Counter Demo */}
          <div className="card text-center">
            <h3 className="text-xl font-semibold mb-4">Interactive Demo</h3>
            <p className="text-gray-600 mb-4">Count: {count}</p>
            <button
              className="btn-accent"
              onClick={() => setCount((count) => count + 1)}
            >
              Increment
            </button>
          </div>

          {/* Info Section */}
          <div className="mt-12 bg-gradient-primary text-white rounded-2xl p-8">
            <h3 className="text-2xl font-montserrat font-bold mb-4">
              🚀 Application Status
            </h3>
            <div className="space-y-2 text-sm">
              <p>✅ Frontend: Vite + React + TypeScript + TailwindCSS</p>
              <p>✅ Backend: Node.js + Express + TypeORM + PostgreSQL</p>
              <p>✅ AI Services: Replicate + Gemini + Claude</p>
              <p>✅ Payments: Paystack + Flutterwave</p>
              <p>✅ Storage: Cloudinary</p>
              <p>✅ PWA: Service Worker + Offline Mode</p>
            </div>
            <p className="mt-4 text-sm opacity-90">
              Check the README.md file for complete setup instructions and next steps!
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary-navy-dark text-white py-6 mt-12">
        <div className="container-custom text-center">
          <p className="text-sm opacity-75">
            © 2024 Sum Decor AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

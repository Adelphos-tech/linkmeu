import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Heart,
  Dumbbell,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Calendar
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const categories = [
    {
      title: 'Jobs',
      description: 'Career opportunities and employment',
      icon: Briefcase,
      color: 'text-gray-900',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200'
    },
    {
      title: 'Physical Community',
      description: 'Local connections and belonging',
      icon: Users,
      color: 'text-gray-900',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200'
    },
    {
      title: 'Business Investors',
      description: 'Investment and funding opportunities',
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
      highlight: true
    },
    {
      title: 'Sports & Wellness',
      description: 'Fitness, teams, and healthy living',
      icon: Dumbbell,
      color: 'text-red-600',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
      highlight: true
    },
    {
      title: 'Education',
      description: 'Learning and skill development',
      icon: GraduationCap,
      color: 'text-gray-900',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200'
    },
    {
      title: 'Events',
      description: 'Experiences and celebrations',
      icon: Calendar,
      color: 'text-gray-900',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img 
                src="/event/linkmeu-logo.png" 
                alt="LinkMeU Logo" 
                className="h-10 w-auto"
              />
              <div>
                <div className="text-2xl font-bold leading-tight">
                  <span className="text-gray-900">LINK</span>
                  <span className="text-red-600">MEU</span>
                </div>
                <div className="text-xs text-gray-600 -mt-1">Connecting Me to You</div>
              </div>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#categories" className="text-gray-700 hover:text-gray-900 text-base font-medium">Categories</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-gray-900 text-base font-medium">How it works</a>
              <button 
                onClick={() => navigate('/events')}
                className="px-6 py-2.5 bg-black hover:bg-gray-900 text-white rounded-lg font-medium transition-all"
              >
                Get Early access
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-left">
            {/* Main Headline */}
            <h1 className="text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              <span className="text-gray-900">Link Me. </span>
              <span className="text-red-600">You Matter Most.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-gray-700 mb-12 max-w-2xl leading-relaxed">
              One place to connect with the right people, for the right purpose — without noise.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/events')}
                className="px-8 py-4 bg-black hover:bg-gray-900 text-white rounded-xl font-semibold text-lg transition-all"
              >
                Get Started
              </button>
              <button 
                onClick={() => navigate('/events')}
                className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 rounded-xl font-semibold text-lg transition-all"
              >
                Explore Categories
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-20 px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Connection Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
              Designed to avoid overlap. Each category has one clear purpose, so matching stays clean and relevant.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <div 
                key={index}
                onClick={() => navigate('/events')}
                className={`group cursor-pointer ${category.bgColor} border-2 ${category.borderColor} rounded-2xl p-8 hover:border-gray-400 transition-all duration-300 hover:shadow-lg`}
              >
                <category.icon className={`w-8 h-8 ${category.color} mb-6`} />
                <h3 className={`text-2xl font-bold mb-3 ${category.color}`}>
                  {category.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 lg:px-8 bg-[#F5F5F0]">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-16 leading-relaxed">
            Connect with people who share your purpose. Whether it's building community, growing professionally, or exploring new opportunities — LinkMeU makes meaningful connections simple.
          </p>
          <button 
            onClick={() => navigate('/events')}
            className="px-8 py-4 bg-black hover:bg-gray-900 text-white rounded-xl font-semibold text-lg transition-all"
          >
            Explore Events
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 lg:px-8 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <img 
                src="/event/linkmeu-logo.png" 
                alt="LinkMeU Logo" 
                className="h-8 w-auto"
              />
              <div>
                <div className="text-xl font-bold leading-tight">
                  <span className="text-gray-900">LINK</span>
                  <span className="text-red-600">MEU</span>
                </div>
              </div>
            </div>
            <div className="text-gray-600 text-sm">
              © 2025 LinkMeU. Link Me. You Matter Most.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

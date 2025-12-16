import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  QrCode, 
  Users, 
  BarChart3, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Globe
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Calendar,
      title: 'Corporate Events',
      subtitle: 'Professional gatherings',
      description: 'Conferences, seminars, and business meetings with enterprise-grade tools',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Users,
      title: 'Community Meetups',
      subtitle: 'Build connections',
      description: 'Local gatherings, networking events, and community celebrations',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Sparkles,
      title: 'Workshops & Training',
      subtitle: 'Learning experiences',
      description: 'Educational sessions, skill-building workshops, and training programs',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Globe,
      title: 'Virtual Events',
      subtitle: 'Connect globally',
      description: 'Online webinars, virtual conferences, and hybrid event solutions',
      color: 'from-green-500 to-teal-500'
    }
  ];

  const highlights = [
    {
      icon: QrCode,
      title: 'Smart QR Check-in',
      description: 'Lightning-fast attendee check-in with generated QR codes'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Track registrations, attendance, and engagement metrics instantly'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with Neon PostgreSQL database'
    },
    {
      icon: Zap,
      title: 'Instant Setup',
      description: 'Create and launch your event in minutes, not hours'
    }
  ];

  const stats = [
    { value: '1000+', label: 'Events Hosted' },
    { value: '50K+', label: 'Attendees' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.9/5', label: 'User Rating' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark via-dark-lighter to-dark">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-dark/95 backdrop-blur-lg shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/events')}>
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-pink-500 rounded-xl flex items-center justify-center transform rotate-12">
                <Calendar className="w-7 h-7 text-white -rotate-12" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  <span className="text-white">Events</span>
                  <span className="text-primary">X</span>
                </div>
                <div className="text-xs text-gray-400 -mt-1">Elevate Every Moment</div>
              </div>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How it Works</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <button 
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/events')}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all transform hover:scale-105"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Production-Ready Event Management</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">Create Events.</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-pink-500 to-purple-500 text-transparent bg-clip-text">
                Connect People.
              </span>
              <br />
              <span className="text-white">Make It</span>{' '}
              <span className="text-primary">Memorable.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-400 mb-12 leading-relaxed max-w-3xl mx-auto">
              The all-in-one platform to organize, manage, and scale your events with 
              <span className="text-white font-semibold"> QR check-ins</span>, 
              <span className="text-white font-semibold"> real-time analytics</span>, and 
              <span className="text-white font-semibold"> enterprise security</span>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button 
                onClick={() => navigate('/events')}
                className="group w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg shadow-primary/25 flex items-center justify-center space-x-2"
              >
                <span>Start Creating Events</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/events')}
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
              >
                Browse Events
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Event Categories
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built for every type of event. Each category optimized for maximum impact and seamless experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-dark-lighter/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 cursor-pointer hover:transform hover:scale-105"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{feature.title}</h3>
                <div className="text-sm text-primary mb-3">{feature.subtitle}</div>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-dark to-dark-lighter">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Why Choose EventsX?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to create unforgettable events, all in one powerful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {highlights.map((highlight, index) => (
              <div 
                key={index}
                className="flex items-start space-x-4 bg-dark-lighter/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <highlight.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{highlight.title}</h3>
                  <p className="text-gray-400">{highlight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Launch Your Event in Minutes
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Simple, fast, and powerful. Get your event up and running in just 3 steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Your Event', description: 'Fill in the details, set the date, and customize your event page in minutes.' },
              { step: '02', title: 'Share & Promote', description: 'Generate QR codes, share registration links, and reach your audience instantly.' },
              { step: '03', title: 'Manage Seamlessly', description: 'Track registrations, check-in attendees with QR codes, and analyze engagement in real-time.' }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-primary/10 mb-4">{item.step}</div>
                <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 -right-4 text-primary">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-3xl"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="bg-gradient-to-r from-primary to-pink-500 rounded-3xl p-12 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to Elevate Your Events?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of event organizers who trust EventsX to create memorable experiences.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate('/events')}
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-100 text-primary rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Get Started Free
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-pink-500 rounded-lg flex items-center justify-center transform rotate-12">
                <Calendar className="w-6 h-6 text-white -rotate-12" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">
                  Events<span className="text-primary">X</span>
                </div>
                <div className="text-xs text-gray-400">Elevate Every Moment</div>
              </div>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 EventsX. Production-ready event management platform.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

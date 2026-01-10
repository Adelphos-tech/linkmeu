import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Briefcase,
    Building2,
    Film,
    ShoppingBag,
    Users,
    Calendar,
    ArrowRight,
    Plus,
    Search,
    MapPin,
    Phone
} from 'lucide-react';

// API Base URL
const API_BASE_URL = 'http://localhost:3001/api';

const MainPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('home');
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        category: 'business',
        purpose: 'sale',
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        title: '',
        description: '',
        currency: 'SGD',
        budget: '',
        revenue: '',
        location: '',
        country: 'Singapore',
        contact: '',
        email: '',
        sellerName: '',
        sellerType: 'owner'
    });

    const categories = [
        {
            id: 'business',
            title: 'Business',
            subtitle: 'Buy • Sell • Invest',
            icon: Briefcase,
            color: 'from-amber-500 to-orange-600',
            bgColor: 'bg-amber-50'
        },
        {
            id: 'property',
            title: 'Properties',
            subtitle: 'Buy • Sell • Rent',
            icon: Building2,
            color: 'from-blue-500 to-indigo-600',
            bgColor: 'bg-blue-50'
        },
        {
            id: 'movies',
            title: 'Movies',
            subtitle: 'Buy • Sell • Distribute',
            icon: Film,
            color: 'from-purple-500 to-pink-600',
            bgColor: 'bg-purple-50'
        },
        {
            id: 'products',
            title: 'Products',
            subtitle: 'Buy • Sell • Distribute',
            icon: ShoppingBag,
            color: 'from-green-500 to-emerald-600',
            bgColor: 'bg-green-50'
        },
        {
            id: 'jobs',
            title: 'Jobs',
            subtitle: 'Join Opportunities',
            icon: Users,
            color: 'from-slate-600 to-gray-800',
            bgColor: 'bg-gray-50',
            isLink: true,
            href: '/events'
        },
        {
            id: 'events',
            title: 'Events',
            subtitle: 'Join Experiences',
            icon: Calendar,
            color: 'from-red-500 to-rose-600',
            bgColor: 'bg-red-50',
            isLink: true,
            href: '/events'
        }
    ];

    useEffect(() => {
        if (activeTab !== 'home' && !categories.find(c => c.id === activeTab)?.isLink) {
            fetchListings(activeTab);
        }
    }, [activeTab]);

    const fetchListings = async (category) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/listings?category=${category}`);
            const data = await response.json();
            if (data.success) {
                setListings(data.listings);
            }
        } catch (error) {
            console.log('API not available');
            setListings([]);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/listings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (result.success) {
                alert('Listing submitted successfully!');
                setShowForm(false);
                if (activeTab !== 'home') fetchListings(activeTab);
                window.open(result.whatsappLink, '_blank');
            }
        } catch {
            alert('Submitted! Contact us on WhatsApp: +65 90191311');
            setShowForm(false);
        }
    };

    const handleCategoryClick = (category) => {
        if (category.isLink) {
            navigate(category.href);
        } else {
            setActiveTab(category.id);
            setFormData(prev => ({ ...prev, category: category.id }));
        }
    };

    const purposeLabels = {
        sale: 'For Sale',
        buy: 'Want to Buy',
        rent: 'For Rent',
        invest: 'Investment'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div
                            className="flex items-center cursor-pointer"
                            onClick={() => setActiveTab('home')}
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-lg">L</span>
                            </div>
                            <div className="ml-2">
                                <span className="text-xl font-bold text-gray-900">Link</span>
                                <span className="text-xl font-bold text-red-600">MeU</span>
                            </div>
                        </div>

                        <nav className="hidden md:flex items-center space-x-1">
                            <button
                                onClick={() => setActiveTab('home')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'home' ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                Home
                            </button>
                            {categories.filter(c => !c.isLink).map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === cat.id ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {cat.title}
                                </button>
                            ))}
                            <Link
                                to="/events"
                                className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100"
                            >
                                Events
                            </Link>
                        </nav>

                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Post Listing</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Tabs */}
            <div className="md:hidden bg-white border-b overflow-x-auto">
                <div className="flex px-4 py-2 space-x-2">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'home' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        Home
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat)}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === cat.id ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                }`}
                        >
                            {cat.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'home' ? (
                    <>
                        {/* Hero Section */}
                        <section className="text-center py-16">
                            <h1 className="text-5xl md:text-6xl font-bold mb-6">
                                <span className="text-gray-900">Link Me. </span>
                                <span className="text-red-600">You Matter Most.</span>
                            </h1>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                                One platform to buy, sell, invest, rent, and connect — for business, property, movies, products, jobs, and events.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all"
                                >
                                    Post a Listing
                                </button>
                                <button
                                    onClick={() => setActiveTab('business')}
                                    className="px-8 py-4 bg-white border-2 border-gray-900 text-gray-900 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all"
                                >
                                    Explore Categories
                                </button>
                            </div>
                        </section>

                        {/* Categories Grid */}
                        <section className="py-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                                Explore Categories
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        onClick={() => handleCategoryClick(category)}
                                        className={`${category.bgColor} rounded-2xl p-8 cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-200`}
                                    >
                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-6`}>
                                            <category.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{category.title}</h3>
                                        <p className="text-gray-600 mb-4">{category.subtitle}</p>
                                        <div className="flex items-center text-gray-900 font-medium">
                                            <span>Explore</span>
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                ) : (
                    <>
                        {/* Category Listings Page */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {categories.find(c => c.id === activeTab)?.title} Listings
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {categories.find(c => c.id === activeTab)?.subtitle}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, category: activeTab }));
                                    setShowForm(true);
                                }}
                                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add Listing</span>
                            </button>
                        </div>

                        {/* Listings */}
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-gray-600 mt-4">Loading listings...</p>
                            </div>
                        ) : listings.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {listings.map((listing) => (
                                    <div key={listing.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100">
                                        <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                            <Briefcase className="w-16 h-16 text-gray-400" />
                                        </div>
                                        <div className="p-5">
                                            <span className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700 mb-2">
                                                {purposeLabels[listing.purpose] || listing.purpose}
                                            </span>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">{listing.title}</h3>
                                            <p className="text-2xl font-bold text-red-600 mb-3">{listing.currency} {listing.budget}</p>
                                            <div className="flex items-center text-gray-500 text-sm mb-2">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                {listing.location}, {listing.country}
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t">
                                                <span className="text-sm text-gray-500">
                                                    {new Date(listing.created_at).toLocaleDateString()}
                                                </span>
                                                <a
                                                    href={`https://wa.me/65${listing.contact}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center space-x-1 text-green-600 font-medium hover:text-green-700"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                    <span>Contact</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-2xl">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Search className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No listings yet</h3>
                                <p className="text-gray-600 mb-6">Be the first to post a listing!</p>
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold"
                                >
                                    Post First Listing
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Listing Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Create Listing</h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                                >
                                    {categories.filter(c => !c.isLink).map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {['sale', 'buy', 'rent', 'invest'].map(purpose => (
                                        <label
                                            key={purpose}
                                            className={`flex items-center justify-center px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${formData.purpose === purpose ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="purpose"
                                                value={purpose}
                                                checked={formData.purpose === purpose}
                                                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                                className="sr-only"
                                            />
                                            {purposeLabels[purpose]}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                                    <input type="date" value={formData.fromDate} onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                                    <input type="date" value={formData.toDate} onChange={(e) => setFormData({ ...formData, toDate: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Cafe Business for Sale" className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} placeholder="Describe what you're offering..." className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget/Price *</label>
                                    <div className="flex">
                                        <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="px-3 py-3 border border-r-0 border-gray-300 rounded-l-xl bg-gray-50">
                                            <option value="SGD">S$</option>
                                            <option value="USD">$</option>
                                            <option value="MYR">RM</option>
                                        </select>
                                        <input type="text" required value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} placeholder="Amount" className="flex-1 px-4 py-3 border border-gray-300 rounded-r-xl" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Revenue</label>
                                    <input type="text" value={formData.revenue} onChange={(e) => setFormData({ ...formData, revenue: e.target.value })} placeholder="e.g., $5,000/month" className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                                    <input type="text" required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="City / Area" className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                                    <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl">
                                        <option value="Singapore">Singapore</option>
                                        <option value="Malaysia">Malaysia</option>
                                        <option value="Indonesia">Indonesia</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact *</label>
                                    <input type="tel" required value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="+65 9XXX XXXX" className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="your@email.com" className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                                    <input type="text" required value={formData.sellerName} onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })} placeholder="Full name" className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Seller Type</label>
                                    <select value={formData.sellerType} onChange={(e) => setFormData({ ...formData, sellerType: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl">
                                        <option value="owner">Owner</option>
                                        <option value="agent">Agent</option>
                                        <option value="partner">Partner</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg">
                                Submit Listing
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-white border-t py-8 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">L</span>
                        </div>
                        <span className="font-bold text-gray-900">Link</span>
                        <span className="font-bold text-red-600">MeU</span>
                    </div>
                    <p className="text-gray-500 text-sm">© 2026 LinkMeU. Link Me. You Matter Most.</p>
                </div>
            </footer>
        </div>
    );
};

export default MainPage;

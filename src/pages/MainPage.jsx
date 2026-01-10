import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, User, Mail, CheckCircle } from 'lucide-react';

const MainPage = () => {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('parttime');
    const [formData, setFormData] = useState({
        fromDate: '',
        toDate: '',
        title: '',
        budgetMin: '',
        budgetMax: '',
        revenue: '',
        contact: '',
        email: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = [
        { id: 'parttime', label: 'Part-time Job' },
        { id: 'business', label: 'Business for Sale' },
        { id: 'property', label: 'Property for Rent' },
        { id: 'wedding', label: 'Wedding Hall Booking' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('http://localhost:3001/api/listings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: activeCategory,
                    purpose: 'sale',
                    ...formData,
                    budget: `${formData.budgetMin} - ${formData.budgetMax}`,
                    sellerName: formData.contact,
                    location: 'Singapore',
                    country: 'Singapore',
                    description: formData.title
                })
            });

            const result = await response.json();
            if (result.success) {
                alert('Listing submitted successfully! Admin will review shortly.');
                window.open(result.whatsappLink, '_blank');
            }
        } catch (error) {
            alert('Listing submitted! We will contact you shortly.');
        }

        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f5f0eb 0%, #e8e0d8 50%, #f0ebe6 100%)' }}>
            {/* Background decorative elements */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-100/30 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-1/3 h-48 opacity-20" style={{ background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Cpath d=\'M20,80 Q30,60 40,80 T60,80 T80,80\' fill=\'%2390be6d\' /%3E%3C/svg%3E")' }}></div>

            {/* Header */}
            <header className="px-6 lg:px-12 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <img
                        src="/linkmeu-logo.png"
                        alt="LinkMeU"
                        className="h-12 w-auto"
                    />
                </div>
                <div className="text-right text-sm text-gray-600">
                    <p>1 listing per account, editable after login.</p>
                    <p className="flex items-center justify-end gap-2">
                        Submission fee: <span className="font-semibold text-gray-800">US$1</span>
                        <span className="text-gray-400">•</span>
                        Admin approval required
                        <CheckCircle className="w-4 h-4 text-green-600" />
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col lg:flex-row gap-12">
                {/* Left Side - Form */}
                <div className="flex-1 max-w-2xl">
                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                        Create Your Listing
                    </h1>
                    <p className="text-gray-600 mb-2 text-lg">
                        Post a listing for part-time jobs, business buy/sell,<br />
                        property rent, or wedding hall booking.
                    </p>
                    <p className="text-gray-500 mb-8 text-sm">
                        Pay US$1 to submit and get admin approval required.
                    </p>

                    {/* Category Tabs */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${activeCategory === cat.id
                                        ? 'bg-gray-800 text-white shadow-lg'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* From Date / To Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="date"
                                        value={formData.fromDate}
                                        onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-600"
                                        placeholder="Select start date"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="date"
                                        value={formData.toDate}
                                        onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-600"
                                        placeholder="Select 1 date"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="Enter destription..."
                                required
                            />
                        </div>

                        {/* Budget / Revenue */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formData.budgetMin}
                                            onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                                            className="w-full pl-8 pr-3 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            placeholder="Min"
                                        />
                                    </div>
                                    <div className="relative flex-1">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formData.budgetMax}
                                            onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                                            className="w-full pl-8 pr-3 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            placeholder="Max"
                                        />
                                    </div>
                                    <select className="px-3 py-3 bg-white border border-gray-200 rounded-lg text-gray-600">
                                        <option>$</option>
                                        <option>S$</option>
                                        <option>RM</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Revenue / Profit</label>
                                <input
                                    type="text"
                                    value={formData.revenue}
                                    onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    placeholder="Enter budget, amount..."
                                />
                            </div>
                        </div>

                        {/* Contact / Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.contact}
                                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        placeholder="Contact"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        placeholder="Email your r-email..."
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer text */}
                        <p className="text-gray-500 text-sm">
                            1 listing per account. Login required. Pay US$1 to submit. Admin approval required.
                        </p>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-red-700 to-red-800 text-white rounded-lg font-semibold text-lg hover:from-red-800 hover:to-red-900 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                        >
                            <span className="text-xl">🇺🇸</span>
                            {isSubmitting ? 'Submitting...' : 'Pay & Submit Listing $1'}
                        </button>
                    </form>
                </div>

                {/* Right Side - Illustration */}
                <div className="hidden lg:flex flex-1 items-center justify-center">
                    <div className="relative">
                        {/* Clipboard illustration */}
                        <svg width="400" height="450" viewBox="0 0 400 450" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Clipboard base */}
                            <rect x="80" y="40" width="240" height="320" rx="16" fill="#D4A574" />
                            <rect x="95" y="55" width="210" height="290" rx="12" fill="#FFF8F0" />

                            {/* Clipboard clip */}
                            <rect x="140" y="25" width="120" height="40" rx="6" fill="#8B7355" />
                            <rect x="155" y="35" width="90" height="20" rx="4" fill="#C4A77D" />

                            {/* Checklist items */}
                            <rect x="115" y="80" width="20" height="20" rx="4" stroke="#8B7355" strokeWidth="2" fill="white" />
                            <path d="M120 90 L125 95 L135 82" stroke="#4CAF50" strokeWidth="3" fill="none" />
                            <rect x="145" y="82" width="140" height="12" rx="2" fill="#E8E0D8" />

                            <rect x="115" y="115" width="20" height="20" rx="4" stroke="#8B7355" strokeWidth="2" fill="white" />
                            <path d="M120 125 L125 130 L135 117" stroke="#4CAF50" strokeWidth="3" fill="none" />
                            <rect x="145" y="117" width="120" height="12" rx="2" fill="#E8E0D8" />

                            <rect x="115" y="150" width="20" height="20" rx="4" stroke="#8B7355" strokeWidth="2" fill="white" />
                            <path d="M120 160 L125 165 L135 152" stroke="#4CAF50" strokeWidth="3" fill="none" />
                            <rect x="145" y="152" width="130" height="12" rx="2" fill="#E8E0D8" />

                            <rect x="115" y="185" width="20" height="20" rx="4" stroke="#8B7355" strokeWidth="2" fill="white" />
                            <rect x="145" y="187" width="100" height="12" rx="2" fill="#E8E0D8" />

                            <rect x="115" y="220" width="20" height="20" rx="4" stroke="#8B7355" strokeWidth="2" fill="white" />
                            <rect x="145" y="222" width="80" height="12" rx="2" fill="#E8E0D8" />

                            {/* Pencil */}
                            <g transform="translate(260, 180) rotate(45)">
                                <rect x="0" y="0" width="100" height="14" rx="2" fill="#FFD700" />
                                <rect x="100" y="0" width="20" height="14" fill="#F5D0A9" />
                                <polygon points="120,0 135,7 120,14" fill="#3D3D3D" />
                                <rect x="0" y="0" width="15" height="14" rx="2" fill="#FF69B4" />
                            </g>

                            {/* Floating cards */}
                            <g transform="translate(300, 60)">
                                <rect x="0" y="0" width="70" height="50" rx="8" fill="white" filter="url(#shadow)" />
                                <rect x="10" y="10" width="50" height="6" rx="2" fill="#E8E0D8" />
                                <rect x="10" y="20" width="35" height="6" rx="2" fill="#E8E0D8" />
                                <rect x="50" y="30" width="12" height="12" rx="2" fill="#4CAF50" />
                                <path d="M53 36 L56 39 L61 33" stroke="white" strokeWidth="2" fill="none" />
                            </g>

                            <g transform="translate(320, 130)">
                                <rect x="0" y="0" width="70" height="50" rx="8" fill="white" filter="url(#shadow)" />
                                <circle cx="20" cy="18" r="12" fill="#FF6B6B" />
                                <rect x="15" y="32" width="20" height="10" fill="#FF6B6B" />
                                <rect x="35" y="10" width="30" height="6" rx="2" fill="#E8E0D8" />
                                <rect x="35" y="20" width="20" height="6" rx="2" fill="#E8E0D8" />
                                <rect x="50" y="32" width="12" height="12" rx="2" fill="#4CAF50" />
                            </g>

                            <g transform="translate(340, 210)">
                                <rect x="0" y="0" width="60" height="45" rx="8" fill="white" filter="url(#shadow)" />
                                <rect x="5" y="5" width="50" height="20" rx="4" fill="#E0E0E0" />
                                <rect x="5" y="28" width="30" height="5" rx="2" fill="#E8E0D8" />
                                <rect x="40" y="28" width="12" height="12" rx="2" fill="#4CAF50" />
                            </g>

                            {/* Green checkmark circle */}
                            <circle cx="320" cy="330" r="35" fill="#4CAF50" />
                            <path d="M300 330 L313 343 L340 315" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                            <defs>
                                <filter id="shadow" x="-4" y="-4" width="calc(100% + 8px)" height="calc(100% + 8px)">
                                    <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1" />
                                </filter>
                            </defs>
                        </svg>
                    </div>
                </div>
            </main>

            {/* Events Link */}
            <div className="fixed bottom-4 right-4">
                <button
                    onClick={() => navigate('/events')}
                    className="px-4 py-2 bg-gray-800 text-white rounded-full text-sm font-medium hover:bg-gray-900 transition-all shadow-lg"
                >
                    View Events →
                </button>
            </div>
        </div>
    );
};

export default MainPage;

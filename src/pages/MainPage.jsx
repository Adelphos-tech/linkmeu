import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, User, Mail, CheckCircle, Sparkles } from 'lucide-react';

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
        { id: 'wedding', label: 'Wedding Hall Booking' },
        { id: 'events', label: 'Events', isLink: true }
    ];

    const handleCategoryClick = (cat) => {
        if (cat.isLink) {
            navigate('/events');
        } else {
            setActiveCategory(cat.id);
        }
    };

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
                    fromDate: formData.fromDate,
                    toDate: formData.toDate,
                    title: formData.title,
                    budget: `${formData.budgetMin} - ${formData.budgetMax}`,
                    revenue: formData.revenue,
                    contact: formData.contact,
                    email: formData.email,
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
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#faf8f5] via-[#f5f0eb] to-[#ebe5dc]">
            {/* Premium gradient overlays */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(180,120,80,0.08)_0%,_transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,115,85,0.06)_0%,_transparent_50%)]"></div>

            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>

            {/* Header */}
            <header className="relative px-6 lg:px-16 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <img
                            src="/linkmeu-logo.png"
                            alt="LinkMeU"
                            className="h-14 w-auto drop-shadow-sm"
                        />
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500 text-sm">1 listing per account, editable after login.</p>
                        <p className="flex items-center justify-end gap-2 text-sm">
                            <span className="text-gray-500">Submission fee:</span>
                            <span className="font-bold text-gray-800 bg-amber-100 px-2 py-0.5 rounded">US$1</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-500">Admin approval required</span>
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative max-w-7xl mx-auto px-6 lg:px-16 py-8 flex flex-col lg:flex-row gap-16">
                {/* Left Side - Form */}
                <div className="flex-1 max-w-2xl">
                    {/* Premium badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-full mb-6">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">Premium Marketplace</span>
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                        Create Your Listing
                    </h1>
                    <p className="text-gray-600 mb-2 text-lg leading-relaxed">
                        Post a listing for part-time jobs, business buy/sell,<br className="hidden sm:block" />
                        property rent, or wedding hall booking.
                    </p>
                    <p className="text-gray-400 mb-8 text-sm">
                        Pay US$1 to submit and get admin approval required.
                    </p>

                    {/* Category Tabs - Premium Style */}
                    <div className="flex flex-wrap gap-2 mb-10">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat)}
                                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === cat.id
                                        ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg shadow-gray-900/20'
                                        : cat.isLink
                                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg hover:shadow-red-600/20'
                                            : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md border border-gray-200/50'
                                    }`}
                            >
                                {cat.label}
                                {cat.isLink && <span className="ml-1">→</span>}
                            </button>
                        ))}
                    </div>

                    {/* Form - Premium Glass Style */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* From Date / To Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="group">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-600 transition-colors" />
                                    <input
                                        type="date"
                                        value={formData.fromDate}
                                        onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-gray-700 shadow-sm"
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-600 transition-colors" />
                                    <input
                                        type="date"
                                        value={formData.toDate}
                                        onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-gray-700 shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3.5 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
                                placeholder="Enter description..."
                                required
                            />
                        </div>

                        {/* Budget / Revenue */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Budget</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formData.budgetMin}
                                            onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                                            className="w-full pl-8 pr-3 py-3.5 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
                                            placeholder="Min"
                                        />
                                    </div>
                                    <div className="relative flex-1">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formData.budgetMax}
                                            onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                                            className="w-full pl-8 pr-3 py-3.5 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
                                            placeholder="Max"
                                        />
                                    </div>
                                    <select className="px-3 py-3.5 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-600 shadow-sm cursor-pointer">
                                        <option>$</option>
                                        <option>S$</option>
                                        <option>RM</option>
                                    </select>
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Revenue / Profit</label>
                                <input
                                    type="text"
                                    value={formData.revenue}
                                    onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                                    className="w-full px-4 py-3.5 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
                                    placeholder="Enter budget, amount..."
                                />
                            </div>
                        </div>

                        {/* Contact / Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="group">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-600 transition-colors" />
                                    <input
                                        type="text"
                                        value={formData.contact}
                                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
                                        placeholder="Contact"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-600 transition-colors" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
                                        placeholder="Email your r-email..."
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer text */}
                        <p className="text-gray-400 text-sm">
                            1 listing per account. Login required. Pay US$1 to submit. Admin approval required.
                        </p>

                        {/* Submit Button - Premium Gradient */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-[#8B2323] via-[#A52A2A] to-[#8B2323] text-white rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-red-900/30 hover:shadow-xl hover:shadow-red-900/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            <span className="text-xl">🇺🇸</span>
                            <span>{isSubmitting ? 'Submitting...' : 'Pay & Submit Listing $1'}</span>
                        </button>
                    </form>
                </div>

                {/* Right Side - Premium Illustration */}
                <div className="hidden lg:flex flex-1 items-center justify-center">
                    <div className="relative">
                        {/* Decorative elements */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-2xl"></div>

                        {/* Clipboard illustration */}
                        <svg width="380" height="430" viewBox="0 0 400 450" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
                            {/* Clipboard base with gradient */}
                            <defs>
                                <linearGradient id="clipboardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#C9A87C" />
                                    <stop offset="100%" stopColor="#A68B5B" />
                                </linearGradient>
                                <linearGradient id="paperGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#FFFDF9" />
                                    <stop offset="100%" stopColor="#FFF8F0" />
                                </linearGradient>
                                <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.1" />
                                </filter>
                            </defs>

                            <rect x="80" y="40" width="240" height="320" rx="20" fill="url(#clipboardGrad)" />
                            <rect x="95" y="55" width="210" height="290" rx="14" fill="url(#paperGrad)" />

                            {/* Clipboard clip - premium metal look */}
                            <rect x="140" y="22" width="120" height="45" rx="8" fill="#6B5B4F" />
                            <rect x="145" y="27" width="110" height="35" rx="6" fill="#8B7B6B" />
                            <rect x="155" y="35" width="90" height="20" rx="4" fill="#A8998B" />

                            {/* Checklist items with premium styling */}
                            {[80, 120, 160, 200, 240].map((y, i) => (
                                <g key={i}>
                                    <rect x="115" y={y} width="22" height="22" rx="6" stroke="#C4B5A5" strokeWidth="2" fill="white" />
                                    {i < 3 && (
                                        <path d={`M120 ${y + 11} L125 ${y + 16} L137 ${y + 5}`} stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                    )}
                                    <rect x="148" y={y + 5} width={140 - i * 15} height="10" rx="3" fill="#E8E0D8" />
                                </g>
                            ))}

                            {/* Premium pencil */}
                            <g transform="translate(250, 175) rotate(45)">
                                <rect x="0" y="0" width="90" height="12" rx="2" fill="#FFD93D" />
                                <rect x="0" y="0" width="90" height="6" fill="#FFE066" />
                                <rect x="90" y="0" width="18" height="12" fill="#FFDDC1" />
                                <polygon points="108,0 120,6 108,12" fill="#2D3436" />
                                <rect x="0" y="0" width="14" height="12" rx="2" fill="#FF6B9C" />
                            </g>

                            {/* Floating cards with premium shadows */}
                            <g transform="translate(290, 50)" filter="url(#cardShadow)">
                                <rect x="0" y="0" width="75" height="55" rx="10" fill="white" />
                                <rect x="12" y="12" width="50" height="6" rx="3" fill="#E8E0D8" />
                                <rect x="12" y="24" width="35" height="6" rx="3" fill="#E8E0D8" />
                                <rect x="50" y="35" width="14" height="14" rx="4" fill="#10B981" />
                                <path d="M54 42 L57 45 L63 38" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
                            </g>

                            <g transform="translate(315, 125)" filter="url(#cardShadow)">
                                <rect x="0" y="0" width="75" height="55" rx="10" fill="white" />
                                <circle cx="22" cy="20" r="14" fill="#EF4444" />
                                <rect x="14" y="35" width="16" height="8" rx="2" fill="#EF4444" />
                                <rect x="40" y="12" width="25" height="6" rx="3" fill="#E8E0D8" />
                                <rect x="40" y="24" width="18" height="6" rx="3" fill="#E8E0D8" />
                                <rect x="52" y="38" width="14" height="14" rx="4" fill="#10B981" />
                            </g>

                            <g transform="translate(335, 205)" filter="url(#cardShadow)">
                                <rect x="0" y="0" width="60" height="50" rx="10" fill="white" />
                                <rect x="5" y="5" width="50" height="22" rx="5" fill="#DDD" />
                                <rect x="5" y="32" width="28" height="6" rx="3" fill="#E8E0D8" />
                                <rect x="38" y="30" width="14" height="14" rx="4" fill="#10B981" />
                            </g>

                            {/* Premium green checkmark circle */}
                            <circle cx="310" cy="330" r="38" fill="url(#checkGrad)" />
                            <defs>
                                <linearGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#10B981" />
                                    <stop offset="100%" stopColor="#059669" />
                                </linearGradient>
                            </defs>
                            <path d="M290 330 L303 343 L330 315" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                    </div>
                </div>
            </main>

            {/* Bottom decorative gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-emerald-50/30 via-transparent to-transparent pointer-events-none"></div>
        </div>
    );
};

export default MainPage;

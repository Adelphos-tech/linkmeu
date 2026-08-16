import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, MapPin, Briefcase, Home, Film, Package, Phone, Mail, Plus, Calendar, ChevronRight, Sparkles, Search, Filter, Heart as HeartIcon, ArrowUpDown, SlidersHorizontal, Shield, ExternalLink, Eye, Share2, Menu, X } from 'lucide-react';
import { getAllListings } from '../db/databaseAdapter';
import { ListingGridSkeleton, CategoryTabsSkeleton } from '../components/Skeleton';
import { useFavorites } from '../hooks/useFavorites';
import { useToast } from '../components/Toast';
import LeadCaptureModal from '../components/LeadCaptureModal';

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

const categoryTabVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
        opacity: 1, 
        scale: 1,
        transition: { type: "spring", stiffness: 200, damping: 20 }
    }
};

// Platform support contact (shown for unpaid listings)
const PLATFORM_CONTACT = {
    phone: '+65 9019 1311',
    email: 'linkmeucom@gmail.com'
};

// Mask contact info in text (phone numbers and emails) for unpaid listings
const maskContactInfo = (text, isPaid) => {
    if (!text || isPaid) return text;
    
    // Mask phone numbers (various formats)
    let masked = text.replace(/(\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, '***-****-****');
    
    // Mask emails
    masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '****@****.***');
    
    // Mask WhatsApp/Telegram mentions with numbers
    masked = masked.replace(/(whatsapp|telegram|wa|tele|call|contact|hp|phone|mobile|tel)[\s:]*(\+?\d[\d\s-]{6,})/gi, '$1: ***-****-****');
    
    return masked;
};

const MainPage = () => {
    const navigate = useNavigate();
    const [allListings, setAllListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const { toggleFavorite, isFavorite, favoritesCount } = useFavorites();
    const toast = useToast();
    
    // Lead capture modal state
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [selectedListing, setSelectedListing] = useState(null);
    
    // Mobile menu state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Handle listing click - show lead capture modal first
    const handleListingClick = (listing) => {
        setSelectedListing(listing);
        setShowLeadModal(true);
    };

    // After lead is captured, navigate to listing
    const handleLeadSuccess = () => {
        console.log('🎯 handleLeadSuccess called, selectedListing:', selectedListing);
        setShowLeadModal(false);
        toast.success('Thank you!', 'Your enquiry has been submitted.');
        if (selectedListing) {
            // Store in sessionStorage to prevent showing modal again on ListingDetail
            const submittedLeads = JSON.parse(sessionStorage.getItem('submittedLeads') || '[]');
            if (!submittedLeads.includes(selectedListing.id)) {
                submittedLeads.push(selectedListing.id);
                sessionStorage.setItem('submittedLeads', JSON.stringify(submittedLeads));
            }
            console.log('🚀 Navigating to listing:', selectedListing.id);
            navigate(`/listing/${selectedListing.id}`);
        } else {
            console.warn('⚠️ No selectedListing to navigate to');
        }
    };

    const sortOptions = [
        { id: 'newest', label: 'Newest First' },
        { id: 'oldest', label: 'Oldest First' },
        { id: 'price_low', label: 'Price: Low to High' },
        { id: 'price_high', label: 'Price: High to Low' },
    ];

    const categories = [
        { id: 'all', label: 'All Listings', icon: Sparkles, color: 'from-gray-600 to-gray-700' },
        { id: 'business', label: 'Business', subtitle: 'Buy | Sell | Invest', icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
        { id: 'property', label: 'Properties', subtitle: 'Buy | Sell | Rent', icon: Home, color: 'from-blue-500 to-blue-600' },
        { id: 'movies', label: 'Movies', subtitle: 'Buy | Sell | Distribute', icon: Film, color: 'from-purple-500 to-purple-600' },
        { id: 'products', label: 'Products', subtitle: 'Buy | Sell | Distribute', icon: Package, color: 'from-orange-500 to-orange-600' },
        { id: 'opportunity', label: 'Opportunity', subtitle: 'Hire | Join', icon: Briefcase, color: 'from-red-500 to-red-600' },
        { id: 'wedding', label: 'Wedding', subtitle: 'Venues | Services', icon: HeartIcon, color: 'from-pink-500 to-pink-600' },
    ];

    // Fetch all listings on mount (public access - no auth required)
    useEffect(() => {
        const fetchListings = async () => {
            setLoading(true);
            try {
                const data = await getAllListings();
                setAllListings(data || []);
            } catch (error) {
                console.error('Error fetching listings:', error);
                setAllListings([]);
            }
            setLoading(false);
        };
        fetchListings();
    }, []);

    // Filter listings by category, search, and favorites
    const filteredListings = allListings
        .filter(listing => {
            const matchesCategory = selectedCategory === 'all' || listing.category === selectedCategory;
            const matchesSearch = !searchQuery || 
                listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                listing.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                listing.location?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFavorites = !showFavoritesOnly || isFavorite(listing.id);
            return matchesCategory && matchesSearch && matchesFavorites;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'oldest':
                    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                case 'price_low':
                    return (a.budgetMin || 0) - (b.budgetMin || 0);
                case 'price_high':
                    return (b.budgetMax || b.budgetMin || 0) - (a.budgetMax || a.budgetMin || 0);
                case 'newest':
                default:
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            }
        });

    // Group listings by category for display
    const listingsByCategory = categories.slice(1).reduce((acc, cat) => {
        acc[cat.id] = filteredListings.filter(l => l.category === cat.id);
        return acc;
    }, {});

    // Get contact info based on approval status (active = approved)
    // Only show listing owner's contact if the listing is approved (status === 'active')
    const getContactInfo = (listing) => {
        const isApproved = listing.status === 'active';
        if (isApproved) {
            return {
                phone: listing.contact || PLATFORM_CONTACT.phone,
                email: listing.email || PLATFORM_CONTACT.email,
                isApproved: true
            };
        }
        return {
            phone: PLATFORM_CONTACT.phone,
            email: PLATFORM_CONTACT.email,
            isApproved: false
        };
    };

    const getCategoryInfo = (categoryId) => {
        return categories.find(c => c.id === categoryId) || categories[0];
    };

    // Listing Card Component - Compact version
    const ListingCard = ({ listing, index = 0 }) => {
        const catInfo = getCategoryInfo(listing.category);
        const Icon = catInfo.icon;

        return (
            <motion.div 
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                onClick={() => handleListingClick(listing)}
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 cursor-pointer">
                
                {/* Image */}
                {listing.images && listing.images.length > 0 ? (
                    <div className="relative aspect-[4/3] overflow-hidden">
                        <img 
                            src={listing.images[0]} 
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                        
                        {/* Category Badge - smaller */}
                        <div className={`absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r ${catInfo.color} text-white text-[10px] font-medium rounded-full flex items-center gap-1`}>
                            <Icon className="w-2.5 h-2.5" />
                            <span className="hidden sm:inline">{catInfo.label}</span>
                        </div>
                        
                        {/* Action Buttons - smaller */}
                        <div className="absolute top-2 right-2 flex gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const shareUrl = `${window.location.origin}/listing/${listing.id}`;
                                    navigator.clipboard.writeText(shareUrl);
                                    toast.success('Link copied!');
                                }}
                                className="p-1.5 rounded-full backdrop-blur-sm bg-white/80 text-gray-600 hover:bg-white hover:text-blue-500 transition-all"
                            >
                                <Share2 className="w-3 h-3" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(listing.id);
                                }}
                                className={`p-1.5 rounded-full backdrop-blur-sm transition-all ${
                                    isFavorite(listing.id)
                                        ? 'bg-red-500 text-white'
                                        : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
                                }`}
                            >
                                <HeartIcon className={`w-3 h-3 ${isFavorite(listing.id) ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                        
                        {/* Price Badge */}
                        {(listing.budgetMin || listing.budgetMax) && (
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-md">
                                <span className="text-emerald-600 font-bold text-xs">
                                    {listing.currency === 'SGD' ? 'S$' : listing.currency === 'MYR' ? 'RM' : '$'}
                                    {listing.budgetMin?.toLocaleString() || '0'}
                                    {listing.budgetMax && `+`}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`aspect-[4/3] bg-gradient-to-br ${catInfo.color} flex items-center justify-center relative`}>
                        <Icon className="w-8 h-8 text-white/50" />
                    </div>
                )}
                
                {/* Content - Compact */}
                <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1 group-hover:text-red-600 transition-colors">
                        {maskContactInfo(listing.title, listing.isPaid)}
                    </h3>
                    
                    <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{listing.location || 'Singapore'}</span>
                    </div>
                    
                    {/* View Details Button */}
                    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium text-center group-hover:from-red-700 group-hover:to-red-800 transition-all flex items-center justify-center gap-1.5">
                        <Eye className="w-3 h-3" />
                        View Details
                    </div>
                </div>
            </motion.div>
        );
    };

    // Loading state - show skeleton
    if (loading) {
        return (
            <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#faf8f5] via-[#f5f0eb] to-[#ebe5dc]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(180,120,80,0.08)_0%,_transparent_50%)]"></div>
                
                {/* Header skeleton */}
                <header className="relative bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center">
                                <span className="text-2xl font-bold text-gray-900">Link</span>
                                <span className="text-2xl font-bold text-red-600">Me</span>
                                <span className="text-2xl font-bold text-gray-900">U</span>
                            </div>
                            <div className="w-32 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                        </div>
                    </div>
                </header>
                
                {/* Content skeleton */}
                <section className="relative py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto text-center">
                        <div className="h-12 bg-gray-200 rounded-xl w-96 mx-auto mb-4 animate-pulse"></div>
                        <div className="h-6 bg-gray-200 rounded w-64 mx-auto mb-8 animate-pulse"></div>
                        <div className="max-w-2xl mx-auto mb-8">
                            <div className="h-14 bg-gray-200 rounded-2xl animate-pulse"></div>
                        </div>
                        <div className="flex justify-center mb-8">
                            <CategoryTabsSkeleton />
                        </div>
                    </div>
                </section>
                
                <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                    <ListingGridSkeleton count={8} />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#faf8f5] via-[#f5f0eb] to-[#ebe5dc]">
            {/* Background patterns */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(180,120,80,0.08)_0%,_transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,115,85,0.06)_0%,_transparent_50%)]"></div>

            {/* Global Navigation Header */}
            <header className="relative bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                            <div>
                                <div className="flex items-center">
                                    <span className="text-2xl font-bold text-gray-900">Link</span>
                                    <span className="text-2xl font-bold text-red-600">Me</span>
                                    <span className="text-2xl font-bold text-gray-900">U</span>
                                </div>
                                <p className="text-[10px] text-gray-500 -mt-0.5 tracking-wide">Link Me You Matter Most.</p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/events')}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <Calendar className="w-4 h-4" />
                                Events
                            </button>
                            
                            <button
                                onClick={() => navigate('/membership')}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <Shield className="w-4 h-4" />
                                Membership
                            </button>
                            
                            {/* Register Button - Prominent */}
                            <button
                                onClick={() => navigate('/register-listing')}
                                className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30"
                            >
                                <Plus className="w-5 h-5" />
                                Register Listing
                            </button>
                            
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="sm:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="sm:hidden bg-white border-t border-gray-100"
                        >
                            <div className="px-4 py-4 space-y-2">
                                <button
                                    onClick={() => {
                                        navigate('/events');
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
                                >
                                    <Calendar className="w-5 h-5" />
                                    <span className="font-medium">Events</span>
                                </button>
                                
                                <button
                                    onClick={() => {
                                        navigate('/membership');
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
                                >
                                    <Shield className="w-5 h-5" />
                                    <span className="font-medium">Membership</span>
                                </button>
                                
                                <div className="pt-2 border-t border-gray-100">
                                    <button
                                        onClick={() => {
                                            navigate('/register-listing');
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Register Listing
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Compact Search & Filter Bar - Desktop */}
            <section className="hidden sm:block sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search listings..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-gray-800 text-sm"
                            />
                        </div>
                        
                        {/* Category Tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                            {categories.map((cat) => {
                                const Icon = cat.icon;
                                const count = cat.id === 'all' ? filteredListings.length : listingsByCategory[cat.id]?.length || 0;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                                            selectedCategory === cat.id
                                                ? `bg-gradient-to-r ${cat.color} text-white shadow-sm`
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {cat.label}
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                            selectedCategory === cat.id ? 'bg-white/20' : 'bg-gray-200/80'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* Sort & Favorites */}
                        <div className="flex items-center gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 font-medium cursor-pointer"
                            >
                                {sortOptions.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </select>
                            
                            <button
                                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                    showFavoritesOnly
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <HeartIcon className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                                {favoritesCount > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                        showFavoritesOnly ? 'bg-white/20' : 'bg-red-100 text-red-600'
                                    }`}>
                                        {favoritesCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mobile-Only Compact Search & Filters - Shows at top on mobile */}
            <section className="sm:hidden sticky top-16 z-40 bg-gradient-to-b from-[#faf8f5] via-[#faf8f5] to-transparent pb-4 pt-4 px-4">
                {/* Search Bar */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search listings..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-gray-800 text-sm"
                    />
                </div>
                
                {/* Category Pills - Horizontal scroll */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        const count = cat.id === 'all' ? filteredListings.length : listingsByCategory[cat.id]?.length || 0;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                                    selectedCategory === cat.id
                                        ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                                        : 'bg-white text-gray-600 border border-gray-200'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {cat.label.split(' ')[0]}
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                    selectedCategory === cat.id ? 'bg-white/20' : 'bg-gray-100'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
                
                {/* Sort & Favorites Row */}
                <div className="flex gap-2 mt-3">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 font-medium"
                    >
                        {sortOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            showFavoritesOnly
                                ? 'bg-red-500 text-white'
                                : 'bg-white border border-gray-200 text-gray-600'
                        }`}
                    >
                        <HeartIcon className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                        {favoritesCount > 0 && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                showFavoritesOnly ? 'bg-white/20' : 'bg-red-100 text-red-600'
                            }`}>
                                {favoritesCount}
                            </span>
                        )}
                    </button>
                </div>
            </section>

            {/* Listings Grid */}
            <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-4">
                {selectedCategory === 'all' ? (
                    // Show all listings in a grid (no category grouping for cleaner look)
                    <div>
                        {filteredListings.length > 0 ? (
                            <motion.div 
                                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                                initial="hidden"
                                animate="visible"
                                variants={staggerContainer}
                            >
                                {filteredListings.map((listing, index) => (
                                    <ListingCard key={listing.id} listing={listing} index={index} />
                                ))}
                            </motion.div>
                        ) : null}
                        
                        {filteredListings.length === 0 && (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings found</h3>
                                <p className="text-gray-500 mb-6">Be the first to post a listing!</p>
                                <button
                                    onClick={() => navigate('/register-listing')}
                                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold"
                                >
                                    Create Listing
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    // Show filtered listings for selected category
                    <div>
                        {filteredListings.length > 0 ? (
                            <motion.div 
                                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                                initial="hidden"
                                animate="visible"
                                variants={staggerContainer}
                            >
                                {filteredListings.map((listing, index) => (
                                    <ListingCard key={listing.id} listing={listing} index={index} />
                                ))}
                            </motion.div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    {React.createElement(getCategoryInfo(selectedCategory).icon, { className: "w-8 h-8 text-gray-400" })}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings in this category</h3>
                                <p className="text-gray-500 text-sm mb-4">Be the first to post!</p>
                                <button
                                    onClick={() => navigate('/register-listing')}
                                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium text-sm"
                                >
                                    Create Listing
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="relative bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xl font-bold">Link</span>
                                <span className="text-xl font-bold text-red-500">Me</span>
                                <span className="text-xl font-bold">U</span>
                            </div>
                            <p className="text-gray-400 text-sm">Link Me. You Matter Most.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Contact Support</h4>
                            <div className="space-y-2 text-gray-400 text-sm">
                                <p className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    +65 9019 1311
                                </p>
                                <p className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    linkmeucom@gmail.com
                                </p>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Quick Links</h4>
                            <div className="space-y-2 text-gray-400 text-sm">
                                <button onClick={() => navigate('/register-listing')} className="block hover:text-white transition-colors">
                                    Register Listing
                                </button>
                                <button onClick={() => navigate('/events')} className="block hover:text-white transition-colors">
                                    Events
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
                        © 2024 LinkMeU. All rights reserved.
                    </div>
                </div>
            </footer>

            {/* Lead Capture Modal */}
            <LeadCaptureModal
                isOpen={showLeadModal}
                onClose={() => setShowLeadModal(false)}
                listing={selectedListing}
                onSuccess={handleLeadSuccess}
            />
        </div>
    );
};

export default MainPage;

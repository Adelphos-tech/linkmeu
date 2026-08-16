import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Phone, Mail, Calendar, DollarSign, 
  Share2, Heart, ChevronLeft, ChevronRight, Building2,
  Home, Film, Package, Briefcase, Clock, User, AlertCircle, MessageCircle
} from 'lucide-react';
import { getListing } from '../db/databaseAdapter';
import LeadCaptureModal from '../components/LeadCaptureModal';
import { useToast } from '../components/Toast';

// Platform support contact (shown for unpaid listings)
const PLATFORM_CONTACT = {
  phone: '+65 9019 1311',
  email: 'linkmeucom@gmail.com'
};

const ListingDetail = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [hasSubmittedLead, setHasSubmittedLead] = useState(false);

  const categories = {
    business: { label: 'Business', icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
    property: { label: 'Properties', icon: Home, color: 'from-blue-500 to-blue-600' },
    movies: { label: 'Movies', icon: Film, color: 'from-purple-500 to-purple-600' },
    products: { label: 'Products', icon: Package, color: 'from-orange-500 to-orange-600' },
    opportunity: { label: 'Opportunity', icon: Briefcase, color: 'from-red-500 to-red-600' },
    wedding: { label: 'Wedding', icon: Heart, color: 'from-pink-500 to-pink-600' },
  };

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      try {
        const data = await getListing(listingId);
        if (data) {
          setListing(data);
          // Check if user already submitted lead for this listing (stored in sessionStorage)
          const submittedLeads = JSON.parse(sessionStorage.getItem('submittedLeads') || '[]');
          // listingId from URL params is a string, so check both string and number
          const alreadySubmitted = submittedLeads.includes(listingId) || submittedLeads.includes(Number(listingId));
          setHasSubmittedLead(alreadySubmitted);
          
          // Show lead modal automatically if not already submitted
          if (!alreadySubmitted) {
            setShowLeadModal(true);
          }
        } else {
          setError('Listing not found');
        }
      } catch (err) {
        console.error('Error fetching listing:', err);
        setError('Failed to load listing');
      }
      setLoading(false);
    };
    fetchListing();
  }, [listingId]);

  // Handle lead submission success
  const handleLeadSuccess = () => {
    console.log('🎯 ListingDetail handleLeadSuccess called');
    setShowLeadModal(false);
    setHasSubmittedLead(true);
    // Store in sessionStorage to prevent showing modal again
    const submittedLeads = JSON.parse(sessionStorage.getItem('submittedLeads') || '[]');
    if (!submittedLeads.includes(listingId)) {
      submittedLeads.push(listingId);
      sessionStorage.setItem('submittedLeads', JSON.stringify(submittedLeads));
    }
    toast.success('Thank you!', 'Your enquiry has been submitted.');
    console.log('✅ Modal closed, user can now see full listing details');
  };

  // Get contact info based on approval status (active = approved)
  // Only show listing owner's contact if the listing is approved (status === 'active')
  const getContactInfo = () => {
    const isApproved = listing?.status === 'active';
    if (isApproved) {
      return {
        phone: listing.contact || PLATFORM_CONTACT.phone,
        whatsapp: listing.whatsapp || listing.contact || PLATFORM_CONTACT.phone,
        email: listing.email || PLATFORM_CONTACT.email,
        isApproved: true
      };
    }
    return {
      phone: PLATFORM_CONTACT.phone,
      whatsapp: PLATFORM_CONTACT.phone,
      email: PLATFORM_CONTACT.email,
      isApproved: false
    };
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.title,
          text: listing?.description,
          url: url
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const nextImage = () => {
    if (listing?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
    }
  };

  const prevImage = () => {
    if (listing?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] via-[#f5f0eb] to-[#ebe5dc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] via-[#f5f0eb] to-[#ebe5dc] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Listing not found'}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  const catInfo = categories[listing.category] || categories.business;
  const Icon = catInfo.icon;
  const contact = getContactInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] via-[#f5f0eb] to-[#ebe5dc]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <Link to="/" className="flex items-center gap-1">
            <span className="text-lg font-bold text-gray-900">Link</span>
            <span className="text-lg font-bold text-red-500">Me</span>
            <span className="text-lg font-bold text-gray-900">U</span>
          </Link>
          
          <button 
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Image Gallery */}
        {listing.images && listing.images.length > 0 ? (
          <div className="relative rounded-2xl overflow-hidden mb-6 bg-gray-100">
            <img 
              src={listing.images[currentImageIndex]} 
              alt={listing.title}
              className="w-full h-64 sm:h-80 md:h-96 object-cover"
            />
            
            {/* Image Navigation */}
            {listing.images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                {/* Image Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {listing.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            
            {/* Category Badge */}
            <div className={`absolute top-4 left-4 px-3 py-1.5 bg-gradient-to-r ${catInfo.color} text-white text-sm font-medium rounded-full flex items-center gap-1.5`}>
              <Icon className="w-4 h-4" />
              {catInfo.label}
            </div>
          </div>
        ) : (
          <div className={`h-48 rounded-2xl bg-gradient-to-br ${catInfo.color} flex items-center justify-center mb-6`}>
            <Icon className="w-16 h-16 text-white/50" />
          </div>
        )}

        {/* Title & Price */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{listing.title}</h1>
          
          {/* Price */}
          {(listing.budgetMin || listing.budgetMax) && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-emerald-600">
                {listing.currency === 'SGD' ? 'S$' : listing.currency === 'MYR' ? 'RM' : '$'}
                {listing.budgetMin?.toLocaleString() || '0'}
                {listing.budgetMax && ` - ${listing.budgetMax.toLocaleString()}`}
              </span>
            </div>
          )}
          
          {/* Location */}
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-5 h-5 text-gray-400" />
            <span>{listing.location || 'Singapore'}</span>
          </div>
          
          {/* Revenue (for business) */}
          {listing.revenue && (
            <div className="flex items-center gap-2 text-gray-600 mt-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <span>Revenue: {listing.revenue}</span>
            </div>
          )}
          
          {/* Date Range */}
          {(listing.fromDate || listing.toDate) && (
            <div className="flex items-center gap-2 text-gray-600 mt-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span>
                {listing.fromDate && new Date(listing.fromDate).toLocaleDateString()}
                {listing.toDate && ` - ${new Date(listing.toDate).toLocaleDateString()}`}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
          <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
            {listing.description || 'No description provided.'}
          </p>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          
          {!contact.isApproved && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-amber-800 text-sm">
                  This listing is pending approval. Contact our support team for more information.
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {/* WhatsApp - Primary CTA */}
            <a 
              href={`https://wa.me/${contact.whatsapp?.replace(/[^0-9]/g, '')}?text=Hi, I'm interested in your listing: ${listing?.title}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-green-500 rounded-xl hover:bg-green-600 transition-colors text-white"
            >
              <div className="p-2 bg-white/20 rounded-lg">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-green-100">WhatsApp</p>
                <p className="font-medium">{contact.whatsapp}</p>
              </div>
            </a>
            
            <a 
              href={`tel:${contact.phone}`}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{contact.phone}</p>
              </div>
            </a>
            
            <a 
              href={`mailto:${contact.email}`}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{contact.email}</p>
              </div>
            </a>
          </div>
        </div>

        {/* Posted Date */}
        <div className="text-center text-gray-400 text-sm py-4">
          <Clock className="w-4 h-4 inline mr-1" />
          Posted {listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : 'Recently'}
        </div>
      </main>

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        listing={listing}
        onSuccess={handleLeadSuccess}
        submitButtonText="View Full Details"
      />
    </div>
  );
};

export default ListingDetail;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, ArrowRight, Loader2, Shield, Zap, MessageSquare } from 'lucide-react';
import { createLead } from '../db/databaseAdapter';

// Session storage keys
const SESSION_PHONE_KEY = 'linkmeu_user_phone';
const SESSION_NAME_KEY = 'linkmeu_user_name';

const LeadCaptureModal = ({ isOpen, onClose, listing, onSuccess, submitButtonText = 'Continue to Listing' }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    requirement: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasExistingPhone, setHasExistingPhone] = useState(false);

  // Load saved phone/name from session on mount
  useEffect(() => {
    const savedPhone = sessionStorage.getItem(SESSION_PHONE_KEY);
    const savedName = sessionStorage.getItem(SESSION_NAME_KEY);
    
    if (savedPhone) {
      setFormData(prev => ({
        ...prev,
        contact: savedPhone,
        name: savedName || ''
      }));
      setHasExistingPhone(true);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log('🔵 handleSubmit called');
    console.log('🔵 listing:', listing);
    console.log('🔵 formData:', formData);

    // Validate listing exists
    if (!listing || !listing.id) {
      console.error('❌ No listing provided to LeadCaptureModal');
      setError('Unable to process request. Please try again.');
      return;
    }

    // Minimal validation - just need phone
    const contact = String(formData.contact || '').trim();
    if (!contact) {
      console.error('❌ No phone number provided');
      setError('Please enter your phone number');
      return;
    }

    console.log('🔵 Validation passed, setting loading...');
    setLoading(true);
    
    try {
      // Save phone/name to session for future use
      sessionStorage.setItem(SESSION_PHONE_KEY, contact);
      const name = String(formData.name || '').trim();
      if (name) {
        sessionStorage.setItem(SESSION_NAME_KEY, name);
      }

      console.log('📝 Submitting lead for listing:', listing.id, listing.title);
      
      await createLead({
        listingId: listing.id,
        listingTitle: listing.title,
        name: name || 'Guest',
        contact: contact,
        email: '',
        eventDate: null,
        notes: String(formData.requirement || '').trim()
      });

      console.log('✅ Lead created successfully, calling onSuccess');
      
      // Reset only requirement, keep phone/name
      setFormData(prev => ({ ...prev, requirement: '' }));
      setHasExistingPhone(true);
      
      // Call success callback - this should navigate to listing
      if (onSuccess) {
        console.log('🚀 Calling onSuccess callback');
        onSuccess();
      } else {
        console.warn('⚠️ No onSuccess callback provided');
      }
    } catch (err) {
      console.error('❌ Error submitting lead:', err);
      console.error('❌ Error details:', err.message, err.stack);
      setError('Something went wrong. Please try again.');
    } finally {
      console.log('🔵 Setting loading to false');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          {/* Semi-transparent overlay - can see background */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />
          
          {/* Modal - slides up on mobile, centered on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle for mobile */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Content */}
            <div className="px-6 pt-4 pb-6">
              {/* Header - friendly, non-threatening */}
              <div className="text-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">Quick Enquiry</h2>
                <p className="text-gray-500 text-sm mt-1">Get connected in seconds</p>
              </div>

              {/* Listing preview - small, contextual */}
              <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-center gap-3">
                {listing?.images?.[0] && (
                  <img 
                    src={listing.images[0]} 
                    alt="" 
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{listing?.title}</p>
                  <p className="text-xs text-gray-500">{listing?.location || 'Singapore'}</p>
                </div>
              </div>

              {/* Form - minimal fields */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Show saved user info if exists */}
                {hasExistingPhone && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">
                        {formData.name || 'Guest'}
                      </p>
                      <p className="text-xs text-green-600">{formData.contact}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        sessionStorage.removeItem(SESSION_PHONE_KEY);
                        sessionStorage.removeItem(SESSION_NAME_KEY);
                        setFormData({ name: '', contact: '', requirement: '' });
                        setHasExistingPhone(false);
                      }}
                      className="text-xs text-green-600 hover:text-green-800 underline"
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* Phone & Name - Only show if no saved phone */}
                {!hasExistingPhone && (
                  <>
                    {/* Phone - Primary field */}
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        placeholder="Your phone number"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-0 focus:border-red-500 focus:bg-white transition-all text-lg"
                        autoFocus
                      />
                    </div>

                    {/* Name - Optional, smaller */}
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your name (optional)"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-0 focus:border-gray-200 focus:bg-white transition-all text-sm"
                      />
                    </div>
                  </>
                )}

                {/* What are you looking for? - Always show */}
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    value={formData.requirement}
                    onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                    placeholder="What are you looking for? (optional)"
                    rows={2}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-0 focus:border-gray-200 focus:bg-white transition-all text-sm resize-none"
                  />
                </div>

                {/* Submit Button - Action-oriented, not scary */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    <>
                      {submitButtonText}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Trust signals */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Instant response</span>
                  </div>
                </div>

                {/* Skip option - reduces pressure */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition-colors"
                >
                  Skip for now
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LeadCaptureModal;

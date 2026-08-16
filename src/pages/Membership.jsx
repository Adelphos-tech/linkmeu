import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Plus, Users, Search, Upload, Download, Calendar, 
  Phone, Mail, DollarSign, CheckCircle, XCircle, Clock,
  Edit2, Trash2, Eye, X, ChevronDown, FileSpreadsheet,
  Building2, UserPlus, CreditCard, AlertCircle, Crown, Gem, Image as ImageIcon,
  MapPin, Globe, Share2, QrCode, Copy, ExternalLink
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { format } from 'date-fns';
import { convertImageToBase64, resizeImage } from '../utils/imageUtils';
import {
  getAllClubs,
  createClub,
  updateClub,
  deleteClub as deleteClubFromDB,
  getAllClubMembers,
  createClubMember,
  updateClubMember,
  deleteClubMember as deleteMemberFromDB,
  bulkCreateClubMembers
} from '../db/databaseAdapter';

// Membership year runs from Jan 1 to Dec 31
const MEMBERSHIP_YEAR_START = 1; // January
const MEMBERSHIP_YEAR_END = 12; // December

const Membership = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState('clubs'); // 'clubs' or 'members'
  const [clubs, setClubs] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showClubModal, setShowClubModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  
  // Form states
  const [clubForm, setClubForm] = useState({
    name: '',
    description: '',
    logo: '',
    contactPerson: '',
    contact: '',
    email: '',
    address: '',
    postalCode: '',
    website: '',
    openingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '13:00', closed: false },
      sunday: { open: '', close: '', closed: true },
    },
    annualFee: 120,
  });
  
  const [memberForm, setMemberForm] = useState({
    name: '',
    contact: '',
    email: '',
    photo: '',
    comments: '',
    registrationDate: format(new Date(), 'yyyy-MM-dd'),
    membershipType: 'annual',
    paymentStatus: 'not_paid',
    amountPaid: 0,
    clubId: null,
    memberCategory: 'individual', // 'individual' or 'company'
    rocNumber: '', // ROC number for company
    country: '', // Country for company
    icPassport: '', // IC/Passport for individual
    nationality: '', // Nationality for individual
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load from Supabase
      const [clubsData, membersData] = await Promise.all([
        getAllClubs(),
        getAllClubMembers()
      ]);
      setClubs(clubsData);
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  // Calculate prorata fee based on registration month
  const calculateProrataFee = (annualFee, registrationDate) => {
    const regDate = new Date(registrationDate);
    const currentMonth = regDate.getMonth() + 1; // 1-12
    const remainingMonths = 12 - currentMonth + 1; // Include current month
    const monthlyFee = annualFee / 12;
    return Math.round(monthlyFee * remainingMonths * 100) / 100;
  };

  // Club CRUD operations
  const handleSaveClub = async () => {
    if (!clubForm.name || !clubForm.email) {
      toast.error('Please fill in club name and email');
      return;
    }

    try {
      if (editingClub) {
        // Update existing club
        const updatedClub = await updateClub(editingClub.id, clubForm);
        setClubs(clubs.map(c => c.id === editingClub.id ? updatedClub : c));
        toast.success('Club updated successfully');
      } else {
        // Create new club
        const newClub = await createClub(clubForm);
        setClubs([newClub, ...clubs]);
        toast.success('Club created successfully');
      }
      resetClubForm();
    } catch (error) {
      console.error('Error saving club:', error);
      toast.error('Failed to save club: ' + error.message);
    }
  };

  const handleDeleteClub = async (clubId) => {
    if (!window.confirm('Are you sure you want to delete this club? All members will also be removed.')) return;
    
    try {
      await deleteClubFromDB(clubId);
      setClubs(clubs.filter(c => c.id !== clubId));
      setMembers(members.filter(m => m.clubId !== clubId));
      toast.success('Club deleted successfully');
    } catch (error) {
      console.error('Error deleting club:', error);
      toast.error('Failed to delete club: ' + error.message);
    }
  };

  const resetClubForm = () => {
    setClubForm({
      name: '',
      description: '',
      logo: '',
      contactPerson: '',
      contact: '',
      email: '',
      address: '',
      postalCode: '',
      website: '',
      openingHours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '13:00', closed: false },
        sunday: { open: '', close: '', closed: true },
      },
      annualFee: 120,
    });
    setEditingClub(null);
    setShowClubModal(false);
  };

  // Member CRUD operations
  const handleSaveMember = async () => {
    if (!memberForm.name || !memberForm.email || !memberForm.clubId) {
      toast.error('Please fill in name, email, and select a club');
      return;
    }

    const club = clubs.find(c => c.id === memberForm.clubId);
    const prorataFee = calculateProrataFee(club?.annualFee || 120, memberForm.registrationDate);

    const memberData = {
      ...memberForm,
      prorataFee,
    };

    try {
      if (editingMember) {
        const updatedMember = await updateClubMember(editingMember.id, memberData);
        setMembers(members.map(m => m.id === editingMember.id ? updatedMember : m));
        toast.success('Member updated successfully');
      } else {
        const newMember = await createClubMember(memberData);
        setMembers([newMember, ...members]);
        toast.success('Member registered successfully');
      }
      resetMemberForm();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error('Failed to save member: ' + error.message);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await deleteMemberFromDB(memberId);
      setMembers(members.filter(m => m.id !== memberId));
      toast.success('Member removed successfully');
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Failed to delete member: ' + error.message);
    }
  };

  const resetMemberForm = () => {
    setMemberForm({
      name: '',
      contact: '',
      email: '',
      photo: '',
      comments: '',
      registrationDate: format(new Date(), 'yyyy-MM-dd'),
      membershipType: 'annual',
      paymentStatus: 'not_paid',
      amountPaid: 0,
      clubId: selectedClub?.id || null,
      memberCategory: 'individual',
      rocNumber: '',
      country: '',
      icPassport: '',
      nationality: '',
    });
    setEditingMember(null);
    setShowMemberModal(false);
  };

  // Bulk upload handler
  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const newMembers = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const member = {
            name: values[headers.indexOf('name')] || '',
            contact: values[headers.indexOf('contact')] || values[headers.indexOf('phone')] || '',
            email: values[headers.indexOf('email')] || '',
            comments: values[headers.indexOf('comments')] || values[headers.indexOf('notes')] || '',
            registrationDate: values[headers.indexOf('date')] || format(new Date(), 'yyyy-MM-dd'),
            membershipType: 'annual',
            paymentStatus: 'not_paid',
            amountPaid: 0,
            clubId: selectedClub?.id,
          };
          
          if (member.name && member.email) {
            const club = clubs.find(c => c.id === member.clubId);
            member.prorataFee = calculateProrataFee(club?.annualFee || 120, member.registrationDate);
            newMembers.push(member);
          }
        }

        if (newMembers.length > 0) {
          const createdMembers = await bulkCreateClubMembers(newMembers);
          setMembers([...createdMembers, ...members]);
          toast.success(`${createdMembers.length} members imported successfully`);
        } else {
          toast.error('No valid members found in file');
        }
      } catch (error) {
        console.error('Error parsing/uploading CSV:', error);
        toast.error('Failed to import members: ' + error.message);
      }
    };
    reader.readAsText(file);
    setShowBulkUploadModal(false);
  };

  // Download template
  const downloadTemplate = () => {
    const template = 'name,email,contact,comments,date\nJohn Doe,john@example.com,+65 9123 4567,New member,2026-01-17';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'member_template.csv';
    a.click();
  };

  // Filter data
  const filteredClubs = clubs.filter(club =>
    club.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClub = !selectedClub || member.clubId === selectedClub.id;
    return matchesSearch && matchesClub;
  });

  // Stats
  const getClubStats = (clubId) => {
    const clubMembers = members.filter(m => m.clubId === clubId);
    const paid = clubMembers.filter(m => m.paymentStatus === 'paid').length;
    const partial = clubMembers.filter(m => m.paymentStatus === 'partial').length;
    const unpaid = clubMembers.filter(m => m.paymentStatus === 'not_paid').length;
    const totalRevenue = clubMembers.reduce((sum, m) => sum + (m.amountPaid || 0), 0);
    return { total: clubMembers.length, paid, partial, unpaid, totalRevenue };
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg flex items-center gap-1.5 border border-emerald-500/20"><CheckCircle className="w-3 h-3" /> Paid</span>;
      case 'partial':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-lg flex items-center gap-1.5 border border-amber-500/20"><Clock className="w-3 h-3" /> Partial</span>;
      default:
        return <span className="px-2.5 py-1 bg-red-500/10 text-red-400 text-xs rounded-lg flex items-center gap-1.5 border border-red-500/20"><XCircle className="w-3 h-3" /> Not Paid</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Premium Header */}
      <header className="bg-[#0f0f15]/95 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-5">
              <button onClick={() => navigate('/')} className="flex items-center group">
                <span className="text-2xl font-bold text-white">Link</span>
                <span className="text-2xl font-bold text-amber-500">Me</span>
                <span className="text-2xl font-bold text-white">U</span>
              </button>
              <div className="h-6 w-px bg-white/10"></div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-lg flex items-center justify-center border border-amber-500/20">
                  <Crown className="w-4 h-4 text-amber-500" />
                </div>
                <span className="font-medium text-white/90 tracking-wide">Membership</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('/events')}
                className="px-4 py-2 text-gray-400 hover:text-white font-medium text-sm transition-colors"
              >
                Events
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-gray-400 hover:text-white font-medium text-sm transition-colors"
              >
                Listings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Premium Tabs */}
      <div className="bg-[#0f0f15] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => { setActiveTab('clubs'); setSelectedClub(null); loadData(); }}
              className={`py-4 px-5 font-medium text-sm transition-all relative ${
                activeTab === 'clubs'
                  ? 'text-amber-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4" />
                Clubs
                <span className={`px-2 py-0.5 rounded text-xs ${
                  activeTab === 'clubs' ? 'bg-amber-500/10 text-amber-500' : 'bg-white/5 text-gray-500'
                }`}>{clubs.length}</span>
              </div>
              {activeTab === 'clubs' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600"></div>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('members'); loadData(); }}
              className={`py-4 px-5 font-medium text-sm transition-all relative ${
                activeTab === 'members'
                  ? 'text-amber-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                Members
                <span className={`px-2 py-0.5 rounded text-xs ${
                  activeTab === 'members' ? 'bg-amber-500/10 text-amber-500' : 'bg-white/5 text-gray-500'
                }`}>{members.length}</span>
              </div>
              {activeTab === 'members' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder={activeTab === 'clubs' ? 'Search clubs...' : 'Search members...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#15151f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
            />
          </div>
          
          <div className="flex gap-3">
            {activeTab === 'clubs' ? (
              <button
                onClick={() => { setEditingClub(null); setShowClubModal(true); }}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                Create Club
              </button>
            ) : (
              <>
                {selectedClub && (
                  <button
                    onClick={() => setShowBulkUploadModal(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-[#15151f] border border-white/10 text-gray-300 rounded-xl hover:bg-[#1a1a25] hover:border-white/20 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    Bulk Upload
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!selectedClub) {
                      toast.error('Please select a club first');
                      return;
                    }
                    setMemberForm({ ...memberForm, clubId: selectedClub.id });
                    setEditingMember(null);
                    setShowMemberModal(true);
                  }}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
                >
                  <UserPlus className="w-4 h-4" />
                  Register Member
                </button>
              </>
            )}
          </div>
        </div>

        {/* Club Filter for Members Tab */}
        {activeTab === 'members' && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-400 mb-3 tracking-wide">Select Club</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedClub(null)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  !selectedClub
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-[#15151f] border border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                }`}
              >
                All Clubs
              </button>
              {clubs.map(club => (
                <button
                  key={club.id}
                  onClick={() => setSelectedClub(club)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedClub?.id === club.id
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20'
                      : 'bg-[#15151f] border border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  {club.name}
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    selectedClub?.id === club.id ? 'bg-black/20' : 'bg-white/5'
                  }`}>
                    {members.filter(m => m.clubId === club.id).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clubs Grid */}
        {activeTab === 'clubs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="w-20 h-20 bg-[#15151f] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5">
                  <Shield className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No clubs yet</h3>
                <p className="text-gray-500 mb-6">Create your first club to get started</p>
                <button
                  onClick={() => setShowClubModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all"
                >
                  Create Club
                </button>
              </div>
            ) : (
              filteredClubs.map(club => {
                const stats = getClubStats(club.id);
                return (
                  <div key={club.id} className="group bg-[#12121a] rounded-2xl border border-white/5 overflow-hidden hover:border-amber-500/30 transition-all duration-300">
                    {/* Card Header with gradient */}
                    <div className="h-2 bg-gradient-to-r from-amber-500/50 via-amber-600/30 to-transparent"></div>
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-4">
                          {club.logo ? (
                            <img src={club.logo} alt={club.name} className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/10" />
                          ) : (
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                              <Crown className="w-7 h-7 text-amber-500" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-white text-lg">{club.name}</h3>
                            <p className="text-sm text-gray-500">{stats.total} members</p>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingClub(club);
                              setClubForm(club);
                              setShowClubModal(true);
                            }}
                            className="p-2 text-gray-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClub(club.id)}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {club.description && (
                        <p className="text-sm text-gray-400 mb-5 line-clamp-2">{club.description}</p>
                      )}
                      
                      <div className="space-y-2.5 text-sm">
                        <div className="flex items-center gap-3 text-gray-400">
                          <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span>{club.contactPerson || 'No contact person'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-400">
                          <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="truncate">{club.email}</span>
                        </div>
                        {club.contact && (
                          <div className="flex items-center gap-3 text-gray-400">
                            <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span>{club.contact}</span>
                          </div>
                        )}
                        {club.address && (
                          <div className="flex items-start gap-3 text-gray-400">
                            <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{club.address}{club.postalCode ? `, ${club.postalCode}` : ''}</span>
                          </div>
                        )}
                        {club.website && (
                          <div className="flex items-center gap-3 text-gray-400">
                            <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <a 
                              href={club.website.startsWith('http') ? club.website : `https://${club.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-amber-500 hover:text-amber-400 truncate flex items-center gap-1"
                            >
                              {club.website.replace(/^https?:\/\//, '')}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        {club.openingHours && Object.keys(club.openingHours).length > 0 && (
                          <div className="flex items-start gap-3 text-gray-400">
                            <Clock className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                            <div className="text-xs">
                              {(() => {
                                const today = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
                                const hours = club.openingHours[today];
                                if (hours?.closed) return <span className="text-red-400">Closed today</span>;
                                if (hours?.open && hours?.close) return <span className="text-emerald-400">Open · {hours.open} - {hours.close}</span>;
                                return <span className="text-gray-500">Hours not set</span>;
                              })()}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          <span className="text-amber-500 font-medium">${club.annualFee}/year</span>
                        </div>
                      </div>
                      
                      {/* Quick Actions - Share & Copy */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            const shareUrl = `${window.location.origin}/membership?club=${club.id}`;
                            navigator.clipboard.writeText(shareUrl);
                            toast.success('Club link copied!');
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-white/5"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy Link
                        </button>
                        <button
                          onClick={() => {
                            const shareData = {
                              title: club.name,
                              text: `Check out ${club.name} on LinkMeU`,
                              url: `${window.location.origin}/membership?club=${club.id}`
                            };
                            if (navigator.share) {
                              navigator.share(shareData);
                            } else {
                              navigator.clipboard.writeText(shareData.url);
                              toast.success('Link copied!');
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-white/5"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Share
                        </button>
                      </div>
                      
                      <div className="mt-5 pt-5 border-t border-white/5">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-emerald-400">{stats.paid} Paid</span>
                          <span className="text-amber-400">{stats.partial} Partial</span>
                          <span className="text-red-400">{stats.unpaid} Unpaid</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-500 h-full" style={{ width: `${(stats.paid / stats.total) * 100 || 0}%` }}></div>
                          <div className="bg-amber-500 h-full" style={{ width: `${(stats.partial / stats.total) * 100 || 0}%` }}></div>
                          <div className="bg-red-500/50 h-full" style={{ width: `${(stats.unpaid / stats.total) * 100 || 0}%` }}></div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedClub(club);
                          setActiveTab('members');
                        }}
                        className="mt-5 w-full py-2.5 text-amber-500 hover:bg-amber-500/10 rounded-xl text-sm font-medium transition-colors border border-amber-500/20 hover:border-amber-500/40"
                      >
                        View Members →
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Members Table */}
        {activeTab === 'members' && (
          <div className="bg-[#12121a] rounded-2xl border border-white/5 overflow-hidden">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-[#15151f] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5">
                  <Users className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No members yet</h3>
                <p className="text-gray-500 mb-4">
                  {selectedClub ? `Add members to ${selectedClub.name}` : 'Select a club and add members'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0f0f15] border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Club</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredMembers.map(member => {
                      const club = clubs.find(c => c.id === member.clubId);
                      return (
                        <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-full flex items-center justify-center border border-amber-500/20">
                                <span className="text-amber-500 font-semibold text-sm">{member.name?.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="font-medium text-white">{member.name}</p>
                                <p className="text-sm text-gray-500">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Crown className="w-4 h-4 text-amber-500" />
                              <span className="text-sm text-gray-300">{club?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="text-gray-300">{format(new Date(member.registrationDate), 'MMM d, yyyy')}</p>
                              <p className="text-xs text-gray-500 capitalize">{member.membershipType}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="font-semibold text-amber-500">${member.prorataFee?.toFixed(2) || '0.00'}</p>
                              <p className="text-xs text-gray-500">Prorata</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              {getPaymentStatusBadge(member.paymentStatus)}
                              {member.amountPaid > 0 && (
                                <p className="text-xs text-gray-500 mt-1">${member.amountPaid} paid</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingMember(member);
                                  setMemberForm(member);
                                  setShowMemberModal(true);
                                }}
                                className="p-2 text-gray-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member.id)}
                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Club Modal */}
      {showClubModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                    <Crown className="w-5 h-5 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    {editingClub ? 'Edit Club' : 'Create New Club'}
                  </h2>
                </div>
                <button onClick={resetClubForm} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Club Name *</label>
                <input
                  type="text"
                  value={clubForm.name}
                  onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                  placeholder="e.g., Singapore Tech Club"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                <textarea
                  value={clubForm.description}
                  onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all resize-none"
                  placeholder="Brief description of the club..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Club Logo</label>
                <div className="flex items-start gap-4">
                  {/* Logo Preview */}
                  <div className="w-20 h-20 rounded-xl bg-[#0a0a0f] border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {clubForm.logo ? (
                      <img 
                        src={clubForm.logo} 
                        alt="Club logo" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-600" />
                    )}
                  </div>
                  
                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2">
                    <label className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-amber-500/50 transition-all cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Upload Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              if (file.size > 2 * 1024 * 1024) {
                                toast.error('Image must be less than 2MB');
                                return;
                              }
                              const base64 = await convertImageToBase64(file);
                              const resized = await resizeImage(base64, 400, 400);
                              setClubForm({ ...clubForm, logo: resized });
                              toast.success('Logo uploaded');
                            } catch (error) {
                              toast.error('Failed to upload logo');
                            }
                          }
                        }}
                      />
                    </label>
                    {clubForm.logo && (
                      <button
                        type="button"
                        onClick={() => setClubForm({ ...clubForm, logo: '' })}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove logo
                      </button>
                    )}
                    <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Contact Person</label>
                <input
                  type="text"
                  value={clubForm.contactPerson}
                  onChange={(e) => setClubForm({ ...clubForm, contactPerson: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                  placeholder="John Doe"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Contact Number</label>
                  <input
                    type="tel"
                    value={clubForm.contact}
                    onChange={(e) => setClubForm({ ...clubForm, contact: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                    placeholder="+65 9123 4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email *</label>
                  <input
                    type="email"
                    value={clubForm.email}
                    onChange={(e) => setClubForm({ ...clubForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                    placeholder="club@example.com"
                  />
                </div>
              </div>
              
              {/* Address Section */}
              <div className="border-t border-white/5 pt-4 mt-2">
                <h4 className="text-sm font-medium text-amber-500 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location Details
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Address</label>
                    <input
                      type="text"
                      value={clubForm.address}
                      onChange={(e) => setClubForm({ ...clubForm, address: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                      placeholder="48 Serangoon Rd, #02-16 Arcade, Singapore"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Postal Code</label>
                      <input
                        type="text"
                        value={clubForm.postalCode}
                        onChange={(e) => setClubForm({ ...clubForm, postalCode: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                        placeholder="217959"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Website</label>
                      <input
                        type="url"
                        value={clubForm.website}
                        onChange={(e) => setClubForm({ ...clubForm, website: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                        placeholder="https://example.org"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Opening Hours Section */}
              <div className="border-t border-white/5 pt-4 mt-2">
                <h4 className="text-sm font-medium text-amber-500 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Opening Hours
                </h4>
                <div className="space-y-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="w-20 text-sm text-gray-400 capitalize">{day.slice(0, 3)}</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!clubForm.openingHours?.[day]?.closed}
                          onChange={(e) => {
                            const isOpen = e.target.checked;
                            setClubForm({
                              ...clubForm,
                              openingHours: {
                                ...clubForm.openingHours,
                                [day]: {
                                  open: isOpen ? (clubForm.openingHours?.[day]?.open || '09:00') : '',
                                  close: isOpen ? (clubForm.openingHours?.[day]?.close || '18:00') : '',
                                  closed: !isOpen
                                }
                              }
                            });
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-[#0a0a0f] text-amber-500 focus:ring-amber-500/20"
                        />
                        <span className="text-xs text-gray-500">Open</span>
                      </label>
                      {!clubForm.openingHours?.[day]?.closed && (
                        <>
                          <input
                            type="time"
                            value={clubForm.openingHours?.[day]?.open || '09:00'}
                            onChange={(e) => setClubForm({
                              ...clubForm,
                              openingHours: {
                                ...clubForm.openingHours,
                                [day]: { ...clubForm.openingHours?.[day], open: e.target.value }
                              }
                            })}
                            className="px-2 py-1 bg-[#0a0a0f] border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-500/20"
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="time"
                            value={clubForm.openingHours?.[day]?.close || '18:00'}
                            onChange={(e) => setClubForm({
                              ...clubForm,
                              openingHours: {
                                ...clubForm.openingHours,
                                [day]: { ...clubForm.openingHours?.[day], close: e.target.value }
                              }
                            })}
                            className="px-2 py-1 bg-[#0a0a0f] border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-500/20"
                          />
                        </>
                      )}
                      {clubForm.openingHours?.[day]?.closed && (
                        <span className="text-sm text-red-400">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Annual Membership Fee ($)</label>
                <input
                  type="number"
                  value={clubForm.annualFee}
                  onChange={(e) => setClubForm({ ...clubForm, annualFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                  placeholder="120"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-white/5 flex gap-3">
              <button
                onClick={resetClubForm}
                className="flex-1 py-3 border border-white/10 text-gray-400 rounded-xl hover:bg-white/5 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClub}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all"
              >
                {editingClub ? 'Save Changes' : 'Create Club'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                    <UserPlus className="w-5 h-5 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    {editingMember ? 'Edit Member' : 'Register Member'}
                  </h2>
                </div>
                <button onClick={resetMemberForm} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Club *</label>
                <select
                  value={memberForm.clubId || ''}
                  onChange={(e) => setMemberForm({ ...memberForm, clubId: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                >
                  <option value="">Select a club</option>
                  {clubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-4">
                {/* Photo Upload */}
                <div className="flex-shrink-0">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Photo</label>
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-[#0a0a0f] border border-white/10 flex items-center justify-center overflow-hidden">
                      {memberForm.photo ? (
                        <img 
                          src={memberForm.photo} 
                          alt="Member" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-amber-400 transition-colors">
                      <Upload className="w-3 h-3 text-black" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              if (file.size > 2 * 1024 * 1024) {
                                toast.error('Image must be less than 2MB');
                                return;
                              }
                              const base64 = await convertImageToBase64(file);
                              const resized = await resizeImage(base64, 300, 300);
                              setMemberForm({ ...memberForm, photo: resized });
                            } catch (error) {
                              toast.error('Failed to upload photo');
                            }
                          }
                        }}
                      />
                    </label>
                    {memberForm.photo && (
                      <button
                        type="button"
                        onClick={() => setMemberForm({ ...memberForm, photo: '' })}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400 transition-colors"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Name Field */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Name *</label>
                  <input
                    type="text"
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                    placeholder="Full name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Contact</label>
                  <input
                    type="tel"
                    value={memberForm.contact}
                    onChange={(e) => setMemberForm({ ...memberForm, contact: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                    placeholder="+65 9123 4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email *</label>
                  <input
                    type="email"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                    placeholder="member@example.com"
                  />
                </div>
              </div>
              
              {/* Member Category */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Member Category</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="memberCategory"
                      value="individual"
                      checked={memberForm.memberCategory === 'individual'}
                      onChange={(e) => setMemberForm({ ...memberForm, memberCategory: e.target.value })}
                      className="w-4 h-4 text-amber-500 bg-[#0a0a0f] border-white/20 focus:ring-amber-500/20"
                    />
                    <span className="text-sm text-gray-300">Individual</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="memberCategory"
                      value="company"
                      checked={memberForm.memberCategory === 'company'}
                      onChange={(e) => setMemberForm({ ...memberForm, memberCategory: e.target.value })}
                      className="w-4 h-4 text-amber-500 bg-[#0a0a0f] border-white/20 focus:ring-amber-500/20"
                    />
                    <span className="text-sm text-gray-300">Company</span>
                  </label>
                </div>
              </div>
              
              {/* Company: ROC Number & Country */}
              {memberForm.memberCategory === 'company' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">ROC Number</label>
                    <input
                      type="text"
                      value={memberForm.rocNumber}
                      onChange={(e) => setMemberForm({ ...memberForm, rocNumber: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                      placeholder="e.g., 201912345A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Country</label>
                    <input
                      type="text"
                      value={memberForm.country}
                      onChange={(e) => setMemberForm({ ...memberForm, country: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                      placeholder="Singapore"
                    />
                  </div>
                </div>
              )}
              
              {/* Individual: IC/Passport & Nationality */}
              {memberForm.memberCategory === 'individual' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">IC/Passport</label>
                    <input
                      type="text"
                      value={memberForm.icPassport}
                      onChange={(e) => setMemberForm({ ...memberForm, icPassport: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                      placeholder="S1234567A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Nationality</label>
                    <input
                      type="text"
                      value={memberForm.nationality}
                      onChange={(e) => setMemberForm({ ...memberForm, nationality: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                      placeholder="Singaporean"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Comments</label>
                <textarea
                  value={memberForm.comments}
                  onChange={(e) => setMemberForm({ ...memberForm, comments: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all resize-none"
                  placeholder="Any notes or remarks..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Registration Date</label>
                  <input
                    type="date"
                    value={memberForm.registrationDate}
                    onChange={(e) => setMemberForm({ ...memberForm, registrationDate: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Membership Type</label>
                  <select
                    value={memberForm.membershipType}
                    onChange={(e) => setMemberForm({ ...memberForm, membershipType: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                  >
                    <option value="annual">Annual</option>
                    <option value="lifetime">Lifetime</option>
                    <option value="honorary">Honorary</option>
                  </select>
                </div>
              </div>
              
              {/* Prorata Fee Display */}
              {memberForm.clubId && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-500 mb-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-medium">Prorata Calculation</span>
                  </div>
                  <p className="text-sm text-amber-400">
                    Fee for remaining months: <strong className="text-amber-300">${calculateProrataFee(
                      clubs.find(c => c.id === memberForm.clubId)?.annualFee || 120,
                      memberForm.registrationDate
                    ).toFixed(2)}</strong>
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Payment Status</label>
                  <select
                    value={memberForm.paymentStatus}
                    onChange={(e) => setMemberForm({ ...memberForm, paymentStatus: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                  >
                    <option value="not_paid">Not Paid</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Amount Paid ($)</label>
                  <input
                    type="number"
                    value={memberForm.amountPaid}
                    onChange={(e) => setMemberForm({ ...memberForm, amountPaid: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-white/5 flex gap-3">
              <button
                onClick={resetMemberForm}
                className="flex-1 py-3 border border-white/10 text-gray-400 rounded-xl hover:bg-white/5 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMember}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all"
              >
                {editingMember ? 'Save Changes' : 'Register Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121a] rounded-2xl w-full max-w-md border border-white/10">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                    <Upload className="w-5 h-5 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Bulk Upload Members</h2>
                </div>
                <button onClick={() => setShowBulkUploadModal(false)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-400 mb-1">CSV Format Required</p>
                    <p className="text-amber-500/70">Columns: name, email, contact, comments, date</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={downloadTemplate}
                className="w-full flex items-center justify-center gap-2 py-3 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5 hover:text-white transition-all"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
              
              <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-amber-500/30 transition-colors">
                <FileSpreadsheet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Upload CSV file</p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkUpload}
                    className="hidden"
                  />
                  <span className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all inline-block">
                    Choose File
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Membership;

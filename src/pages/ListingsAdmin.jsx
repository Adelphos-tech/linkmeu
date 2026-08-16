import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, LogOut, Plus, Search, RefreshCw, Trash2, Edit, Eye, 
  ChevronLeft, ChevronRight, Users, Briefcase, Home, Heart, 
  DollarSign, Calendar, MapPin, Mail, Phone, CheckCircle, XCircle,
  MoreVertical, Filter, Download, Image, Clock, TrendingUp, AlertCircle, Sparkles, Bell, UserCheck, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllListingsAdmin, deleteListing, updateListing, getAllUsers, getAllLeads, updateLeadStatus, deleteLead } from '../db/databaseAdapter';
import { format } from 'date-fns';
import { notifyUserListingStatus } from '../utils/emailService';
import { useToast } from '../components/Toast';
import NotificationCenter from '../components/NotificationCenter';

const ListingsAdmin = () => {
  const navigate = useNavigate();
  const { user, logout, isSuperAdmin } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('listings');
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [editingListing, setEditingListing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const itemsPerPage = 10;

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'parttime', label: 'Part-time Job', icon: Briefcase },
    { id: 'business', label: 'Business for Sale', icon: DollarSign },
    { id: 'property', label: 'Property for Rent', icon: Home },
    { id: 'wedding', label: 'Wedding Hall', icon: Heart },
  ];

  const statuses = [
    { id: 'all', label: 'All Status' },
    { id: 'active', label: 'Active' },
    { id: 'pending', label: 'Pending' },
    { id: 'rejected', label: 'Rejected' },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listingsData, usersData, leadsData] = await Promise.all([
        getAllListingsAdmin(),
        getAllUsers(),
        getAllLeads()
      ]);
      setListings(listingsData || []);
      setUsers(usersData || []);
      setLeads(leadsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !isSuperAdmin()) {
      navigate('/listings-login');
    } else {
      fetchData();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/listings-login');
  };

  const handleDeleteListing = async (listing) => {
    if (!window.confirm(`Delete listing "${listing.title}"?\n\nThis action cannot be undone.`)) return;
    
    try {
      await deleteListing(listing.id);
      setListings(prev => prev.filter(l => l.id !== listing.id));
    } catch (error) {
      alert('Failed to delete listing: ' + error.message);
    }
  };

  const handleStatusChange = async (listing, newStatus) => {
    try {
      await updateListing(listing.id, { status: newStatus });
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: newStatus } : l));
      
      // Notify user about status change
      if (listing.email && (newStatus === 'active' || newStatus === 'rejected')) {
        await notifyUserListingStatus(listing, newStatus);
        toast.success(
          newStatus === 'active' ? 'Listing approved!' : 'Listing rejected',
          `Notification sent to ${listing.email}`
        );
      }
    } catch (error) {
      toast.error('Failed to update status: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (!window.confirm(`Delete ${selectedItems.length} selected listings?`)) return;
    
    try {
      await Promise.all(selectedItems.map(id => deleteListing(id)));
      setListings(prev => prev.filter(l => !selectedItems.includes(l.id)));
      setSelectedItems([]);
    } catch (error) {
      alert('Failed to delete listings: ' + error.message);
    }
  };

  const handleEditListing = (listing) => {
    setEditingListing(listing);
    setEditForm({
      title: listing.title || '',
      description: listing.description || '',
      category: listing.category || 'business',
      budgetMin: listing.budgetMin || '',
      budgetMax: listing.budgetMax || '',
      currency: listing.currency || 'SGD',
      location: listing.location || '',
      contact: listing.contact || '',
      email: listing.email || '',
      revenue: listing.revenue || '',
      images: listing.images || [],
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newImages = [...(editForm.images || [])];
    
    for (const file of files) {
      if (newImages.length >= 5) break; // Max 5 images
      
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = (event) => {
          newImages.push(event.target.result);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    
    setEditForm({ ...editForm, images: newImages });
  };

  const removeImage = (index) => {
    const newImages = editForm.images.filter((_, i) => i !== index);
    setEditForm({ ...editForm, images: newImages });
  };

  const handleSaveEdit = async () => {
    if (!editingListing) return;
    setSaving(true);
    try {
      await updateListing(editingListing.id, {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        location: editForm.location,
        budgetMin: parseFloat(editForm.budgetMin) || null,
        budgetMax: parseFloat(editForm.budgetMax) || null,
        revenue: editForm.revenue,
        images: editForm.images,
      });
      setListings(prev => prev.map(l => 
        l.id === editingListing.id 
          ? { ...l, ...editForm, budgetMin: parseFloat(editForm.budgetMin) || null, budgetMax: parseFloat(editForm.budgetMax) || null }
          : l
      ));
      setEditingListing(null);
      setEditForm({});
    } catch (error) {
      alert('Failed to save changes: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || listing.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.contact?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.listingTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = leadStatusFilter === 'all' || lead.status === leadStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const getItemCount = () => {
    if (activeTab === 'listings') return filteredListings.length;
    if (activeTab === 'users') return filteredUsers.length;
    if (activeTab === 'leads') return filteredLeads.length;
    return 0;
  };

  const totalPages = Math.ceil(getItemCount() / itemsPerPage);
  const paginatedListings = filteredListings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    totalListings: listings.length,
    activeListings: listings.filter(l => l.status === 'active').length,
    pendingListings: listings.filter(l => l.status === 'pending').length,
    totalUsers: users.length,
    totalLeads: leads.length,
    newLeads: leads.filter(l => l.status === 'new').length,
    todayUsers: users.filter(u => {
      if (!u.created_at) return false;
      const created = new Date(u.created_at);
      const today = new Date();
      return created.toDateString() === today.toDateString();
    }).length,
  };

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat?.icon || Briefcase;
  };

  const getStatusStyle = (status) => {
    const styles = {
      active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[status] || styles.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] via-[#f5f0eb] to-[#ebe5dc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-6">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#faf8f5] via-[#f5f0eb] to-[#ebe5dc]">
      {/* Premium gradient overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(180,120,80,0.08)_0%,_transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,115,85,0.06)_0%,_transparent_50%)]"></div>

      {/* Header */}
      <header className="relative border-b border-gray-200/50 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <img src="/linkmeu-logo.png" alt="LinkMeU" className="h-10 w-auto" />
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="text-gray-800 font-semibold">Admin Panel</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Super Admin</span>
                </div>
                <p className="text-gray-500 text-xs">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Center */}
              <NotificationCenter pendingListingsCount={stats.pendingListings} />
              
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-all border border-gray-200 shadow-sm"
              >
                Back to Site
              </button>
              <button
                onClick={handleLogout}
                className="p-2 bg-white hover:bg-gray-50 text-gray-600 rounded-xl transition-all border border-gray-200 shadow-sm"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-full mb-4">
            <Shield className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Admin Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Listings & Users</h1>
          <p className="text-gray-500">View, edit, and manage all marketplace listings and registered users</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Listings', value: stats.totalListings, icon: Briefcase, color: 'amber', highlight: false },
            { label: 'Active', value: stats.activeListings, icon: CheckCircle, color: 'emerald', highlight: false },
            { label: 'Pending Approval', value: stats.pendingListings, icon: Bell, color: 'orange', highlight: stats.pendingListings > 0 },
            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue', highlight: false },
            { label: 'New Today', value: stats.todayUsers, icon: TrendingUp, color: 'purple', highlight: false },
          ].map((stat, i) => (
            <div 
              key={i} 
              className={`backdrop-blur-sm border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${
                stat.highlight 
                  ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300 ring-2 ring-orange-200 animate-pulse' 
                  : 'bg-white/70 border-gray-200/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 ${stat.highlight ? 'bg-orange-200' : `bg-${stat.color}-100`} rounded-xl flex items-center justify-center relative`}>
                  <stat.icon className={`w-5 h-5 ${stat.highlight ? 'text-orange-600' : `text-${stat.color}-600`}`} />
                  {stat.highlight && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                  )}
                </div>
                <div>
                  <p className={`text-2xl font-bold ${stat.highlight ? 'text-orange-700' : 'text-gray-900'}`}>{stat.value}</p>
                  <p className={`text-xs ${stat.highlight ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Card */}
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
          {/* Tabs & Filters */}
          <div className="border-b border-gray-200/50 p-4 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex gap-2 flex-wrap">
              {['listings', 'users', 'leads'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setCurrentPage(1); setStatusFilter('all'); setCategoryFilter('all'); setLeadStatusFilter('all'); setSearchQuery(''); }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${
                    activeTab === tab 
                      ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab} ({tab === 'listings' ? listings.length : tab === 'users' ? users.length : leads.length})
                </button>
              ))}
              
              {/* Quick filter for pending listings */}
              {stats.pendingListings > 0 && activeTab === 'listings' && (
                <button
                  onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    statusFilter === 'pending'
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {stats.pendingListings} Pending
                </button>
              )}

              {/* Quick filter for new leads */}
              {stats.newLeads > 0 && activeTab === 'leads' && (
                <button
                  onClick={() => { setLeadStatusFilter('new'); setCurrentPage(1); }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    leadStatusFilter === 'new'
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  {stats.newLeads} New
                </button>
              )}
            </div>

            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'listings' ? 'Search listings...' : activeTab === 'users' ? 'Search users...' : 'Search leads...'}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>

              {activeTab === 'listings' && (
                <>
                  <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                  >
                    {statuses.map(status => (
                      <option key={status.id} value={status.id}>{status.label}</option>
                    ))}
                  </select>
                </>
              )}

              <button
                onClick={fetchData}
                className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="bg-amber-50 border-b border-amber-200/50 px-4 py-3 flex items-center gap-4">
              <span className="text-amber-700 text-sm font-medium">{selectedItems.length} selected</span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-all flex items-center gap-1"
              >
                <Trash2 size={14} />
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedItems([])}
                className="text-gray-500 text-sm hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          )}

          {/* Listings Table */}
          {activeTab === 'listings' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === paginatedListings.length && paginatedListings.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(paginatedListings.map(l => l.id));
                          } else {
                            setSelectedItems([]);
                          }
                        }}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Listing</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Budget</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedListings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center">
                        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No listings found</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedListings.map((listing) => {
                      const CategoryIcon = getCategoryIcon(listing.category);
                      return (
                        <tr key={listing.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(listing.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItems([...selectedItems, listing.id]);
                                } else {
                                  setSelectedItems(selectedItems.filter(id => id !== listing.id));
                                }
                              }}
                              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                                {listing.images && listing.images[0] ? (
                                  <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Image className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-gray-900 font-medium truncate max-w-[200px]">{listing.title}</p>
                                <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3" />
                                  {listing.location || 'Singapore'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <CategoryIcon className="w-4 h-4 text-gray-600" />
                              </div>
                              <span className="text-gray-700 text-sm capitalize">{listing.category}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-emerald-600 text-sm font-semibold">
                              {listing.currency === 'SGD' ? 'S$' : listing.currency === 'MYR' ? 'RM' : '$'}
                              {listing.budgetMin?.toLocaleString() || '0'}
                              {listing.budgetMax && ` - ${listing.budgetMax.toLocaleString()}`}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-gray-800 text-sm">{listing.email}</p>
                              <p className="text-gray-500 text-xs">{listing.contact}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <select
                              value={listing.status}
                              onChange={(e) => handleStatusChange(listing, e.target.value)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getStatusStyle(listing.status)} cursor-pointer focus:outline-none`}
                            >
                              <option value="active">Active</option>
                              <option value="pending">Pending</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-gray-500 text-sm">
                              {listing.createdAt ? format(new Date(listing.createdAt), 'MMM d, yyyy') : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditListing(listing)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteListing(listing)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Users Table */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-16 text-center">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No users found</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
                              <span className="text-white font-semibold text-sm">
                                {u.email?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-gray-900 font-medium">{u.email}</p>
                              <p className="text-gray-400 text-xs">ID: {u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{u.contact || 'Not provided'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            u.role === 'superadmin' 
                              ? 'bg-amber-100 text-amber-700' 
                              : u.role === 'owner'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-500 text-sm">
                            {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy HH:mm') : '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Leads Table */}
          {activeTab === 'leads' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lead Info</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Listing</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Looking For</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No leads found</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-sm">
                              <span className="text-white font-semibold text-sm">
                                {lead.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-gray-900 font-medium">{lead.name}</p>
                              <p className="text-gray-400 text-xs">ID: {lead.id?.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            {lead.contact && (
                              <a href={`tel:${lead.contact}`} className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{lead.contact}</span>
                              </a>
                            )}
                            {lead.email && (
                              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-sm truncate max-w-[150px]">{lead.email}</span>
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-gray-900 text-sm font-medium truncate max-w-[200px]" title={lead.listingTitle}>
                            {lead.listingTitle || 'Unknown Listing'}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          {lead.notes ? (
                            <p className="text-gray-700 text-sm max-w-[200px] line-clamp-2" title={lead.notes}>
                              {lead.notes}
                            </p>
                          ) : (
                            <span className="text-gray-400 text-sm italic">Not specified</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={lead.status}
                            onChange={async (e) => {
                              try {
                                await updateLeadStatus(lead.id, e.target.value);
                                setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: e.target.value } : l));
                                toast.success('Lead status updated');
                              } catch (err) {
                                toast.error('Failed to update status');
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                              lead.status === 'new' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                              lead.status === 'contacted' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              lead.status === 'converted' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                              'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="converted">Converted</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-500 text-sm">
                            {lead.createdAt ? format(new Date(lead.createdAt), 'MMM d, yyyy HH:mm') : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {lead.contact && (
                              <a
                                href={`https://wa.me/${lead.contact.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${lead.name}, thank you for your interest in "${lead.listingTitle}".${lead.notes ? `\n\nYou mentioned: "${lead.notes}"` : ''}\n\nHow can we help you?`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={async () => {
                                if (window.confirm('Delete this lead?')) {
                                  try {
                                    await deleteLead(lead.id);
                                    setLeads(prev => prev.filter(l => l.id !== lead.id));
                                    toast.success('Lead deleted');
                                  } catch (err) {
                                    toast.error('Failed to delete lead');
                                  }
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200/50 px-4 py-4 flex items-center justify-between bg-gray-50/50">
              <p className="text-gray-500 text-sm">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, getItemCount())} of {getItemCount()}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-gray-600 text-sm px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Listing Modal */}
      {editingListing && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Listing</h2>
              <button
                onClick={() => { setEditingListing(null); setEditForm({}); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Category & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="business">Business</option>
                    <option value="property">Property</option>
                    <option value="movies">Movies</option>
                    <option value="products">Products</option>
                    <option value="opportunity">Opportunity</option>
                    <option value="wedding">Wedding</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Budget */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={editForm.currency}
                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="SGD">SGD</option>
                    <option value="USD">USD</option>
                    <option value="MYR">MYR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Budget</label>
                  <input
                    type="number"
                    value={editForm.budgetMin}
                    onChange={(e) => setEditForm({ ...editForm, budgetMin: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget</label>
                  <input
                    type="number"
                    value={editForm.budgetMax}
                    onChange={(e) => setEditForm({ ...editForm, budgetMax: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Revenue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Revenue (for business)</label>
                <input
                  type="text"
                  value={editForm.revenue}
                  onChange={(e) => setEditForm({ ...editForm, revenue: e.target.value })}
                  placeholder="e.g., $25,000/month"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <input
                    type="text"
                    value={editForm.contact}
                    onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Images Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                
                {/* Current Images */}
                {editForm.images && editForm.images.length > 0 && (
                  <div className="grid grid-cols-5 gap-3 mb-3">
                    {editForm.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={img} 
                          alt={`Image ${index + 1}`} 
                          className="w-full h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Upload Button */}
                {(!editForm.images || editForm.images.length < 5) && (
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors">
                    <Image className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {editForm.images?.length > 0 
                        ? `Add more images (${5 - editForm.images.length} remaining)` 
                        : 'Upload images (max 5)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => { setEditingListing(null); setEditForm({}); }}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingsAdmin;

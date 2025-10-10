import React, { useState, useEffect } from 'react';
import { Mail, Users, Calendar, Package, Send, Eye, BarChart3, Filter, Search, CheckSquare, Square } from 'lucide-react';
import { isAutheticated } from '../auth/helper';
import { useDevMode } from '../context/DevModeContext';
import { toast, Toaster } from 'react-hot-toast';
import { format } from 'date-fns';
import { API } from '../backend';

// TypeScript interfaces
interface Product {
  _id: string;
  name: string;
  price: number;
  photoUrl?: string;
  images?: Array<{ url: string; isPrimary?: boolean }>;
  category: string;
  stock: number;
  isActive: boolean;
}

interface Buyer {
  _id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  orderIds: string[];
}

interface Campaign {
  _id?: string;
  name: string;
  subject: string;
  products: Product[];
  buyers: Buyer[];
  dateRange: {
    start: string;
    end: string;
  };
  status: 'draft' | 'sent' | 'scheduled';
  sentAt?: string;
  analytics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
}

const EmailMarketing: React.FC = () => {
  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;
  const { isTestMode } = useDevMode();

  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [selectedBuyers, setSelectedBuyers] = useState<Buyer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Campaign creation state
  const [campaignName, setCampaignName] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  // Manual email selection
  const [manualEmails, setManualEmails] = useState<string[]>([]);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailInputError, setEmailInputError] = useState('');

  // Filters and search
  const [productSearch, setProductSearch] = useState('');
  const [buyerFilter, setBuyerFilter] = useState<'all' | 'new' | 'repeat' | 'high-value'>('all');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCampaigns();
  }, [isTestMode]);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      loadBuyers();
    }
  }, [dateRange, buyerFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      if (isTestMode) {
        // Mock products data
        const mockProducts: Product[] = [
          {
            _id: 'prod1',
            name: 'Naruto Hokage T-Shirt',
            price: 1199,
            photoUrl: '/placeholder.png',
            category: 'Anime',
            stock: 25,
            isActive: true
          },
          {
            _id: 'prod2',
            name: 'Dragon Ball Z Goku T-Shirt',
            price: 1399,
            photoUrl: '/placeholder.png',
            category: 'Anime',
            stock: 18,
            isActive: true
          },
          {
            _id: 'prod3',
            name: 'One Piece Luffy T-Shirt',
            price: 999,
            photoUrl: '/placeholder.png',
            category: 'Anime',
            stock: 30,
            isActive: true
          },
          {
            _id: 'prod4',
            name: 'Attack on Titan Survey Corps T-Shirt',
            price: 1299,
            photoUrl: '/placeholder.png',
            category: 'Anime',
            stock: 22,
            isActive: true
          },
          {
            _id: 'prod5',
            name: 'My Hero Academia Deku T-Shirt',
            price: 1199,
            photoUrl: '/placeholder.png',
            category: 'Anime',
            stock: 15,
            isActive: true
          },
          {
            _id: 'prod6',
            name: 'Demon Slayer Tanjiro T-Shirt',
            price: 1399,
            photoUrl: '/placeholder.png',
            category: 'Anime',
            stock: 28,
            isActive: true
          }
        ];
        setProducts(mockProducts);
      } else {
        if (user && token) {
          const response = await fetch(`${API}/products?limit=50&isActive=true`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setProducts(data.products || []);
          }
        }
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadBuyers = async () => {
    try {
      if (isTestMode) {
        // Mock buyers data based on date range and filter
        const mockBuyers: Buyer[] = [
          {
            _id: 'buyer1',
            name: 'Akash Sharma',
            email: 'akash.sharma@example.com',
            totalOrders: 3,
            totalSpent: 3597,
            lastOrderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            orderIds: ['ord1', 'ord2', 'ord3']
          },
          {
            _id: 'buyer2',
            name: 'Priya Patel',
            email: 'priya.patel@example.com',
            totalOrders: 1,
            totalSpent: 1199,
            lastOrderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            orderIds: ['ord4']
          },
          {
            _id: 'buyer3',
            name: 'Rohit Kumar',
            email: 'rohit.kumar@example.com',
            totalOrders: 5,
            totalSpent: 6495,
            lastOrderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            orderIds: ['ord5', 'ord6', 'ord7', 'ord8', 'ord9']
          },
          {
            _id: 'buyer4',
            name: 'Sneha Gupta',
            email: 'sneha.gupta@example.com',
            totalOrders: 2,
            totalSpent: 2398,
            lastOrderDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            orderIds: ['ord10', 'ord11']
          },
          {
            _id: 'buyer5',
            name: 'Arjun Singh',
            email: 'arjun.singh@example.com',
            totalOrders: 1,
            totalSpent: 999,
            lastOrderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            orderIds: ['ord12']
          }
        ];

        // Apply buyer filter
        let filteredBuyers = mockBuyers;
        switch (buyerFilter) {
          case 'new':
            filteredBuyers = mockBuyers.filter(buyer => buyer.totalOrders === 1);
            break;
          case 'repeat':
            filteredBuyers = mockBuyers.filter(buyer => buyer.totalOrders > 1);
            break;
          case 'high-value':
            filteredBuyers = mockBuyers.filter(buyer => buyer.totalSpent > 3000);
            break;
          default:
            filteredBuyers = mockBuyers;
        }

        setBuyers(filteredBuyers);
      } else {
        if (user && token) {
          const params = new URLSearchParams({
            startDate: dateRange.start,
            endDate: dateRange.end,
            filter: buyerFilter
          });

          const response = await fetch(`${API}/marketing/buyers/${user._id}?${params}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setBuyers(data.buyers || []);
          }
        }
      }
    } catch (error) {
      console.error('Error loading buyers:', error);
      toast.error('Failed to load buyers');
    }
  };

  const loadCampaigns = async () => {
    try {
      if (isTestMode) {
        // Mock campaigns data
        const mockCampaigns: Campaign[] = [
          {
            _id: 'camp1',
            name: 'New Arrivals October',
            subject: 'New Anime Designs Just Dropped! 🔥',
            products: [],
            buyers: [],
            dateRange: { start: '2024-10-01', end: '2024-10-31' },
            status: 'sent',
            sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            analytics: {
              sent: 150,
              delivered: 147,
              opened: 89,
              clicked: 23
            }
          },
          {
            _id: 'camp2',
            name: 'September Customer Retention',
            subject: 'Miss us? Check out these exclusive designs! ✨',
            products: [],
            buyers: [],
            dateRange: { start: '2024-09-01', end: '2024-09-30' },
            status: 'sent',
            sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            analytics: {
              sent: 98,
              delivered: 95,
              opened: 52,
              clicked: 18
            }
          }
        ];
        setCampaigns(mockCampaigns);
      } else {
        if (user && token) {
          const response = await fetch(`${API}/marketing/campaigns/${user._id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setCampaigns(data.campaigns || []);
          }
        }
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.find(p => p._id === product._id);
      if (isSelected) {
        return prev.filter(p => p._id !== product._id);
      } else {
        return [...prev, product];
      }
    });
  };

  const toggleBuyerSelection = (buyer: Buyer) => {
    setSelectedBuyers(prev => {
      const isSelected = prev.find(b => b._id === buyer._id);
      if (isSelected) {
        return prev.filter(b => b._id !== buyer._id);
      } else {
        return [...prev, buyer];
      }
    });
  };

  const selectAllBuyers = () => {
    setSelectedBuyers([...buyers]);
  };

  const clearAllBuyers = () => {
    setSelectedBuyers([]);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSendCampaign = async () => {
    const totalRecipients = getTotalRecipients();
    
    if (!campaignName || !emailSubject || selectedProducts.length === 0 || totalRecipients === 0) {
      toast.error('Please fill all required fields and select products and recipients');
      return;
    }

    try {
      setLoading(true);
      
      if (isTestMode) {
        // Simulate sending
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.success(`Campaign "${campaignName}" sent to ${totalRecipients} recipients!`);
        
        // Add to campaigns list
        const newCampaign: Campaign = {
          _id: `camp_${Date.now()}`,
          name: campaignName,
          subject: emailSubject,
          products: selectedProducts,
          buyers: buyers,
          dateRange,
          status: 'sent',
          sentAt: new Date().toISOString(),
          analytics: {
            sent: totalRecipients,
            delivered: totalRecipients - 1,
            opened: 0,
            clicked: 0
          }
        };
        setCampaigns(prev => [newCampaign, ...prev]);
        
        // Reset form
        setCampaignName('');
        setEmailSubject('');
        setSelectedProducts([]);
        setManualEmails([]);
      } else {
        if (user && token) {
          const response = await fetch(`${API}/marketing/campaign/send/${user._id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: campaignName,
              subject: emailSubject,
              products: selectedProducts.map(p => p._id),
              buyers: selectedBuyers.map(b => b._id),
              manualEmails: manualEmails,
              dateRange
            })
          });

          if (response.ok) {
            const data = await response.json();
            toast.success(`Campaign sent to ${totalRecipients} recipients!`);
            loadCampaigns();
            
            // Reset form
            setCampaignName('');
            setEmailSubject('');
            setSelectedProducts([]);
            setManualEmails([]);
          } else {
            throw new Error('Failed to send campaign');
          }
        }
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  // Manual email management functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addManualEmail = () => {
    setEmailInputError('');
    
    if (!newEmailInput.trim()) {
      setEmailInputError('Please enter an email address');
      return;
    }
    
    if (!validateEmail(newEmailInput.trim())) {
      setEmailInputError('Please enter a valid email address');
      return;
    }
    
    const email = newEmailInput.trim().toLowerCase();
    
    if (manualEmails.includes(email)) {
      setEmailInputError('This email is already added');
      return;
    }
    
    // Check if email already exists in buyers list
    const existsInBuyers = buyers.some(buyer => buyer.email.toLowerCase() === email);
    if (existsInBuyers) {
      setEmailInputError('This email is already in the selected buyers list');
      return;
    }
    
    setManualEmails(prev => [...prev, email]);
    setNewEmailInput('');
  };

  const removeManualEmail = (emailToRemove: string) => {
    setManualEmails(prev => prev.filter(email => email !== emailToRemove));
  };

  const getTotalRecipients = () => {
    return selectedBuyers.length + manualEmails.length;
  };

  const getProductImageUrl = (product: Product) => {
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary);
      return primaryImage ? primaryImage.url : product.images[0].url;
    }
    return product.photoUrl || '/placeholder.png';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Mail className="w-8 h-8 text-yellow-400" />
                Email Marketing
              </h1>
              <p className="text-gray-400">Send product showcases to targeted buyers</p>
              {isTestMode && (
                <p className="text-yellow-400 text-sm mt-2">
                  🧪 Test Mode: Using sample data
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'create'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Create Campaign
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Campaign History
            </button>
          </div>
        </div>

        {activeTab === 'create' ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Campaign Setup */}
            <div className="lg:col-span-2 space-y-6">
              {/* Campaign Details */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-yellow-400" />
                  Campaign Details
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Campaign Name
                    </label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="e.g., New Arrivals October 2024"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Subject Line
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="e.g., New Anime Designs Just for You! 🔥"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Date Range & Buyer Selection */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-yellow-400" />
                  Target Buyers
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 text-white"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Buyer Filter
                  </label>
                  <select
                    value={buyerFilter}
                    onChange={(e) => setBuyerFilter(e.target.value as any)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 text-white"
                  >
                    <option value="all">All Buyers</option>
                    <option value="new">First-time Buyers</option>
                    <option value="repeat">Repeat Customers</option>
                    <option value="high-value">High-value Customers (₹3000+)</option>
                  </select>
                </div>

                {/* Available Buyers List */}
                {buyers.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-yellow-400">
                        Available Buyers ({buyers.length})
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={selectAllBuyers}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          onClick={clearAllBuyers}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-700 rounded-lg p-4">
                      {buyers.map(buyer => {
                        const isSelected = selectedBuyers.find(b => b._id === buyer._id);
                        return (
                          <div
                            key={buyer._id}
                            onClick={() => toggleBuyerSelection(buyer)}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                              isSelected ? 'bg-yellow-400/20 border border-yellow-400/50' : 'bg-gray-600 hover:bg-gray-500'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-yellow-400" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                              <div>
                                <p className="text-white font-medium">{buyer.name}</p>
                                <p className="text-gray-300 text-sm">{buyer.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-yellow-400 font-bold">₹{buyer.totalSpent.toLocaleString('en-IN')}</p>
                              <p className="text-gray-400 text-xs">{buyer.totalOrders} orders</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected Buyers Summary */}
                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-300 mb-2">Selected Buyers:</p>
                  <p className="text-2xl font-bold text-yellow-400">{selectedBuyers.length}</p>
                  {selectedBuyers.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400">
                        Total potential revenue: ₹{selectedBuyers.reduce((sum, buyer) => sum + buyer.totalSpent, 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Manual Email Selection */}
                <div className="border-t border-gray-600 pt-4">
                  <h3 className="text-lg font-medium text-yellow-400 mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Manual Email Selection
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newEmailInput}
                        onChange={(e) => setNewEmailInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addManualEmail()}
                        placeholder="Enter email address..."
                        className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:border-yellow-400 text-white text-sm"
                      />
                      <button
                        onClick={addManualEmail}
                        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-medium text-sm transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    
                    {emailInputError && (
                      <p className="text-red-400 text-xs">{emailInputError}</p>
                    )}
                    
                    {manualEmails.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-300">Manual Recipients ({manualEmails.length}):</p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {manualEmails.map((email, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-600 px-3 py-2 rounded text-sm">
                              <span className="text-white">{email}</span>
                              <button
                                onClick={() => removeManualEmail(email)}
                                className="text-red-400 hover:text-red-300 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Recipients Summary */}
                <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 mt-4">
                  <p className="text-sm text-gray-300 mb-2">Total Recipients:</p>
                  <p className="text-3xl font-bold text-yellow-400">{getTotalRecipients()}</p>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>From Orders: {selectedBuyers.length}</span>
                    <span>Manual: {manualEmails.length}</span>
                  </div>
                </div>
              </div>

              {/* Product Selection */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-yellow-400" />
                  Select Products to Showcase
                </h2>
                
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {filteredProducts.map(product => {
                    const isSelected = selectedProducts.find(p => p._id === product._id);
                    return (
                      <div
                        key={product._id}
                        onClick={() => toggleProductSelection(product)}
                        className={`relative bg-gray-700 rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-yellow-400 bg-yellow-400/10' : 'hover:bg-gray-600'
                        }`}
                      >
                        <div className="absolute top-2 right-2">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-yellow-400" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        
                        <img
                          src={getProductImageUrl(product)}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                        
                        <h3 className="font-medium text-sm text-white mb-1 pr-6">
                          {product.name}
                        </h3>
                        <p className="text-yellow-400 font-bold">₹{product.price}</p>
                        <p className="text-xs text-gray-400">Stock: {product.stock}</p>
                      </div>
                    );
                  })}
                </div>

                {selectedProducts.length > 0 && (
                  <div className="mt-4 bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-300 mb-2">Selected Products:</p>
                    <p className="text-xl font-bold text-yellow-400">{selectedProducts.length}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedProducts.slice(0, 3).map(product => (
                        <span key={product._id} className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded">
                          {product.name}
                        </span>
                      ))}
                      {selectedProducts.length > 3 && (
                        <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                          +{selectedProducts.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Preview & Actions */}
            <div className="space-y-6">
              {/* Campaign Summary */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">Campaign Summary</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Campaign:</span>
                    <span className="text-white">{campaignName || 'Untitled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Recipients:</span>
                    <span className="text-yellow-400 font-bold">{getTotalRecipients()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Products:</span>
                    <span className="text-yellow-400 font-bold">{selectedProducts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date Range:</span>
                    <span className="text-white text-sm">
                      {format(new Date(dateRange.start), 'MMM dd')} - {format(new Date(dateRange.end), 'MMM dd')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview Button */}
              <button
                onClick={() => setShowPreview(!showPreview)}
                disabled={selectedProducts.length === 0}
                className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                {showPreview ? 'Hide Preview' : 'Preview Email'}
              </button>

              {/* Send Campaign Button */}
              <button
                onClick={handleSendCampaign}
                disabled={loading || !campaignName || !emailSubject || selectedProducts.length === 0 || getTotalRecipients() === 0}
                className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 px-6 py-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Campaign
                  </>
                )}
              </button>

              {/* Email Preview */}
              {showPreview && selectedProducts.length > 0 && (
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h2 className="text-lg font-bold mb-4">Email Preview</h2>
                  <div className="bg-white text-gray-900 rounded-lg p-4 text-sm">
                    <div className="border-b pb-3 mb-3">
                      <p className="font-bold">{emailSubject || 'Subject Line'}</p>
                      <p className="text-gray-600">From: Attars &lt;noreply@attars.club&gt;</p>
                    </div>
                    
                    <div className="space-y-4">
                      <h1 className="text-xl font-bold text-center bg-yellow-400 text-gray-900 p-4 rounded">
                        {emailSubject || 'Check Out These Amazing Designs!'}
                      </h1>
                      
                      <p>Hi there!</p>
                      <p>We thought you'd love these awesome new anime designs:</p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {selectedProducts.slice(0, 4).map(product => (
                          <div key={product._id} className="border rounded p-2 text-center h-32 flex flex-col justify-between">
                            <img
                              src={getProductImageUrl(product)}
                              alt={product.name}
                              className="w-full h-16 object-cover rounded mb-1"
                            />
                            <div className="flex-1 flex flex-col justify-between">
                              <p className="font-medium text-xs leading-tight line-clamp-2 overflow-hidden">{product.name}</p>
                              <p className="text-yellow-600 font-bold">₹{product.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Why Shop With Us Section */}
                      <div className="bg-gray-100 p-3 rounded text-center">
                        <h3 className="font-bold text-gray-900 mb-2">Why Shop With Us?</h3>
                        <div className="text-xs text-gray-700 space-y-1">
                          <p>🎨 Unique anime-inspired designs</p>
                          <p>👕 Premium quality materials</p>
                          <p>🚚 Fast shipping across India</p>
                          <p>💝 Perfect for anime fans</p>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <button className="bg-yellow-400 text-gray-900 px-4 py-2 rounded font-bold">
                          Shop Now
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-4">
                        This is a preview of how your email will look to recipients.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Campaign History Tab
          <div className="space-y-6">
            {/* Campaign Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{campaigns.length}</p>
                    <p className="text-sm text-gray-400">Total Campaigns</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <Send className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {campaigns.reduce((sum, camp) => sum + (camp.analytics?.sent || 0), 0)}
                    </p>
                    <p className="text-sm text-gray-400">Emails Sent</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <Eye className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {campaigns.reduce((sum, camp) => sum + (camp.analytics?.opened || 0), 0)}
                    </p>
                    <p className="text-sm text-gray-400">Emails Opened</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {campaigns.reduce((sum, camp) => sum + (camp.analytics?.clicked || 0), 0)}
                    </p>
                    <p className="text-sm text-gray-400">Clicks</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign List */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Recent Campaigns</h2>
              
              {campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-xl text-gray-400">No campaigns yet</p>
                  <p className="text-gray-500 mt-2">Create your first email campaign to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map(campaign => (
                    <div key={campaign._id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-white">{campaign.name}</h3>
                          <p className="text-gray-400">{campaign.subject}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Sent on {campaign.sentAt ? format(new Date(campaign.sentAt), 'MMM dd, yyyy at h:mm a') : 'Draft'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            campaign.status === 'sent' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      {campaign.analytics && (
                        <div className="grid grid-cols-4 gap-4 mt-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-white">{campaign.analytics.sent}</p>
                            <p className="text-xs text-gray-400">Sent</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-400">{campaign.analytics.delivered}</p>
                            <p className="text-xs text-gray-400">Delivered</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-400">{campaign.analytics.opened}</p>
                            <p className="text-xs text-gray-400">Opened</p>
                            <p className="text-xs text-gray-500">
                              {campaign.analytics.sent > 0 ? Math.round((campaign.analytics.opened / campaign.analytics.sent) * 100) : 0}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-400">{campaign.analytics.clicked}</p>
                            <p className="text-xs text-gray-400">Clicked</p>
                            <p className="text-xs text-gray-500">
                              {campaign.analytics.opened > 0 ? Math.round((campaign.analytics.clicked / campaign.analytics.opened) * 100) : 0}%
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailMarketing;

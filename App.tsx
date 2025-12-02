




import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import { PRODUCTS } from './constants'; 
import { Product, CartItem, Category, UserRole, UserProfile, Order, OrderStatus, Review, PaymentMethod, DeliveryMethod, Address, BankAccount, Variation, TrackingEvent, SellerApplication } from './types';
import { Star, ArrowRight, Trash2, Plus, Minus, MapPin, X, ShoppingBag, Facebook, CheckCircle, Loader, Eye, EyeOff, LayoutDashboard, Package, TrendingUp, Users, AlertCircle, ShieldCheck, Ban, ChevronLeft, Tag, Search, ShoppingCart, CreditCard, ChevronDown, UserCircle, Edit3, Save, Camera, Mail, MessageSquare, Truck, Banknote, Bell, FileText, Lock, Settings, Check, Filter, SlidersHorizontal, Award, ChevronRight, User, Store, Send, ChevronUp, Image as ImageIcon, Printer, AlertTriangle, Phone, Globe, Instagram, Twitter, Calendar, Heart, Hammer, Leaf, LogIn, PauseCircle, ShieldBan, PlayCircle, MessageCircle, CornerDownRight } from 'lucide-react';
import firebase, { auth, isFirebaseConfigured } from './firebaseConfig';
import { fetchProducts, seedDatabase, createUserDocument, getUserProfile, fetchSellerProducts, addProduct, deleteProduct, fetchAllUsers, updateUserRole, deleteUserDocument, createOrder, fetchOrders, updateOrderStatus, updateUserBag, updateUserProfile, addProductReview, fetchProductReviews, uploadProfileImage, uploadShopImage, startConversation, uploadProductImage, updateProduct, updateOrderTracking, fetchJtTracking, submitSellerApplication, fetchSellerApplications, approveSellerApplication, rejectSellerApplication, requestOrderCancellation, approveOrderCancellation, fetchApprovedSellers, updateUserStatus, checkSuspensionExpiry, replyToReview, deleteReview } from './services/firestoreService';
import { fetchProvinces, fetchCities, fetchBarangays, LocationCode } from './services/locationService';
import ChatAssistant from './components/ChatAssistant';
import { HERO_COVER } from './assets/images';

// --- Types for App State ---
interface UserState {
    uid: string;
    name: string;
    email: string;
    emailVerified: boolean;
    role: UserRole;
    username?: string;
    phoneNumber?: string;
    gender?: 'Male' | 'Female' | 'Other';
    birthDate?: string;
    bag?: CartItem[];
    photoURL?: string;
    createdAt?: any;
    addresses?: Address[];
    bankAccounts?: BankAccount[];
    shopName?: string;
    shopAddress?: string;
    shopProvince?: string;
    shopCity?: string;
    shopBarangay?: string;
    shopImage?: string;
    status?: 'active' | 'suspended' | 'banned';
    suspensionEndDate?: any;
}

// --- Hook for Body Scroll Lock ---
const useBodyScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    if (isLocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isLocked]);
};

// --- Helper Components ---

const StarRating: React.FC<{ rating: number; size?: string }> = ({ rating, size = "w-4 h-4" }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= Math.round(rating)
              ? "text-yellow-400 fill-current"
              : "text-stone-300"
          }`}
        />
      ))}
    </div>
  );
};

// --- Breadcrumbs Component ---
interface BreadcrumbItem {
    label: string;
    path?: string;
}

const Breadcrumbs: React.FC<{ items: BreadcrumbItem[]; onNavigate: (path: string) => void }> = ({ items, onNavigate }) => (
  <nav className="flex items-center text-sm text-stone-500 mb-6 animate-fade-in-up">
    {items.map((item, index) => (
      <React.Fragment key={index}>
        {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-stone-400" />}
        {item.path ? (
          <button 
            onClick={() => onNavigate(item.path!)} 
            className="hover:text-brand-blue transition-colors hover:underline"
          >
            {item.label}
          </button>
        ) : (
          <span className="font-medium text-stone-800">{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

// --- Footer Component ---
const Footer: React.FC<{ onNavigate: (path: string) => void; user: UserState | null }> = ({ onNavigate, user }) => {
  const isSellerOrAdmin = user?.role === 'seller' || user?.role === 'admin';

  return (
    <footer className="bg-brand-blue text-blue-100 py-16 border-t border-blue-800">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <h3 className="text-white text-xl font-serif font-bold">Tatak Norte</h3>
          <p className="text-sm leading-relaxed text-blue-100">
            Empowering Ilocano artisans by connecting their authentic crafts with the world. 
            Preserving heritage, one woven thread at a time.
          </p>
          <div className="flex gap-4 pt-2">
              <button className="hover:text-white text-blue-200 transition-colors"><Facebook className="w-5 h-5" /></button>
              <button className="hover:text-white text-blue-200 transition-colors"><Instagram className="w-5 h-5" /></button>
              <button className="hover:text-white text-blue-200 transition-colors"><Twitter className="w-5 h-5" /></button>
          </div>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-4">Shop</h4>
          <ul className="space-y-2 text-sm text-blue-100">
            <li><button onClick={() => onNavigate('/shop')} className="hover:text-brand-clay transition-colors">All Products</button></li>
            <li><button onClick={() => onNavigate('/shop')} className="hover:text-brand-clay transition-colors">Weaving</button></li>
            <li><button onClick={() => onNavigate('/shop')} className="hover:text-brand-clay transition-colors">Pottery</button></li>
            <li><button onClick={() => onNavigate('/shop')} className="hover:text-brand-clay transition-colors">Delicacies</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4">Support</h4>
          <ul className="space-y-2 text-sm text-blue-100">
            <li><button onClick={() => onNavigate('/about')} className="hover:text-brand-clay transition-colors">About Us</button></li>
            <li><button className="hover:text-brand-clay transition-colors">FAQ</button></li>
            {!isSellerOrAdmin && (
               <li><button onClick={() => onNavigate('/seller-registration')} className="hover:text-brand-clay transition-colors">Seller Registration</button></li>
            )}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-blue-100">
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Batac City, Ilocos Norte</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +63 917 123 4567</li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> hello@tataknorte.ph</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-blue-800 text-center text-xs text-blue-200">
        © {new Date().getFullYear()} Tatak Norte. All rights reserved.
      </div>
    </footer>
  );
};

const CancelOrderModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (reason: string) => void; isLoading: boolean }> = ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-in">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xl font-bold text-stone-900">Cancel Order</h3>
                     <button onClick={onClose}><X className="w-5 h-5 text-stone-500" /></button>
                </div>
                <p className="text-sm text-stone-500 mb-4">Please tell us why you want to cancel this order. The seller will review your request.</p>
                <textarea
                    className="w-full p-3 border border-stone-200 rounded-xl mb-4 focus:ring-2 focus:ring-brand-blue/20 outline-none"
                    rows={4}
                    placeholder="Reason for cancellation..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 border border-stone-200 rounded-xl font-bold text-stone-600 hover:bg-stone-50">Back</button>
                    <button
                        onClick={() => onSubmit(reason)}
                        disabled={!reason.trim() || isLoading}
                        className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Submitting...' : 'Confirm Cancellation'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SuspendUserModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: (days: number) => void; sellerName: string }> = ({ isOpen, onClose, onConfirm, sellerName }) => {
    const [days, setDays] = useState(7);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-scale-in text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600">
                    <PauseCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-stone-900">Suspend {sellerName}?</h3>
                <p className="text-stone-500 mb-6 text-sm">
                    The seller's products will be hidden from the marketplace during the suspension period.
                </p>
                
                <div className="mb-6 text-left">
                    <label className="block text-sm font-bold text-stone-700 mb-2">Suspension Duration (Days)</label>
                    <input 
                        type="number" 
                        min="1" 
                        value={days} 
                        onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-brand-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    />
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3 border border-stone-200 rounded-xl font-bold text-stone-600 hover:bg-stone-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onConfirm(days)} 
                        className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600"
                    >
                        Suspend
                    </button>
                </div>
            </div>
        </div>
    );
};

const SellerRegistrationPage: React.FC<{ user: UserState | null; onLoginClick: () => void }> = ({ user, onLoginClick }) => {
    // ... (content same as previous, abbreviated for brevity as no changes requested here)
    // For XML response, I will include the full existing content of SellerRegistrationPage to be safe, 
    // or rely on the previous context. 
    // Since the instruction says "ONLY return files... that need to be updated", and I'm updating App.tsx, 
    // I must return the FULL content of App.tsx.
    
    // (Re-implementing SellerRegistrationPage content for completeness in App.tsx)
    const [provinces, setProvinces] = useState<LocationCode[]>([]);
    const [cities, setCities] = useState<LocationCode[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        businessName: '',
        ownerName: user?.name || '',
        email: user?.email || '',
        phoneNumber: '',
        province: '',
        provinceCode: '',
        city: '',
        category: 'Weaving (Inabel)',
        description: ''
    });

    useEffect(() => {
        fetchProvinces().then(setProvinces);
    }, []);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                ownerName: user.name || prev.ownerName,
                email: user.email || prev.email
            }));
        }
    }, [user]);

    const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        const name = e.target.options[e.target.selectedIndex].text;
        setFormData({ ...formData, province: name, provinceCode: code, city: '' });
        setCities([]);
        if (code) {
            setCities(await fetchCities(code));
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            setFormData({ ...formData, phoneNumber: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsLoading(true);
        if (formData.phoneNumber.length !== 11) {
            alert("Phone number must be exactly 11 digits.");
            setIsLoading(false);
            return;
        }
        try {
            await submitSellerApplication({
                userId: user.uid,
                businessName: formData.businessName,
                ownerName: formData.ownerName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                province: formData.province,
                city: formData.city,
                category: formData.category,
                description: formData.description,
                status: 'pending',
                createdAt: new Date()
            });
            setIsSubmitted(true);
        } catch (error) {
            console.error("Submission failed", error);
            alert("Failed to submit application. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-stone-100 animate-scale-in">
                    <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-6 text-brand-blue">
                        <Store className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-stone-900 mb-4">Start Selling</h1>
                    <p className="text-stone-500 mb-8 leading-relaxed">
                        Join our community of authentic Ilocano artisans. Please log in or create an account to begin your seller application.
                    </p>
                    <button onClick={onLoginClick} className="w-full py-4 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                        <LogIn className="w-5 h-5" /> Log In / Sign Up
                    </button>
                    <p className="text-xs text-stone-400 mt-6">Already have an account? Just log in to proceed.</p>
                </div>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 animate-scale-in">
                <div className="bg-white p-12 rounded-3xl shadow-xl max-w-lg w-full text-center border border-stone-100">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-stone-900 mb-4">Application Submitted!</h1>
                    <p className="text-stone-600 mb-8 leading-relaxed">
                        Thank you for your interest in becoming a Tatak Norte seller. Our team will review your application and contact you within 24-48 hours.
                    </p>
                    <button onClick={() => window.location.href = '/'} className="px-8 py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-800 transition-colors">Return Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 py-12 px-4 md:px-8 flex justify-center">
            <div className="max-w-6xl w-full grid md:grid-cols-12 gap-8 items-start animate-fade-in-up">
                <div className="md:col-span-4 space-y-6 sticky top-24">
                    <div className="bg-brand-blue text-white p-8 rounded-3xl shadow-xl overflow-hidden relative">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                         <h2 className="text-2xl font-serif font-bold mb-4 relative z-10">Why sell with us?</h2>
                         <ul className="space-y-4 relative z-10">
                             <li className="flex gap-3"><div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3" /></div><span className="text-blue-100 text-sm">Reach a wider audience of heritage lovers</span></li>
                             <li className="flex gap-3"><div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3" /></div><span className="text-blue-100 text-sm">Secure payments and verified customers</span></li>
                             <li className="flex gap-3"><div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3" /></div><span className="text-blue-100 text-sm">Dedicated support for local artisans</span></li>
                         </ul>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                        <h3 className="font-bold text-stone-900 mb-2 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-500" /> Vetted Sellers</h3>
                        <p className="text-xs text-stone-500 leading-relaxed">We manually review every application to ensure authenticity. Once approved, you will receive an official <span className="font-mono text-stone-700 bg-stone-100 px-1 rounded">@tataknorte.ph</span> seller account handle.</p>
                    </div>
                </div>
                <div className="md:col-span-8 bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-stone-100">
                    <div className="mb-8 pb-8 border-b border-stone-100">
                        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-2">Seller Registration</h1>
                        <p className="text-stone-500">Complete the form below to apply.</p>
                    </div>
                    <form className="space-y-8" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-brand-blue uppercase tracking-wider flex items-center gap-2"><Store className="w-4 h-4" /> Business Details</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-bold text-stone-700 mb-2">Business Name</label><input type="text" required value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-brand-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" placeholder="e.g. Nana Clara's Weaving" /></div>
                                <div><label className="block text-sm font-bold text-stone-700 mb-2">Primary Category</label><div className="relative"><select className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-brand-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}><option value="Weaving (Inabel)">Weaving (Inabel)</option><option value="Pottery (Burnay)">Pottery (Burnay)</option><option value="Delicacies">Delicacies</option><option value="Woodworks">Woodworks</option><option value="Accessories">Accessories</option><option value="Others">Others</option></select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" /></div></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-brand-blue uppercase tracking-wider flex items-center gap-2"><User className="w-4 h-4" /> Contact Information</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-bold text-stone-700 mb-2">Owner/Artisan Name</label><input type="text" required value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-brand-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" placeholder="Full Name" /></div>
                                <div><label className="block text-sm font-bold text-stone-700 mb-2">Email Address</label><input type="email" required readOnly value={formData.email} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-500 cursor-not-allowed" /></div>
                                <div><label className="block text-sm font-bold text-stone-700 mb-2">Phone Number</label><input type="text" required value={formData.phoneNumber} onChange={handlePhoneChange} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-brand-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" placeholder="09123456789" maxLength={11} /><p className="text-xs text-stone-400 mt-1">Must be 11 digits</p></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                             <h3 className="text-sm font-bold text-brand-blue uppercase tracking-wider flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                 <div><label className="block text-sm font-bold text-stone-700 mb-2">Province</label><div className="relative"><select className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-brand-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white appearance-none" value={formData.provinceCode} onChange={handleProvinceChange} required><option value="">Select Province</option>{provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}</select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" /></div></div>
                                 <div><label className="block text-sm font-bold text-stone-700 mb-2">Municipality/City</label><div className="relative"><select className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-brand-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white appearance-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} disabled={!formData.provinceCode} required><option value="">Select City</option>{cities.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}</select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" /></div></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                             <h3 className="text-sm font-bold text-brand-blue uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4" /> Your Craft</h3>
                            <div><label className="block text-sm font-bold text-stone-700 mb-2">Tell us about your products</label><textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-brand-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" placeholder="Describe your products, history, and what makes them special..." /></div>
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full py-4 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">{isLoading ? <Loader className="w-5 h-5 animate-spin" /> : 'Submit Application'} <Send className="w-4 h-4" /></button>
                        <p className="text-center text-xs text-stone-400">By submitting, you agree to our Terms of Service and Artisan Code of Conduct.</p>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ... (Other Modals: TrackingModal, AuthModal, CheckoutModal, Dashboard, CartPage, AboutPage, ProfilePage - Keep as is)
const TrackingModal: React.FC<{ isOpen: boolean; onClose: () => void; trackingNumber: string; status: OrderStatus }> = ({ isOpen, onClose, trackingNumber, status }) => {
    // ... same as before
    const [events, setEvents] = useState<TrackingEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && trackingNumber) {
            setLoading(true);
            fetchJtTracking(trackingNumber, status).then(data => {
                setEvents(data);
                setLoading(false);
            });
        }
    }, [isOpen, trackingNumber, status]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-scale-in">
                <div className="bg-red-600 px-6 py-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2"><Truck className="w-5 h-5" /><span className="font-bold">J&T Express Tracking</span></div>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6">
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 mb-6 flex justify-between items-center"><div><p className="text-xs text-stone-500 uppercase tracking-wider">Tracking Number</p><p className="text-lg font-mono font-bold text-stone-900 tracking-widest">{trackingNumber}</p></div><Printer className="w-5 h-5 text-stone-400" /></div>
                    {loading ? <div className="py-10 text-center"><Loader className="w-8 h-8 animate-spin mx-auto text-brand-blue" /></div> : <div className="space-y-6 relative pl-4 border-l-2 border-stone-200 ml-2">{events.map((event, index) => (<div key={index} className="relative pl-6"><div className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full border-2 border-white ${index === 0 ? 'bg-green-500 ring-2 ring-green-100' : 'bg-stone-300'}`} /><p className={`text-sm font-bold ${index === 0 ? 'text-green-600' : 'text-stone-800'}`}>{event.status}</p><p className="text-xs text-stone-500 mb-1">{event.timestamp}</p><p className="text-sm text-stone-600">{event.description}</p><p className="text-xs text-stone-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</p></div>))}</div>}
                </div>
            </div>
        </div>
    );
};

// ... Include AuthModal, CheckoutModal, Dashboard, CartPage, AboutPage, ProfilePage fully ... 
// (For brevity in the thought process I skipped listing them, but for the output I need to ensure they exist or use references if possible. 
// Given the prompt "ONLY return files... that need to be updated", I should include the whole file since I can't partially update. 
// I will just include the changed components `ProductDetailsPage`, `ProductCard`, and `App`. 
// I will include the other components collapsed or unchanged.)

const AuthModal: React.FC<any> = ({ isOpen, onClose, onLoginSuccess }) => {
    // ... (Keep existing implementation)
    // To save space in response, I am omitting the body of AuthModal, CheckoutModal, Dashboard, CartPage, AboutPage, ProfilePage unless changed. 
    // Wait, I must provide full file content. I'll copy the provided content for these components.
    useBodyScrollLock(isOpen);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsVerificationSent(false);
      setMode('login');
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getErrorMessage = (err: any) => {
    const code = err.code;
    switch (code) {
      case 'auth/email-already-in-use': return 'This email is already registered. Please Log In instead.';
      case 'auth/invalid-email': return 'Please enter a valid email address.';
      case 'auth/weak-password': return 'Password should be at least 6 characters.';
      case 'auth/user-not-found': return 'No account found with this email.';
      case 'auth/wrong-password': return 'Incorrect password.';
      case 'auth/invalid-credential': return 'Invalid email or password. Please try again.';
      case 'auth/popup-closed-by-user': return 'Sign in cancelled.';
      case 'auth/operation-not-supported-in-this-environment': return 'Authentication is restricted in this environment.';
      default: return err.message || 'An error occurred. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const lowerEmail = email.toLowerCase();
    const isInternalDomain = lowerEmail.endsWith('@tataknorte.ph');
    const isSetupAccount = lowerEmail.startsWith('admin') || lowerEmail.startsWith('seller');
    if (mode === 'register' && isInternalDomain && !isSetupAccount) { setError("Registration restricted. Only 'admin*' or 'seller*' accounts can use the @tataknorte.ph domain."); setIsLoading(false); return; }
    if (!isFirebaseConfigured()) { setError("System Error: Database not configured."); setIsLoading(false); return; }
    try {
      if (mode === 'login') {
        const result = await auth.signInWithEmailAndPassword(email, password);
        if (result.user) {
          const profile = await getUserProfile(result.user.uid);
          
          if (profile?.status === 'banned') {
              setError("This account has been banned.");
              await auth.signOut();
              setIsLoading(false);
              return;
          }
           if (profile?.status === 'suspended') {
              const isExpired = await checkSuspensionExpiry(result.user.uid);
              if (!isExpired) {
                  setError("This account has been suspended. Please contact support.");
                  await auth.signOut();
                  setIsLoading(false);
                  return;
              }
          }

          if (!profile) await createUserDocument(result.user);
          
          const updatedProfile = await getUserProfile(result.user.uid);
          onLoginSuccess({ 
              uid: result.user.uid, name: result.user.displayName || 'User', email: result.user.email || '', emailVerified: result.user.emailVerified, role: updatedProfile?.role || 'customer', username: updatedProfile?.username, phoneNumber: updatedProfile?.phoneNumber, gender: updatedProfile?.gender, birthDate: updatedProfile?.birthDate, photoURL: updatedProfile?.photoURL, bag: updatedProfile?.bag || [], createdAt: updatedProfile?.createdAt, addresses: updatedProfile?.addresses || [], bankAccounts: updatedProfile?.bankAccounts || [], shopName: updatedProfile?.shopName, shopAddress: updatedProfile?.shopAddress, shopProvince: updatedProfile?.shopProvince, shopCity: updatedProfile?.shopCity, shopBarangay: updatedProfile?.shopBarangay, shopImage: updatedProfile?.shopImage, status: updatedProfile?.status, suspensionEndDate: updatedProfile?.suspensionEndDate
          });
        }
        onClose();
      } else {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        if (userCredential.user) {
            await userCredential.user.updateProfile({ displayName: fullName });
            await createUserDocument(userCredential.user, { displayName: fullName });
            await userCredential.user.sendEmailVerification();
        }
        setIsVerificationSent(true);
      }
    } catch (err: any) { console.error(err); setError(getErrorMessage(err)); } finally { setIsLoading(false); }
  };

  const handleSocialLogin = async (providerName: 'Facebook' | 'Google') => {
    setIsLoading(true); setError(null);
    if (!isFirebaseConfigured()) { setError("System Error: Database not configured."); setIsLoading(false); return; }
    try {
      const provider = providerName === 'Google' ? new firebase.auth.GoogleAuthProvider() : new firebase.auth.FacebookAuthProvider();
      if (providerName === 'Google') { provider.addScope('email'); provider.addScope('profile'); } else { provider.addScope('email'); provider.addScope('public_profile'); }
      const result = await auth.signInWithPopup(provider);
      if (result.user) {
        const profile = await getUserProfile(result.user.uid);
         if (profile?.status === 'banned') {
              setError("This account has been banned.");
              await auth.signOut();
              setIsLoading(false);
              return;
          }
         if (profile?.status === 'suspended') {
              const isExpired = await checkSuspensionExpiry(result.user.uid);
              if (!isExpired) {
                  setError("This account has been suspended.");
                  await auth.signOut();
                  setIsLoading(false);
                  return;
              }
          }

        if (!profile) await createUserDocument(result.user);
        const updatedProfile = await getUserProfile(result.user.uid);

        onLoginSuccess({ uid: result.user.uid, name: result.user.displayName || 'User', email: result.user.email || '', emailVerified: result.user.emailVerified, role: updatedProfile?.role || 'customer', photoURL: updatedProfile?.photoURL, bag: updatedProfile?.bag || [], createdAt: updatedProfile?.createdAt, addresses: updatedProfile?.addresses || [], shopName: updatedProfile?.shopName, shopAddress: updatedProfile?.shopAddress, shopProvince: updatedProfile?.shopProvince, shopCity: updatedProfile?.shopCity, shopBarangay: updatedProfile?.shopBarangay, shopImage: updatedProfile?.shopImage, status: updatedProfile?.status, suspensionEndDate: updatedProfile?.suspensionEndDate } as UserState);
      }
      onClose();
    } catch (err: any) { console.error(err); setError(getErrorMessage(err)); } finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-md transition-opacity" 
            onClick={onClose} 
        />
        
        {/* Main Card */}
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row animate-scale-in min-h-[600px]">
            
            {/* Left Side: Branding/Image (Hidden on mobile) */}
            <div className="hidden md:flex w-5/12 bg-brand-blue relative flex-col justify-between p-10 text-white overflow-hidden">
                {/* Background Image & Overlay */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1598460677843-c0d29790680a?q=80&w=2574&auto=format&fit=crop" 
                        className="w-full h-full object-cover opacity-40 mix-blend-overlay"
                        alt="Ilocos Heritage"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-blue/80 via-brand-blue/70 to-blue-900/90" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-lg">
                        <span className="font-serif font-bold text-2xl text-white">T</span>
                    </div>
                    <h2 className="text-4xl font-serif font-bold leading-tight mb-4 tracking-tight">
                        {mode === 'login' ? 'Welcome back to your heritage.' : 'Join the community.'}
                    </h2>
                    <p className="text-blue-100 text-lg font-light leading-relaxed">
                        Explore authentic Ilocano craftsmanship and keep the tradition alive.
                    </p>
                </div>

                <div className="relative z-10">
                    <div className="flex gap-1 mb-3">
                        {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current text-yellow-400 text-opacity-90" />)}
                    </div>
                    <blockquote className="text-sm text-blue-50 italic mb-2 leading-relaxed opacity-90">
                        "The Inabel blankets I bought are stunning. It feels good to support local weavers directly."
                    </blockquote>
                    <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">— Leslie A.</p>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full md:w-7/12 bg-white p-8 md:p-12 flex flex-col justify-center relative">
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 p-2 text-stone-400 hover:bg-stone-50 hover:text-stone-600 rounded-full transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="mb-8 mt-4 md:mt-0">
                    <h3 className="text-3xl font-serif font-bold text-stone-900 mb-2">
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </h3>
                    <p className="text-stone-500">
                        {mode === 'login' ? "New to Tatak Norte?" : "Already have an account?"} {' '}
                        <button 
                            onClick={() => {
                                setMode(mode === 'login' ? 'register' : 'login');
                                setError(null);
                            }} 
                            className="font-bold text-brand-blue hover:underline transition-all"
                        >
                            {mode === 'login' ? 'Create an account' : 'Log in'}
                        </button>
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm flex items-start gap-3 animate-fade-in-up">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {isVerificationSent ? (
                    <div className="text-center p-8 bg-green-50 rounded-2xl border border-green-100 animate-fade-in-up">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-green-800 text-lg mb-2">Check your email</h4>
                        <p className="text-green-700 text-sm">We've sent a verification link to <strong>{email}</strong>. Please verify your email to continue.</p>
                        <button onClick={() => setIsVerificationSent(false)} className="mt-6 text-sm font-bold text-green-800 hover:underline">Back to Login</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {mode === 'register' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-brand-blue transition-colors" />
                                    <input 
                                        type="text" 
                                        required 
                                        value={fullName} 
                                        onChange={(e) => setFullName(e.target.value)} 
                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-stone-400" 
                                        placeholder="Juan Dela Cruz" 
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-brand-blue transition-colors" />
                                <input 
                                    type="email" 
                                    required 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-stone-400" 
                                    placeholder="name@example.com" 
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-brand-blue transition-colors" />
                                <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    required 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-stone-400" 
                                    placeholder="••••••••" 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full py-4 bg-brand-blue text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-800 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-lg mt-2"
                        >
                            {isLoading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>
                )}

                {mode === 'login' && !isVerificationSent && (
                    <>
                         <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-stone-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-stone-500 font-medium">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                type="button" 
                                onClick={() => handleSocialLogin('Google')} 
                                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300 transition-all font-medium text-stone-700 text-sm"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                Google
                            </button>
                            <button 
                                type="button" 
                                onClick={() => handleSocialLogin('Facebook')} 
                                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300 transition-all font-medium text-stone-700 text-sm"
                            >
                                <Facebook className="w-5 h-5 text-blue-600" />
                                Facebook
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    </div>
  );
};

const CheckoutModal: React.FC<any> = ({ isOpen, onClose, cart, onCheckoutSubmit, user, onSaveAddress }) => {
    // ... (Keep existing implementation)
    useBodyScrollLock(isOpen);
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Standard');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
    const [viewMode, setViewMode] = useState<'view' | 'list' | 'create'>('view');
    const [selectedAddress, setSelectedAddress] = useState<Address | undefined>(user?.addresses?.find((a: Address) => a.isDefault) || user?.addresses?.[0]);
    const [fullName, setFullName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [street, setStreet] = useState('');
    const [provinces, setProvinces] = useState<LocationCode[]>([]);
    const [cities, setCities] = useState<LocationCode[]>([]);
    const [barangays, setBarangays] = useState<LocationCode[]>([]);
    const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
    const [selectedProvinceName, setSelectedProvinceName] = useState('');
    const [selectedCityCode, setSelectedCityCode] = useState('');
    const [selectedCityName, setSelectedCityName] = useState('');
    const [selectedBarangayName, setSelectedBarangayName] = useState('');
    
    // NEW STATE
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const defaultAddr = user?.addresses?.find((a: Address) => a.isDefault) || user?.addresses?.[0];
            setSelectedAddress(defaultAddr);
            setViewMode(defaultAddr ? 'view' : 'create');
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (isOpen && viewMode === 'create') {
            fetchProvinces().then(setProvinces);
        }
    }, [isOpen, viewMode]);

    const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        const name = e.target.options[e.target.selectedIndex].text;
        setSelectedProvinceCode(code);
        setSelectedProvinceName(name);
        setCities([]); setBarangays([]); setSelectedCityCode('');
        if (code) { setCities(await fetchCities(code)); }
    };
    const handleCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        const name = e.target.options[e.target.selectedIndex].text;
        setSelectedCityCode(code);
        setSelectedCityName(name);
        setBarangays([]);
        if (code) { setBarangays(await fetchBarangays(code)); }
    };

    const subtotal = cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const shippingCost = deliveryMethod === 'Standard' ? 120 : 0;
    const total = subtotal + shippingCost;

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (deliveryMethod === 'Standard' && !selectedAddress) { alert("Please select a delivery address."); return; }
        onCheckoutSubmit(paymentMethod, deliveryMethod, selectedAddress);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-brand-cream rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in shadow-2xl">
                <div className="bg-white px-8 py-5 flex justify-between items-center border-b border-stone-100 shrink-0">
                    <div className="flex items-center gap-3"><ShoppingBag className="w-6 h-6 text-brand-blue" /><h2 className="font-serif font-bold text-2xl text-brand-blue">Checkout</h2></div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors"><X className="w-6 h-6 text-stone-500" /></button>
                </div>
                
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left Side - Forms */}
                    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 bg-white lg:border-r border-stone-100">
                        {deliveryMethod === 'Standard' && (
                            <section>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2"><MapPin className="w-4 h-4" /> Shipping Address</h3>
                                    {viewMode === 'view' && selectedAddress && (<button onClick={() => setViewMode('list')} className="text-xs font-bold text-brand-blue hover:underline">Change</button>)}
                                    {viewMode === 'list' && (<button onClick={() => setViewMode('create')} className="text-xs font-bold text-brand-blue hover:underline">+ Add New</button>)}
                                    {(viewMode === 'list' || viewMode === 'create') && selectedAddress && (<button onClick={() => setViewMode('view')} className="text-xs font-bold text-stone-500 hover:underline ml-3">Cancel</button>)}
                                </div>
                                {viewMode === 'create' ? (
                                    <div className="bg-stone-50 p-6 rounded-xl border border-stone-200 space-y-4 animate-fade-in-up">
                                         <div className="grid grid-cols-2 gap-4"><input className="w-full p-3 border border-stone-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} /><input className="w-full p-3 border border-stone-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none" placeholder="Mobile Number" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} /></div>
                                         <div className="grid grid-cols-3 gap-4">
                                            <select className="w-full p-3 border border-stone-200 rounded-lg bg-white" value={selectedProvinceCode} onChange={handleProvinceChange}><option value="">Select Province</option>{provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}</select>
                                            <select className="w-full p-3 border border-stone-200 rounded-lg bg-white" value={selectedCityCode} onChange={handleCityChange} disabled={!selectedProvinceCode}><option value="">Select City</option>{cities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select>
                                            <select className="w-full p-3 border border-stone-200 rounded-lg bg-white" value={selectedBarangayName} onChange={e => setSelectedBarangayName(e.target.value)} disabled={!selectedCityCode}><option value="">Select Barangay</option>{barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}</select>
                                         </div>
                                         <input className="w-full p-3 border border-stone-200 rounded-lg bg-white" placeholder="Street Address, Landmark, etc." value={street} onChange={e => setStreet(e.target.value)} />
                                         <div className="flex justify-end gap-3 pt-2"><button onClick={() => setViewMode(user?.addresses?.length > 0 ? 'list' : 'view')} className="px-4 py-2 text-stone-500 font-bold hover:bg-stone-200 rounded-lg">Cancel</button><button onClick={() => { const addr: Address = { fullName, mobileNumber, province: selectedProvinceName, city: selectedCityName, barangay: selectedBarangayName, street }; onSaveAddress(addr).then((saved: Address) => { setSelectedAddress(saved); setViewMode('view'); }); }} className="px-6 py-2 bg-brand-blue text-white rounded-lg font-bold shadow-lg shadow-blue-900/10">Save Address</button></div>
                                    </div>
                                ) : viewMode === 'list' ? (
                                    <div className="space-y-3">{user?.addresses?.length > 0 ? (user.addresses.map((addr: Address, idx: number) => (<div key={idx} onClick={() => { setSelectedAddress(addr); setViewMode('view'); }} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start justify-between group ${selectedAddress === addr ? 'border-brand-blue bg-blue-50/30' : 'border-stone-100 hover:border-brand-blue/50'}`}><div><div className="font-bold text-stone-900 flex items-center gap-2">{addr.fullName} <span className="text-stone-400 font-normal text-sm">| {addr.mobileNumber}</span></div><div className="text-sm text-stone-600 mt-1">{addr.street}, {addr.barangay}, {addr.city}, {addr.province}</div></div>{selectedAddress === addr && <CheckCircle className="w-5 h-5 text-brand-blue" />}</div>))) : (<div className="text-center p-4">No addresses found.</div>)}</div>
                                ) : (
                                    <div>{selectedAddress ? (<div className="p-4 rounded-xl border-2 border-brand-blue bg-blue-50/30 flex items-start justify-between"><div><div className="font-bold text-stone-900 flex items-center gap-2">{selectedAddress.fullName} <span className="text-stone-400 font-normal text-sm">| {selectedAddress.mobileNumber}</span></div><div className="text-sm text-stone-600 mt-1">{selectedAddress.street}, {selectedAddress.barangay}, {selectedAddress.city}, {selectedAddress.province}</div></div><CheckCircle className="w-5 h-5 text-brand-blue" /></div>) : (<button onClick={() => setViewMode('create')} className="w-full py-8 border-2 border-dashed border-stone-300 rounded-xl text-stone-500 font-bold hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50 transition-colors">+ Add Delivery Address</button>)}</div>
                                )}
                            </section>
                        )}
                         <section><h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Truck className="w-4 h-4" /> Delivery Method</h3><div className="grid grid-cols-2 gap-4"><button onClick={() => setDeliveryMethod('Standard')} className={`p-4 rounded-xl border-2 text-left transition-all ${deliveryMethod === 'Standard' ? 'border-brand-blue bg-blue-50/50' : 'border-stone-100 hover:border-stone-200'}`}><div className="font-bold text-brand-blue mb-1">Standard Delivery</div><div className="text-sm text-stone-500">J&T Express (3-5 days)</div><div className="text-sm font-bold mt-2">₱120.00</div></button><button onClick={() => setDeliveryMethod('Pickup')} className={`p-4 rounded-xl border-2 text-left transition-all ${deliveryMethod === 'Pickup' ? 'border-brand-blue bg-blue-50/50' : 'border-stone-100 hover:border-stone-200'}`}><div className="font-bold text-brand-blue mb-1">Store Pickup</div><div className="text-sm text-stone-500">Pick up from artisan</div><div className="text-sm font-bold mt-2">Free</div></button></div></section>
                        <section><h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Payment Method</h3><div className="space-y-3">{['COD', 'GCash', 'PayMaya'].map((method) => (<label key={method} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === method ? 'border-brand-blue bg-blue-50/50' : 'border-stone-100 hover:border-stone-200'}`}><input type="radio" name="payment" className="w-4 h-4 text-brand-blue focus:ring-brand-blue" checked={paymentMethod === method} onChange={() => setPaymentMethod(method as PaymentMethod)} /><span className="font-medium text-stone-900">{method === 'COD' ? 'Cash on Delivery' : method}</span></label>))}</div></section>
                    </div>

                    {/* Right Side - Summary */}
                    <div className="w-full lg:w-96 bg-stone-50 flex flex-col shrink-0 lg:h-full lg:border-l border-stone-200 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.1)] lg:shadow-none z-10">
                        {/* Mobile Toggle */}
                        <button 
                            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                            className="lg:hidden p-4 flex justify-between items-center bg-stone-50 border-b border-stone-200 w-full"
                        >
                            <div className="flex items-center gap-2 font-bold text-stone-700 text-sm uppercase tracking-wider">
                                <span>Order Summary</span>
                                {isSummaryExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </div>
                            <span className="font-bold text-brand-blue">₱{total.toLocaleString()}</span>
                        </button>

                        <h3 className="hidden lg:block text-sm font-bold text-stone-400 uppercase tracking-wider mb-6 px-8 pt-8">Order Summary</h3>
                        
                        {/* Collapsible Content */}
                        <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out ${isSummaryExpanded ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0 lg:max-h-full lg:opacity-100'}`}>
                             <div className="flex-1 overflow-y-auto px-6 lg:px-8 space-y-4 mb-6 pt-4 lg:pt-0">
                                {cart.map((item: any, idx: number) => (<div key={idx} className="flex gap-4 items-start"><div className="w-16 h-16 rounded-lg bg-white border border-stone-200 overflow-hidden flex-shrink-0"><img src={item.image} className="w-full h-full object-cover" alt={item.name} /></div><div className="flex-1 min-w-0"><p className="text-sm font-bold text-stone-900 line-clamp-2">{item.name}</p>{item.selectedVariation && <p className="text-xs text-stone-500">{item.selectedVariation.name}</p>}<div className="flex justify-between mt-1"><p className="text-xs text-stone-500">Qty: {item.quantity}</p><p className="text-sm font-bold text-stone-900">₱{(item.price * item.quantity).toLocaleString()}</p></div></div></div>))}
                             </div>
                             <div className="border-t border-stone-200 pt-6 space-y-3 px-6 lg:px-8 pb-4">
                                <div className="flex justify-between text-stone-600 text-sm"><span>Subtotal</span><span>₱{subtotal.toLocaleString()}</span></div>
                                <div className="flex justify-between text-stone-600 text-sm"><span>Shipping Fee</span><span>{shippingCost === 0 ? 'Free' : `₱${shippingCost.toLocaleString()}`}</span></div>
                                <div className="flex justify-between text-brand-blue font-bold text-xl pt-2 border-t border-stone-200 mt-2"><span>Total</span><span>₱{total.toLocaleString()}</span></div>
                             </div>
                        </div>

                        {/* Button always visible */}
                        <div className="p-6 lg:p-8 pt-4 lg:pt-0 bg-stone-50">
                            <button onClick={handleSubmit} className="w-full py-4 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">Place Order <ArrowRight className="w-5 h-5" /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ... Include Dashboard, CartPage, AboutPage, ProfilePage fully ...
const Dashboard: React.FC<any> = ({ user, products, onUpdateProfile, onRefreshGlobalData }) => {
    // ... (Keep existing implementation)
    // To minimize output size while following instructions to return full file content for changed files:
    // I am including the full content of App.tsx which includes these components.
    
    // (Re-pasting Dashboard content)
    const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'applications' : 'products');
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [isProductManagerOpen, setIsProductManagerOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [sellerApps, setSellerApps] = useState<SellerApplication[]>([]);
    const [sellersList, setSellersList] = useState<UserProfile[]>([]);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    // Suspension Modal State
    const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
    const [sellerToSuspend, setSellerToSuspend] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (user) {
            fetchOrders('seller', user.uid).then(setOrders);

            if (user.role === 'admin') {
                fetchSellerApplications('pending').then(setSellerApps);
                fetchApprovedSellers().then(setSellersList);
            }
        }
    }, [user]);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };
    
    const sellerProducts = products && user ? products.filter((p: any) => p.sellerId === user.uid || user.role === 'admin') : [];

    const handleApproveApp = async (app: SellerApplication) => {
        if (window.confirm(`Approve ${app.businessName} as a seller?`)) {
            const success = await approveSellerApplication(app);
            if (success) {
                showNotification(`${app.businessName} approved successfully!`, 'success');
                setSellerApps(sellerApps.filter(a => a.id !== app.id));
                // Refresh sellers list after approval
                fetchApprovedSellers().then(setSellersList);
            } else {
                showNotification("Failed to approve seller.", 'error');
            }
        }
    };

    const handleRejectApp = async (appId: string) => {
        if (window.confirm("Reject this application?")) {
            const success = await rejectSellerApplication(appId);
            if (success) {
                showNotification("Application rejected.", 'success');
                setSellerApps(sellerApps.filter(a => a.id !== appId));
            } else {
                 showNotification("Failed to reject application.", 'error');
            }
        }
    };

    const handleUserAction = async (seller: UserProfile, action: 'ban' | 'suspend' | 'activate' | 'remove') => {
        if (action === 'suspend') {
            setSellerToSuspend(seller);
            setIsSuspendModalOpen(true);
            return;
        }

        const actionText = action === 'ban' ? 'Ban' : action === 'activate' ? 'Activate' : 'Remove';
        if (window.confirm(`Are you sure you want to ${actionText} seller ${seller.shopName || seller.displayName}?`)) {
            let success = false;
            
            if (action === 'remove') {
                success = await deleteUserDocument(seller.uid);
            } else {
                 const status = action === 'activate' ? 'active' : 'banned';
                 success = await updateUserStatus(seller.uid, status);
            }

            if (success) {
                alert(`Seller ${actionText} successful.`);
                fetchApprovedSellers().then(setSellersList);
                onRefreshGlobalData(); // Refresh to update product visibility
            } else {
                alert(`Failed to ${action} seller.`);
            }
        }
    }

    const confirmSuspend = async (days: number) => {
        if (!sellerToSuspend) return;
        const success = await updateUserStatus(sellerToSuspend.uid, 'suspended', days);
        if (success) {
            alert(`Seller suspended for ${days} days.`);
            fetchApprovedSellers().then(setSellersList);
            onRefreshGlobalData();
            setIsSuspendModalOpen(false);
            setSellerToSuspend(null);
        } else {
            alert("Failed to suspend seller.");
        }
    }

    const isAdmin = user?.role === 'admin';

    if (!user) return <div className="p-20 text-center animate-fade-in-up">Please log in to access the dashboard.</div>;

    const tabs = isAdmin 
        ? ['applications', 'sellers', 'products']
        : ['products', 'orders'];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">
            {notification && (
                <div className={`fixed top-24 right-4 z-[60] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-up border ${notification.type === 'success' ? 'bg-white border-green-100 text-green-700' : 'bg-white border-red-100 text-red-700'}`}>
                    <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div>
                        <p className="font-bold text-sm">{notification.type === 'success' ? 'Success' : 'Error'}</p>
                        <p className="text-sm">{notification.message}</p>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-4 text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
                </div>
            )}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-serif font-bold">{isAdmin ? 'Admin Dashboard' : 'Seller Dashboard'}</h1>
                {!isAdmin && (
                    <button onClick={() => { setEditingProduct(null); setIsAddProductOpen(true); }} className="px-6 py-3 bg-brand-blue text-white rounded-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5" /> Add Product</button>
                )}
            </div>
            <div className="flex gap-6 border-b border-stone-200 mb-8">
                {tabs.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-bold uppercase tracking-wider ${activeTab === tab ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-stone-500'}`}>{tab}</button>
                ))}
            </div>
            
            {activeTab === 'applications' && isAdmin && (
                <div className="space-y-4">
                    {sellerApps.length > 0 ? (
                        sellerApps.map(app => (
                            <div key={app.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-xl text-stone-900">{app.businessName}</h3>
                                        <p className="text-stone-500 text-sm mb-4">Applicant: {app.ownerName} ({app.email})</p>
                                        
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-stone-600 mb-4">
                                            <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {app.phoneNumber}</div>
                                            <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {app.city}, {app.province}</div>
                                            <div className="flex items-center gap-2"><Tag className="w-4 h-4" /> {app.category}</div>
                                        </div>
                                        <div className="bg-stone-50 p-4 rounded-lg text-sm text-stone-700 italic border border-stone-100 max-w-2xl">
                                            "{app.description}"
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleRejectApp(app.id!)} className="p-2 border border-stone-200 text-stone-500 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors" title="Reject">
                                            <X className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleApproveApp(app)} className="px-4 py-2 bg-brand-blue text-white rounded-lg font-bold hover:bg-blue-800 transition-colors flex items-center gap-2">
                                            <Check className="w-4 h-4" /> Approve
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-stone-200">
                             <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
                                 <FileText className="w-8 h-8" />
                             </div>
                             <p className="text-stone-500">No pending applications.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'sellers' && isAdmin && (
                <div className="space-y-4">
                     {sellersList.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sellersList.map(seller => (
                                <div key={seller.uid} className={`bg-white p-6 rounded-2xl border shadow-sm flex flex-col gap-4 relative overflow-hidden ${seller.status === 'banned' ? 'border-red-200 bg-red-50' : seller.status === 'suspended' ? 'border-orange-200 bg-orange-50' : 'border-stone-200'}`}>
                                     {seller.status === 'banned' && (
                                         <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl z-10">BANNED</div>
                                     )}
                                     {seller.status === 'suspended' && (
                                         <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl z-10">SUSPENDED</div>
                                     )}

                                     <div className="flex items-center gap-4">
                                         <div className="w-16 h-16 rounded-full bg-stone-100 overflow-hidden border border-stone-200 flex-shrink-0">
                                            {seller.shopImage ? (
                                                <img src={seller.shopImage} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-stone-300">
                                                    <Store className="w-8 h-8" />
                                                </div>
                                            )}
                                         </div>
                                         <div className="min-w-0">
                                             <h3 className="font-bold text-lg text-stone-900 truncate">{seller.shopName || 'Unnamed Shop'}</h3>
                                             <p className="text-sm text-stone-500 truncate">{seller.email}</p>
                                             {seller.status === 'suspended' && seller.suspensionEndDate && (
                                                 <p className="text-xs text-orange-600 font-bold mt-1">
                                                     Until: {new Date(seller.suspensionEndDate.seconds * 1000).toLocaleDateString()}
                                                 </p>
                                             )}
                                         </div>
                                     </div>
                                     <div className="space-y-2 text-sm text-stone-600">
                                         <div className="flex items-center gap-2">
                                             <User className="w-4 h-4 text-stone-400" />
                                             <span className="truncate">{seller.displayName}</span>
                                         </div>
                                         <div className="flex items-center gap-2">
                                             <MapPin className="w-4 h-4 text-stone-400" />
                                             <span className="truncate">{seller.shopAddress || 'No address set'}</span>
                                         </div>
                                     </div>
                                     <div className="mt-auto pt-4 border-t border-stone-100 flex justify-between items-center text-xs">
                                          <div className="flex gap-2">
                                             {seller.status !== 'banned' && seller.status !== 'suspended' && (
                                                  <>
                                                    <button onClick={() => handleUserAction(seller, 'suspend')} className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 border border-orange-200" title="Suspend User">
                                                        <PauseCircle className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleUserAction(seller, 'ban')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200" title="Ban User">
                                                        <ShieldBan className="w-4 h-4" />
                                                    </button>
                                                  </>
                                             )}
                                             {(seller.status === 'banned' || seller.status === 'suspended') && (
                                                <button onClick={() => handleUserAction(seller, 'activate')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-200" title="Activate User">
                                                    <PlayCircle className="w-4 h-4" />
                                                </button>
                                             )}
                                             <button onClick={() => handleUserAction(seller, 'remove')} className="p-2 bg-stone-50 text-stone-500 rounded-lg hover:bg-red-50 hover:text-red-500 border border-stone-200 hover:border-red-200" title="Remove User">
                                                <Trash2 className="w-4 h-4" />
                                             </button>
                                          </div>
                                          <span className="text-stone-400">Since {seller.createdAt ? new Date(seller.createdAt.seconds * 1000).getFullYear() : 'N/A'}</span>
                                     </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-stone-200 text-stone-500">
                             No approved sellers found.
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'products' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                    {sellerProducts.length > 0 ? (
                        sellerProducts.map((p: any) => (
                            <div key={p.id} className="relative group">
                                <ProductCard product={p} onClick={() => { setSelectedProduct(p); setIsProductManagerOpen(true); }} />
                                {p.sellerStatus === 'suspended' && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-2xl pointer-events-none">
                                        <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                            Suspended
                                        </div>
                                    </div>
                                )}
                                {p.sellerStatus === 'banned' && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-2xl pointer-events-none">
                                        <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                            Banned
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full p-10 text-center bg-white rounded-2xl border border-stone-200 text-stone-500">
                             No products found.
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white p-6 rounded-2xl border border-stone-200">
                             <div className="flex justify-between mb-4">
                                 <div><span className="font-bold text-lg">Order #{order.id.slice(-6)}</span><p className="text-sm text-stone-500">{new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}</p></div>
                                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                     order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                                     order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                     order.status === 'Cancellation Requested' ? 'bg-orange-100 text-orange-700' :
                                     'bg-blue-100 text-blue-700'
                                 }`}>
                                     {order.status}
                                 </span>
                             </div>
                             <div className="space-y-2 mb-4">
                                 {order.items.filter(i => i.sellerId === user.uid).map((item, idx) => (
                                     <div key={idx} className="flex justify-between text-sm"><span>{item.quantity}x {item.name} {item.selectedVariation && `(${item.selectedVariation.name})`}</span><span>₱{(item.price * item.quantity).toLocaleString()}</span></div>
                                 ))}
                             </div>
                             {order.status === 'Processing' && <button onClick={async () => { await updateOrderTracking(order.id); fetchOrders('seller', user.uid).then(setOrders); }} className="w-full py-2 bg-brand-blue text-white rounded-lg font-bold">Mark as Shipped</button>}
                             
                             {order.status === 'Cancellation Requested' && (
                                <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
                                    <h4 className="font-bold text-red-700 mb-1 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Cancellation Requested
                                    </h4>
                                    <p className="text-sm text-stone-700 mb-3">Reason: "{order.cancellationReason}"</p>
                                    <div className="flex gap-3">
                                         <button
                                            onClick={async () => {
                                                if(window.confirm("Reject cancellation and return order to Processing?")) {
                                                     const success = await updateOrderStatus(order.id, 'Processing');
                                                     if (success) {
                                                         setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Processing' } : o));
                                                         fetchOrders('seller', user.uid).then(setOrders);
                                                     } else {
                                                         alert("Failed to update order status.");
                                                     }
                                                }
                                            }}
                                            className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors"
                                         >
                                            Reject
                                         </button>
                                         <button
                                            onClick={async () => {
                                                 if(window.confirm("Approve cancellation?")) {
                                                     const success = await approveOrderCancellation(order.id);
                                                     if (success) {
                                                        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Cancelled' } : o));
                                                        fetchOrders('seller', user.uid).then(setOrders);
                                                     } else {
                                                        alert("Failed to cancel order. Please try again.");
                                                     }
                                                }
                                            }}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                                         >
                                            Approve Cancellation
                                         </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {orders.length === 0 && <p className="text-center py-10 text-stone-500">No orders found.</p>}
                </div>
            )}

            <AddProductModal 
                isOpen={isAddProductOpen} 
                onClose={() => setIsAddProductOpen(false)} 
                user={user}
                editingProduct={editingProduct}
                onAddProduct={async (data: any) => {
                    await addProduct(data);
                    onRefreshGlobalData(); 
                }} 
            />
            <ProductManagerModal
                isOpen={isProductManagerOpen}
                onClose={() => setIsProductManagerOpen(false)}
                product={selectedProduct}
                onEdit={() => {
                    setEditingProduct(selectedProduct);
                    setIsProductManagerOpen(false);
                    setIsAddProductOpen(true);
                }}
                onDelete={async (id: string) => {
                    await deleteProduct(id);
                    onRefreshGlobalData();
                }}
            />
            
            <SuspendUserModal 
                isOpen={isSuspendModalOpen}
                onClose={() => setIsSuspendModalOpen(false)}
                onConfirm={confirmSuspend}
                sellerName={sellerToSuspend?.shopName || sellerToSuspend?.displayName || 'Seller'}
            />
        </div>
    );
};

const CartPage: React.FC<any> = ({ cart, onUpdateQuantity, onRemove, onCheckoutClick, onContinueShopping }) => {
    // ... (Keep existing implementation)
    const total = cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    return (
        <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-in-up">
            <h1 className="font-serif text-4xl font-bold mb-8 text-brand-blue">Shopping Bag</h1>
            {cart.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 shadow-sm">
                    <ShoppingBag className="w-20 h-20 mx-auto mb-6 text-stone-200" />
                    <h2 className="text-2xl font-bold text-stone-900 mb-2">Your bag is empty</h2>
                    <p className="text-stone-500 mb-8">Looks like you haven't added any authentic Ilocano treasures yet.</p>
                    <button onClick={onContinueShopping} className="px-8 py-3 bg-brand-blue text-white rounded-full font-bold hover:bg-blue-800 transition-colors">Start Shopping</button>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                        {cart.map((item: any) => (
                            <div key={item.id} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm flex gap-6 items-center hover:shadow-md transition-shadow">
                                <img src={item.image} className="w-32 h-32 rounded-xl object-cover bg-stone-50" />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-lg text-stone-900">{item.name}</h3>
                                            <p className="text-sm text-stone-500">{item.selectedVariation?.name || 'Standard'}</p>
                                        </div>
                                        <button onClick={() => onRemove(item.id)} className="text-stone-400 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                    <div className="flex justify-between items-end mt-4">
                                        <p className="text-brand-blue font-bold text-xl">₱{item.price.toLocaleString()}</p>
                                        <div className="flex items-center gap-4 bg-stone-50 rounded-lg p-1 border border-stone-200">
                                            <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded-md transition-colors"><Minus className="w-4 h-4" /></button>
                                            <span className="font-bold w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded-md transition-colors"><Plus className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="w-full lg:w-96 bg-white p-8 rounded-3xl border border-stone-100 shadow-lg h-fit">
                        <h3 className="text-xl font-bold mb-6">Order Summary</h3>
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-stone-600">
                                <span>Subtotal</span>
                                <span>₱{total.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-stone-600">
                                <span>Shipping</span>
                                <span className="text-xs text-stone-400 italic">Calculated at checkout</span>
                            </div>
                            <div className="border-t border-stone-100 pt-4 flex justify-between font-bold text-xl text-brand-blue">
                                <span>Total</span>
                                <span>₱{total.toLocaleString()}</span>
                            </div>
                        </div>
                        <button onClick={onCheckoutClick} className="w-full py-4 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20">Proceed to Checkout</button>
                        <button onClick={onContinueShopping} className="w-full mt-4 py-2 text-stone-500 font-bold text-sm hover:text-brand-blue">Continue Shopping</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const AboutPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => (
    // ... (Keep existing implementation)
    <div className="bg-brand-cream min-h-screen animate-fade-in-up overflow-x-hidden">
        {/* Hero Section */}
        <div className="relative h-[80vh] overflow-hidden">
            <img 
                src="https://static.wixstatic.com/media/ceba28_7bbc8278eac248438dd9f7a72b2bff8f~mv2.jpg/v1/fill/w_1024,h_683,al_c,q_85,enc_auto/ceba28_7bbc8278eac248438dd9f7a72b2bff8f~mv2.jpg" 
                alt="Ilocos Weaving Loom" 
                className="absolute inset-0 w-full h-full object-cover transform hover:scale-105 transition-transform duration-[30s]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-blue/60 to-brand-blue/80 mix-blend-multiply" />
            <div className="absolute inset-0 flex items-center justify-center text-center px-4">
                <div className="max-w-4xl space-y-8 animate-scale-in relative z-10">
                    <p className="text-blue-100 font-medium tracking-[0.2em] uppercase text-sm mb-4">Established 2024 • Ilocos Norte, PH</p>
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-bold text-white tracking-tight leading-[0.9] drop-shadow-xl">
                        Heritage <br/> <span className="italic font-light">Reimagined</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90 font-light max-w-2xl mx-auto leading-relaxed mt-6">
                        Bridging the gap between ancient Ilocano craftsmanship and the modern world.
                    </p>
                </div>
            </div>
        </div>

        {/* The Story Section - Broken Grid Layout */}
        <div className="max-w-7xl mx-auto px-4 py-24 md:py-32">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-center">
                <div className="relative order-2 lg:order-1">
                    <div className="relative z-10">
                        <img 
                            src="https://images.unsplash.com/photo-1620619767323-b95a89183081?q=80&w=2070&auto=format&fit=crop" 
                            alt="Vigan Architecture" 
                            className="rounded-none shadow-2xl w-full max-w-md mx-auto lg:mx-0 object-cover aspect-[3/4]"
                        />
                    </div>
                    {/* Overlapping Image */}
                    <div className="absolute -bottom-12 -right-12 md:-right-24 w-64 h-64 z-20 hidden md:block">
                         <img 
                            src="https://transformingclay.wordpress.com/wp-content/uploads/2010/06/hand2.jpg" 
                            alt="Pottery Texture" 
                            className="w-full h-full object-cover shadow-2xl border-8 border-brand-cream"
                        />
                    </div>
                    {/* Decorative Element */}
                    <div className="absolute -top-12 -left-12 w-32 h-32 border border-brand-blue/20 rounded-full z-0" />
                </div>
                
                <div className="space-y-10 order-1 lg:order-2">
                    <div>
                        <span className="text-brand-clay font-bold tracking-widest uppercase text-xs flex items-center gap-2 mb-4">
                             <span className="w-12 h-[1px] bg-brand-clay"></span> Our Roots
                        </span>
                        <h2 className="text-4xl md:text-6xl font-serif font-bold text-brand-blue leading-[1.1]">
                            Preserving Culture, <br/> Empowering Lives.
                        </h2>
                    </div>
                    <div className="space-y-6 text-lg text-stone-600 leading-relaxed font-light">
                        <p>
                            <span className="font-bold text-brand-blue">Tatak Norte</span> was born from a simple yet powerful realization: the ancient arts of Inabel weaving and Burnay pottery were slowly fading into history, whispered only in the quiet corners of artisan workshops.
                        </p>
                        <p>
                            We set out to build a bridge—a digital marketplace that not only showcases these masterpieces to the world but ensures the hands that make them are honored and sustained.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Stats Section - Clean Strip */}
        <div className="bg-white border-y border-stone-100">
            <div className="max-w-7xl mx-auto px-4 py-16">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-stone-100">
                     <div className="p-4">
                         <p className="text-6xl font-serif font-bold text-brand-blue mb-2">100+</p>
                         <p className="text-stone-400 font-medium uppercase tracking-widest text-xs">Artisans Supported</p>
                     </div>
                     <div className="p-4">
                         <p className="text-6xl font-serif font-bold text-brand-blue mb-2">3</p>
                         <p className="text-stone-400 font-medium uppercase tracking-widest text-xs">Heritage Industries</p>
                     </div>
                     <div className="p-4">
                         <p className="text-6xl font-serif font-bold text-brand-blue mb-2">100%</p>
                         <p className="text-stone-400 font-medium uppercase tracking-widest text-xs">Locally Sourced</p>
                     </div>
                 </div>
            </div>
        </div>

        {/* Values Section */}
        <div className="max-w-7xl mx-auto px-4 py-32">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <span className="text-brand-clay font-bold tracking-widest uppercase text-xs mb-4 block">Our Philosophy</span>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-blue">Curated with Purpose</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
                {[
                    {
                        icon: <Leaf className="w-10 h-10" />,
                        title: "Sustainable & Ethical",
                        desc: "We operate on a fair-trade model, ensuring artisans receive the majority of the profit. Every purchase directly supports Ilocano families."
                    },
                    {
                        icon: <Hammer className="w-10 h-10" />,
                        title: "Master Craftsmanship",
                        desc: "Every item is sourced directly from verified local makers. No mass production, just pure skill passed down through generations."
                    },
                    {
                        icon: <Heart className="w-10 h-10" />,
                        title: "Community First",
                        desc: "We are more than a store; we are a community dedicated to keeping the vibrant culture of the North alive for the future."
                    }
                ].map((value, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center p-8 group hover:-translate-y-2 transition-transform duration-300">
                        <div className="w-20 h-20 rounded-full border border-stone-200 flex items-center justify-center mb-8 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors">
                            {value.icon}
                        </div>
                        <h3 className="text-2xl font-bold text-stone-900 mb-4 font-serif">{value.title}</h3>
                        <p className="text-stone-500 leading-relaxed">{value.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-7xl mx-auto px-4 pb-32">
             <div className="bg-brand-blue text-white rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden">
                 {/* Abstract Background Shapes */}
                 <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
                 <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-clay/20 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/3" />

                 <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                     <h2 className="text-4xl md:text-6xl font-serif font-bold leading-tight">
                         Own a piece of history.
                     </h2>
                     <p className="text-xl text-blue-100 leading-relaxed font-light">
                         Explore our collection of authentic Ilocano treasures and support the artisans keeping the tradition alive.
                     </p>
                     <button 
                        onClick={() => onNavigate('/shop')}
                        className="inline-flex items-center gap-3 px-10 py-5 bg-white text-brand-blue rounded-full font-bold text-lg hover:bg-brand-light transition-all shadow-xl hover:shadow-2xl hover:scale-105 mt-4"
                    >
                        Visit the Marketplace <ArrowRight className="w-5 h-5" />
                    </button>
                 </div>
             </div>
        </div>
    </div>
);

const ProfilePage: React.FC<any> = ({ user, onUpdateProfile, onNavigate }) => {
    // ... (Keep existing implementation)
    // Same as above, assuming content is largely the same.
    const isSellerOrAdmin = user?.role === 'seller' || user?.role === 'admin';
    const [orders, setOrders] = useState<Order[]>([]);
    const [activeTab, setActiveTab] = useState(isSellerOrAdmin ? 'shop' : 'orders');
    const [editForm, setEditForm] = useState<{
        displayName: string;
        phoneNumber: string;
        gender: 'Male' | 'Female' | 'Other';
        birthDate: string;
    }>({
        displayName: '',
        phoneNumber: '',
        gender: 'Other',
        birthDate: ''
    });
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isTrackingOpen, setIsTrackingOpen] = useState(false);
    const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);

    // Shop Settings State
    const [shopName, setShopName] = useState(user?.shopName || '');
    const [shopImageFile, setShopImageFile] = useState<File | null>(null);
    const [isSavingShop, setIsSavingShop] = useState(false);
    
    // Shop Location State
    const [shopProvinceCode, setShopProvinceCode] = useState('');
    const [shopCityCode, setShopCityCode] = useState('');
    const [shopProvince, setShopProvince] = useState(user?.shopProvince || '');
    const [shopCity, setShopCity] = useState(user?.shopCity || '');
    const [shopBarangay, setShopBarangay] = useState(user?.shopBarangay || '');
    
    // Independent lists for shop location to avoid conflicts
    const [shopCities, setShopCities] = useState<LocationCode[]>([]);
    const [shopBarangays, setShopBarangays] = useState<LocationCode[]>([]);

    // Address Management State
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
    const [addressForm, setAddressForm] = useState<Address>({
        fullName: '', mobileNumber: '', street: '', barangay: '', city: '', province: '', isDefault: false
    });
    
    // Delete Confirmation State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState<number | null>(null);

    // Order Cancellation State
    const [isCancelOrderModalOpen, setIsCancelOrderModalOpen] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    
    // General Location State (for Address Modal & Shared Provinces)
    const [provinces, setProvinces] = useState<LocationCode[]>([]);
    const [cities, setCities] = useState<LocationCode[]>([]);
    const [barangays, setBarangays] = useState<LocationCode[]>([]);
    const [provCode, setProvCode] = useState('');
    const [cityCode, setCityCode] = useState('');
    const [loadingLocation, setLoadingLocation] = useState(false);

    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 3000);
    }

    useEffect(() => {
        if (user) {
            if (!isSellerOrAdmin) {
                setIsLoadingOrders(true);
                fetchOrders('customer', user.uid).then(data => {
                    setOrders(data);
                    setIsLoadingOrders(false);
                });
            }
            setEditForm({
                displayName: user.name || '',
                phoneNumber: user.phoneNumber || '',
                gender: user.gender || 'Other',
                birthDate: user.birthDate || ''
            });

            // Initialize Shop Settings
            if (isSellerOrAdmin) {
                setShopName(user.shopName || '');
            }
        }
    }, [user, isSellerOrAdmin]);

    useEffect(() => {
        const hydrateShopLocation = async () => {
            if (isSellerOrAdmin) {
                const ps = await fetchProvinces();
                setProvinces(ps); // Share provinces list
                
                if (user && user.shopProvince) {
                    setShopProvince(user.shopProvince);
                    const p = ps.find(x => x.name === user.shopProvince);
                    if (p) {
                        setShopProvinceCode(p.code);
                        const cs = await fetchCities(p.code);
                        setShopCities(cs);
                        
                        if (user.shopCity) {
                            setShopCity(user.shopCity);
                            const c = cs.find(x => x.name === user.shopCity);
                            if (c) {
                                setShopCityCode(c.code);
                                const bs = await fetchBarangays(c.code);
                                setShopBarangays(bs);
                                if (user.shopBarangay) {
                                    setShopBarangay(user.shopBarangay);
                                }
                            }
                        }
                    }
                }
            }
        };
        hydrateShopLocation();
    }, [user, isSellerOrAdmin]);

    useEffect(() => {
        if (isSellerOrAdmin && !['shop', 'personal'].includes(activeTab)) {
            setActiveTab('shop');
        } else if (!isSellerOrAdmin && !['orders', 'personal', 'addresses'].includes(activeTab)) {
            setActiveTab('orders');
        }
    }, [isSellerOrAdmin]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && user) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                 setErrorMessage("Invalid file type. Please upload an image.");
                 return;
            }
            try {
                const url = await uploadProfileImage(user.uid, file);
                if (url) {
                    await updateUserProfile(user.uid, { photoURL: url });
                    onUpdateProfile();
                    showSuccess("Profile photo updated successfully!");
                } else {
                     setErrorMessage("Failed to upload image. Please check your connection.");
                }
            } catch (err) {
                console.error("Failed to upload image", err);
                setErrorMessage("Failed to upload image. Please try again.");
            }
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSavingProfile(true);
        setErrorMessage(null);
        try {
            const success = await updateUserProfile(user.uid, editForm);
            if (success) {
                await onUpdateProfile();
                showSuccess("Profile updated successfully!");
            } else {
                throw new Error("Failed to update profile in database.");
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.message?.includes('auth')) {
                setErrorMessage("Your session has expired. Please log out and log in again.");
            } else {
                setErrorMessage("Failed to update profile. Please try again later.");
            }
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleSaveShopSettings = async () => {
        if (!user) return;
        setIsSavingShop(true);
        try {
            let imageUrl = user.shopImage;
            if (shopImageFile) {
                imageUrl = await uploadShopImage(user.uid, shopImageFile);
            }
            // Construct the display address string
            const fullAddress = [shopBarangay, shopCity, shopProvince].filter(Boolean).join(', ');
            
            await updateUserProfile(user.uid, {
                shopName,
                shopAddress: fullAddress,
                shopProvince,
                shopCity,
                shopBarangay,
                shopImage: imageUrl || undefined
            });
            await onUpdateProfile();
            showSuccess("Shop settings saved!");
        } catch (error) {
            console.error(error);
            setErrorMessage("Failed to save settings");
        } finally {
            setIsSavingShop(false);
        }
    };

    const handleOpenAddressModal = async (index?: number) => {
        setIsAddressModalOpen(true);
        setLoadingLocation(true);

        const ps = await fetchProvinces();
        setProvinces(ps);
        
        if (index !== undefined && user?.addresses?.[index]) {
            setEditingAddressIndex(index);
            const addr = user.addresses[index];
            setAddressForm(addr);
            
            const p = ps.find(x => x.name.toLowerCase() === addr.province.toLowerCase());
            
            if (p) {
                setProvCode(p.code);
                const cs = await fetchCities(p.code);
                setCities(cs);
                
                const c = cs.find(x => x.name.toLowerCase() === addr.city.toLowerCase());
                if (c) {
                    setCityCode(c.code);
                    const bs = await fetchBarangays(c.code);
                    setBarangays(bs);
                } else {
                    setCityCode('');
                    setBarangays([]);
                }
            } else {
                setProvCode('');
                setCities([]);
                setCityCode('');
                setBarangays([]);
            }
        } else {
            setEditingAddressIndex(null);
            setAddressForm({ 
                fullName: '', 
                mobileNumber: '', 
                street: '', 
                barangay: '', 
                city: '', 
                province: '', 
                isDefault: user?.addresses?.length === 0 
            });
            setProvCode('');
            setCityCode('');
            setCities([]);
            setBarangays([]);
        }
        setLoadingLocation(false);
    };

    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        let newAddresses = [...(user.addresses || [])];
        const newAddress = { ...addressForm };

        if (newAddress.isDefault) {
             newAddresses = newAddresses.map(a => ({ ...a, isDefault: false }));
        } else {
             if (newAddresses.length === 0 || (editingAddressIndex !== null && newAddresses.length === 1)) {
                 newAddress.isDefault = true;
             }
        }

        if (editingAddressIndex !== null) {
            newAddresses[editingAddressIndex] = newAddress;
        } else {
            newAddresses.push(newAddress);
        }

        const success = await updateUserProfile(user.uid, { addresses: newAddresses });
        if (success) {
            await onUpdateProfile();
            setIsAddressModalOpen(false);
        } else {
            alert("Failed to save address.");
        }
    };

    const confirmDeleteAddress = (index: number) => {
        setAddressToDelete(index);
        setIsDeleteModalOpen(true);
    };

    const executeDeleteAddress = async () => {
        if (addressToDelete === null || !user || !user.addresses) return;
        
        const newAddresses = [...user.addresses];
        const deletedAddress = newAddresses[addressToDelete];
        newAddresses.splice(addressToDelete, 1);
        
        if (deletedAddress.isDefault && newAddresses.length > 0) {
            newAddresses[0].isDefault = true;
        }

        const success = await updateUserProfile(user.uid, { addresses: newAddresses });
        if (success) {
            await onUpdateProfile();
            setIsDeleteModalOpen(false);
            setAddressToDelete(null);
        } else {
            alert("Failed to delete address.");
        }
    };

    const handleSetDefaultAddress = async (index: number) => {
        if (!user || !user.addresses) return;
        const newAddresses = user.addresses.map((addr: Address, i: number) => ({
            ...addr,
            isDefault: i === index
        }));
        await updateUserProfile(user.uid, { addresses: newAddresses });
        await onUpdateProfile();
    };

    const handleCancelOrderClick = (order: Order) => {
        setOrderToCancel(order);
        setIsCancelOrderModalOpen(true);
    }

    const handleSubmitCancellation = async (reason: string) => {
        if(!orderToCancel || !user) return;
        setIsCancelling(true);
        await requestOrderCancellation(orderToCancel.id, reason);
        fetchOrders('customer', user.uid).then(setOrders);
        setIsCancelling(false);
        setIsCancelOrderModalOpen(false);
        setOrderToCancel(null);
    }

    if (!user) return <div className="p-20 text-center">Please log in to view profile.</div>;

    const TabButton = ({ id, label, icon }: any) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`w-full text-left px-6 py-4 rounded-xl flex items-center gap-4 font-bold transition-all duration-200 mb-2 ${
                activeTab === id 
                ? 'bg-brand-blue text-white shadow-lg shadow-blue-900/10 translate-x-2' 
                : 'text-stone-600 hover:bg-white hover:text-brand-blue hover:shadow-sm'
            }`}
        >
            {icon}
            <span>{label}</span>
            {id === 'orders' && <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${activeTab === id ? 'rotate-90' : ''}`} />}
        </button>
    );

    // Profile render logic...
    return (
        <div className="min-h-screen bg-stone-50">
             {/* ... Same Profile Layout ... */}
            <div className="h-64 bg-gradient-to-r from-brand-blue to-blue-900 relative">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-stone-50 to-transparent"></div>
            </div>

            <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10 pb-20 animate-fade-in-up">
                 {/* ... Header ... */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-stone-100 flex flex-col md:flex-row items-end md:items-center gap-8 mb-12">
                     <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-[6px] border-white shadow-2xl bg-stone-100">
                            {user.photoURL ? (
                                <img src={user.photoURL} className="w-full h-full object-cover" alt={user.name} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-brand-blue/30 bg-stone-200">
                                    {user.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-[6px] border-transparent">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
                    </div>
                    
                    <div className="flex-1 pb-2">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-2">
                             <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900">{user.name}</h1>
                             <span className="px-4 py-1.5 bg-brand-light text-brand-blue rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100">{user.role}</span>
                        </div>
                        <p className="text-stone-500 mb-6 flex items-center gap-2"><Mail className="w-4 h-4" /> {user.email}</p>
                        <div className="flex flex-wrap gap-8 text-sm text-stone-600">
                             {!isSellerOrAdmin && (
                                 <div className="flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-lg border border-stone-100">
                                     <Package className="w-5 h-5 text-brand-clay" />
                                     <span className="font-bold text-lg text-stone-900">{orders.length}</span> <span className="text-stone-500">Orders Placed</span>
                                 </div>
                             )}
                             <div className="flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-lg border border-stone-100">
                                 <Calendar className="w-5 h-5 text-brand-clay" />
                                 <span className="text-stone-500">Joined</span> <span className="font-bold text-stone-900">{user.createdAt ? new Date(user.createdAt.seconds * 1000).getFullYear() : new Date().getFullYear()}</span>
                             </div>
                        </div>
                    </div>
                </div>

                {(successMessage || errorMessage) && (
                    <div className={`mb-8 p-4 border-l-4 rounded-r-xl flex items-center justify-between gap-3 animate-fade-in-up shadow-sm ${successMessage ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
                        <div className="flex items-center gap-2">
                            {successMessage ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <span className="font-bold">{successMessage || errorMessage}</span>
                        </div>
                        <button onClick={() => { setSuccessMessage(null); setErrorMessage(null); }} className="p-1 rounded-full hover:bg-white/50 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                     <div className="lg:col-span-3">
                        <div className="sticky top-24">
                            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 pl-4">Account Menu</h3>
                            {isSellerOrAdmin ? (
                                <>
                                    <TabButton id="shop" label="Shop Profile" icon={<Store className="w-5 h-5" />} />
                                    <TabButton id="personal" label="Personal Information" icon={<User className="w-5 h-5" />} />
                                </>
                            ) : (
                                <>
                                    <TabButton id="orders" label="My Orders" icon={<Package className="w-5 h-5" />} />
                                    <TabButton id="personal" label="Profile Settings" icon={<UserCircle className="w-5 h-5" />} />
                                    <TabButton id="addresses" label="Addresses" icon={<MapPin className="w-5 h-5" />} />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-9">
                         {/* Content based on activeTab - using the same structure as before */}
                         {activeTab === 'orders' && !isSellerOrAdmin && (
                            <div className="space-y-6 animate-scale-in">
                                <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6">Order History</h2>
                                {isLoadingOrders ? (
                                    <div className="p-20 text-center"><Loader className="w-10 h-10 animate-spin mx-auto text-brand-blue" /></div>
                                ) : orders.length > 0 ? (
                                    orders.map(order => (
                                        <div key={order.id} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow group">
                                            {/* Order Card Content */}
                                            <div className="flex flex-wrap justify-between items-start gap-4 mb-6 border-b border-stone-100 pb-4">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="font-bold text-xl text-stone-900">#{order.id.slice(-6).toUpperCase()}</span>
                                                        <span className="text-sm text-stone-400">• {new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="text-sm text-stone-500">
                                                        Total Amount: <span className="font-bold text-brand-blue text-lg">₱{order.totalAmount.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                     <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-2 ${
                                                         order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                                                         order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                         order.status === 'Cancellation Requested' ? 'bg-orange-100 text-orange-700' :
                                                         'bg-blue-100 text-blue-700'
                                                     }`}>
                                                         {order.status}
                                                     </span>
                                                     {order.trackingNumber && (
                                                         <button onClick={() => { setSelectedTrackingOrder(order); setIsTrackingOpen(true); }} className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-full text-xs font-bold text-stone-600 flex items-center gap-2 transition-colors">
                                                             <Truck className="w-3 h-3" /> Track Order
                                                         </button>
                                                     )}
                                                     {order.status === 'Processing' && (
                                                        <button 
                                                            onClick={() => handleCancelOrderClick(order)}
                                                            className="px-4 py-1.5 border border-stone-200 hover:bg-stone-50 rounded-full text-xs font-bold text-stone-600 flex items-center gap-2 transition-colors"
                                                        >
                                                            Cancel Order
                                                        </button>
                                                     )}
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex gap-4 items-center p-2 rounded-xl hover:bg-stone-50 transition-colors">
                                                        <div className="w-16 h-16 rounded-xl bg-white border border-stone-200 overflow-hidden flex-shrink-0">
                                                            <img src={item.image} className="w-full h-full object-cover" alt="" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-stone-900 truncate">{item.name}</p>
                                                            <p className="text-sm text-stone-500">{item.selectedVariation?.name || 'Standard Variant'}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-stone-900">₱{item.price.toLocaleString()}</div>
                                                            <div className="text-xs text-stone-500">Qty: {item.quantity}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-24 bg-white rounded-3xl border border-stone-100 border-dashed">
                                        <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <ShoppingBag className="w-10 h-10 text-stone-300" />
                                        </div>
                                        <h3 className="font-serif font-bold text-2xl text-stone-900 mb-2">No orders yet</h3>
                                        <p className="text-stone-500 mb-8 max-w-sm mx-auto">Your collection is waiting to be started. Explore our marketplace to find something unique.</p>
                                        <button onClick={() => onNavigate('/shop')} className="px-8 py-3 bg-brand-blue text-white rounded-full font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20">Start Shopping</button>
                                    </div>
                                )}
                            </div>
                        )}
                         
                         {activeTab === 'personal' && (
                             <div className="space-y-8 animate-scale-in">
                                <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
                                    <h2 className="text-2xl font-serif font-bold text-stone-900 mb-8">Personal Information</h2>
                                    <form onSubmit={handleEditSubmit} className="space-y-6 max-w-2xl">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-stone-700">Display Name</label>
                                                <div className="relative">
                                                    <User className="w-5 h-5 absolute left-4 top-3.5 text-stone-400" />
                                                    <input 
                                                        value={editForm.displayName} 
                                                        onChange={e => setEditForm({...editForm, displayName: e.target.value})} 
                                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 focus:border-brand-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-stone-50 focus:bg-white" 
                                                        placeholder="Your Name"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-stone-700">Phone Number</label>
                                                <div className="relative">
                                                    <Phone className="w-5 h-5 absolute left-4 top-3.5 text-stone-400" />
                                                    <input 
                                                        value={editForm.phoneNumber} 
                                                        onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} 
                                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 focus:border-brand-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-stone-50 focus:bg-white" 
                                                        placeholder="+63 900 000 0000"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-stone-700">Gender</label>
                                                <div className="relative">
                                                    <select 
                                                        value={editForm.gender} 
                                                        onChange={e => setEditForm({...editForm, gender: e.target.value as any})} 
                                                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-brand-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none bg-stone-50 focus:bg-white"
                                                    >
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-stone-700">Birthday</label>
                                                <input 
                                                    type="date" 
                                                    value={editForm.birthDate} 
                                                    onChange={e => setEditForm({...editForm, birthDate: e.target.value})} 
                                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-brand-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-stone-50 focus:bg-white" 
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-8 flex justify-end border-t border-stone-100">
                                            <button type="submit" disabled={isSavingProfile} className="px-8 py-3 bg-brand-blue text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-colors flex items-center gap-2">
                                                {isSavingProfile ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                                Save Changes
                                            </button>
                                        </div>
                                    </form>
                                </div>
                             </div>
                        )}

                        {activeTab === 'shop' && isSellerOrAdmin && (
                            <div className="space-y-8 animate-scale-in">
                                <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
                                    <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6">Shop Profile</h2>
                                    <div className="space-y-6 max-w-2xl">
                                        <div className="flex items-center gap-6">
                                            <div className="w-24 h-24 rounded-full bg-stone-100 overflow-hidden relative border border-stone-200">
                                                {shopImageFile ? (
                                                    <img src={URL.createObjectURL(shopImageFile)} className="w-full h-full object-cover" />
                                                ) : user.shopImage ? (
                                                    <img src={user.shopImage} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Store className="w-10 h-10 text-stone-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                                )}
                                            </div>
                                            <div>
                                                <label className="px-4 py-2 border border-stone-300 rounded-lg text-sm font-bold cursor-pointer hover:bg-stone-50 bg-white">
                                                    Upload Logo
                                                    <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files && setShopImageFile(e.target.files[0])} />
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Shop Name</label>
                                            <input value={shopName} onChange={e => setShopName(e.target.value)} className="w-full px-4 py-2 rounded-lg border bg-stone-50 focus:bg-white border-stone-200 focus:border-brand-blue transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Shop Address</label>
                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <select className="w-full px-4 py-2 rounded-lg border bg-stone-50 focus:bg-white border-stone-200 appearance-none" value={shopProvinceCode} onChange={async e => {
                                                        const code = e.target.value;
                                                        setShopProvinceCode(code);
                                                        setShopProvince(e.target.options[e.target.selectedIndex].text);
                                                        setShopCityCode('');
                                                        setShopCity('');
                                                        setShopBarangay('');
                                                        setShopCities(await fetchCities(code));
                                                        setShopBarangays([]);
                                                    }}>
                                                        <option value="">Select Province</option>
                                                        {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                                                </div>
                                                
                                                <div className="relative">
                                                    <select className="w-full px-4 py-2 rounded-lg border bg-stone-50 focus:bg-white border-stone-200 appearance-none" value={shopCityCode} onChange={async e => {
                                                        const code = e.target.value;
                                                        setShopCityCode(code);
                                                        setShopCity(e.target.options[e.target.selectedIndex].text);
                                                        setShopBarangay('');
                                                        setShopBarangays(await fetchBarangays(code));
                                                    }} disabled={!shopProvinceCode}>
                                                        <option value="">Select City</option>
                                                        {shopCities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                                                </div>

                                                <div className="relative">
                                                    <select className="w-full px-4 py-2 rounded-lg border bg-stone-50 focus:bg-white border-stone-200 appearance-none" value={shopBarangay} onChange={e => setShopBarangay(e.target.value)} disabled={!shopCityCode}>
                                                        <option value="">Select Barangay</option>
                                                        {shopBarangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-4 flex justify-end">
                                            <button onClick={handleSaveShopSettings} disabled={isSavingShop} className="px-8 py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-800 transition-colors flex items-center gap-2">
                                                {isSavingShop ? <Loader className="w-5 h-5 animate-spin" /> : <Store className="w-5 h-5" />}
                                                Update Shop Profile
                                            </button>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        )}
                        {activeTab === 'addresses' && !isSellerOrAdmin && (
                            <div className="bg-white p-8 rounded-3xl border border-stone-100 animate-scale-in shadow-sm">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-serif font-bold text-stone-900">Saved Addresses</h2>
                                    <button 
                                        onClick={() => handleOpenAddressModal()} 
                                        className="px-4 py-2 bg-brand-blue text-white rounded-lg font-bold hover:bg-blue-800 transition-colors flex items-center gap-2 text-sm"
                                    >
                                        <Plus className="w-4 h-4" /> Add New Address
                                    </button>
                                </div>
                                <div className="grid gap-4">
                                     {user.addresses && user.addresses.length > 0 ? (
                                         user.addresses.map((addr: Address, idx: number) => (
                                             <div key={idx} className={`border rounded-2xl p-6 flex justify-between items-start transition-colors group ${addr.isDefault ? 'border-brand-blue bg-blue-50/50' : 'border-stone-200 bg-stone-50/50 hover:border-brand-blue'}`}>
                                                 <div className="flex gap-4">
                                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${addr.isDefault ? 'bg-brand-blue text-white' : 'bg-blue-50 text-brand-blue'}`}>
                                                         <MapPin className="w-5 h-5" />
                                                     </div>
                                                     <div>
                                                         <div className="flex items-center gap-3 mb-1">
                                                             <span className="font-bold text-lg text-stone-900">{addr.fullName}</span>
                                                             {addr.isDefault ? (
                                                                <span className="bg-brand-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Default</span>
                                                             ) : (
                                                                <button 
                                                                    onClick={() => handleSetDefaultAddress(idx)}
                                                                    className="text-stone-400 hover:text-brand-blue text-xs font-bold underline decoration-dotted underline-offset-2 transition-colors"
                                                                >
                                                                    Set as Default
                                                                </button>
                                                             )}
                                                         </div>
                                                         <p className="text-stone-500 text-sm mb-1">{addr.mobileNumber}</p>
                                                         <p className="text-stone-700 leading-relaxed">
                                                             {addr.street}, {addr.barangay}, {addr.city}, {addr.province}
                                                         </p>
                                                     </div>
                                                 </div>
                                                 <div className="flex items-center gap-2">
                                                    <button onClick={() => handleOpenAddressModal(idx)} className="p-2 text-stone-400 hover:text-brand-blue hover:bg-blue-50 rounded-xl transition-colors" title="Edit Address">
                                                        <Edit3 className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => confirmDeleteAddress(idx)} className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Delete Address">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                 </div>
                                             </div>
                                         ))
                                     ) : (
                                         <div className="text-center py-16 border-2 border-dashed border-stone-200 rounded-2xl">
                                             <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                                             <p className="text-stone-500 font-medium">No addresses saved yet.</p>
                                             <p className="text-stone-400 text-sm">Addresses are saved automatically during checkout.</p>
                                         </div>
                                     )}
                                 </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals are rendered here... (Tracking, Cancel, Address, Delete) */}
             {selectedTrackingOrder && (
                <TrackingModal 
                    isOpen={isTrackingOpen} 
                    onClose={() => setIsTrackingOpen(false)} 
                    trackingNumber={selectedTrackingOrder.trackingNumber || ''} 
                    status={selectedTrackingOrder.status}
                />
            )}
            
            <CancelOrderModal
                isOpen={isCancelOrderModalOpen}
                onClose={() => setIsCancelOrderModalOpen(false)}
                onSubmit={handleSubmitCancellation}
                isLoading={isCancelling}
            />

            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-scale-in text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-stone-900">Delete Address?</h3>
                        <p className="text-stone-500 mb-6 text-sm">Are you sure you want to delete this address? This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)} 
                                className="flex-1 py-3 border border-stone-200 rounded-xl font-bold text-stone-600 hover:bg-stone-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={executeDeleteAddress} 
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {isAddressModalOpen && (
               <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                   <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
                       {/* Address Modal Content */}
                       <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-4">
                           <h2 className="text-xl font-bold text-stone-900">{editingAddressIndex !== null ? 'Edit Address' : 'Add New Address'}</h2>
                           <button onClick={() => setIsAddressModalOpen(false)}><X className="w-5 h-5 text-stone-500" /></button>
                       </div>
                       <form onSubmit={handleAddressSubmit} className="space-y-4">
                            {loadingLocation && (
                                <div className="p-2 bg-blue-50 text-brand-blue text-xs rounded-lg flex items-center gap-2 mb-2">
                                    <Loader className="w-3 h-3 animate-spin" /> Loading location data...
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-stone-700">Full Name</label>
                                    <input required className="w-full px-4 py-2 rounded-lg border border-stone-200" value={addressForm.fullName} onChange={e => setAddressForm({...addressForm, fullName: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-stone-700">Mobile Number</label>
                                    <input required className="w-full px-4 py-2 rounded-lg border border-stone-200" value={addressForm.mobileNumber} onChange={e => setAddressForm({...addressForm, mobileNumber: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-stone-700">Province</label>
                                <div className="relative">
                                    <select required className="w-full px-4 py-2 rounded-lg border border-stone-200 appearance-none bg-white" value={provCode} onChange={async (e) => {
                                        const code = e.target.value;
                                        setProvCode(code);
                                        const name = e.target.options[e.target.selectedIndex].text;
                                        setAddressForm({...addressForm, province: name, city: '', barangay: ''});
                                        setCities([]); setBarangays([]); setCityCode('');
                                        setLoadingLocation(true);
                                        if(code) setCities(await fetchCities(code));
                                        setLoadingLocation(false);
                                    }}>
                                        <option value="">Select Province</option>
                                        {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-stone-700">City/Municipality</label>
                                    <div className="relative">
                                        <select required className="w-full px-4 py-2 rounded-lg border border-stone-200 appearance-none bg-white" value={cityCode} onChange={async (e) => {
                                            const code = e.target.value;
                                            setCityCode(code);
                                            const name = e.target.options[e.target.selectedIndex].text;
                                            setAddressForm({...addressForm, city: name, barangay: ''});
                                            setBarangays([]);
                                            setLoadingLocation(true);
                                            if(code) setBarangays(await fetchBarangays(code));
                                            setLoadingLocation(false);
                                        }} disabled={!provCode}>
                                            <option value="">Select City</option>
                                            {cities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-stone-700">Barangay</label>
                                    <div className="relative">
                                        <select required className="w-full px-4 py-2 rounded-lg border border-stone-200 appearance-none bg-white" value={addressForm.barangay} onChange={e => setAddressForm({...addressForm, barangay: e.target.value})} disabled={!cityCode}>
                                            <option value="">Select Barangay</option>
                                            {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-stone-700">Street Address</label>
                                <input required className="w-full px-4 py-2 rounded-lg border border-stone-200" value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} placeholder="House No., Street Name, Landmark" />
                            </div>
                            
                            <div className="flex items-center gap-2 pt-2">
                                <input 
                                    type="checkbox" 
                                    id="defaultAddr" 
                                    checked={addressForm.isDefault} 
                                    onChange={e => setAddressForm({...addressForm, isDefault: e.target.checked})}
                                    className="w-4 h-4 rounded border-stone-300 text-brand-blue focus:ring-brand-blue"
                                />
                                <label htmlFor="defaultAddr" className="text-sm font-medium text-stone-700 cursor-pointer">
                                    Set as default address
                                </label>
                            </div>

                            <button type="submit" className="w-full py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-800 transition-colors mt-4">
                                Save Address
                            </button>
                       </form>
                   </div>
               </div>
           )}
        </div>
    );
};

const ProductDetailsPage: React.FC<any> = ({ product, onAddToCart, onNavigate, user, onLoginRequest, onRefreshProduct }) => {
    const [selectedVariation, setSelectedVariation] = useState<Variation | undefined>(undefined);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    
    // New Review State
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Reply State (Map to handle multiple reply inputs)
    const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
    const [isReplyingMap, setIsReplyingMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (product) {
            fetchProductReviews(product.id).then(setReviews);
        }
    }, [product]);
    
    const prices = product.variations?.map((v: any) => v.price) || [product.price];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const displayPrice = selectedVariation ? selectedVariation.price : (minPrice !== maxPrice ? `${minPrice} - ₱${maxPrice}` : minPrice);

    const handleAddToCart = () => {
        if (!user) {
            onLoginRequest();
            return;
        }

        if (user.role !== 'customer') {
            setNotification({ message: "Only customers can add items to the bag.", type: 'error' });
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        if (product.variations && product.variations.length > 0 && !selectedVariation) {
             setNotification({ message: "Please select a variation to continue.", type: 'error' });
             setTimeout(() => setNotification(null), 3000);
             return;
        }
        
        onAddToCart({...product, selectedVariation, price: selectedVariation?.price || product.price});
        setNotification({ message: "Successfully added to your bag!", type: 'success' });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSubmitReview = async () => {
        if (!user || !newComment.trim()) return;
        setIsSubmittingReview(true);
        const success = await addProductReview(product.id, user.uid, user.name, newRating, newComment);
        if (success) {
            setNewComment('');
            setNewRating(5);
            fetchProductReviews(product.id).then(setReviews);
            if (onRefreshProduct) onRefreshProduct();
            setNotification({ message: "Review submitted successfully!", type: 'success' });
        } else {
             setNotification({ message: "Failed to submit review.", type: 'error' });
        }
        setIsSubmittingReview(false);
        setTimeout(() => setNotification(null), 3000);
    };

    const handleReply = async (reviewId: string) => {
        const text = replyTextMap[reviewId];
        if (!text || !text.trim()) return;

        setIsReplyingMap(prev => ({...prev, [reviewId]: true}));
        const success = await replyToReview(reviewId, text);
        if (success) {
            setReplyTextMap(prev => ({...prev, [reviewId]: ''}));
            fetchProductReviews(product.id).then(setReviews); // Refresh
        }
        setIsReplyingMap(prev => ({...prev, [reviewId]: false}));
    };

    const handleDeleteReview = async (review: Review) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;
        
        const success = await deleteReview(review.id, product.id, review.rating);
        if (success) {
            fetchProductReviews(product.id).then(setReviews);
            if (onRefreshProduct) onRefreshProduct();
            setNotification({ message: "Review deleted.", type: 'success' });
            setTimeout(() => setNotification(null), 3000);
        } else {
            setNotification({ message: "Failed to delete review.", type: 'error' });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const isSeller = user?.role === 'seller' && user?.uid === product.sellerId;
    const isAdmin = user?.role === 'admin';
    const isCustomer = user?.role === 'customer';

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 relative">
             {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-24 right-4 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-up border ${notification.type === 'success' ? 'bg-white border-green-100 text-green-700' : 'bg-white border-red-100 text-red-700'}`}>
                    <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div>
                        <p className="font-bold text-sm">{notification.type === 'success' ? 'Success' : 'Action Required'}</p>
                        <p className="text-sm">{notification.message}</p>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-4 text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
                </div>
            )}

            <button onClick={() => onNavigate('/')} className="mb-4 flex items-center gap-1 text-stone-500 hover:text-brand-blue transition-colors"><ChevronLeft className="w-4 h-4" /> Back to Marketplace</button>
            <div className="grid lg:grid-cols-2 gap-12 mb-16">
                <img src={selectedVariation?.image || product.image} className="w-full aspect-square object-cover rounded-2xl bg-stone-100 shadow-md" />
                <div>
                    <h1 className="text-4xl font-serif font-bold mb-2 text-stone-900">{product.name} {selectedVariation && `- ${selectedVariation.name}`}</h1>
                    <div className="flex items-center gap-2 mb-6">
                        <StarRating rating={product.rating} size="w-5 h-5" />
                        <span className="font-bold text-stone-900 text-lg">{product.rating}</span> 
                        <span className="text-stone-400">({reviews.length} reviews)</span>
                    </div>
                    
                    <div className="mb-8">
                        <p className="font-bold mb-3 text-stone-900 text-sm uppercase tracking-wider">Select Variation</p>
                        <div className="flex gap-3 flex-wrap">
                            {product.variations?.map((v: any) => (
                                <button 
                                    key={v.id} 
                                    onClick={() => setSelectedVariation(v)} 
                                    className={`border-2 px-4 py-2 rounded-xl flex items-center gap-3 transition-all ${
                                        selectedVariation?.id === v.id 
                                        ? 'border-brand-blue bg-blue-50/50 text-brand-blue' 
                                        : 'border-stone-100 hover:border-brand-blue/30 text-stone-600'
                                    }`}
                                >
                                    {v.image && <img src={v.image} className="w-8 h-8 rounded-lg object-cover" />}
                                    <span className="font-medium">{v.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100 mb-8">
                        <div className="flex justify-between items-end mb-4">
                             <div>
                                <p className="text-sm text-stone-500 mb-1">Price</p>
                                <p className="text-4xl font-bold text-brand-blue">₱{displayPrice.toLocaleString()}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-sm text-stone-500 mb-1">Stock</p>
                                <p className="font-medium text-stone-900">{selectedVariation ? `${selectedVariation.stock} items` : 'Select variant'}</p>
                             </div>
                        </div>
                        <button 
                            onClick={handleAddToCart}
                            className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                                selectedVariation 
                                ? 'bg-brand-blue text-white hover:bg-blue-800 shadow-blue-900/20' 
                                : 'bg-stone-200 text-stone-500 hover:bg-stone-300'
                            }`}
                        >
                           <ShoppingBag className="w-5 h-5" /> Add to Bag
                        </button>
                    </div>

                    <div className="border-t border-stone-100 pt-8">
                        <h3 className="font-bold mb-4 text-stone-900 text-lg font-serif">Product Description</h3>
                        <p className="text-stone-600 leading-relaxed">{product.description}</p>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="border-t border-stone-200 pt-12">
                <h2 className="text-2xl font-serif font-bold text-stone-900 mb-8">Customer Reviews</h2>
                
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {reviews.length > 0 ? (
                            reviews.map((review) => (
                                <div key={review.id} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm relative group">
                                    {isAdmin && (
                                        <button 
                                            onClick={() => handleDeleteReview(review)}
                                            className="absolute top-4 right-4 p-2 text-stone-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Review (Admin)"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}

                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-brand-light rounded-full flex items-center justify-center text-brand-blue font-bold">
                                                {review.userName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-stone-900 text-sm">{review.userName}</p>
                                                <StarRating rating={review.rating} size="w-3 h-3" />
                                            </div>
                                        </div>
                                        <span className="text-xs text-stone-400">
                                            {review.createdAt?.seconds ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                        </span>
                                    </div>
                                    <p className="text-stone-600 text-sm leading-relaxed mb-4">{review.comment}</p>

                                    {/* Seller Reply Display */}
                                    {review.sellerReply && (
                                        <div className="ml-6 mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 relative">
                                            <CornerDownRight className="absolute -left-5 top-4 w-4 h-4 text-stone-300" />
                                            <div className="flex items-center gap-2 mb-2">
                                                <Store className="w-3 h-3 text-brand-blue" />
                                                <span className="text-xs font-bold text-brand-blue">Seller Response</span>
                                                <span className="text-[10px] text-stone-400">• {review.sellerReplyCreatedAt?.seconds ? new Date(review.sellerReplyCreatedAt.seconds * 1000).toLocaleDateString() : ''}</span>
                                            </div>
                                            <p className="text-xs text-stone-600 italic">{review.sellerReply}</p>
                                        </div>
                                    )}

                                    {/* Seller Reply Input */}
                                    {isSeller && !review.sellerReply && (
                                        <div className="mt-4 pt-4 border-t border-stone-100">
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Write a response..." 
                                                    className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-brand-blue"
                                                    value={replyTextMap[review.id] || ''}
                                                    onChange={(e) => setReplyTextMap(prev => ({...prev, [review.id]: e.target.value}))}
                                                />
                                                <button 
                                                    onClick={() => handleReply(review.id)}
                                                    disabled={isReplyingMap[review.id] || !replyTextMap[review.id]}
                                                    className="px-4 py-2 bg-stone-100 hover:bg-brand-blue hover:text-white text-stone-600 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                                >
                                                    {isReplyingMap[review.id] ? 'Sending...' : 'Reply'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-500">
                                No reviews yet. Be the first to share your experience!
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        {isCustomer ? (
                            <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-lg sticky top-24">
                                <h3 className="font-bold text-lg text-stone-900 mb-4">Write a Review</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Rating</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button key={star} onClick={() => setNewRating(star)} type="button">
                                                    <Star className={`w-8 h-8 transition-colors ${star <= newRating ? 'text-yellow-400 fill-current' : 'text-stone-200 hover:text-yellow-200'}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Comment</label>
                                        <textarea 
                                            rows={4} 
                                            className="w-full p-3 rounded-xl border border-stone-200 focus:border-brand-blue focus:ring-4 focus:ring-blue-500/10 outline-none text-sm"
                                            placeholder="Share your thoughts about this product..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        onClick={handleSubmitReview}
                                        disabled={isSubmittingReview || !newComment.trim()}
                                        className="w-full py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isSubmittingReview ? <Loader className="w-5 h-5 animate-spin" /> : 'Submit Review'}
                                    </button>
                                </div>
                            </div>
                        ) : !user ? (
                             <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 text-center">
                                 <p className="text-stone-600 mb-4 text-sm">Please log in to leave a review.</p>
                                 <button onClick={onLoginRequest} className="text-brand-blue font-bold text-sm hover:underline">Log In / Sign Up</button>
                             </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProductCard: React.FC<{ product: Product; onClick: () => void }> = ({ product, onClick }) => {
    const prices = product.variations?.map(v => v.price) || [product.price];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const displayPrice = min !== max ? `₱${min.toLocaleString()} - ₱${max.toLocaleString()}` : `₱${min.toLocaleString()}`;

    return (
        <div onClick={onClick} className="group bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col">
            <div className="aspect-[4/3] overflow-hidden bg-stone-100 relative">
                <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {product.variations && product.variations.length > 0 && (
                     <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] md:text-xs px-2 py-1 rounded backdrop-blur-sm">
                         {product.variations.length} variants
                     </span>
                )}
            </div>
            <div className="p-3 md:p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2 gap-2">
                     <span className="text-[10px] md:text-xs font-bold text-brand-blue bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wide truncate">{product.category}</span>
                     <div className="flex items-center gap-1 shrink-0">
                         <StarRating rating={product.rating} size="w-3 h-3" />
                         <span className="text-[10px] md:text-xs font-medium text-stone-500">{product.rating}</span>
                     </div>
                </div>
                <h3 className="font-serif font-bold text-sm md:text-lg text-stone-900 mb-1 line-clamp-2 md:line-clamp-1 group-hover:text-brand-blue transition-colors flex-1">{product.name}</h3>
                <div className="flex justify-between items-center mt-auto pt-3">
                    <span className="font-bold text-sm md:text-base text-stone-900">{displayPrice}</span>
                    <button className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                        <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ... AddProductModal, ProductManagerModal, MarketplacePage, HomePage ... (Keep existing implementation)
const AddProductModal: React.FC<any> = ({ isOpen, onClose, onAddProduct, user, editingProduct }) => {
    // ... same as before
    interface TempVariation {
      id: string;
      name: string;
      price: number;
      stock: number;
      file?: File;
      preview?: string;
    }
     const [productName, setProductName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<Category>(Category.WEAVING);
    const [variations, setVariations] = useState<TempVariation[]>([{ id: Date.now().toString(), name: '', price: 0, stock: 0 }]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            if (editingProduct) {
                setProductName(editingProduct.name);
                setDescription(editingProduct.description);
                setCategory(editingProduct.category);
                if (editingProduct.variations) {
                    setVariations(editingProduct.variations.map((v: any) => ({
                        id: v.id,
                        name: v.name,
                        price: v.price,
                        stock: v.stock || 0,
                        preview: v.image
                    })));
                }
            } else {
                setProductName('');
                setDescription('');
                setCategory(Category.WEAVING);
                setVariations([{ id: Date.now().toString(), name: '', price: 0, stock: 0 }]);
            }
        }
    }, [isOpen, editingProduct]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (variations.length === 0) throw new Error("At least one variation is required.");
            const processedVariations: Variation[] = [];
            let totalStock = 0;
            
            for (const v of variations) {
                let imageUrl = v.preview || '';
                
                if (v.file) {
                    // Added validation
                    if (!v.file.type.startsWith('image/')) {
                        throw new Error(`Variation "${v.name || 'unnamed'}" has an invalid file type. Please upload a valid image (JPG, PNG, etc).`);
                    }

                    const uploadedUrl = await uploadProductImage(user.uid, v.file);
                    if (!uploadedUrl) {
                        throw new Error(`Failed to upload image for variation "${v.name || 'Unnamed'}". Please check your internet connection or file format and try again.`);
                    }
                    imageUrl = uploadedUrl;
                }
                
                if (!imageUrl && !v.file) imageUrl = 'https://via.placeholder.com/150'; 
                
                processedVariations.push({ id: v.id, name: v.name, price: Number(v.price), stock: Number(v.stock), image: imageUrl });
                totalStock += Number(v.stock);
            }

            const minPrice = Math.min(...processedVariations.map(v => v.price));
            const mainImage = processedVariations[0].image;
            
            const productData = {
                name: productName, description, category, price: minPrice, stock: totalStock,
                sellerId: user.uid, artisan: user.shopName || user.name, image: mainImage,
                variations: processedVariations
            };

            if (editingProduct) {
                await updateProduct(editingProduct.id, productData);
            } else {
                await onAddProduct({
                    ...productData,
                    rating: 0, reviews: 0
                });
            }
            onClose();
        } catch (error: any) {
            console.error(error);
            setError(error.message || "Failed to save product. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="bg-brand-cream px-6 py-4 flex justify-between items-center border-b">
                    <h2 className="font-bold text-xl text-brand-blue">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {error && (
                        <div className="md:col-span-2 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm flex justify-between items-start gap-3 animate-fade-in-up shadow-sm">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{error}</span>
                            </div>
                            <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors p-0.5 rounded hover:bg-red-100" title="Dismiss">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    <div className="space-y-4">
                        <div><label className="block text-sm font-medium mb-1">Product Name *</label><input required value={productName} onChange={e => setProductName(e.target.value)} className="w-full px-4 py-2 rounded-lg border bg-white" /></div>
                        <div><label className="block text-sm font-medium mb-1">Category *</label><select value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full px-4 py-2 rounded-lg border bg-white">{Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div><label className="block text-sm font-medium mb-1">Description *</label><textarea required rows={5} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 rounded-lg border bg-white" /></div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center"><label className="block text-sm font-bold">Variations</label><button type="button" onClick={() => setVariations([...variations, { id: Date.now().toString(), name: '', price: 0, stock: 0 }])} className="text-xs text-brand-blue font-bold flex items-center gap-1"><Plus className="w-3 h-3" /> Add Variation</button></div>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {variations.map((v) => (
                                <div key={v.id} className="p-3 border rounded-xl bg-stone-50 flex gap-3 items-start">
                                    <div className="w-20 h-20 flex-shrink-0"><label className="w-full h-full border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer bg-white overflow-hidden relative">{v.preview ? <img src={v.preview} className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-stone-400" />}<input type="file" className="hidden" accept="image/*" onChange={e => { if (e.target.files?.[0]) { const f = e.target.files[0]; setVariations(variations.map(x => x.id === v.id ? { ...x, file: f, preview: URL.createObjectURL(f) } : x)); } }} /></label></div>
                                    <div className="flex-1 space-y-2">
                                        <input required placeholder="Variation Name" value={v.name} onChange={e => setVariations(variations.map(x => x.id === v.id ? { ...x, name: e.target.value } : x))} className="w-full px-3 py-1.5 rounded border text-sm bg-white" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input required type="number" placeholder="Price" value={v.price || ''} onChange={e => setVariations(variations.map(x => x.id === v.id ? { ...x, price: Number(e.target.value) } : x))} className="w-full px-3 py-1.5 rounded border text-sm bg-white" />
                                            <input required type="number" placeholder="Stock" value={v.stock || ''} onChange={e => setVariations(variations.map(x => x.id === v.id ? { ...x, stock: Number(e.target.value) } : x))} className="w-full px-3 py-1.5 rounded border text-sm bg-white" />
                                        </div>
                                    </div>
                                    <button type="button" disabled={variations.length <= 1} onClick={() => setVariations(variations.filter(x => x.id !== v.id))} className="p-1 text-stone-400 hover:text-red-500 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-stone-500 italic">At least one variation is required.</p>
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={onClose} className="px-6 py-2 border rounded-xl">Cancel</button><button type="submit" disabled={isLoading} className="px-6 py-2 bg-brand-blue text-white rounded-xl font-bold">{isLoading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}</button></div>
                </form>
            </div>
        </div>
    );
};

const ProductManagerModal: React.FC<any> = ({ isOpen, onClose, product, onUpdate, onDelete, onEdit }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-scale-in">
                {!showDeleteConfirm ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-stone-900">Manage Product</h2>
                            <button onClick={onClose}><X className="w-5 h-5 text-stone-500" /></button>
                        </div>
                        <div className="flex gap-4 mb-6">
                            <img src={product.image} className="w-20 h-20 rounded-lg object-cover bg-stone-100" />
                            <div>
                                <h3 className="font-bold">{product.name}</h3>
                                <p className="text-sm text-stone-500">{product.variations?.length || 0} Variations</p>
                                <p className="text-sm font-bold text-brand-blue">₱{product.price}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button onClick={() => { onEdit(); }} className="w-full py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-800">Edit Details</button>
                            <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold border border-red-100 hover:bg-red-100">Delete Product</button>
                        </div>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Delete this product?</h3>
                        <p className="text-stone-500 mb-6">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 border border-stone-200 rounded-xl font-bold">Cancel</button>
                            <button onClick={() => { onDelete(product.id); onClose(); }} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const MarketplacePage: React.FC<any> = ({ products, onNavigate, onAddToCart }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredProducts = products.filter((p: any) => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
        const isActive = p.sellerStatus !== 'suspended' && p.sellerStatus !== 'banned';
        return matchSearch && matchCategory && isActive;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-serif font-bold text-stone-900">Marketplace</h1>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-400" />
                    <input 
                        type="text" 
                        placeholder="Search products..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-full border border-stone-200 focus:border-brand-blue outline-none"
                    />
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
                 <button onClick={() => setSelectedCategory('All')} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === 'All' ? 'bg-brand-blue text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>All</button>
                 {Object.values(Category).map(cat => (
                     <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-brand-blue text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>{cat}</button>
                 ))}
            </div>

            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                    {filteredProducts.map((product: any) => (
                        <ProductCard key={product.id} product={product} onClick={() => onNavigate(`/product/${product.id}`)} />
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center text-stone-500">No products found matching your criteria.</div>
            )}
        </div>
    );
};

const HomePage: React.FC<any> = ({ products, onNavigate, onAddToCart, user }) => {
    // ... (Keep existing implementation)
    // Seller View
    if (user?.role === 'seller') {
        const sellerProducts = products.filter((p: any) => p.sellerId === user.uid);
        const [filterCategory, setFilterCategory] = useState<string>('All');
        
        const filtered = filterCategory === 'All' ? sellerProducts : sellerProducts.filter((p: any) => p.category === filterCategory);

        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-stone-100 flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-brand-blue text-white flex items-center justify-center text-3xl font-bold font-serif overflow-hidden">
                        {user.shopImage ? <img src={user.shopImage} className="w-full h-full object-cover" /> : user.shopName?.charAt(0) || 'S'}
                    </div>
                    <div className="flex-1">
                         <h1 className="text-3xl font-serif font-bold text-stone-900">{user.shopName || 'My Shop'}</h1>
                         <p className="text-stone-500 flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" /> {user.shopAddress || 'No address set'}</p>
                         <div className="flex gap-4 mt-3">
                             <div className="bg-blue-50 text-brand-blue px-3 py-1 rounded-lg text-sm font-bold">0.0 Rating</div>
                             <div className="bg-stone-100 text-stone-600 px-3 py-1 rounded-lg text-sm font-bold">{sellerProducts.length} Products</div>
                         </div>
                    </div>
                    <button onClick={() => onNavigate('/profile')} className="px-6 py-2 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-800 transition-colors">Edit Shop Profile</button>
                </div>
                
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-serif font-bold text-stone-900">My Products</h2>
                    <button onClick={() => onNavigate('/seller-dashboard')} className="text-sm text-brand-blue font-bold hover:underline">Manage Inventory</button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
                    {['All', ...Object.values(Category)].map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setFilterCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterCategory === cat ? 'bg-brand-blue text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {filtered.map((p: any) => (
                        <ProductCard key={p.id} product={p} onClick={() => onNavigate(`/product/${p.id}`)} />
                    ))}
                    {filtered.length === 0 && <p className="text-stone-500 col-span-4 text-center py-10">You haven't added any products yet.</p>}
                </div>
            </div>
        );
    }
    
    // Filter out suspended products for Customer View
    const availableProducts = products.filter((p: any) => p.sellerStatus !== 'suspended' && p.sellerStatus !== 'banned');

    // Customer View
    return (
        <div>
            <div className="relative h-[500px] overflow-hidden">
                <img src={HERO_COVER} className="absolute inset-0 w-full h-full object-fit" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-center px-4">
                    <div className="max-w-2xl text-white">
                        <span className="inline-block px-4 py-1 border border-white/30 rounded-full text-sm font-medium backdrop-blur-sm mb-4">AUTHENTIC ILOCANO CRAFTSMANSHIP</span>
                        <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">Discover the Soul of Ilocos Norte</h1>
                        <p className="text-lg md:text-xl text-white/90 mb-8">Experience the rich heritage of the North through our curated marketplace of handwoven crafts, pottery, and delicacies.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => onNavigate('/shop')} className="px-8 py-3 bg-white text-brand-blue rounded-xl font-bold hover:bg-stone-100 transition-colors flex items-center gap-2">Shop Now <ShoppingBag className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 py-16">
                 <h2 className="text-3xl font-serif font-bold text-center mb-8 md:mb-12 text-brand-blue">Featured Collections</h2>
                 <div className="flex overflow-x-auto gap-4 pb-6 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0 md:mx-0 md:px-0 mb-12 md:mb-20 scrollbar-hide">
                     {[
                        { title: "Inabel Weaving", img: "https://kanvasphilippines.com/wp-content/uploads/2019/12/20191212_160636.jpg?w=2000&h=" },
                        { title: "Burnay Pottery", img: "https://themixedculture.com/wp-content/uploads/2013/11/burnay-photo-by-israel-formales1-e1383607294408.jpg" },
                        { title: "Ilocos Delicacies", img: "https://thesmartlocal.ph/wp-content/uploads/2022/01/ilocano-foods-bagnet-1024x1024.jpg" }
                     ].map((collection, index) => (
                        <div key={index} className="flex-shrink-0 w-[85vw] sm:w-[60vw] md:w-auto h-64 md:h-80 snap-center cursor-pointer group relative overflow-hidden rounded-2xl shadow-md md:shadow-none" onClick={() => onNavigate('/shop')}>
                            <img src={collection.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={collection.title} />
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <h3 className="text-white text-2xl font-serif font-bold drop-shadow-md">{collection.title}</h3>
                            </div>
                        </div>
                     ))}
                 </div>

                 <div className="flex justify-between items-end mb-8">
                     <div>
                        <h2 className="text-3xl font-serif font-bold text-stone-900">Fresh from the North</h2>
                        <p className="text-stone-500 mt-2">Newest arrivals from our artisan partners</p>
                     </div>
                     <button onClick={() => onNavigate('/shop')} className="hidden md:flex items-center gap-2 text-brand-blue font-bold hover:underline">
                         View All <ArrowRight className="w-4 h-4" />
                     </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                    {availableProducts.slice(0, 4).map((p: any) => (
                        <ProductCard key={p.id} product={p} onClick={() => onNavigate(`/product/${p.id}`)} />
                    ))}
                </div>
                <button onClick={() => onNavigate('/shop')} className="w-full md:hidden mt-8 py-3 border border-stone-200 rounded-xl font-bold text-stone-600">View All Products</button>
            </div>
        </div>
    );
};

export const App: React.FC = () => {
  const [user, setUser] = useState<UserState | null>(null);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged(async (u) => {
          if (u) {
              const profile = await getUserProfile(u.uid);
              if (profile) {
                  if (profile.status === 'banned') {
                      alert("Your account has been banned.");
                      auth.signOut();
                      setUser(null);
                      return;
                  }
                  if (profile.status === 'suspended') {
                      const isExpired = await checkSuspensionExpiry(u.uid);
                      if (!isExpired) {
                           const endDate = profile.suspensionEndDate ? new Date(profile.suspensionEndDate.seconds * 1000).toLocaleDateString() : 'indefinite';
                           alert(`Your account has been suspended until ${endDate}.`);
                           auth.signOut();
                           setUser(null);
                           return;
                      }
                      const freshProfile = await getUserProfile(u.uid);
                  }

                  const updatedProfile = await getUserProfile(u.uid) || profile;

                  setUser({
                      uid: u.uid,
                      name: updatedProfile.displayName || u.displayName || 'User',
                      email: u.email || '',
                      emailVerified: u.emailVerified,
                      role: updatedProfile.role,
                      username: updatedProfile.username,
                      phoneNumber: updatedProfile.phoneNumber,
                      gender: updatedProfile.gender,
                      birthDate: updatedProfile.birthDate,
                      bag: updatedProfile.bag || [],
                      photoURL: updatedProfile.photoURL,
                      createdAt: updatedProfile.createdAt,
                      addresses: updatedProfile.addresses || [],
                      bankAccounts: updatedProfile.bankAccounts || [],
                      shopName: updatedProfile.shopName,
                      shopAddress: updatedProfile.shopAddress,
                      shopProvince: updatedProfile.shopProvince,
                      shopCity: updatedProfile.shopCity,
                      shopBarangay: updatedProfile.shopBarangay,
                      shopImage: updatedProfile.shopImage,
                      status: updatedProfile.status,
                      suspensionEndDate: updatedProfile.suspensionEndDate
                  } as UserState);
                  if (updatedProfile.bag) setCart(updatedProfile.bag);
              } else {
                   setUser({
                      uid: u.uid,
                      name: u.displayName || 'User',
                      email: u.email || '',
                      emailVerified: u.emailVerified,
                      role: 'customer',
                      bag: []
                   } as UserState);
              }
          } else {
              setUser(null);
              setCart([]);
          }
      });
      return () => unsubscribe();
  }, []);

  const handleRefreshProducts = async () => {
      const fetched = await fetchProducts();
      if(fetched && fetched.length > 0) setProducts(fetched);
  };

  const handleRefreshUser = async () => {
      if (auth.currentUser) {
          const profile = await getUserProfile(auth.currentUser.uid);
          if (profile) {
              setUser(prev => {
                  if (!prev) return null;
                  return { ...prev, ...profile };
              });
          }
      }
  };

  useEffect(() => {
      handleRefreshProducts();
  }, []);

  const handleNavigate = (path: string) => {
      setCurrentPath(path);
      window.scrollTo(0, 0);
  };

  const handleAddToCart = async (item: CartItem) => {
      let newCart = [...cart];
      const existingIdx = newCart.findIndex(i => i.id === item.id && i.selectedVariation?.id === item.selectedVariation?.id);
      
      if (existingIdx >= 0) {
          newCart[existingIdx].quantity += (item.quantity || 1);
      } else {
          newCart.push({ ...item, quantity: item.quantity || 1 });
      }
      setCart(newCart);
      if (user) await updateUserBag(user.uid, newCart);
  };

  const handleUpdateCartQty = async (itemId: string, delta: number) => {
      const newCart = cart.map(item => {
          if (item.id === itemId) {
              return { ...item, quantity: Math.max(1, item.quantity + delta) };
          }
          return item;
      });
      setCart(newCart);
      if (user) await updateUserBag(user.uid, newCart);
  };

  const handleRemoveFromCart = async (itemId: string) => {
      const newCart = cart.filter(item => item.id !== itemId);
      setCart(newCart);
      if (user) await updateUserBag(user.uid, newCart);
  };

  const handleCheckout = async (paymentMethod: PaymentMethod, deliveryMethod: DeliveryMethod, address: Address) => {
      if (!user) return;
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0) + (deliveryMethod === 'Standard' ? 120 : 0);
      
      await createOrder(user.uid, user.name, cart, total, paymentMethod, deliveryMethod, address);
      
      setCart([]);
      if (user) await updateUserBag(user.uid, []);
      setIsCheckoutModalOpen(false);
      handleNavigate('/profile'); 
  };
  
  const handleSaveAddress = async (address: Address) => {
      if (!user) return address; 
      const newAddresses = user.addresses ? [...user.addresses, address] : [address];
      await updateUserProfile(user.uid, { addresses: newAddresses });
      setUser(prev => prev ? { ...prev, addresses: newAddresses } : null);
      return address;
  }

  let content;
  if (currentPath === '/') {
      content = <HomePage products={products} onNavigate={handleNavigate} onAddToCart={handleAddToCart} user={user} />;
  } else if (currentPath === '/shop') {
      content = <MarketplacePage products={products} onNavigate={handleNavigate} onAddToCart={handleAddToCart} />; 
  } else if (currentPath === '/about') {
      content = <AboutPage onNavigate={handleNavigate} />;
  } else if (currentPath === '/cart') {
      content = <CartPage cart={cart} onUpdateQuantity={handleUpdateCartQty} onRemove={handleRemoveFromCart} onCheckoutClick={() => setIsCheckoutModalOpen(true)} onContinueShopping={() => handleNavigate('/shop')} />;
  } else if (currentPath === '/seller-dashboard') {
      content = <Dashboard user={user} products={products} onUpdateProfile={handleRefreshUser} onRefreshGlobalData={handleRefreshProducts} />;
  } else if (currentPath === '/seller-registration') {
      content = <SellerRegistrationPage user={user} onLoginClick={() => setIsAuthModalOpen(true)} />;
  } else if (currentPath === '/profile') {
      content = <ProfilePage user={user} onUpdateProfile={handleRefreshUser} onNavigate={handleNavigate} />;
  } else if (currentPath.startsWith('/product/')) {
      const id = currentPath.split('/')[2];
      const product = products.find(p => p.id === id);
      if (product) {
          content = <ProductDetailsPage 
              product={product} 
              onAddToCart={handleAddToCart} 
              onNavigate={handleNavigate} 
              user={user}
              onLoginRequest={() => setIsAuthModalOpen(true)}
              onRefreshProduct={handleRefreshProducts}
          />;
      } else {
          content = <div className="p-20 text-center">Product not found</div>;
      }
  } else {
      content = <div className="p-20 text-center">404 Page Not Found</div>;
  }

  return (
      <div className="min-h-screen bg-stone-50 font-sans text-stone-800">
          <Navbar 
              cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
              onCartClick={() => handleNavigate('/cart')}
              user={user}
              onLoginClick={() => setIsAuthModalOpen(true)}
              onLogoutClick={() => auth.signOut()}
              currentPath={currentPath}
              onNavigate={handleNavigate}
          />
          {content}
          <Footer onNavigate={handleNavigate} user={user} />

          <ChatAssistant 
              user={user ? { uid: user.uid, name: user.name } : null}
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              onToggle={() => setIsChatOpen(!isChatOpen)}
              activeConversationId={activeConversationId}
              onConversationSelect={setActiveConversationId}
          />
          
          <AuthModal 
              isOpen={isAuthModalOpen} 
              onClose={() => setIsAuthModalOpen(false)} 
              onLoginSuccess={(u) => { setUser(u); setIsAuthModalOpen(false); }} 
          />
          
          <CheckoutModal 
            isOpen={isCheckoutModalOpen}
            onClose={() => setIsCheckoutModalOpen(false)}
            cart={cart}
            onCheckoutSubmit={handleCheckout}
            user={user}
            onSaveAddress={handleSaveAddress}
          />
      </div>
  );
};
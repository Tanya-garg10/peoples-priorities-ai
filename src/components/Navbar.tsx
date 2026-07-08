import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  MapPin, 
  PlusCircle, 
  LayoutDashboard, 
  Map, 
  BarChart3, 
  Trophy, 
  MessageSquareCode, 
  ShieldAlert, 
  LogOut, 
  LogIn, 
  Bell, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Languages
} from 'lucide-react';
import { db, collection, query, where, onSnapshot } from '../firebase';
import { AppNotification } from '../types';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode, language, setLanguage }) => {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Fetch alerts/notifications in real-time if logged in
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', user.uid),
      where('read', '==', false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as AppNotification);
      });
      setNotifications(list);
    }, (error) => {
      console.warn("Notifications subscription error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const menuItems = [
    { path: '/dashboard', label: language === 'en' ? 'Dashboard' : 'डैशबोर्ड', icon: LayoutDashboard },
    { path: '/report', label: language === 'en' ? 'Suggest Idea' : 'सुझाव दें', icon: PlusCircle },
    { path: '/map', label: language === 'en' ? 'Interactive Map' : 'नक्शा', icon: Map },
    { path: '/analytics', label: language === 'en' ? 'Analytics' : 'विश्लेषण', icon: BarChart3 },
    { path: '/leaderboard', label: language === 'en' ? 'Leaderboard' : 'लीडरबोर्ड', icon: Trophy },
    { path: '/assistant', label: language === 'en' ? 'AI Assistant' : 'एआई सहायक', icon: MessageSquareCode },
  ];

  if (profile?.role === 'admin') {
    menuItems.push({ path: '/admin', label: language === 'en' ? 'MP Dashboard' : 'सांसद डैशबोर्ड', icon: ShieldAlert });
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="p-2 bg-blue-600 dark:bg-emerald-600 rounded-lg text-white">
                <Building2 className="h-6 w-6 animate-pulse" />
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                People's Priorities AI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {user && menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-emerald-400 font-bold border-b-2 border-blue-500 dark:border-emerald-500'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Utility Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Multilingual Toggle */}
            <button
              onClick={toggleLanguage}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center space-x-1 text-xs font-semibold border border-slate-200 dark:border-slate-800 cursor-pointer"
              title="Change Language"
            >
              <Languages className="h-4 w-4 text-emerald-500" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-500" />}
            </button>

            {/* Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative cursor-pointer"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-2xs font-extrabold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-rose-500 rounded-full">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-3">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {language === 'en' ? 'Alerts & Notifications' : 'अलर्ट और सूचनाएं'}
                      </span>
                      <span className="text-xs text-blue-500">{notifications.length} {language === 'en' ? 'new' : 'नया'}</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-slate-400 text-sm">
                          {language === 'en' ? 'No new updates.' : 'कोई नई सूचना नहीं है।'}
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div key={notif.id} className="px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{notif.title}</h4>
                            <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">{notif.message}</p>
                            <span className="text-3xs text-slate-400 block mt-1">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile / Auth Info */}
            {user && profile ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 dark:border-slate-700">
                <img 
                  src={profile.photoURL} 
                  alt={profile.displayName} 
                  className="h-8 w-8 rounded-full ring-2 ring-blue-500/30 object-cover"
                />
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{profile.displayName}</span>
                  <span className="text-3xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-emerald-400 font-extrabold capitalize w-max mt-0.5">
                    {profile.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-emerald-600 text-white rounded-lg text-sm font-bold hover:shadow-lg transition cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>{language === 'en' ? 'Sign In' : 'लॉग इन'}</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Icon */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={toggleLanguage}
              className="p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center text-xs font-semibold cursor-pointer"
            >
              <Languages className="h-4 w-4 text-emerald-500 mr-1" />
              <span>{language === 'en' ? 'हिन्दी' : 'EN'}</span>
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-500 dark:text-slate-400 rounded-lg cursor-pointer"
            >
              {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-500" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-500 dark:text-slate-400 rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Open */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-4 space-y-2 animate-in slide-in-from-top-5">
          {user ? (
            <>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Icon className="h-5 w-5 text-slate-500" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img src={profile?.photoURL} className="h-9 w-9 rounded-full object-cover" />
                  <div>
                    <div className="text-xs font-bold dark:text-slate-100">{profile?.displayName}</div>
                    <div className="text-3xs text-slate-500 dark:text-slate-400 capitalize">{profile?.role} • Score: {profile?.contributionScore}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-lg text-xs font-extrabold cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold"
            >
              <LogIn className="h-4 w-4" />
              <span>{language === 'en' ? 'Sign In' : 'लॉग इन'}</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

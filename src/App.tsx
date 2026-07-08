import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { DashboardView } from './components/DashboardView';
import { ReportIssueView } from './components/ReportIssueView';
import { IssueDetailsView } from './components/IssueDetailsView';
import { InteractiveMapComponent } from './components/InteractiveMapComponent';
import { AnalyticsView } from './components/AnalyticsView';
import { LeaderboardView } from './components/LeaderboardView';
import { AIAssistantView } from './components/AIAssistantView';
import { AdminPanelView } from './components/AdminPanelView';
import { Clock } from 'lucide-react';

// Protected Route Guard for general registered citizens/officers
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500">
        <Clock className="h-8 w-8 animate-spin text-blue-500 mb-2" />
        <span className="text-xs">Authenticating clearance record...</span>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Protected Route Guard specifically for municipal admin auditors
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500">
        <Clock className="h-8 w-8 animate-spin text-blue-500 mb-2" />
        <span className="text-xs">Retrieving commissioner clearances...</span>
      </div>
    );
  }
  
  if (!user || profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();

  // Load language settings from storage
  const [language, setLanguage] = useState<'en' | 'hi'>(() => {
    return (localStorage.getItem('peoplepriorities_lang') as 'en' | 'hi') || 'en';
  });

  // Load dark mode settings from storage
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('peoplepriorities_theme') === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('peoplepriorities_lang', language);
  }, [language]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('peoplepriorities_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('peoplepriorities_theme', 'light');
    }
  }, [darkMode]);

  // Hide Navbar completely on the Login Page for cleaner visual boundaries
  const showNavbar = location.pathname !== '/login';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {showNavbar && (
        <Navbar 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          language={language} 
          setLanguage={setLanguage} 
        />
      )}
      
      <Routes>
        <Route path="/" element={<LandingPage language={language} />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Dashboard and Citizen routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardView language={language} />
          </ProtectedRoute>
        } />
        
        <Route path="/report" element={
          <ProtectedRoute>
            <ReportIssueView language={language} />
          </ProtectedRoute>
        } />
        
        <Route path="/report/:id" element={
          <ProtectedRoute>
            <IssueDetailsView language={language} />
          </ProtectedRoute>
        } />
        
        <Route path="/map" element={
          <ProtectedRoute>
            <InteractiveMapComponent language={language} />
          </ProtectedRoute>
        } />
        
        <Route path="/analytics" element={
          <ProtectedRoute>
            <AnalyticsView language={language} />
          </ProtectedRoute>
        } />
        
        <Route path="/leaderboard" element={
          <ProtectedRoute>
            <LeaderboardView language={language} />
          </ProtectedRoute>
        } />
        
        <Route path="/assistant" element={
          <ProtectedRoute>
            <AIAssistantView language={language} />
          </ProtectedRoute>
        } />

        {/* Commissioner Admin Desk */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminPanelView language={language} />
          </AdminRoute>
        } />

        {/* Fallback routing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

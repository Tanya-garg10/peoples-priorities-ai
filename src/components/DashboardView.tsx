import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  db, 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from '../firebase';
import { CivicIssueReport, AIRecommendation } from '../types';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  Compass, 
  PlusCircle, 
  Sparkles, 
  UserCheck, 
  TrendingUp, 
  MapPin,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

const MODEL_NAME = "gemini-3.5-flash";

interface DashboardViewProps {
  language: 'en' | 'hi';
}

export const DashboardView: React.FC<DashboardViewProps> = ({ language }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<CivicIssueReport[]>([]);
  const [aiInsights, setAiInsights] = useState<{
    dailySummary: string;
    recommendations: AIRecommendation[];
  }>({
    dailySummary: "Municipal optimization engine loading. Connecting to People's Priorities Analytics Agent...",
    recommendations: []
  });
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  // Seed initial mock reports if firestore database is empty
  const seedReportsIfEmpty = async () => {
    try {
      const q = collection(db, 'reports');
      const snap = await getDocs(q);
      
      if (snap.empty) {
        console.log("Firestore empty. Seeding realistic community reports...");
        
        const initialReports = [
          {
            description: "Huge garbage accumulation blocking the sidewalk near Sector-15 market crossing. Stray dogs are scattering waste across the road, creating a health hazard.",
            category: "Sanitation & Waste",
            latitude: 28.6150,
            longitude: 77.2110,
            address: "Main Market Crossing, Sector 15, New Delhi",
            date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
            createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
            reporterId: "seed_user_1",
            reporterName: "Rajiv Sharma",
            reporterPhoto: "https://api.dicebear.com/7.x/adventurer/svg?seed=Rajiv",
            status: "assigned",
            department: "Sanitation & Waste",
            priority: "high",
            severity: "8",
            aiAnalysis: {
              issueType: "Garbage Pile Overflow",
              severity: "8",
              priority: "high",
              department: "Sanitation & Waste",
              estimatedDays: 2,
              reasoning: "Visual analysis shows massive heap blocking sidewalk. Risk of infectious disease spread and traffic diversion.",
              confidence: 0.94
            },
            votesCount: 15,
            upvotes: 12,
            downvotes: 3,
            verificationCount: 8,
            rejectionsCount: 0,
            verificationStatus: "verified",
            ward: "Ward-4",
            timeline: [
              { id: '1', status: 'pending', title: 'Issue Reported', description: 'Citizen Rajiv Sharma logged the complaint.', date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), updatedBy: 'Rajiv Sharma' },
              { id: '2', status: 'verified', title: 'Community Verified', description: 'Issue confirmed by 8 nearby neighbors.', date: new Date(Date.now() - 1.8 * 24 * 3600 * 1000).toISOString(), updatedBy: "People's Priorities Community" },
              { id: '3', status: 'assigned', title: 'Department Assigned', description: 'Assigned to Sanitation & Waste crew #4.', date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), updatedBy: 'Planning Agent' }
            ],
            duplicatesMerged: []
          },
          {
            description: "Dangerous pothole right in the middle of the bus transit lane. Multiple bikes have swerved violently to avoid it.",
            category: "Broken Road",
            latitude: 28.6220,
            longitude: 77.2030,
            address: "Outer Circle, Connaught Place, New Delhi",
            date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
            createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
            reporterId: "seed_user_2",
            reporterName: "Aarti Mehra",
            reporterPhoto: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aarti",
            status: "pending",
            department: "Public Works Dept",
            priority: "critical",
            severity: "9",
            aiAnalysis: {
              issueType: "Deep Pothole",
              severity: "9",
              priority: "critical",
              department: "Public Works Dept",
              estimatedDays: 1,
              reasoning: "Deep depression located on heavy-traffic lane. Highly hazardous for two-wheelers, risk of fatal crash.",
              confidence: 0.98
            },
            votesCount: 22,
            upvotes: 21,
            downvotes: 1,
            verificationCount: 12,
            rejectionsCount: 0,
            verificationStatus: "verified",
            ward: "Ward-1",
            timeline: [
              { id: '1', status: 'pending', title: 'Critical Incident Reported', description: 'Flagged with high priority by Aarti Mehra.', date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), updatedBy: 'Aarti Mehra' }
            ],
            duplicatesMerged: []
          },
          {
            description: "Major water pipeline leakage, flooding the main residential road of Block C. Hundreds of gallons of clean drinking water wasting.",
            category: "Water Leakage",
            latitude: 28.6080,
            longitude: 77.2250,
            address: "Block C, Lodhi Colony, New Delhi",
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            reporterId: "seed_user_3",
            reporterName: "Vikram Sen",
            reporterPhoto: "https://api.dicebear.com/7.x/adventurer/svg?seed=Vikram",
            status: "pending",
            department: "Water & Sewage",
            priority: "medium",
            severity: "6",
            aiAnalysis: {
              issueType: "Main Pipeline Burst",
              severity: "6",
              priority: "medium",
              department: "Water & Sewage",
              estimatedDays: 3,
              reasoning: "Substantial freshwater wastage. Minor road logging, does not immediately block emergency vehicles.",
              confidence: 0.91
            },
            votesCount: 8,
            upvotes: 8,
            downvotes: 0,
            verificationCount: 3,
            rejectionsCount: 0,
            verificationStatus: "unverified",
            ward: "Ward-3",
            timeline: [
              { id: '1', status: 'pending', title: 'Water Leak Logged', description: 'Complaint lodged by citizen Vikram Sen.', date: new Date().toISOString(), updatedBy: 'Vikram Sen' }
            ],
            duplicatesMerged: []
          },
          {
            description: "Streetlights are completely out for the past 4 days. Entire alley is dark at night, making residents feel unsafe.",
            category: "Damaged Streetlight",
            latitude: 28.6180,
            longitude: 77.1890,
            address: "Alley 12, Karol Bagh, New Delhi",
            date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
            createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
            reporterId: "seed_user_4",
            reporterName: "Pooja Gupta",
            reporterPhoto: "https://api.dicebear.com/7.x/adventurer/svg?seed=Pooja",
            status: "resolved",
            department: "Electricity Board",
            priority: "medium",
            severity: "7",
            aiAnalysis: {
              issueType: "Streetlight outage",
              severity: "7",
              priority: "medium",
              department: "Electricity Board",
              estimatedDays: 4,
              reasoning: "Dark street raises safety threats for pedestrians. Local crime risk is evaluated as medium.",
              confidence: 0.89
            },
            votesCount: 11,
            upvotes: 10,
            downvotes: 1,
            verificationCount: 6,
            rejectionsCount: 0,
            verificationStatus: "verified",
            ward: "Ward-5",
            timeline: [
              { id: '1', status: 'pending', title: 'Issue Created', description: 'Log made by Pooja Gupta.', date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), updatedBy: 'Pooja Gupta' },
              { id: '2', status: 'verified', title: 'Verified by Ward Residents', description: '6 neighbors voted affirmative.', date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), updatedBy: 'Community' },
              { id: '3', status: 'assigned', title: 'Assigned to Electric Dept', description: 'Work order #92 dispatched.', date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), updatedBy: 'Admin' },
              { id: '4', status: 'resolved', title: 'Lights Repaired & Resolved', description: 'Wiring harness fixed and lights tested.', date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), updatedBy: 'Electric Inspector' }
            ],
            duplicatesMerged: []
          }
        ];

        for (const rep of initialReports) {
          await addDoc(collection(db, 'reports'), rep);
        }
      }
    } catch (e) {
      console.warn("Seeding failed or database unavailable", e);
    }
  };

  // Subscribe to real-time reports from Firestore
  useEffect(() => {
    const initData = async () => {
      await seedReportsIfEmpty();
      
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: CivicIssueReport[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as CivicIssueReport);
        });
        setReports(list);
        setLoading(false);
      }, (error) => {
        console.error("Firestore reports subscription error:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    };

    initData();
  }, []);

  // Run AI Analytics Agent to generate real-time dispatch dashboard summary
  const generateAIAnalytics = async () => {
    if (reports.length === 0) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports })
      });
      const data = await res.json();
      if (data.success && data.analytics) {
        setAiInsights({
          dailySummary: data.analytics.dailySummary,
          recommendations: data.analytics.recommendations
        });
      }
    } catch (err) {
      console.error("AI Insights Error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (reports.length > 0 && aiInsights.recommendations.length === 0) {
      generateAIAnalytics();
    }
  }, [reports]);

  // Statistics calculations
  const totalCount = reports.length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;
  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const criticalCount = reports.filter(r => r.priority === 'critical' && r.status !== 'resolved').length;
  const verifiedCount = reports.filter(r => r.verificationStatus === 'verified').length;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-300 text-slate-800 dark:text-slate-100">
      
      {/* Header Greeting */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {language === 'en' ? "Civic Dashboard" : "नागरिक डैशबोर्ड"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'en' 
              ? `Welcome back, ${profile?.displayName || 'Citizen'}. Showing community issues for Ward-1 to Ward-5.`
              : `स्वागत है, ${profile?.displayName || 'नागरिक'}। वार्ड-1 से वार्ड-5 के लिए रिपोर्ट दिखाई जा रही हैं।`}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={generateAIAnalytics}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            title="Recalculate AI Dispatch recommendations"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
            <span>{language === 'en' ? 'Refresh Dispatch' : 'रीफ़्रेश करें'}</span>
          </button>
          <Link
            to="/report"
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm hover:shadow-lg hover:shadow-blue-500/10 transition cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{language === 'en' ? 'New Report' : 'नया रिपोर्ट'}</span>
          </Link>
        </div>
      </div>

      {loading ? (
        // Loading skeletons for Dashboard
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 animate-pulse" />
            <div className="h-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Dashboard Summary Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Total Issues */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {language === 'en' ? 'Total Reported' : 'कुल शिकायतें'}
                </span>
                <span className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Compass className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black leading-none">{totalCount}</span>
                <span className="text-4xs text-emerald-500 font-bold block mt-1">↑ 100% active</span>
              </div>
            </div>

            {/* Resolved Issues */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {language === 'en' ? 'Resolved Issues' : 'सुलझाए गए'}
                </span>
                <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black leading-none">{resolvedCount}</span>
                <span className="text-4xs text-emerald-500 font-bold block mt-1">
                  {totalCount > 0 ? `${Math.round((resolvedCount/totalCount)*100)}% solve rate` : '0% solve rate'}
                </span>
              </div>
            </div>

            {/* Pending Issues */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {language === 'en' ? 'Pending Action' : 'लंबित कार्रवाई'}
                </span>
                <span className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black leading-none">{pendingCount}</span>
                <span className="text-4xs text-slate-400 font-bold block mt-1">Awaiting dispatch</span>
              </div>
            </div>

            {/* Critical Issues */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {language === 'en' ? 'Critical Hazard' : 'अति गंभीर'}
                </span>
                <span className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg">
                  <ShieldAlert className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black leading-none text-rose-600 dark:text-rose-500">{criticalCount}</span>
                <span className="text-4xs text-rose-500 font-bold block mt-1">Requires dispatch</span>
              </div>
            </div>

            {/* Verification Score */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between col-span-2 lg:col-span-1">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {language === 'en' ? 'Community Score' : 'समुदाय स्कोर'}
                </span>
                <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <UserCheck className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline space-x-1.5">
                <span className="text-3xl font-black leading-none">{verifiedCount * 15 + resolvedCount * 25 + 120}</span>
                <span className="text-4xs text-indigo-500 font-bold block mt-1">Excellent trust</span>
              </div>
            </div>

          </div>

          {/* Central Grid Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Recent Activity Feed */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-extrabold tracking-tight">
                  {language === 'en' ? 'Recent Civic Activity' : 'हालिया नागरिक गतिविधियाँ'}
                </h2>
                <Link to="/map" className="text-xs font-bold text-blue-600 dark:text-emerald-400 flex items-center hover:underline cursor-pointer">
                  <span>{language === 'en' ? 'View Map' : 'नक्शा देखें'}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[450px] pr-2">
                {reports.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-sm">
                    {language === 'en' ? 'No recent reports. Be the first to report!' : 'कोई हालिया रिपोर्ट नहीं। पहले रिपोर्टर बनें!'}
                  </div>
                ) : (
                  reports.map((report, idx) => (
                    <div 
                      key={report.id || idx}
                      onClick={() => navigate(`/report/${report.id}`)}
                      className="group p-4 bg-slate-50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800/70 hover:border-slate-200 rounded-2xl cursor-pointer transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="flex items-start space-x-3">
                        {report.imageUrl ? (
                          <img 
                            src={report.imageUrl} 
                            alt={report.category} 
                            className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-blue-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs shrink-0 uppercase">
                            {report.category.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{report.category}</span>
                            <span className={`text-3xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              report.priority === 'critical' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400' :
                              report.priority === 'high' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' :
                              'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                            }`}>
                              {report.priority}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 max-w-md">
                            {report.description}
                          </p>
                          <div className="flex items-center space-x-2 text-3xs text-slate-400 mt-2">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span>{report.ward} • {report.address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Status and Voting metrics */}
                      <div className="flex sm:flex-col items-end gap-2 shrink-0">
                        <span className={`text-3xs px-2.5 py-1 rounded-lg font-black uppercase tracking-wider text-center ${
                          report.status === 'resolved' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' :
                          report.status === 'assigned' ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400' :
                          report.status === 'verified' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' :
                          'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                        }`}>
                          {report.status}
                        </span>
                        <div className="flex items-center space-x-1.5 text-3xs font-extrabold text-slate-400">
                          <span>👍 {report.upvotes}</span>
                          <span>•</span>
                          <span>🔍 Verified x{report.verificationCount}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: AI Insights and Resource Dispatch recommendations */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col justify-between">
              <div>
                {/* Insights Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <Sparkles className="h-4 w-4 text-emerald-400 animate-spin" />
                    </div>
                    <span className="text-sm font-extrabold uppercase tracking-widest text-slate-200">
                      People's Priorities AI Insights
                    </span>
                  </div>
                  <span className="text-3xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-black uppercase tracking-wider">
                    Live Agent
                  </span>
                </div>

                {/* AI Executive Summary */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {language === 'en' ? "Daily State Dispatch" : "दैनिक स्थिति प्रेषण"}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {aiInsights.dailySummary}
                  </p>
                </div>

                {/* Auto Planning Resource Allocations */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    {language === 'en' ? "Autonomous Dispatch Plans" : "स्वायत्त प्रेषण योजनाएं"}
                  </h3>
                  
                  {aiLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((idx) => (
                        <div key={idx} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : aiInsights.recommendations.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      Calculating dispatch plans...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {aiInsights.recommendations.map((rec, idx) => (
                        <div key={rec.id || idx} className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-start space-x-2.5">
                          <div className={`p-1 rounded-lg text-xs mt-0.5 shrink-0 ${
                            rec.priority === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-100 leading-snug">{rec.title}</h4>
                            <p className="text-4xs text-slate-400 mt-0.5 line-clamp-1">{rec.description}</p>
                            <div className="flex items-center space-x-2 mt-1.5 text-4xs">
                              <span className="px-1.5 py-0.5 bg-slate-700/60 rounded text-slate-300 capitalize font-extrabold">{rec.department}</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-emerald-400 font-extrabold capitalize">{rec.priority} dispatch</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bot Info Footer */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-4xs text-slate-500">
                <span>Model: {MODEL_NAME}</span>
                <span>Optimized Resource Routes</span>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

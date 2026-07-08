import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, collection, getDocs } from '../firebase';
import { CivicIssueReport, IssueStatus, IssuePriority } from '../types';
import { 
  MapPin, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  Layers, 
  Building2,
  ListFilter,
  Info
} from 'lucide-react';

interface InteractiveMapComponentProps {
  language: 'en' | 'hi';
}

export const InteractiveMapComponent: React.FC<InteractiveMapComponentProps> = ({ language }) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<CivicIssueReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<CivicIssueReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [priority, setPriority] = useState('All');
  const [status, setStatus] = useState('All');
  const [ward, setWard] = useState('All');

  // Selected marker details
  const [selectedReport, setSelectedReport] = useState<CivicIssueReport | null>(null);

  // Fetch reports from firestore
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const snap = await getDocs(collection(db, 'reports'));
        const list: CivicIssueReport[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as CivicIssueReport);
        });
        setReports(list);
        setFilteredReports(list);
      } catch (e) {
        console.error("Failed to load map reports:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Handle Filters application
  useEffect(() => {
    let result = [...reports];

    // Search filter
    if (search.trim()) {
      result = result.filter(r => 
        r.description.toLowerCase().includes(search.toLowerCase()) || 
        r.address.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Category Filter
    if (category !== 'All') {
      result = result.filter(r => r.category === category);
    }

    // Priority Filter
    if (priority !== 'All') {
      result = result.filter(r => r.priority === priority);
    }

    // Status Filter
    if (status !== 'All') {
      result = result.filter(r => r.status === status);
    }

    // Ward Filter
    if (ward !== 'All') {
      result = result.filter(r => r.ward === ward);
    }

    setFilteredReports(result);
    
    // Auto-select first filtered report if previous selection not in list
    if (result.length > 0) {
      if (!selectedReport || !result.find(r => r.id === selectedReport.id)) {
        setSelectedReport(result[0]);
      }
    } else {
      setSelectedReport(null);
    }

  }, [search, category, priority, status, ward, reports]);

  const getMarkerColor = (report: CivicIssueReport) => {
    if (report.status === 'resolved') return 'bg-emerald-500 ring-emerald-300';
    if (report.priority === 'critical') return 'bg-rose-600 ring-rose-300';
    if (report.priority === 'high') return 'bg-amber-500 ring-amber-300';
    return 'bg-blue-500 ring-blue-300'; // Medium / Low / Pending
  };

  const getMarkerTextColor = (report: CivicIssueReport) => {
    if (report.status === 'resolved') return 'text-emerald-500 border-emerald-500';
    if (report.priority === 'critical') return 'text-rose-600 border-rose-600';
    if (report.priority === 'high') return 'text-amber-500 border-amber-500';
    return 'text-blue-500 border-blue-500';
  };

  const getPriorityBadgeClass = (priority: IssuePriority) => {
    switch (priority) {
      case 'critical':
        return 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
      case 'high':
        return 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'medium':
        return 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
    }
  };

  const getStatusBadgeClass = (status: IssueStatus) => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'assigned':
        return 'bg-violet-50 text-violet-600 border border-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20';
      case 'rejected':
        return 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
      default: // pending or verified
        return 'bg-sky-50 text-sky-600 border border-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20';
    }
  };

  const categories = [
    'All',
    'Pothole',
    'Garbage',
    'Streetlight',
    'Water Leakage',
    'Broken Road',
    'Illegal Dumping',
    'Construction Damage',
    'Sanitation & Waste',
    'Public Hazard'
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-300 text-slate-800 dark:text-slate-100">
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Title and stats bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'en' ? 'Interactive Spatial Ward Map' : 'इंटरएक्टिव स्थानीय वार्ड मानचित्र'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Showing coordinates of community infrastructure issues. Click a marker to inspect ward diagnostics.
            </p>
          </div>
          <div className="flex items-center space-x-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-bold">
            <span className="flex items-center space-x-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-600" /> <span>Critical</span></span>
            <span className="flex items-center space-x-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> <span>High Priority</span></span>
            <span className="flex items-center space-x-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> <span>Medium</span></span>
            <span className="flex items-center space-x-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> <span>Resolved</span></span>
          </div>
        </div>

        {/* Filters Panel bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center">
          
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search address or description..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
            >
              {categories.map(c => (
                <option key={c} value={c}>Category: {c}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
          >
            <option value="All">Priority: All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
          >
            <option value="All">Status: All</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Ward Filter */}
          <select
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold animate-pulse"
          >
            <option value="All">Ward: All Wards</option>
            <option value="Ward-1">Ward-1</option>
            <option value="Ward-2">Ward-2</option>
            <option value="Ward-3">Ward-3</option>
            <option value="Ward-4">Ward-4</option>
            <option value="Ward-5">Ward-5</option>
          </select>

        </div>

        {/* Dual Panels: Left Map, Right Panel details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Spatial Grid Map panel */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl h-[500px] shadow-sm relative overflow-hidden">
            
            {/* Grid street layout mockup background */}
            <div className="absolute inset-0 bg-slate-100 dark:bg-slate-950 p-4 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="w-full border-t border-slate-300 dark:border-slate-800" />
              <div className="w-full border-t border-slate-300 dark:border-slate-800" />
              <div className="w-full border-t border-slate-300 dark:border-slate-800" />
              <div className="w-full border-t border-slate-300 dark:border-slate-800" />
            </div>
            
            {/* Real coordinates mapping to screen scale coordinates */}
            {filteredReports.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
                <Info className="h-8 w-8 text-slate-400 mb-2" />
                <h3 className="text-sm font-bold">No issues match current filters</h3>
                <p className="text-xs text-slate-400 mt-1">Try relaxing filters to see neighborhood issues.</p>
              </div>
            ) : (
              <div className="absolute inset-0 p-8">
                {filteredReports.map((report) => {
                  // Project coordinate scale into a neat percentage coordinate space
                  // Delhi latitudes roughly: 28.60 to 28.63 -> map to percentage 10% to 90%
                  // Delhi longitudes roughly: 77.18 to 77.23 -> map to percentage 10% to 90%
                  const latPercent = 90 - ((report.latitude - 28.60) / (28.63 - 28.60)) * 80;
                  const lngPercent = ((report.longitude - 77.18) / (77.23 - 77.18)) * 80;
                  
                  // clamp values just in case
                  const top = Math.max(5, Math.min(95, latPercent));
                  const left = Math.max(5, Math.min(95, lngPercent));

                  const isSelected = selectedReport?.id === report.id;

                  return (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="absolute group z-20 hover:z-40 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition duration-200 animate-fade-in"
                      style={{ top: `${top}%`, left: `${left}%` }}
                    >
                      {/* Pulsing visual halo */}
                      <span className={`absolute inline-flex h-8 w-8 rounded-full opacity-40 animate-ping -left-2 -top-2 ${
                        report.status === 'resolved' ? 'bg-emerald-400' :
                        report.priority === 'critical' ? 'bg-rose-400' :
                        report.priority === 'high' ? 'bg-amber-400' :
                        'bg-blue-400'
                      }`} />

                      <div className={`h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 shadow-md transition-all ${getMarkerColor(report)} ${
                        isSelected ? 'scale-150 ring-4 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-125'
                      }`} />

                      {/* Premium Preview Card on hover */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 mb-2 w-60 sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 origin-bottom z-50 text-left">
                        {report.imageUrl && (
                          <div className="relative h-20 w-full mb-2 rounded-lg overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800">
                            <img 
                              src={report.imageUrl} 
                              alt={report.category} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-end p-1.5">
                              <span className="text-4xs text-white font-semibold bg-slate-900/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                                {report.ward}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-4xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              {report.category}
                            </span>
                            <span className={`text-5xs font-black px-1.5 py-0.5 rounded-full capitalize ${getStatusBadgeClass(report.status)}`}>
                              {report.status}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                              {report.aiAnalysis?.issueType || report.category}
                            </h4>
                            <p className="text-5xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-normal">
                              {report.description}
                            </p>
                          </div>

                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-5xs">
                            <span className="flex items-center text-slate-400 dark:text-slate-500 max-w-[120px]">
                              <MapPin className="h-2.5 w-2.5 mr-0.5 flex-shrink-0 text-slate-400" />
                              <span className="truncate">{report.address}</span>
                            </span>
                            <span className={`font-extrabold px-1.5 py-0.5 rounded capitalize ${getPriorityBadgeClass(report.priority)}`}>
                              {report.priority}
                            </span>
                          </div>
                        </div>

                        {/* Little physical triangle indicator arrow at bottom */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-white dark:border-t-slate-900" />
                      </div>
                    </button>
                  );
                })}

                {/* Grid map markers watermark */}
                <div className="absolute bottom-4 left-4 bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 border border-slate-200 dark:border-slate-800 rounded text-5xs font-mono text-slate-500 z-10 uppercase">
                  Spatial Coordinate Scale: Sector-15 NCR Grid
                </div>
              </div>
            )}

            {/* Simulated Street overlay */}
            <svg className="absolute inset-0 h-full w-full pointer-events-none opacity-10 dark:opacity-20" xmlns="http://www.w3.org/2000/svg">
              <line x1="10%" y1="0" x2="10%" y2="100%" stroke="currentColor" strokeWidth="4" />
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" strokeWidth="8" />
              <line x1="85%" y1="0" x2="85%" y2="100%" stroke="currentColor" strokeWidth="4" />
              <line x1="0" y1="20%" x2="100%" y2="20%" stroke="currentColor" strokeWidth="6" />
              <line x1="0" y1="70%" x2="100%" y2="70%" stroke="currentColor" strokeWidth="10" />
            </svg>

          </div>

          {/* Right Detail Inspect panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm h-[500px] flex flex-col justify-between">
            {selectedReport ? (
              <div className="flex flex-col h-full justify-between">
                
                <div className="space-y-4">
                  
                  {/* Selected report image preview */}
                  {selectedReport.imageUrl ? (
                    <img 
                      src={selectedReport.imageUrl} 
                      alt={selectedReport.category} 
                      className="w-full h-36 object-cover rounded-2xl ring-1 ring-slate-150"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-36 bg-slate-50 rounded-2xl border flex items-center justify-center text-slate-400 text-xs">
                      No Image attached.
                    </div>
                  )}

                  <div>
                    <div className="flex gap-2">
                      <span className="text-3xs font-extrabold text-blue-600 dark:text-blue-400 capitalize bg-blue-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {selectedReport.category}
                      </span>
                      <span className={`text-3xs font-extrabold px-2 py-0.5 rounded capitalize ${
                        selectedReport.priority === 'critical' ? 'bg-rose-50 text-rose-600' :
                        selectedReport.priority === 'high' ? 'bg-amber-50 text-amber-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {selectedReport.priority}
                      </span>
                    </div>

                    <h3 className="text-base font-black mt-2">
                      {selectedReport.aiAnalysis?.issueType || selectedReport.category}
                    </h3>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">
                      {selectedReport.description}
                    </p>
                  </div>

                  {/* Ward details */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-2xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Location Ward</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-200">{selectedReport.ward}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Assigned Crew</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-200">{selectedReport.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Trust validation</span>
                      <span className="font-extrabold text-emerald-500">{selectedReport.verificationCount} confirms</span>
                    </div>
                  </div>

                </div>

                <button
                  onClick={() => navigate(`/report/${selectedReport.id}`)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer mt-4"
                >
                  <span>Inspect Case Diagnostics</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                <Layers className="h-10 w-10 mb-2 animate-bounce" />
                <h3 className="text-xs font-bold">No issue highlighted</h3>
                <p className="text-4xs mt-1">Tap any pin on the map to inspect live municipal records.</p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { db, collection, getDoc, getDocs, updateDoc, doc, addDoc } from '../firebase';
import { CivicIssueReport, IssueStatus, IssuePriority } from '../types';
import { 
  ShieldCheck, 
  Download, 
  Trash2, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  Settings,
  XCircle,
  Building2,
  FileSpreadsheet
} from 'lucide-react';

interface AdminPanelViewProps {
  language: 'en' | 'hi';
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({ language }) => {
  const [reports, setReports] = useState<CivicIssueReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<CivicIssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const departments = [
    'Public Works Dept',
    'Sanitation & Waste',
    'Water & Sewage',
    'Electricity Board',
    'Traffic Police'
  ];

  const statuses: IssueStatus[] = ['pending', 'verified', 'assigned', 'resolved', 'rejected'];

  const fetchReports = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'reports'));
      const list: CivicIssueReport[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as CivicIssueReport);
      });
      setReports(list);
      setFilteredReports(list);
    } catch (e) {
      console.error("Failed to load admin reports:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    let list = [...reports];
    if (statusFilter !== 'All') {
      list = list.filter(r => r.status === statusFilter);
    }
    if (categoryFilter !== 'All') {
      list = list.filter(r => r.category === categoryFilter);
    }
    setFilteredReports(list);
  }, [statusFilter, categoryFilter, reports]);

  // Handle status update
  const handleUpdateStatus = async (reportId: string, reporterId: string, category: string, newStatus: IssueStatus) => {
    setActionLoading(true);
    try {
      const docRef = doc(db, 'reports', reportId);
      const reportDoc = await getDoc(docRef);
      if (!reportDoc.exists()) return;
      const data = reportDoc.data() as CivicIssueReport;
      const timeline = [...data.timeline];

      timeline.push({
        id: `timeline_${Date.now()}`,
        status: newStatus,
        title: `Status set to: ${newStatus.toUpperCase()}`,
        description: `Administrative re-assignment to state: ${newStatus}.`,
        date: new Date().toISOString(),
        updatedBy: 'Admin Commissioner'
      });

      await updateDoc(docRef, { status: newStatus, timeline });
      
      // Send real-time notification alert to the reporter
      await addDoc(collection(db, 'notifications'), {
        userId: reporterId,
        title: `Report Status updated: ${newStatus.toUpperCase()}`,
        message: `Your reported ${category} complaint status has been set to: "${newStatus}" by the municipal desk.`,
        read: false,
        createdAt: new Date().toISOString()
      });

      await fetchReports();
    } catch (e) {
      console.error("Failed to update status:", e);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle department update
  const handleUpdateDepartment = async (reportId: string, newDept: string) => {
    setActionLoading(true);
    try {
      const docRef = doc(db, 'reports', reportId);
      const reportDoc = await getDoc(docRef);
      if (!reportDoc.exists()) return;
      const data = reportDoc.data() as CivicIssueReport;
      const timeline = [...data.timeline];

      timeline.push({
        id: `timeline_${Date.now()}`,
        status: data.status,
        title: `Department changed to: ${newDept}`,
        description: `Dispatch crew reallocated to: ${newDept}.`,
        date: new Date().toISOString(),
        updatedBy: 'Admin Commissioner'
      });

      await updateDoc(docRef, { department: newDept, timeline });
      await fetchReports();
    } catch (e) {
      console.error("Failed to update department:", e);
    } finally {
      setActionLoading(false);
    }
  };

  // Export Reports compiled as a downloadable CSV!
  const handleExportCSV = () => {
    if (reports.length === 0) return;

    // Build columns
    const headers = ["ID", "Category", "Ward", "Status", "Priority", "Department", "Severity", "Reporter Name", "Latitude", "Longitude", "Created At"];
    const rows = reports.map(r => [
      r.id,
      `"${r.category}"`,
      r.ward,
      r.status,
      r.priority,
      `"${r.department}"`,
      r.severity,
      `"${r.reporterName}"`,
      r.latitude,
      r.longitude,
      r.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Peoples_Priorities_AI_Municipal_Dispatches_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-300 text-slate-800 dark:text-slate-100">
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Title greeting bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/65 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600 rounded-xl text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black">
                {language === 'en' ? "Municipal Administrator Console" : "नगरपालिका प्रशासनिक कंसोल"}
              </h1>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage citizen filings, verify automated AI priority assignments, and dispatch municipal utility departments.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>{language === 'en' ? "Export Dispatches CSV" : "डिस्पैच सीएसवी डाउनलोड करें"}</span>
            </button>
            <button
              onClick={fetchReports}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-200 cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter bars */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-1 text-xs font-bold">
            <Filter className="h-4 w-4 text-slate-400" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
          >
            <option value="All">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="assigned">Assigned</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
          >
            <option value="All">All Categories</option>
            <option value="Sanitation & Waste">Sanitation & Waste</option>
            <option value="Broken Road">Broken Road</option>
            <option value="Water Leakage">Water Leakage</option>
            <option value="Streetlight">Streetlight</option>
          </select>
        </div>

        {/* Admin Data Grid table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              
              <thead className="bg-slate-50 dark:bg-slate-800/50 uppercase text-slate-400 font-extrabold tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Complaint Category</th>
                  <th className="px-6 py-4">Ward</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Assign Department</th>
                  <th className="px-6 py-4">Status Controller</th>
                  <th className="px-6 py-4">Verification</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      Loading data pipeline...
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No citizen reports available.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      
                      {/* Category and details link */}
                      <td className="px-6 py-4 flex items-center space-x-3">
                        <div className="shrink-0 h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 font-black">
                          {report.category.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-800 dark:text-slate-100 block">{report.category}</span>
                          <span className="text-4xs text-slate-400 block line-clamp-1 max-w-xs">{report.description}</span>
                        </div>
                      </td>

                      {/* Ward */}
                      <td className="px-6 py-4 font-bold">
                        {report.ward}
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4">
                        <span className={`text-4xs px-2 py-0.5 font-black rounded uppercase tracking-wider ${
                          report.priority === 'critical' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700' :
                          report.priority === 'high' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700' :
                          'bg-blue-100 dark:bg-blue-950/40 text-blue-700'
                        }`}>
                          {report.priority}
                        </span>
                      </td>

                      {/* Assign Department dropdown */}
                      <td className="px-6 py-4">
                        <select
                          value={report.department}
                          onChange={(e) => handleUpdateDepartment(report.id, e.target.value)}
                          disabled={actionLoading}
                          className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-3xs font-extrabold"
                        >
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </td>

                      {/* Change Status dropdown */}
                      <td className="px-6 py-4">
                        <select
                          value={report.status}
                          onChange={(e) => handleUpdateStatus(report.id, report.reporterId, report.category, e.target.value as IssueStatus)}
                          disabled={actionLoading}
                          className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-3xs font-extrabold capitalize"
                        >
                          {statuses.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </td>

                      {/* Community verification validations */}
                      <td className="px-6 py-4 text-slate-400 font-bold">
                        👍 {report.verificationCount} confirms / {report.rejectionsCount} flags
                      </td>

                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>

        </div>

      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  db, 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from '../firebase';
import { CivicIssueReport, Comment, TimelineEvent, IssueStatus, IssuePriority } from '../types';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ArrowLeft, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  ShieldCheck, 
  PlusCircle, 
  MapPin, 
  Calendar, 
  Building2, 
  XCircle,
  Camera,
  Trash2
} from 'lucide-react';

interface IssueDetailsViewProps {
  language: 'en' | 'hi';
}

export const IssueDetailsView: React.FC<IssueDetailsViewProps> = ({ language }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, updateProfileScore } = useAuth();

  const [report, setReport] = useState<CivicIssueReport | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch report details and comments in real-time
  useEffect(() => {
    if (!id) return;

    // Report document listener
    const docRef = doc(db, 'reports', id);
    const unsubscribeReport = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setReport({ id: docSnap.id, ...docSnap.data() } as CivicIssueReport);
      } else {
        setReport(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error subscribing to report:", error);
      setLoading(false);
    });

    // Comments query list listener
    const commentsQuery = query(
      collection(db, 'comments'),
      where('reportId', '==', id),
      orderBy('createdAt', 'asc')
    );
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const list: Comment[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(list);
    }, (err) => {
      console.warn("Comments subscription failed:", err);
    });

    return () => {
      unsubscribeReport();
      unsubscribeComments();
    };
  }, [id]);

  // Handle Upvotes / Downvotes
  const handleVote = async (type: 'upvote' | 'downvote') => {
    if (!report || !id) return;
    try {
      const docRef = doc(db, 'reports', id);
      if (type === 'upvote') {
        const votes = report.upvotes + 1;
        await updateDoc(docRef, { 
          upvotes: votes, 
          votesCount: votes + report.downvotes 
        });
        await updateProfileScore(5, 'Support Voter');
      } else {
        const votes = report.downvotes + 1;
        await updateDoc(docRef, { 
          downvotes: votes, 
          votesCount: report.upvotes + votes 
        });
      }
    } catch (e) {
      console.error("Vote failed:", e);
    }
  };

  // Handle Community Verification (Confirm / Reject)
  const handleVerification = async (type: 'confirm' | 'reject') => {
    if (!report || !id) return;
    setActionLoading(true);
    try {
      const docRef = doc(db, 'reports', id);
      const timeline = [...report.timeline];
      
      let updatedCount = 0;
      let updatedStatus: IssueStatus = report.status;
      
      if (type === 'confirm') {
        updatedCount = report.verificationCount + 1;
        
        // Auto-Verify when confirmations reach 3
        if (updatedCount >= 3 && report.status === 'pending') {
          updatedStatus = 'verified';
          timeline.push({
            id: `timeline_${Date.now()}`,
            status: 'verified',
            title: 'Verified by Community',
            description: `Auto-verified after receiving ${updatedCount} neighborhood confirmations.`,
            date: new Date().toISOString(),
            updatedBy: "People's Priorities AI Agent"
          });

          // Send global alert to user
          await addDoc(collection(db, 'notifications'), {
            userId: report.reporterId,
            title: "Report Verified! 🔍",
            message: `Your ${report.category} issue has been verified by the community and is queued for action.`,
            read: false,
            createdAt: new Date().toISOString()
          });
        }

        await updateDoc(docRef, { 
          verificationCount: updatedCount,
          status: updatedStatus,
          timeline,
          verificationStatus: updatedCount >= 3 ? 'verified' : 'unverified'
        });
        await updateProfileScore(10, 'Neighborhood Verifier');

      } else {
        const rejections = report.rejectionsCount + 1;
        
        if (rejections >= 3 && report.status === 'pending') {
          updatedStatus = 'rejected';
          timeline.push({
            id: `timeline_${Date.now()}`,
            status: 'rejected',
            title: 'Rejected as False / Spam',
            description: `Flagged as fake/duplicate after receiving ${rejections} neighbor rejections.`,
            date: new Date().toISOString(),
            updatedBy: "People's Priorities AI Agent"
          });
        }

        await updateDoc(docRef, { 
          rejectionsCount: rejections,
          status: updatedStatus,
          timeline,
          verificationStatus: rejections >= 3 ? 'disputed' : 'unverified'
        });
      }
    } catch (e) {
      console.error("Verification failed:", e);
    } finally {
      setActionLoading(false);
    }
  };

  // Add Comment (Support optional compressed base64 upload proof too!)
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && !commentImage) return;

    try {
      const commentData = {
        reportId: id,
        userId: user?.uid || 'guest_user',
        userName: profile?.displayName || 'Citizen',
        userPhoto: profile?.photoURL || 'https://api.dicebear.com/7.x/adventurer/svg?seed=guest',
        content: newComment,
        imageUrl: commentImage || null,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'comments'), commentData);
      setNewComment('');
      setCommentImage(null);
      await updateProfileScore(5, 'Civic Engager');
    } catch (e) {
      console.error("Failed to add comment:", e);
    }
  };

  // Image upload in comments (compressed)
  const handleCommentPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setCommentImage(canvas.toDataURL('image/jpeg', 0.6));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Administrative actions (Assign department, change status, etc.)
  const handleAdminAction = async (newStatus: IssueStatus, commentLog: string) => {
    if (!report || !id || profile?.role !== 'admin') return;
    setActionLoading(true);
    try {
      const docRef = doc(db, 'reports', id);
      const timeline = [...report.timeline];
      
      timeline.push({
        id: `timeline_${Date.now()}`,
        status: newStatus,
        title: `Status updated to: ${newStatus.toUpperCase()}`,
        description: commentLog,
        date: new Date().toISOString(),
        updatedBy: profile.displayName
      });

      await updateDoc(docRef, {
        status: newStatus,
        timeline
      });

      // Send alert notify to citizen
      await addDoc(collection(db, 'notifications'), {
        userId: report.reporterId,
        title: `Issue status updated: ${newStatus.toUpperCase()}`,
        message: `Your reported ${report.category} issue has been updated: "${commentLog}"`,
        read: false,
        createdAt: new Date().toISOString()
      });
      
    } catch (e) {
      console.error("Admin action failed:", e);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <Clock className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-2" />
        <span className="text-sm text-slate-500">Retrieving case record...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <AlertTriangle className="h-10 w-10 mx-auto text-rose-500 mb-2" />
        <h2 className="text-lg font-bold">Report Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested civic complaint does not exist or has been archived.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">
          Go to Dashboard
        </button>
      </div>
    );
  }

  // Calculate Trust Score using the algorithm
  const trustScore = Math.round(
    (report.verificationCount / (report.verificationCount + report.rejectionsCount + 1)) * 100
  );

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-300 text-slate-800 dark:text-slate-100">
      
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation Head */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'en' ? 'Back to Dashboard' : 'डैशबोर्ड पर लौटें'}</span>
        </button>

        {/* Title Block */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-extrabold rounded-lg capitalize">
                {report.category}
              </span>
              <span className={`text-3xs px-2.5 py-0.5 rounded-lg font-black uppercase tracking-wider ${
                report.priority === 'critical' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400' :
                report.priority === 'high' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' :
                'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
              }`}>
                {report.priority} {language === 'en' ? 'Priority' : 'प्राथमिकता'}
              </span>
              <span className="text-3xs px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-lg">
                {report.ward}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-2 leading-tight">
              {report.aiAnalysis?.issueType || report.category} Diagnostic
            </h1>
            <div className="flex items-center space-x-2 text-3xs text-slate-400 mt-2">
              <MapPin className="h-3 w-3" />
              <span>{report.address}</span>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <span className={`text-xs px-3.5 py-1.5 rounded-xl font-black uppercase tracking-wider text-center block ${
              report.status === 'resolved' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 animate-pulse' :
              report.status === 'assigned' ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400' :
              report.status === 'verified' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' :
              'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
            }`}>
              Status: {report.status}
            </span>
            <span className="text-4xs text-slate-400">Filed {new Date(report.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Central Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left: Image evidence, description, and comments stream */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Visual Evidence Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              {report.imageUrl ? (
                <img 
                  src={report.imageUrl} 
                  alt={report.category} 
                  className="w-full h-80 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-80 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-400">
                  <Camera className="h-10 w-10 mb-2" />
                  <span>No image attached.</span>
                </div>
              )}
              
              <div className="p-6 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {language === 'en' ? 'Citizen Incident Description' : 'नागरिक घटना का विवरण'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {report.description}
                </p>

                {/* Submitting User Profile details */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-3 text-2xs">
                  <img src={report.reporterPhoto} className="h-8 w-8 rounded-full" />
                  <div>
                    <span className="block font-bold text-slate-700 dark:text-slate-200">{report.reporterName}</span>
                    <span className="text-3xs text-slate-400">Community Contributor</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Neighborhood Feed: Comments Stream */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
              <h2 className="text-base font-extrabold">
                {language === 'en' ? 'Neighborhood Discussions' : 'पड़ोस की चर्चाएँ'} ({comments.length})
              </h2>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="space-y-4">
                <div className="flex gap-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={language === 'en' ? "Add neighborhood updates, verification photos or request priority updates..." : "पड़ोस के विवरण या तस्वीरें जोड़ें..."}
                    rows={2}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none"
                  />
                </div>

                {/* Optional Comment Image preview */}
                {commentImage && (
                  <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-slate-200">
                    <img src={commentImage} className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setCommentImage(null)}
                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <label className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-lg cursor-pointer flex items-center space-x-1 text-xs">
                      <Camera className="h-4 w-4" />
                      <span className="text-3xs font-bold">Attach Photo</span>
                      <input type="file" onChange={handleCommentPhoto} accept="image/*" className="hidden" />
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                  >
                    Post Update
                  </button>
                </div>
              </form>

              {/* Comments Feed List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No comments yet. Keep neighbors updated!
                  </div>
                ) : (
                  comments.map((comm) => (
                    <div key={comm.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-50 dark:border-slate-800 flex items-start space-x-3">
                      <img src={comm.userPhoto} className="h-7 w-7 rounded-full shrink-0" />
                      <div className="space-y-1 w-full">
                        <div className="flex justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{comm.userName}</span>
                          <span className="text-4xs text-slate-400">{new Date(comm.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {comm.content}
                        </p>
                        {comm.imageUrl && (
                          <img src={comm.imageUrl} className="max-w-xs h-32 object-cover rounded-lg mt-2 border border-slate-200" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right: AI Analysis parameters, Verification counters, Status timeline, Admin controls */}
          <div className="space-y-6">
            
            {/* AI Diagnostics details card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Building2 className="h-4 w-4 text-indigo-400" />
                <span className="text-2xs font-extrabold uppercase tracking-widest text-slate-200">
                  AI Planning Assessment
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-4xs uppercase tracking-wider font-extrabold">Assigned Department</span>
                  <span className="font-extrabold text-slate-200 text-sm">{report.department}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block text-4xs uppercase tracking-wider font-extrabold">Severity Score</span>
                    <span className="font-black text-rose-400 text-sm">{report.severity}/10</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-4xs uppercase tracking-wider font-extrabold">Estimated Fix Time</span>
                    <span className="font-black text-emerald-400 text-sm">
                      {report.aiAnalysis?.estimatedDays || 5} Days
                    </span>
                  </div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 text-4xs text-slate-300 leading-relaxed">
                  <span className="text-slate-500 block text-5xs uppercase tracking-wider font-black mb-1">Planning Log reasoning</span>
                  {report.aiAnalysis?.reasoning}
                </div>
              </div>
            </div>

            {/* Voting & Community Verification Actions */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                {language === 'en' ? 'Community Verification & Trust' : 'सामुदायिक सत्यापन और विश्वास'}
              </h3>

              {/* Dynamic Trust Score visualization */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>Trust Score</span>
                  <span className={`${trustScore > 60 ? 'text-emerald-500' : 'text-amber-500'}`}>{trustScore}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${trustScore > 60 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${trustScore}%` }}
                  />
                </div>
                <span className="text-4xs text-slate-400 block pt-1">
                  Verified by {report.verificationCount} citizens. {report.rejectionsCount} rejected/disputed.
                </span>
              </div>

              {/* Interactive buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => handleVerification('confirm')}
                  disabled={actionLoading}
                  className="py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 rounded-xl text-3xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Confirm Issue
                </button>
                <button
                  onClick={() => handleVerification('reject')}
                  disabled={actionLoading}
                  className="py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900/50 rounded-xl text-3xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Reject Fake
                </button>
              </div>

              {/* Upvote support bar */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-3xs font-bold text-slate-500">Do you experience this issue?</span>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleVote('upvote')}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-3xs font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    <ThumbsUp className="h-3 w-3 text-slate-500" />
                    <span>{report.upvotes}</span>
                  </button>
                  <button 
                    onClick={() => handleVote('downvote')}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-3xs font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    <ThumbsDown className="h-3 w-3 text-slate-500" />
                    <span>{report.downvotes}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Case Resolution Status Timeline */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                {language === 'en' ? 'Resolution Timeline' : 'निवारण समयरेखा'}
              </h3>

              <div className="space-y-4 relative pl-4 border-l border-slate-200 dark:border-slate-800 mt-2">
                {report.timeline.map((event, idx) => (
                  <div key={event.id || idx} className="relative">
                    {/* Circle Dot */}
                    <div className="absolute -left-[21px] top-1 h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900" />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-snug">{event.title}</h4>
                      <p className="text-4xs text-slate-500 dark:text-slate-400 mt-0.5">{event.description}</p>
                      <span className="text-5xs text-slate-400 block mt-1">
                        {new Date(event.date).toLocaleDateString()} • {event.updatedBy}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Administrative / Municipal Control Console */}
            {profile?.role === 'admin' && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-3xl p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Municipal Administrative Desk
                  </span>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleAdminAction('assigned', 'Assigned to the field engineering dispatch crew.')}
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-3xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Dispatch Field Crew
                  </button>
                  <button
                    onClick={() => handleAdminAction('resolved', 'The municipal field engineering crew repaired the issue. Tested OK.')}
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-white border border-emerald-500 text-emerald-700 rounded-xl text-3xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => handleAdminAction('rejected', 'Audited as fake/duplicate complaint by admin.')}
                    disabled={actionLoading}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-3xs font-bold uppercase cursor-pointer"
                  >
                    Reject Report
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

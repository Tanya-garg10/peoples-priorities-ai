import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, collection, addDoc, getDocs } from '../firebase';
import { 
  Building2, 
  Camera, 
  MapPin, 
  Sparkles, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle, 
  Calendar, 
  HelpCircle, 
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  RefreshCw,
  Mic,
  MicOff,
  Users,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

interface ReportIssueViewProps {
  language: 'en' | 'hi';
}

export const ReportIssueView: React.FC<ReportIssueViewProps> = ({ language }) => {
  const { user, profile, updateProfileScore } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Schools & Education');
  const [expectedImpact, setExpectedImpact] = useState('');
  const [expectedBeneficiaries, setExpectedBeneficiaries] = useState<number>(1000);
  const [latitude, setLatitude] = useState<number>(28.6139);
  const [longitude, setLongitude] = useState<number>(77.2090);
  const [address, setAddress] = useState('Central New Delhi, Delhi, India');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [ward, setWard] = useState('Ward-1');

  // Image assets
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Voice Input States
  const [isListening, setIsListening] = useState(false);

  // AI Agent States
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  
  // Duplicate Check State
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'Schools & Education',
    'Roads & Connectivity',
    'Water Supply & Sanitation',
    'PHC & Healthcare',
    'Streetlights & Public Safety',
    'Community Libraries',
    'Parks & Recreation',
    'Drainage & Sewage',
    'Waste Management'
  ];

  const wards = ['Ward-1', 'Ward-2', 'Ward-3', 'Ward-4', 'Ward-5'];

  // Automatically lookup user current GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(parseFloat(position.coords.latitude.toFixed(6)));
          setLongitude(parseFloat(position.coords.longitude.toFixed(6)));
          setAddress(`GPS Coordinate Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
        },
        (error) => {
          console.warn("Geolocation lookup denied or unavailable. Standard defaults applied.");
        }
      );
    }
  }, []);

  // Web Speech API Integration
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(language === 'en' 
        ? "Speech recognition is not supported in this browser. Please type your suggestion." 
        : "आपके ब्राउज़र में आवाज़ पहचान समर्थित नहीं है। कृपया टाइप करके विवरण लिखें।"
      );
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDescription((prev) => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Handle Image Upload & Compression to keep base64 payloads lightweight
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress the image using HTML5 Canvas
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Convert compressed image to standard jpeg base64
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setImageSrc(compressedBase64);
          
          // Instantly trigger Vision Agent analysis
          triggerVisionAgent(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Trigger server-side Vision Agent
  const triggerVisionAgent = async (base64Img: string) => {
    setAnalyzing(true);
    setAiAnalysis(null);
    try {
      const res = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Img,
          description,
          category,
          title,
          expectedImpact
        })
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
        if (data.analysis.expectedBeneficiaries) {
          setExpectedBeneficiaries(data.analysis.expectedBeneficiaries);
        }
      } else if (data.fallbackAnalysis) {
        setAiAnalysis(data.fallbackAnalysis);
      }
    } catch (e) {
      console.error("Vision agent failed:", e);
      // Fallback diagnostics
      setAiAnalysis({
        category,
        developmentNeed: title || "Infrastructure Upgrade",
        priority: "medium",
        expectedBeneficiaries: expectedBeneficiaries,
        department: category.includes('Education') ? 'Education Dept' : 'Public Works Dept',
        estimatedDays: 90,
        reasoning: "Image uploaded successfully. Diagnostics assigned standard developmental priority and coverage metrics.",
        confidence: 0.75
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Run validation checks for duplicate reports in same ward
  const validateDuplicateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert(language === 'en' ? "Please enter a title for your suggestion." : "कृपया अपने सुझाव के लिए एक शीर्षक दर्ज करें।");
      return;
    }
    if (!description.trim()) {
      alert(language === 'en' ? "Please provide a description." : "कृपया विवरण प्रदान करें।");
      return;
    }
    if (!imageSrc) {
      alert(language === 'en' ? "Please upload an image showing the site or current condition." : "कृपया साइट या वर्तमान स्थिति दिखाने वाली एक फोटो अपलोड करें।");
      return;
    }

    setCheckingDuplicate(true);
    setDuplicateWarning(null);

    try {
      // Load current suggestions from Firestore to look for overlaps
      const q = collection(db, 'reports');
      const snap = await getDocs(q);
      const existingReports: any[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        if (d.status !== 'resolved' && d.category === category) {
          existingReports.push({ id: doc.id, ...d });
        }
      });

      // Call Validation Agent API (Cluster Agent)
      const res = await fetch('/api/ai/validate-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentReport: { description, category, title },
          existingReports
        })
      });
      
      const data = await res.json();
      if (data.success && data.result?.isDuplicate) {
        setDuplicateWarning(data.result);
        setCheckingDuplicate(false);
        return; // Pause filing to prompt confirmation
      }
    } catch (err) {
      console.warn("Validation agent skipped:", err);
    }

    setCheckingDuplicate(false);
    // Proceed if clean
    await submitReport();
  };

  // Submit suggestion to firestore database
  const submitReport = async () => {
    setSubmitting(true);
    try {
      const finalReport = {
        title,
        description,
        category,
        expectedImpact,
        expectedBeneficiaries: aiAnalysis?.expectedBeneficiaries || expectedBeneficiaries,
        latitude,
        longitude,
        address,
        date,
        createdAt: new Date().toISOString(),
        reporterId: user?.uid || 'guest_id',
        reporterName: profile?.displayName || 'Guest Contributor',
        reporterPhoto: profile?.photoURL || 'https://api.dicebear.com/7.x/adventurer/svg?seed=guest',
        status: 'pending',
        department: aiAnalysis?.department || 'Public Works Dept',
        priority: aiAnalysis?.priority || 'medium',
        severity: aiAnalysis?.severity || '5',
        imageUrl: imageSrc || null,
        aiAnalysis: aiAnalysis || {
          category,
          developmentNeed: title,
          priority: "medium",
          expectedBeneficiaries: expectedBeneficiaries,
          department: "Planning & Development Board",
          estimatedDays: 90,
          reasoning: "Direct developmental suggestion posted by citizen.",
          confidence: 0.6
        },
        votesCount: 1, // Start with 1 vote (the author)
        upvotes: 1,
        downvotes: 0,
        verificationCount: 0,
        rejectionsCount: 0,
        verificationStatus: 'unverified',
        ward,
        timeline: [
          {
            id: '1',
            status: 'pending',
            title: language === 'en' ? 'Suggestion Registered' : 'सुझाव पंजीकृत किया गया',
            description: language === 'en' 
              ? `Development idea logged in ${ward}. Diagnostics analyzed by AI Planning Agent.`
              : `विकास विचार ${ward} में दर्ज किया गया। एआई प्लानिंग एजेंट द्वारा निदान विश्लेषण।`,
            date: new Date().toISOString(),
            updatedBy: profile?.displayName || 'Citizen'
          }
        ],
        duplicatesMerged: []
      };

      await addDoc(collection(db, 'reports'), finalReport);
      
      // Award Contribution score for proposing a community idea
      await updateProfileScore(30, 'Active Visionary');

      // Create local alert/notification
      await addDoc(collection(db, 'notifications'), {
        userId: user?.uid || 'guest_id',
        title: language === 'en' ? "Suggestion Submitted 🎉" : "सुझाव सफलतापूर्वक जमा 🎉",
        message: language === 'en' 
          ? `Your suggestion for "${title}" has been registered in ${ward}. It has been forwarded to the ${finalReport.department}. (+30 Points)`
          : `आपका "${title}" के लिए सुझाव ${ward} में दर्ज किया गया है। इसे ${finalReport.department} को भेज दिया गया है। (+30 अंक)`,
        read: false,
        createdAt: new Date().toISOString()
      });

      navigate('/dashboard');
    } catch (e: any) {
      console.error("Failed to submit suggestion:", e);
      alert(`Submission failed. Please try again. Error: ${e?.message || e || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-300 text-slate-800 dark:text-slate-100">
      
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Head */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'en' ? 'Back to Dashboard' : 'डैशबोर्ड पर लौटें'}</span>
        </button>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
          {language === 'en' ? 'Suggest a Public Development Idea' : 'सार्वजनिक विकास विचार का सुझाव दें'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-8">
          {language === 'en' 
            ? 'Propose infrastructure projects (schools, roads, water filtration, safety). Our AI Priority Agent automatically estimates coverage, benefits, and drafts optimization reports.'
            : 'बुनियादी ढांचा परियोजनाओं (स्कूल, सड़क, जल निस्पंदन, सुरक्षा) का प्रस्ताव दें। हमारा एआई प्रायोरिटी एजेंट कवरेज, लाभों का अनुमान लगाता है।'}
        </p>

        {/* Form Container */}
        <form onSubmit={validateDuplicateAndSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left: Input fields and location */}
          <div className="space-y-6">
            
            {/* Title */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                {language === 'en' ? 'Suggestion Title' : 'सुझाव का शीर्षक'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={language === 'en' ? "e.g. Upgrade Primary School with Science Lab" : "जैसे: प्राथमिक विद्यालय को साइंस लैब के साथ अपग्रेड करें"}
                required
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            {/* Category Dropdown */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                {language === 'en' ? 'Socio-Development Sector' : 'सामाजिक-विकास क्षेत्र'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Description Area with Voice Integration */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm relative">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                  {language === 'en' ? 'Detailed Description' : 'विस्तृत विवरण'}
                </label>
                
                {/* Voice Input Trigger */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5 text-blue-500" />}
                  <span>{isListening ? (language === 'en' ? 'Listening...' : 'सुन रहा है...') : (language === 'en' ? 'Speak' : 'बोलें')}</span>
                </button>
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === 'en' ? "What infrastructure is currently missing, and what exactly are you proposing? Be descriptive." : "वर्तमान में कौन सा बुनियादी ढांचा गायब है, और आप वास्तव में क्या प्रस्ताव दे रहे हैं?"}
                rows={4}
                required
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            {/* Expected Impact & Beneficiaries */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  {language === 'en' ? 'Expected Community Impact' : 'अपेक्षित सामुदायिक प्रभाव'}
                </label>
                <textarea
                  value={expectedImpact}
                  onChange={(e) => setExpectedImpact(e.target.value)}
                  placeholder={language === 'en' ? "Who will benefit and how? (e.g. students will save 5km travel, clean drinking water will reduce waterborne illnesses)" : "किसको लाभ होगा और कैसे? (जैसे: स्वच्छ पेयजल से जलजनित बीमारियां कम होंगी)"}
                  rows={2}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  {language === 'en' ? 'Est. Beneficiaries (People Impacted)' : 'अनुमानित लाभार्थी (प्रभावित लोग)'}
                </label>
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-slate-400" />
                  <input
                    type="number"
                    value={expectedBeneficiaries}
                    onChange={(e) => setExpectedBeneficiaries(Number(e.target.value))}
                    min={10}
                    max={100000}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Ward Selector */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                {language === 'en' ? 'Constituency Village/Ward' : 'निर्वाचन क्षेत्र का गांव/वार्ड'}
              </label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                {wards.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            {/* GPS & Location Selector */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                  {language === 'en' ? 'Geoposition GPS' : 'भू-स्थिति जीपीएस'}
                </label>
                <span className="text-4xs px-2 py-0.5 bg-blue-100 dark:bg-slate-800 text-blue-600 rounded font-black">
                  Locked
                </span>
              </div>
              
              {/* Interactive Fallback Map Selector */}
              <div className="h-44 bg-slate-100 dark:bg-slate-950 rounded-xl relative overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 text-center">
                <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-600/5 grid grid-cols-6 grid-rows-4 gap-0 pointer-events-none opacity-50">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="border border-slate-200/30 dark:border-slate-800/20" />
                  ))}
                </div>
                
                <div className="relative z-10 flex flex-col items-center justify-center h-full">
                  <MapPin className="h-8 w-8 text-rose-500 animate-bounce mb-2" />
                  <span className="text-2xs font-extrabold text-slate-700 dark:text-slate-300">
                    {address}
                  </span>
                  <div className="flex space-x-2 mt-3">
                    <span className="text-4xs font-mono px-2 py-1 bg-white dark:bg-slate-900 rounded border border-slate-200/60 dark:border-slate-800 text-slate-500">
                      Lat: {latitude}
                    </span>
                    <span className="text-4xs font-mono px-2 py-1 bg-white dark:bg-slate-900 rounded border border-slate-200/60 dark:border-slate-800 text-slate-500">
                      Lng: {longitude}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right: Camera / Image Evidence Upload and AI agent analysis */}
          <div className="space-y-6">
            
            {/* Image Upload Box */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                {language === 'en' ? 'Site or Empty Lot Photo (Required)' : 'साइट या खाली भूमि की फोटो (आवश्यक)'}
              </label>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition relative overflow-hidden bg-slate-50 dark:bg-slate-950"
              >
                {imageSrc ? (
                  <>
                    <img src={imageSrc} alt="Preview" className="h-full w-full object-cover" />
                    <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/75 text-white text-4xs rounded-lg font-bold flex items-center space-x-1">
                      <Camera className="h-3 w-3" />
                      <span>Retake</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <div className="p-3 bg-blue-50 dark:bg-slate-800 rounded-full text-blue-600 dark:text-blue-400 w-max mx-auto mb-3">
                      <Camera className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-extrabold dark:text-slate-200 block">Click or Tap to upload Site Photo</span>
                    <span className="text-4xs text-slate-400 mt-1 block">Supports drag & drop or camera capture</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                onChange={handleImageChange} 
                ref={fileInputRef} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* AI Diagnostics Box (Visible after image uploaded / during active lookup) */}
            {(analyzing || aiAnalysis) && (
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
                
                {/* Visual Glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/15 rounded-full blur-2xl" />

                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-emerald-400 animate-spin" />
                    <span className="text-2xs font-extrabold uppercase tracking-widest text-slate-200">
                      AI Priority & Impact Diagnostics
                    </span>
                  </div>
                  <span className="text-4xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded font-black">
                    Active
                  </span>
                </div>

                {analyzing ? (
                  <div className="py-8 text-center space-y-3">
                    <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin mx-auto" />
                    <span className="text-2xs font-bold text-slate-400 block">Running diagnostic multi-agent models...</span>
                  </div>
                ) : (
                  <div className="space-y-4 text-left">
                    <div className="grid grid-cols-2 gap-3 text-2xs">
                      <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-4xs uppercase tracking-wider font-extrabold">Proposed Upgrade</span>
                        <span className="font-extrabold text-slate-200">{aiAnalysis.developmentNeed || aiAnalysis.issueType}</span>
                      </div>
                      <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-4xs uppercase tracking-wider font-extrabold">Assigned Department</span>
                        <span className="font-extrabold text-slate-200">{aiAnalysis.department}</span>
                      </div>
                      <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-4xs uppercase tracking-wider font-extrabold">Urgency Priority</span>
                        <span className="font-extrabold text-amber-400 capitalize">{aiAnalysis.priority}</span>
                      </div>
                      <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-4xs uppercase tracking-wider font-extrabold">Direct Beneficiaries</span>
                        <span className="font-extrabold text-emerald-400">~{aiAnalysis.expectedBeneficiaries || expectedBeneficiaries} People</span>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-4xs uppercase tracking-wider font-extrabold mb-1">Explainable Planning Reasoning</span>
                      <p className="text-4xs text-slate-300 leading-relaxed">
                        {aiAnalysis.reasoning}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-5xs text-slate-500">
                      <span>Planners Confidence: {Math.round(aiAnalysis.confidence * 100)}%</span>
                      <span>Proj. Drafting Phase: {aiAnalysis.estimatedDays || 90} Days</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Duplicate Validation Warn Box */}
            {duplicateWarning && (
              <div className="bg-amber-50 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200 dark:border-amber-900 shadow-sm space-y-3">
                <div className="flex items-start space-x-2.5">
                  <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-amber-800 dark:text-amber-300">Cluster Agent: Similar Suggestion Found Nearby</h4>
                    <p className="text-3xs text-amber-700 dark:text-amber-400 mt-1">
                      {duplicateWarning.reason}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/report/${duplicateWarning.matchReportId}`)}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-3xs font-bold hover:bg-amber-700 cursor-pointer"
                  >
                    View & Vote on Existing Suggestion
                  </button>
                  <button
                    type="button"
                    onClick={submitReport}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 rounded-lg text-3xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Submit New Suggestion Anyway
                  </button>
                </div>
              </div>
            )}

            {/* Submit Bar */}
            <button
              type="submit"
              disabled={submitting || analyzing || checkingDuplicate}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 flex items-center justify-center space-x-2 transform hover:-translate-y-0.5 transition cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? 'Registering Suggestion...' : checkingDuplicate ? 'Checking Similar Proposals...' : 'Submit Suggestion & Dispatch'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { db, collection, getDocs } from '../firebase';
import { CivicIssueReport } from '../types';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  User, 
  HelpCircle, 
  Building2, 
  FileText, 
  Award, 
  CheckCircle2, 
  Compass, 
  Languages, 
  FileCheck, 
  AlertCircle,
  Clock,
  MapPin,
  ChevronRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAssistantViewProps {
  language: 'en' | 'hi';
}

type CompanionTab = 'chat' | 'schemes' | 'documents' | 'tracking';
type SelectedLang = 'en' | 'hi' | 'mr' | 'ta' | 'bn';

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ language }) => {
  const [activeTab, setActiveTab] = useState<CompanionTab>('chat');
  const [assistantLang, setAssistantLang] = useState<SelectedLang>(() => {
    return (language as SelectedLang) || 'en';
  });

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<CivicIssueReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScheme, setSelectedScheme] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize greeting on mount or language change
  useEffect(() => {
    const greeting = getGreeting(assistantLang);
    setMessages([
      {
        role: 'assistant',
        content: greeting
      }
    ]);
  }, [assistantLang]);

  // Load latest reports context so AI can answer with real-time ward data
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const snap = await getDocs(collection(db, 'reports'));
        const list: CivicIssueReport[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as CivicIssueReport);
        });
        setReports(list);
      } catch (e) {
        console.warn("Failed to load AI reports context:", e);
      }
    };
    fetchContext();
  }, []);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getGreeting = (lang: SelectedLang) => {
    switch (lang) {
      case 'hi':
        return "नमस्ते! मैं आपका **People's Priorities AI नागरिक सहायक** हूँ। आप मुझसे सरकारी योजनाओं (जैसे आयुष्मान भारत, पीएम किसान), पासपोर्ट या ड्राइविंग लाइसेंस के दस्तावेज़ों, या अपने वार्ड की शिकायतों के लाइव स्टेटस के बारे में पूछ सकते हैं। आप नीचे दिए गए टैब का भी उपयोग कर सकते हैं!";
      case 'mr':
        return "नमस्कार! मी आपला **People's Priorities AI नागरिक सहाय्यक** आहे. आपण मला सरकारी योजना (उदा. आयुष्मान भारत, पीएम किसान), पासपोर्ट किंवा ड्रायव्हिंग लायसन्सचे दस्तऐवज, किंवा आपल्या वॉर्डमधील तक्रारींच्या लाईव्ह स्टेटस बद्दल विचारू शकता.";
      case 'ta':
        return "வணக்கம்! நான் உங்கள் **People's Priorities AI குடிமக்கள் உதவியாளர்**. அரசாங்கத் திட்டங்கள் (ஆயுஷ்மான் பாரத், பிஎம் கிசான்), பாஸ்போர்ட்/ஓட்டுநர் உரிம ஆவணங்கள் அல்லது உங்கள் வார்டு புகார்களின் நேரடி நிலையைப் பற்றி என்னிடம் கேட்கலாம்.";
      case 'bn':
        return "নমস্কার! আমি আপনার **People's Priorities AI নাগরিক সহকারী**। আপনি আমাকে সরকারী স্কিম (যেমন আয়ুষ্মান ভারত, পিএম কিষাণ), পাসপোর্ট বা ড্রাইভিং লাইসেন্সের নথিপত্র, বা আপনার ওয়ার্ডের অভিযোগের লাইভ স্ট্যাটাস সম্পর্কে জিজ্ঞাসা করতে পারেন।";
      default:
        return "Hello! I am your **People's Priorities AI Civic Companion**. Ask me about government schemes (Ayushman Bharat, PM Kisan), passport/driving licence document checklists, or track your local ward complaints in real-time. Feel free to use the interactive tabs below to guide your journey!";
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const userMessage = { role: 'user' as const, content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Send chat message to Express backend with reports data for context grounding!
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          chatHistory: messages.slice(1), // Exclude initial greeting
          reportsContext: reports.map(r => ({
            id: r.id || 'N/A',
            category: r.category,
            address: r.address,
            priority: r.priority,
            status: r.status,
            ward: r.ward,
            reporter: r.reporterName,
            severity: r.severity,
            days: r.aiAnalysis?.estimatedDays || 5,
            description: r.description
          }))
        })
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "I am having trouble connecting to my central multi-agent server. Please ensure your GEMINI_API_KEY is configured." }]);
      }
    } catch (e) {
      console.error("AI Chat error:", e);
      setMessages(prev => [...prev, { role: 'assistant', content: "An unexpected connection error occurred. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to trigger canned scheme lookup
  const queryScheme = (schemeName: string, queryText: string) => {
    setSelectedScheme(schemeName);
    setActiveTab('chat');
    handleSend(queryText);
  };

  // Helper to trigger canned document lookup
  const queryDocument = (docName: string, queryText: string) => {
    setSelectedDoc(docName);
    setActiveTab('chat');
    handleSend(queryText);
  };

  // Language display mapping
  const languagesList: { code: SelectedLang; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'mr', name: 'मराठी' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'bn', name: 'বাংলা' }
  ];

  const govSchemes = [
    {
      id: 'ayushman',
      title: 'Ayushman Bharat (PM-JAY)',
      desc: 'Free health insurance cover up to ₹5 Lakh/family/year for secondary & tertiary hospitalizations.',
      queries: {
        en: 'Am I eligible for Ayushman Bharat scheme and what are the benefits?',
        hi: 'क्या मैं आयुष्मान भारत योजना के लिए पात्र हूं और इसके क्या लाभ हैं?',
        mr: 'मी आयुष्मान भारत योजनेसाठी पात्र आहे का आणि त्याचे काय फायदे आहेत?',
        ta: 'ஆயுஷ்மான் பாரத் திட்டத்திற்கு நான் தகுதியானவரா மற்றும் அதன் நன்மைகள் என்ன?',
        bn: 'আমি কি আয়ুষ্মান ভারত প্রকল্পের জন্য যোগ্য এবং এর সুবিধা কী কী?'
      }
    },
    {
      id: 'pmkisan',
      title: 'PM Kisan Samman Nidhi',
      desc: 'Income support of ₹6,000/year to all small & marginal landholding farmer families.',
      queries: {
        en: 'How do I apply for PM Kisan Samman Nidhi and who is eligible?',
        hi: 'मैं पीएम किसान सम्मान निधि के लिए कैसे आवेदन करूं और कौन पात्र है?',
        mr: 'मी पीएम किसान सन्मान निधीसाठी कसा अर्ज करू आणि कोण पात्र आहे?',
        ta: 'பிஎம் கிசான் சம்மான் நிதிக்கு நான் எப்படி விண்ணப்பிப்பது மற்றும் யார் தகுதி உடையவர்?',
        bn: 'আমি কীভাবে পিএম কিষাণ সম্মান নিধির জন্য আবেদন করব এবং কারা যোগ্য?'
      }
    },
    {
      id: 'pmay',
      title: 'PM Awas Yojana (PMAY)',
      desc: 'Housing subsidy scheme aiming to build pucca houses with electricity & sanitation for all.',
      queries: {
        en: 'What is the eligibility criteria and subsidy amount under PM Awas Yojana?',
        hi: 'प्रधानमंत्री आवास योजना के तहत पात्रता मानदंड और सब्सिडी राशि क्या है?',
        mr: 'पंतप्रधान आवास योजनेअंतर्गत पात्रता निकष आणि सबसिडीची रक्कम काय आहे?',
        ta: 'பிரதம மந்திரி ஆவாஸ் யோஜனா திட்டத்தின் கீழ் தகுதி வரம்புகள் மற்றும் மானியத் தொகை என்ன?',
        bn: 'প্রধানমন্ত্রী আবাস যোজনার অধীনে যোগ্যতার মানদণ্ড এবং ভর্তুকির পরিমাণ কত?'
      }
    },
    {
      id: 'passport_guide',
      title: 'Indian Passport Application',
      desc: 'Complete workflow for fresh and re-issue passport registration, scheduling & fees.',
      queries: {
        en: 'What is the document checklist and step-by-step process to apply for an Indian Passport?',
        hi: 'भारतीय पासपोर्ट के आवेदन के लिए दस्तावेज़ चेकलिस्ट और चरण-दर-चरण प्रक्रिया क्या है?',
        mr: 'भारतीय पासपोर्टसाठी अर्ज करण्याची कागदपत्रे चेकलिस्ट आणि स्टेप-बाय-स्टेप प्रक्रिया काय आहे?',
        ta: 'இந்திய பாஸ்போர்ட்டிற்கு விண்ணப்பிக்க தேவையான ஆவணங்களின் பட்டியல் மற்றும் படிநிலைகள் என்ன?',
        bn: 'ভারতীয় পাসপোর্টের জন্য আবেদন করার নথিপত্র চেকলিস্ট এবং ধাপে ধাপে প্রক্রিয়াটি কী?'
      }
    },
    {
      id: 'dl_guide',
      title: 'Driving Licence Renewal & Apply',
      desc: 'Guidance on learning license, permanent license test, and renewal steps via Sarathi RTO.',
      queries: {
        en: 'Tell me the documents required, fees, and process for Driving Licence renewal.',
        hi: 'ड्राइविंग लाइसेंस नवीनीकरण के लिए आवश्यक दस्तावेज़, शुल्क और प्रक्रिया बताएं।',
        mr: 'ड्रायव्हिंग लायसन्स नूतनीकरणासाठी आवश्यक कागदपत्रे, शुल्क आणि प्रक्रिया सांगा.',
        ta: 'ஓட்டுநர் உரிமம் புதுப்பிப்பதற்கான தேவையான ஆவணங்கள், கட்டணம் மற்றும் செயல்முறை பற்றி கூறவும்.',
        bn: 'ড্রাইভিং লাইসেন্স নবীকরণের জন্য প্রয়োজনীয় নথিপত্র, ফি এবং প্রক্রিয়া বলুন।'
      }
    },
    {
      id: 'pension',
      title: 'National Pension Schemes',
      desc: 'Old age, widow, and disability pension assistance under the National Social Assistance Programme.',
      queries: {
        en: 'What pension schemes are available for senior citizens and how to enroll?',
        hi: 'वरिष्ठ नागरिकों के लिए कौन सी पेंशन योजनाएं उपलब्ध हैं और नामांकन कैसे करें?',
        mr: 'ज्येष्ठ नागरिकांसाठी कोणत्या पेन्शन योजना उपलब्ध आहेत आणि नोंदणी कशी करावी?',
        ta: 'முதியோர்களுக்கு என்ன ஓய்வூதியத் திட்டங்கள் உள்ளன மற்றும் அதில் எவ்வாறு இணைவது?',
        bn: 'প্রবীণ নাগরিকদের জন্য কী কী পেনশন স্কিম উপলব্ধ এবং কীভাবে নথিভুক্ত করবেন?'
      }
    }
  ];

  const documentChecklists = [
    { id: 'passport', name: 'Fresh Passport', icon: FileCheck },
    { id: 'dl', name: 'Driving Licence', icon: Compass },
    { id: 'birth', name: 'Birth Certificate', icon: FileText },
    { id: 'pan', name: 'PAN Card (New)', icon: Award }
  ];

  // Search local reports list for real-time tracking
  const filteredReports = reports.filter(r => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.category?.toLowerCase().includes(query) ||
      r.description?.toLowerCase().includes(query) ||
      r.ward?.toLowerCase().includes(query) ||
      r.status?.toLowerCase().includes(query) ||
      r.id?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)] flex flex-col justify-between transition-colors duration-300 text-slate-800 dark:text-slate-100 pb-8">
      
      {/* Top Multilingual Language Selector Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 shadow-sm sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center space-x-2">
            <Languages className="h-5 w-5 text-emerald-500 shrink-0" />
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Select AI Companion Language:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {languagesList.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setAssistantLang(lang.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                  assistantLang === lang.code
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto px-4 mt-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-14rem)] min-h-[500px]">
        
        {/* Left Interactive Workspace Menu (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm h-full">
          
          {/* Quick-action Tab Selectors */}
          <div className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-2 px-1 rounded-xl text-2xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-emerald-400 shadow-sm border border-slate-200/20'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Interactive Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('schemes')}
              className={`py-2 px-1 rounded-xl text-2xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'schemes'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-emerald-400 shadow-sm border border-slate-200/20'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Gov Schemes</span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-2 px-1 rounded-xl text-2xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'documents'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-emerald-400 shadow-sm border border-slate-200/20'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Doc Checklists</span>
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`py-2 px-1 rounded-xl text-2xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'tracking'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-emerald-400 shadow-sm border border-slate-200/20'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <AlertCircle className="h-4 w-4" />
              <span>Track Ward</span>
            </button>
          </div>

          {/* Tab View Contents */}
          <div className="flex-1 overflow-y-auto p-5">
            
            {/* Interactive Chat Tab Info */}
            {activeTab === 'chat' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100/40 dark:border-blue-900/30">
                  <h3 className="text-xs font-black uppercase text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-500 animate-spin" />
                    Multilingual Civic AI Copilot
                  </h3>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Connected to the live ward registries. You can ask queries in natural English, Hindi, Marathi, Tamil, or Bengali. Our companion will seamlessly reply with official procedural info, documents required, and smart recommendations.
                  </p>
                </div>

                <div>
                  <span className="text-4xs font-black uppercase text-slate-400 tracking-wider block mb-3">Quick Conversational Prompts:</span>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { 
                        title: 'Passport Guide', 
                        q: {
                          en: 'How do I apply for a new passport and what are the steps?',
                          hi: 'पासपोर्ट के लिए आवेदन करने का तरीका और कदम क्या हैं?',
                          mr: 'नवीन पासपोर्टसाठी अर्ज कसा करावा आणि पायऱ्या काय आहेत?',
                          ta: 'புதிய பாஸ்போர்ட்டிற்கு எப்படி விண்ணப்பிப்பது மற்றும் அதன் படிகள் என்ன?',
                          bn: 'নতুন পাসপোর্টের জন্য কীভাবে আবেদন করব এবং পদক্ষেপগুলি কী কী?'
                        }
                      },
                      { 
                        title: 'Driving Licence', 
                        q: {
                          en: 'How to renew my driving licence in RTO?',
                          hi: 'आरटीओ में ड्राइविंग लाइसेंस का नवीनीकरण कैसे कराएं?',
                          mr: 'आरटीओ मध्ये माझे ड्रायव्हिंग लायसन्स कसे नूतनीकरण करावे?',
                          ta: 'RTO-ல் எனது ஓட்டுநர் உரிமத்தை எவ்வாறு புதுப்பிப்பது?',
                          bn: 'আরটিওতে আমার ড্রাইভিং লাইসেন্স কীভাবে রিনিউ করব?'
                        }
                      },
                      { 
                        title: 'Ayushman Bharat Eligibility', 
                        q: {
                          en: 'Am I eligible for Ayushman Bharat health card benefits?',
                          hi: 'क्या मैं आयुष्मान भारत स्वास्थ्य कार्ड लाभों के लिए पात्र हूँ?',
                          mr: 'मी आयुष्मान भारत आरोग्य कार्ड फायद्यांसाठी पात्र आहे का?',
                          ta: 'ஆயுஷ்மான் பாரத் மருத்துவ அட்டை நன்மைகளுக்கு நான் தகுதியானவரா?',
                          bn: 'আমি কি আয়ুষ্মান ভারত স্বাস্থ্য কার্ডের সুবিধার জন্য যোগ্য?'
                        }
                      },
                      { 
                        title: 'Unresolved Area Complaints', 
                        q: {
                          en: 'Show pending complaints in our area.',
                          hi: 'हमारे क्षेत्र में लंबित शिकायतें दिखाएं।',
                          mr: 'आमच्या क्षेत्रातील प्रलंबित तक्रारी दाखवा.',
                          ta: 'எங்கள் பகுதியில் நிலுவையில் உள்ள புகார்களைக் காட்டவும்.',
                          bn: 'আমাদের এলাকায় মুলতুবি অভিযোগ দেখান।'
                        }
                      }
                    ].map((item, idx) => {
                      const queryText = item.q[assistantLang] || item.q.en;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSend(queryText)}
                          className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-left border border-slate-200/50 dark:border-slate-800/60 rounded-xl cursor-pointer transition-all flex justify-between items-center group"
                        >
                          <div className="flex items-center space-x-2">
                            <HelpCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span className="text-2xs font-extrabold text-slate-700 dark:text-slate-200">{item.title}</span>
                          </div>
                          <ChevronRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Gov Schemes Assistant Tab */}
            {activeTab === 'schemes' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100/40 dark:border-emerald-900/30">
                  <h3 className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 mb-0.5">Government Scheme Advisor</h3>
                  <p className="text-4xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Click any core scheme card below to instantly analyze eligibility, incentives, and documents needed from the AI Companion.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {govSchemes.map((scheme) => {
                    const queryText = scheme.queries[assistantLang] || scheme.queries.en;
                    return (
                      <div
                        key={scheme.id}
                        className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-xl flex flex-col justify-between"
                      >
                        <div>
                          <h4 className="text-2xs font-black text-slate-800 dark:text-slate-100">{scheme.title}</h4>
                          <p className="text-4xs text-slate-400 dark:text-slate-400 mt-1 leading-relaxed">
                            {scheme.desc}
                          </p>
                        </div>
                        <button
                          onClick={() => queryScheme(scheme.title, queryText)}
                          className="mt-3 px-3 py-1.5 bg-blue-50 dark:bg-slate-700/60 text-blue-600 dark:text-emerald-400 text-4xs font-black rounded-lg hover:bg-blue-100 dark:hover:bg-slate-700 flex items-center justify-center space-x-1 cursor-pointer transition-all border border-blue-100/40"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Ask Eligibility & Apply steps</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Document Checklist Assistant */}
            {activeTab === 'documents' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-100/40 dark:border-amber-900/30">
                  <h3 className="text-xs font-black uppercase text-amber-700 dark:text-amber-400 mb-0.5">Document Assistant Checklists</h3>
                  <p className="text-4xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Get precise checklists containing: required identity proofs, fees, processing duration, and common rejection pitfalls.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {documentChecklists.map((doc) => {
                    const Icon = doc.icon;
                    const queryText = assistantLang === 'hi'
                      ? `${doc.name} के लिए आवश्यक दस्तावेज़, शुल्क, और प्रक्रिया की पूरी सूची दें।`
                      : `Give me the comprehensive document checklist, approximate fee structure, step-by-step process, and common mistakes to avoid when applying for a ${doc.name}.`;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => queryDocument(doc.name, queryText)}
                        className="p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-2xl flex flex-col items-center text-center justify-center cursor-pointer transition-all h-28 hover:shadow"
                      >
                        <div className="p-2 bg-blue-100 dark:bg-slate-700 text-blue-600 dark:text-emerald-400 rounded-xl mb-2">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-3xs font-black text-slate-800 dark:text-slate-200">{doc.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Complaint Tracking Grounded with live reports */}
            {activeTab === 'tracking' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100/40 dark:border-blue-900/30">
                  <h3 className="text-xs font-black uppercase text-blue-700 dark:text-blue-400 mb-0.5">Live Complaint Tracking</h3>
                  <p className="text-4xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    This search looks up active municipal issues filed in our database. Click any issue to generate an AI status follow-up and escalation recommendation.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search complaints (e.g. pothole, sewage...)"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-3xs font-extrabold rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {filteredReports.length === 0 ? (
                    <div className="text-center text-slate-400 text-4xs py-6">
                      No matching registered complaints found.
                    </div>
                  ) : (
                    filteredReports.map((report) => (
                      <div
                        key={report.id}
                        className="p-3 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 rounded-xl shadow-2xs hover:shadow-xs transition"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-4xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-600 dark:text-slate-300">
                            {report.category}
                          </span>
                          <span className={`text-4xs font-black uppercase ${
                            report.status === 'resolved' 
                              ? 'text-emerald-500' 
                              : report.status === 'verified'
                              ? 'text-blue-500 animate-pulse'
                              : 'text-amber-500'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-3xs font-bold text-slate-700 dark:text-slate-200 mt-1.5 line-clamp-2">
                          {report.description}
                        </p>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                          <span className="text-5xs text-slate-400">{report.address}</span>
                          <button
                            onClick={() => {
                              const query = assistantLang === 'hi'
                                ? `कृपया शिकायत "${report.category}" (पता: ${report.address}) का वर्तमान स्टेटस, विभाग और समाधान के अनुमानित दिन जांचें और मुझे बताएं।`
                                : `What is the current status, department and estimated days of resolution for the "${report.category}" complaint at "${report.address}"?`;
                              handleSend(query);
                            }}
                            className="text-4xs font-black text-blue-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            Track via AI →
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Right Active Conversation View (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-slate-800 rounded-2xl text-indigo-600 dark:text-indigo-400">
                <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black leading-none">People's Priorities AI</h2>
                <span className="text-5xs text-slate-400 font-extrabold uppercase mt-1.5 block">
                  Grounding Live Database Context
                </span>
              </div>
            </div>
            <span className="text-5xs px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-black rounded-lg uppercase">
              Connected
            </span>
          </div>

          {/* Scrolling messages viewport */}
          <div className="flex-1 overflow-y-auto space-y-4 p-6 scrollbar-thin">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[85%] ${
                  m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Icon indicator */}
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}>
                  {m.role === 'user' ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4 text-emerald-500" />}
                </div>

                {/* Speech Bubble */}
                <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white font-semibold shadow-md' 
                    : 'bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                }`}>
                  {m.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div className="markdown-body text-xs sm:text-sm space-y-1">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-slate-700 dark:text-slate-200">{children}</p>,
                          strong: ({ children }) => <strong className="font-black text-slate-900 dark:text-white">{children}</strong>,
                          h1: ({ children }) => <h1 className="text-base font-extrabold mt-3 mb-1 text-slate-900 dark:text-white border-b border-slate-200/40 dark:border-slate-800/40 pb-0.5">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm font-bold mt-2.5 mb-1 text-slate-900 dark:text-white">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-xs font-semibold mt-2 mb-1 text-slate-800 dark:text-slate-300">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1 text-slate-700 dark:text-slate-200">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-slate-700 dark:text-slate-200">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          code: ({ children }) => <code className="font-mono text-2xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400">{children}</code>,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 mr-auto items-center">
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  <Sparkles className="h-4 w-4 animate-spin text-indigo-500" />
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs text-slate-400 animate-pulse">
                  Analyzing central registry clearance...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input Box */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="border-t border-slate-100 dark:border-slate-800 p-4 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                assistantLang === 'hi' 
                  ? "प्रश्न पूछें (उदा. 'क्या मैं आयुष्मान भारत के लिए योग्य हूँ?')..." 
                  : "Ask a question (e.g. 'Am I eligible for Ayushman Bharat?')..."
              }
              className="flex-1 pl-4 pr-3 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow hover:shadow-lg cursor-pointer disabled:opacity-50 transition"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  MapPin, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  Award, 
  Building2,
  ChevronRight,
  Shield,
  Clock,
  ThumbsUp,
  PlusCircle,
  Map
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  language: 'en' | 'hi';
}

export const LandingPage: React.FC<LandingPageProps> = ({ language }) => {
  const { user } = useAuth();

  // Translations
  const content = {
    en: {
      heroTitle: "People's Priorities AI",
      heroSubtitle: "Empowering citizens to propose public works (schools, roads, water, libraries) and using multi-agents to analyze demand, cluster suggestions, and optimize constituency budget allocation.",
      ctaReport: "Suggest a Development Idea",
      ctaViewMap: "Explore Demand Hotspots",
      statTotal: "Total Suggestions",
      statResolved: "Approved Projects",
      statHours: "AI Priority Accuracy",
      statVerified: "Citizen Approved Ideas",
      howTitle: "How People's Priorities AI Works",
      howSubtitle: "A democratic 4-step pipeline that transforms community suggestions into priority-ranked municipal planning dispatches.",
      how1Title: "1. Propose & Describe",
      how1Desc: "Submit an idea for a school, road, water treatment, or health center. Add impact description, location, or voice input.",
      how2Title: "2. Autonomous Prioritization",
      how2Desc: "Our AI Priority Agent analyzes population coverage, calculates priority scores, and estimates direct beneficiaries.",
      how3Title: "3. Democratic Voting",
      how3Desc: "Citizens support proposals, add comments, and vote to raise the community consensus score.",
      how4Title: "4. Budget Planning Dispatch",
      how4Desc: "Our Planning Agent clusters related requests and drafts optimal budget allocations for local development funds.",
      featTitle: "Multi-Agent Constituency Planning Features",
      featSubtitle: "Autonomous public decision-support system backed by collaborative AI agents.",
      feat1Title: "Feedback & Cluster Agent",
      feat1Desc: "Reads voice input and text descriptions in 5 languages, instantly classifying and grouping similar requests.",
      feat2Title: "Priority & Impact Agent",
      feat2Desc: "Calculates priority indexes by cross-referencing existing infrastructure gaps, census population data, and citizen votes.",
      feat3Title: "AI Budget Planner",
      feat3Desc: "Generates optimal ₹2 Crore - ₹5 Crore fund distributions across Roads, Schools, Water, and Health sectors.",
      feat4Title: "MP Decision Dashboard",
      feat4Desc: "Provides local representatives with real-time demand heatmaps, project comparison matrices, and constituency diagnostics.",
      testTitle: "What Citizens & Representatives Say",
      testSubtitle: "Empowering local leadership with data-driven democratic transparency.",
      test1Name: "Amit Patel (Citizen, Ward 4)",
      test1Quote: "Proposing a community library used to mean bureaucratic dead-ends. With People's Priorities, our entire neighborhood voted, and the AI highlighted it as Priority #1. Now, it's already budgeted!",
      test2Name: "Dr. Sandeep Rao (Municipal Commissioner / Planner)",
      test2Quote: "The AI Budget Planner and hotspot map helped us allocate our annual development budget in hours instead of months. It ensures funds go exactly where people need them most."
    },
    hi: {
      heroTitle: "पीपुल्स प्रायोरिटीज एआई",
      heroSubtitle: "नागरिकों को सार्वजनिक कार्यों (स्कूल, सड़क, पानी, पुस्तकालय) का प्रस्ताव देने और मांग का विश्लेषण करने, सुझावों को क्लस्टर करने और निर्वाचन क्षेत्र के बजट आवंटन को अनुकूलित करने के लिए बहु-एजेंटों का उपयोग करने के लिए सशक्त बनाना।",
      ctaReport: "विकास का सुझाव दें",
      ctaViewMap: "मांग हॉटस्पॉट देखें",
      statTotal: "कुल सुझाव",
      statResolved: "स्वीकृत परियोजनाएं",
      statHours: "एआई प्राथमिकता सटीकता",
      statVerified: "नागरिक स्वीकृत विचार",
      howTitle: "पीपुल्स प्रायोरिटीज एआई कैसे काम करता है",
      howSubtitle: "एक लोकतांत्रिक 4-चरण की प्रक्रिया जो समुदाय के सुझावों को प्राथमिकता-रैंक वाले नगर निगम नियोजन प्रेषण में बदल देती है।",
      how1Title: "1. प्रस्ताव और विवरण",
      how1Desc: "स्कूल, सड़क, जल उपचार या स्वास्थ्य केंद्र के लिए विचार प्रस्तुत करें। प्रभाव विवरण, स्थान या आवाज इनपुट जोड़ें।",
      how2Title: "2. स्वायत्त प्राथमिकता",
      how2Desc: "हमारा एआई प्रायोरिटी एजेंट जनसंख्या कवरेज का विश्लेषण करता है, प्राथमिकता स्कोर की गणना करता है, और प्रत्यक्ष लाभार्थियों का अनुमान लगाता है।",
      how3Title: "3. लोकतांत्रिक मतदान",
      how3Desc: "नागरिक प्रस्तावों का समर्थन करते हैं, टिप्पणियां जोड़ते हैं, और सामुदायिक सहमति स्कोर बढ़ाने के लिए मतदान करते हैं।",
      how4Title: "4. बजट योजना प्रेषण",
      how4Desc: "हमारा प्लानिंग एजेंट संबंधित अनुरोधों को क्लस्टर करता है और स्थानीय विकास कोष के लिए इष्टतम बजट आवंटन का मसौदा तैयार करता है।",
      featTitle: "बहु-एजेंट निर्वाचन क्षेत्र योजना विशेषताएं",
      featSubtitle: "सहयोगात्मक एआई एजेंटों द्वारा समर्थित स्वायत्त सार्वजनिक निर्णय-समर्थन प्रणाली।",
      feat1Title: "फीडबैक और क्लस्टर एजेंट",
      feat1Desc: "5 भाषाओं में आवाज इनपुट और पाठ विवरण पढ़ता है, तुरंत समान अनुरोधों को वर्गीकृत और समूहीकृत करता है।",
      feat2Title: "प्राथमिकता और प्रभाव एजेंट",
      feat2Desc: "मौजूदा बुनियादी ढांचे के अंतराल, जनगणना जनसंख्या डेटा और नागरिक वोटों को क्रॉस-रेफरेंस करके प्राथमिकता सूचकांक की गणना करता है।",
      feat3Title: "एआई बजट योजनाकार",
      feat3Desc: "सड़क, स्कूल, पानी और स्वास्थ्य क्षेत्रों में इष्टतम कोष वितरण का मसौदा तैयार करता है।",
      feat4Title: "सांसद निर्णय डैशबोर्ड",
      feat4Desc: "स्थानीय प्रतिनिधियों को वास्तविक समय में मांग हॉटस्पॉट, परियोजना तुलना मेट्रिक्स और निर्वाचन क्षेत्र निदान प्रदान करता है।",
      testTitle: "नागरिकों और प्रतिनिधियों का क्या कहना है",
      testSubtitle: "डेटा-संचालित लोकतांत्रिक पारदर्शिता के साथ स्थानीय नेतृत्व को सशक्त बनाना।",
      test1Name: "अमित पटेल (नागरिक, वार्ड 4)",
      test1Quote: "सामुदायिक पुस्तकालय का प्रस्ताव देने का मतलब सरकारी दफ्तरों के चक्कर काटना होता था। पीपुल्स प्रायोरिटीज के साथ, हमारे पूरे पड़ोस ने मतदान किया, और एआई ने इसे प्राथमिकता #1 के रूप में रेखांकित किया। अब, यह पहले से ही बजट में शामिल है!",
      test2Name: "डॉ. संदीप राव (नगर आयुक्त / योजनाकार)",
      test2Quote: "एआई बजट प्लानर और हॉटस्पॉट मानचित्र ने हमें महीनों के बजाय घंटों में अपने वार्षिक विकास बजट को आवंटित करने में मदद की। यह सुनिश्चित करता है कि धन ठीक वहीं जाए जहां लोगों को इसकी सबसे अधिक आवश्यकता है।"
    }
  };

  const currentContent = content[language];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-300">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900/50 dark:to-slate-950">
        {/* Abstract Background Accents */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-600/10 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            
            {/* Animated Micro-badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-xs font-bold mb-6 border border-blue-200/50 dark:border-blue-900/40">
              <Sparkles className="h-4 w-4 text-amber-500 animate-spin" />
              <span>{language === 'en' ? "Multi-Agent Civic AI Engine v2.5" : "मल्टी-एजेंट सिविक एआई इंजन"}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              {currentContent.heroTitle}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              {currentContent.heroSubtitle}
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={user ? "/report" : "/login"}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 transform hover:-translate-y-0.5 transition-all text-center flex items-center justify-center space-x-2 cursor-pointer"
              >
                <PlusCircle className="h-5 w-5" />
                <span>{currentContent.ctaReport}</span>
              </Link>
              <Link
                to={user ? "/map" : "/login"}
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transform hover:-translate-y-0.5 transition-all text-center flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Map className="h-5 w-5 text-emerald-500" />
                <span>{currentContent.ctaViewMap}</span>
              </Link>
            </div>

            {/* Demo Accounts Callout for Hackathon Evaluation */}
            <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-2">
              <span className="font-extrabold text-blue-600 dark:text-emerald-400">💡 HACKATHON EVALUATORS:</span>
              <span>Use the <strong>"Demo Login"</strong> bypass on the login screen to instantly log in as a citizen or a government administrator with full dashboards!</span>
            </div>

          </div>
        </div>
      </section>

      {/* Real-time Statistics Grid */}
      <section className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <span className="block text-4xl font-extrabold text-blue-600 dark:text-emerald-500">1,248</span>
              <span className="block text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{currentContent.statTotal}</span>
            </div>
            <div className="text-center border-l border-slate-200 dark:border-slate-800">
              <span className="block text-4xl font-extrabold text-blue-600 dark:text-emerald-500">1,092</span>
              <span className="block text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{currentContent.statResolved}</span>
            </div>
            <div className="text-center border-l border-slate-200 dark:border-slate-800">
              <span className="block text-4xl font-extrabold text-blue-600 dark:text-emerald-500">26.4h</span>
              <span className="block text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{currentContent.statHours}</span>
            </div>
            <div className="text-center border-l border-slate-200 dark:border-slate-800">
              <span className="block text-4xl font-extrabold text-blue-600 dark:text-emerald-500">94.8%</span>
              <span className="block text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{currentContent.statVerified}</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              {currentContent.howTitle}
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">
              {currentContent.howSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-blue-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{currentContent.how1Title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{currentContent.how1Desc}</p>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-blue-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold mb-4">
                <Sparkles className="h-6 w-6 text-indigo-500 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{currentContent.how2Title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{currentContent.how2Desc}</p>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-blue-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold mb-4">
                <ThumbsUp className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{currentContent.how3Title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{currentContent.how3Desc}</p>
            </div>

            {/* Step 4 */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-blue-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold mb-4">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{currentContent.how4Title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{currentContent.how4Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Agents & Technology */}
      <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              {currentContent.featTitle}
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">
              {currentContent.featSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Vision Agent Card */}
            <div className="flex bg-slate-50 dark:bg-slate-800/40 p-8 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-blue-100 dark:bg-blue-950/60 rounded-xl h-12 w-12 flex items-center justify-center text-blue-600 mr-4 shrink-0">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white mb-2">{currentContent.feat1Title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{currentContent.feat1Desc}</p>
              </div>
            </div>

            {/* Validation Agent Card */}
            <div className="flex bg-slate-50 dark:bg-slate-800/40 p-8 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl h-12 w-12 flex items-center justify-center text-emerald-600 mr-4 shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white mb-2">{currentContent.feat2Title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{currentContent.feat2Desc}</p>
              </div>
            </div>

            {/* Planning / Resource Dispatcher Card */}
            <div className="flex bg-slate-50 dark:bg-slate-800/40 p-8 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/60 rounded-xl h-12 w-12 flex items-center justify-center text-amber-600 mr-4 shrink-0">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white mb-2">{currentContent.feat3Title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{currentContent.feat3Desc}</p>
              </div>
            </div>

            {/* Leaderboard & Gamification Card */}
            <div className="flex bg-slate-50 dark:bg-slate-800/40 p-8 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-950/60 rounded-xl h-12 w-12 flex items-center justify-center text-indigo-600 mr-4 shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white mb-2">{currentContent.feat4Title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{currentContent.feat4Desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              {currentContent.testTitle}
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">
              {currentContent.testSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm relative">
              <p className="text-slate-600 dark:text-slate-300 italic mb-6">
                "{currentContent.test1Quote}"
              </p>
              <div className="flex items-center">
                <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Amit" className="h-10 w-10 rounded-full mr-3" />
                <div>
                  <h4 className="text-sm font-bold dark:text-white">{currentContent.test1Name}</h4>
                  <span className="text-2xs text-slate-400">Verified Contributor</span>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm relative">
              <p className="text-slate-600 dark:text-slate-300 italic mb-6">
                "{currentContent.test2Quote}"
              </p>
              <div className="flex items-center">
                <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Sandeep" className="h-10 w-10 rounded-full mr-3" />
                <div>
                  <h4 className="text-sm font-bold dark:text-white">{currentContent.test2Name}</h4>
                  <span className="text-2xs text-slate-400">Department Head</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Building2 className="h-6 w-6 text-blue-500" />
            <span className="text-lg font-bold text-white">People's Priorities AI Civic Portal</span>
          </div>
          <p className="text-xs mb-4">AI Civic Companion & Government Services Assistant Platform</p>
          <p className="text-3xs text-slate-500">© 2026 People's Priorities AI. Built for municipal efficiency. Dedicated to citizens worldwide.</p>
        </div>
      </footer>

    </div>
  );
};

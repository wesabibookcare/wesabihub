import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useAccountPending } from '../auth/AccountPendingWrapper';
import { permissionService } from '../../services/permissionService';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HelpCircle, X, Search, MessageSquare, BookOpen,
  ChevronRight, Send, Minimize2, Maximize2, Package, Clock,
  ShieldCheck, Scan, Download, Upload, TrendingUp, Activity,
  Map, Navigation, ShieldAlert, ClipboardList, LayoutDashboard,
  MapPin, Sparkles, Brain, Compass, Zap, Image as ImageIcon,
  Cpu, FileImage, Sliders, ArrowDown, RefreshCw, Layers
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { Card } from '../ui/Card';
import { useSettings } from '../../context/SettingsContext';
import { BrandLogo } from '../brand/BrandLogo';

type ViewState = 'home' | 'chat' | 'media-analysis' | 'image-generator';
type AIChatMode = 'general' | 'thinking' | 'maps' | 'low-latency';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  mode?: AIChatMode;
  timestamp: Date;
  groundingLinks?: Array<{ uri: string; title: string }>;
}

export const HelpCenterWidget = () => {
  const { user, fbUser, role } = useAuth();
  const { isPending } = useAccountPending();
  const { settings } = useSettings();
  const brandColor = settings?.branding?.primaryColor || '#2563eb';
  // "Omorfi" (the AI-powered views) are themed with the parent company's
  // (Omorfi) brand identity, distinct from OmorfiHub's own color elsewhere.
  const OMORFI_COLOR = settings?.aiBranding?.primaryColor || '#c93f25';
  const OMORFI_LOGO_URL = settings?.aiBranding?.logo || settings?.omorfiLogo || '/assets/brand/omorfi-logo.png';
  const AI_NAME = settings?.aiBranding?.name || 'Omorfi';
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ViewState>('home');
  const isAIView = view === 'chat' || view === 'media-analysis' || view === 'image-generator';
  const [chatMode, setChatMode] = useState<AIChatMode>('general');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [personas, setPersonas] = useState<any[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Media Analysis states
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaPrompt, setMediaPrompt] = useState('Inspect this item and verify packaging, safety seal, and label conditions.');
  const [mediaResult, setMediaResult] = useState<string | null>(null);
  const [isAnalyzingMedia, setIsAnalyzingMedia] = useState(false);

  // Image Generator states
  const [generatorPrompt, setGeneratorPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [selectedQuality, setSelectedQuality] = useState<'general' | 'studio'>('general');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatorError, setGeneratorError] = useState<string | null>(null);

  // Dynamic widget configuration loaded from DB
  const [widgetConfig, setWidgetConfig] = useState({
    welcomeMessage: "Welcome to OmorfiHub.",
    initialGreeting: "How can we help you today?",
    retrievalDelayMessage: "Please wait while we check that for you..."
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setView('chat');
    };
    window.addEventListener('open-help-center', handleOpen);
    return () => window.removeEventListener('open-help-center', handleOpen);
  }, []);

  // Fetch help center config from DB on open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/chat/config')
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setWidgetConfig(data);
          }
        })
        .catch(err => console.error("Error loading widget config:", err));
      fetch('/api/chat/personas')
        .then(res => res.json())
        .then(data => {
          setPersonas(data);
          if (data.length > 0) setSelectedPersonaId(data[0].id);
        })
        .catch(err => console.error("Error loading personas:", err));
    }
  }, [isOpen]);

  const isMobile = windowWidth < 768;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // 1. Unified Gemini AI Chat send
  const handleSend = async () => {
    if (!message.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: message,
      mode: chatMode,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentMessage = message;
    setMessage('');
    setIsTyping(true);

    try {
      // Retrieve the Firebase ID Token securely to pass role validation on the backend
      let token = null;
      if (fbUser) {
        try {
          token = await fbUser.getIdToken();
        } catch (tokenErr) {
          console.error("[HelpCenterWidget] Error retrieving ID token:", tokenErr);
        }
      }

      // Build proper chat history for Gemini
      const apiHistory = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: currentMessage,
          personaId: selectedPersonaId || undefined,
          context: {
            user: fbUser ? { uid: fbUser.uid, email: fbUser.email, role: role } : undefined
          }
        })
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textErr = await res.text();
        throw new Error(textErr || `Server returned non-JSON response (${res.status})`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.text || `HTTP error! Status: ${res.status}`);
      }

      let groundingLinks: Array<{ uri: string; title: string }> | undefined = undefined;
      if (data.groundingChunks) {
        groundingLinks = data.groundingChunks
          .filter((chunk: any) => chunk.web)
          .map((chunk: any) => ({
            uri: chunk.web.uri,
            title: chunk.web.title
          }));
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'agent',
        text: data.text || data.error || "Omorfi response received.",
        timestamp: new Date(),
        groundingLinks
      }]);
    } catch (err: any) {
      console.error("[HelpCenterWidget] AI Chat failed:", err);
      let errorText = err.message || "Sorry, I am having connection difficulties. Let me know if you would like me to create an offline Support Ticket for our operations team.";

      const rawMsg = err.message || '';
      if (rawMsg.includes("GEMINI_API_KEY") || rawMsg.includes("api key") || rawMsg.includes("API key")) {
        errorText = "The Omorfi chatbot is currently offline because the Gemini API Key is not configured in environment variables or Settings. Please set GEMINI_API_KEY to activate assistance.";
      } else if (rawMsg.includes("Firebase not configured")) {
        errorText = "The AI Chatbot requires a Firebase Service Account. Please ensure FIREBASE_SERVICE_ACCOUNT_KEY is configured in your platform settings.";
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'agent',
        text: errorText,
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // 2. Media Upload & Gemini pro-preview Analysis
  const handleMediaUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeMedia = async () => {
    if (!mediaFile) return;
    setIsAnalyzingMedia(true);
    setMediaResult(null);

    try {
      const base64 = await fileToBase64(mediaFile);
      const res = await fetch('/api/ai/analyze-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaBase64: base64,
          mimeType: mediaFile.type,
          prompt: mediaPrompt
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP error! Status: ${res.status}`);
      }
      if (data.error) {
        setMediaResult(`Analysis Error: ${data.error}`);
      } else {
        setMediaResult(data.text);
      }
    } catch (err: any) {
      setMediaResult(`Failed to analyze media: ${err.message}`);
    } finally {
      setIsAnalyzingMedia(false);
    }
  };

  // 3. AI Image Generation with Aspect Ratio controls
  const handleGenerateImage = async () => {
    if (!generatorPrompt.trim()) return;
    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);
    setGeneratorError(null);

    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: generatorPrompt,
          aspectRatio: selectedRatio,
          quality: selectedQuality
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP error! Status: ${res.status}`);
      }
      if (data.error) {
        setGeneratorError(data.error);
      } else {
        setGeneratedImageUrl(data.imageUrl);
      }
    } catch (err: any) {
      setGeneratorError(`Generation failed: ${err.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Role actions mappings
  const getRoleActions = () => {
    // If user is unauthenticated, they are a GUEST on the public landing page.
    if (!user) {
      return [
        { icon: ClipboardList, label: 'Create a Free Account', action: () => { setIsOpen(false); navigate('/register'); }, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        { icon: LayoutDashboard, label: 'Login to My Portal', action: () => { setIsOpen(false); navigate('/login'); }, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { icon: ShieldCheck, label: 'About Payment Protection', action: () => { setIsOpen(false); navigate('/how-it-works'); }, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { icon: TrendingUp, label: 'Check Delivery Rates', action: () => { setIsOpen(false); navigate('/pricing'); }, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        { icon: Search, label: 'Verify Branded Receipt', action: () => { setIsOpen(false); navigate('/verify-receipt'); }, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        { icon: MessageSquare, label: 'Chat with Omorfi', action: () => setView('chat'), color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20' },
      ];
    }

    const activeUserRole = role || user?.role;
    switch(activeUserRole) {
      case 'MERCHANT':
        return [
          { icon: Package, label: 'Create Shipment', action: () => { setIsOpen(false); navigate('/merchant/shipments/create'); }, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { icon: Clock, label: 'Shipment History', action: () => { setIsOpen(false); navigate('/merchant/shipments/history'); }, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { icon: ShieldCheck, label: 'Payment Protection Control', action: () => { setIsOpen(false); navigate('/merchant/payment-protection'); }, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { icon: FileImage, label: 'Inspect Shipment Label', action: () => setView('media-analysis'), color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { icon: MessageSquare, label: 'Omorfi Customer Care', action: () => setView('chat'), color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20' },
        ];
      case 'POINT_OWNER':
      case 'POINT_STAFF':
      case 'CENTER_OWNER':
      case 'CENTER_STAFF':
        return [
          { icon: Scan, label: 'Scan Parcel QR', action: () => { setIsOpen(false); navigate('/point/search'); }, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { icon: Download, label: 'Incoming Parcels', action: () => { setIsOpen(false); navigate('/point/parcels/receive'); }, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { icon: Upload, label: 'Outgoing Parcels', action: () => { setIsOpen(false); navigate('/point/parcels/release'); }, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { icon: FileImage, label: 'Audit Parcel Photo', action: () => setView('media-analysis'), color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { icon: MessageSquare, label: 'Omorfi Support', action: () => setView('chat'), color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20' },
        ];
      case 'LOGISTICS_OWNER':
      case 'LOGISTICS_COMPANY':
      case 'DRIVER':
      case 'DISPATCH_RIDER':
        return [
          { icon: Map, label: 'Assigned Deliveries', action: () => { setIsOpen(false); navigate('/logistics/jobs'); }, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { icon: Navigation, label: 'Route Assistance', action: () => { setIsOpen(false); navigate('/logistics/routes'); }, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { icon: FileImage, label: 'Analyze Delivery Photo', action: () => setView('media-analysis'), color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { icon: MessageSquare, label: 'Omorfi Support', action: () => setView('chat'), color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20' },
        ];
      case 'SUPER_ADMIN':
      case 'OPERATIONS_MANAGER':
        return [
          { icon: ShieldAlert, label: 'Security Alerts', action: () => { setIsOpen(false); navigate('/admin/audit'); }, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
          { icon: LayoutDashboard, label: 'Help Center Config', action: () => { setIsOpen(false); navigate('/admin/help-center'); }, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { icon: FileImage, label: 'Analyze Proof of Delivery', action: () => setView('media-analysis'), color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { icon: MessageSquare, label: 'Chat with Omorfi', action: () => setView('chat'), color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20' },
        ];
      default:
        const isApprovedMerchant = (user?.roles?.includes('MERCHANT') || user?.role === 'MERCHANT') &&
          (user?.status === 'APPROVED' || user?.status === 'ACTIVE' || user?.verificationStatus?.kyc === true);
        const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN') || user?.role === 'SUPER_ADMIN' || user?.email === 'wesabibookcare@gmail.com';
        const canSendParcel = isApprovedMerchant || isSuperAdmin;

        return [
          canSendParcel
            ? { icon: Send, label: 'Send a Parcel', action: () => { setIsOpen(false); navigate('/customer/send'); }, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' }
            : { icon: Send, label: 'Send Parcels (Apply as Merchant)', action: () => { setIsOpen(false); navigate('/customer/settings?tab=roles&apply=MERCHANT'); }, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { icon: Search, label: 'Track My Parcel', action: () => { setIsOpen(false); navigate('/customer/track'); }, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { icon: MessageSquare, label: 'Omorfi Customer Care', action: () => setView('chat'), color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20' },
          { icon: FileImage, label: 'Analyze Package Photo', action: () => setView('media-analysis'), color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { icon: MapPin, label: 'Find a Hub Point', action: () => { setIsOpen(false); navigate('/customer/hubs'); }, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ];
    }
  };

  const menuItems = getRoleActions();

  if (isPending) return null;

  return (
    <div className="fixed z-50 pointer-events-none inset-0 flex items-end justify-end p-4 md:p-6 lg:p-8 pb-[max(env(safe-area-inset-bottom,16px),16px)]">
      <AnimatePresence>
        {isOpen && (
          <>
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto z-40"
                onClick={() => setIsOpen(false)}
              />
            )}

            <motion.div
              initial={isMobile ? { y: '100%' } : { opacity: 0, x: '100%' }}
              animate={isMobile ? { y: 0 } : { opacity: 1, x: 0 }}
              exit={isMobile ? { y: '100%' } : { opacity: 0, x: '100%' }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className={cn(
                "pointer-events-auto bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col z-50",
                isMobile
                  ? "fixed bottom-0 left-0 right-0 h-[85vh] rounded-t-3xl border-t border-slate-200 dark:border-slate-800"
                  : "fixed top-0 right-0 bottom-0 w-[380px] lg:w-[460px] border-l border-slate-200 dark:border-slate-800"
              )}
            >
              {/* Universal Header */}
              <div style={{ backgroundColor: isAIView ? OMORFI_COLOR : brandColor }} className="p-4 text-white shrink-0 flex items-center justify-between relative overflow-hidden">
                {isAIView && (
                  <img
                    src={OMORFI_LOGO_URL}
                    alt=""
                    aria-hidden="true"
                    className="absolute -right-4 -top-6 w-24 h-24 opacity-20 object-contain pointer-events-none select-none"
                  />
                )}
                {view !== 'home' ? (
                  <div className="flex items-center gap-3">
                    <button onClick={() => setView('home')} className="p-1 hover:bg-primary-700 rounded-lg transition-colors">
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <div>
                      <h3 className="font-bold text-sm">
                        {view === 'chat' && 'Live Omorfi Chat'}
                        {view === 'media-analysis' && 'Omorfi Vision Specialist'}
                        {view === 'image-generator' && 'Omorfi Designer Studio'}
                      </h3>
                      <p className="text-[10px] text-primary-100">
                        {view === 'chat' && 'Grounded Multi-turn Conversation'}
                        {view === 'media-analysis' && 'Image & Video Understanding'}
                        {view === 'image-generator' && 'Custom Aspect Ratio Designs'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold font-display text-lg">{settings?.platformName || 'OmorfiHub'} Help Center</h3>
                    <p className="text-xs text-primary-100">{widgetConfig.welcomeMessage}</p>
                  </div>
                )}

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-primary-700 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* View Panel */}
              <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 relative">
                {isAIView && (
                  <img
                    src={OMORFI_LOGO_URL}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 m-auto w-48 h-48 opacity-[0.04] dark:opacity-[0.06] object-contain pointer-events-none select-none"
                  />
                )}

                {/* 1. HOME VIEW */}
                {view === 'home' && (
                  <div className="p-4 space-y-6">
                    <div className="text-center space-y-2 mt-4">
                       <h4 className="text-lg font-bold text-slate-900 dark:text-white">Need help? Let Omorfi assist!</h4>
                       <p className="text-xs text-slate-500 dark:text-slate-400">Complete E2E workflows fully integrated with Omorfi Intelligence.</p>
                    </div>

                    {/* Omorfi Feature Quick Shortcuts */}
                    <div className="grid grid-cols-2 gap-2 bg-gradient-to-tr from-primary-50 to-indigo-50 dark:from-primary-950/20 dark:to-indigo-950/20 p-3 rounded-2xl border border-primary-100/50 dark:border-primary-900/30">
                      <button
                        onClick={() => { setView('chat'); setChatMode('general'); }}
                        className="flex flex-col items-center p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center shadow-sm"
                      >
                        <MessageSquare className="w-4 h-4 text-primary-600 mb-1 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Agent Chat</span>
                      </button>

                      <button
                        onClick={() => setView('media-analysis')}
                        className="flex flex-col items-center p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center shadow-sm relative"
                      >
                        <FileImage className="w-4 h-4 text-emerald-600 mb-1" />
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
                          Vision {!user && "🔒"}
                        </span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">Services & Operations</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {menuItems.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={item.action}
                            className="w-full flex flex-col items-center justify-center gap-2 p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl transition-colors group text-center shadow-sm"
                          >
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", item.bg, item.color)}>
                              <item.icon className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary-600 transition-colors text-xs line-clamp-2">
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. CHAT VIEW */}
                {view === 'chat' && (
                  <div className="flex flex-col h-full">
                    {/* Model Mode Selection Bar */}
                    <div className="p-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between gap-1 overflow-x-auto shrink-0 scrollbar-none">
                      <button
                        onClick={() => setChatMode('general')}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                          chatMode === 'general' ? "bg-primary-600 text-white" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        )}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> General (Care)
                      </button>

                      {/* High Thinking - Admin/Support Only */}
                      {(role === 'SUPER_ADMIN' || role === 'SUPPORT_OFFICER' || role === 'OPERATIONS_MANAGER') && (
                        <button
                          onClick={() => setChatMode('thinking')}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                            chatMode === 'thinking' ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          )}
                        >
                          <Brain className="w-3.5 h-3.5" /> High Thinking
                        </button>
                      )}

                      <button
                        onClick={() => setChatMode('maps')}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                          chatMode === 'maps' ? "bg-emerald-600 text-white" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        )}
                      >
                        <Compass className="w-3.5 h-3.5" /> Maps Finder
                      </button>

                      <button
                        onClick={() => setChatMode('low-latency')}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                          chatMode === 'low-latency' ? "bg-amber-600 text-white" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        )}
                      >
                        <Zap className="w-3.5 h-3.5" /> Quick Help
                      </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                      {messages.length === 0 && (
                        <div className="text-center py-6 space-y-4">
                          <div className="w-14 h-14 rounded-full overflow-hidden mx-auto border-2 border-primary-200 shadow-md">
                            <video
                              src="/assets/brand/omorfi-avatar.mp4"
                              autoPlay loop muted playsInline
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2">
                              {Array.isArray(personas) && personas.find(p => p.id === selectedPersonaId)?.profilePictureUrl && (
                                  <img src={personas.find(p => p.id === selectedPersonaId)?.profilePictureUrl} className="w-6 h-6 rounded-full" />
                              )}
                              {Array.isArray(personas) ? (personas.find(p => p.id === selectedPersonaId)?.name || 'Support Assistant') : 'Support Assistant'}
                            </p>
                            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                              {chatMode === 'general' && 'A robust support bot optimized for payment protection, rules, and general operations.'}
                              {chatMode === 'thinking' && 'Executes extremely deep reasoning for legal disputes or financial audit checks.'}
                              {chatMode === 'maps' && 'Perfect to search geographical coordinates, hub locations, and route states.'}
                              {chatMode === 'low-latency' && 'Provides instant answers for simple queries.'}
                            </p>
                          </div>

                          {/* Quick Action Suggestion Pills */}
                          <div className="pt-2 max-w-xs mx-auto space-y-1.5">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center">Suggested Quick Questions</p>
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {[
                                'How does SafePay work?',
                                'Track my parcel',
                                'Find nearest OmorfiHub',
                                'Check delivery fees'
                              ].map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setMessage(suggestion);
                                  }}
                                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all text-left shadow-xs"
                                >
                                  ✨ {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === 'user' ? "flex-row-reverse" : "flex-row")}>
                          {msg.sender !== 'user' && (
                            <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-primary-200 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              {Array.isArray(personas) && personas.find(p => p.id === selectedPersonaId)?.profilePictureUrl ? (
                                <img src={personas.find(p => p.id === selectedPersonaId)?.profilePictureUrl} className="w-full h-full object-cover" alt="AI Avatar" />
                              ) : (
                                <video src="/assets/brand/omorfi-avatar.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
                              )}
                            </div>
                          )}
                          <div
                          className={cn(
                            "max-w-[85%] rounded-2xl p-3 text-sm flex flex-col gap-1.5 shadow-sm border",
                            msg.sender === 'user'
                              ? "bg-primary-600 text-white ml-auto rounded-tr-sm border-primary-500"
                              : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 mr-auto rounded-tl-sm"
                          )}
                        >
                          <p className="leading-relaxed">{msg.text}</p>

                          {/* Grounding metadata Links */}
                          {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/50 space-y-1 text-xs">
                              <p className="font-bold text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Compass className="w-3 h-3" /> Grounded Search References:
                              </p>
                              {msg.groundingLinks.map((link, idx) => (
                                <a
                                  key={idx}
                                  href={link.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-primary-500 hover:underline truncate"
                                >
                                  📍 {link.title || link.uri}
                                </a>
                              ))}
                            </div>
                          )}

                          <span className={cn(
                            "text-[9px] block text-right mt-1 font-mono",
                            msg.sender === 'user' ? "text-primary-100" : "text-slate-400"
                          )}>
                            {msg.mode ? `${msg.mode.toUpperCase()} • ` : ''}
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        </div>
                      ))}

                      {isTyping && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 w-fit rounded-2xl rounded-tl-sm p-4 flex gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          placeholder={`Ask Omorfi via ${chatMode} mode...`}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                          className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-950 dark:text-white"
                        />
                        <button
                          onClick={handleSend}
                          disabled={!message.trim()}
                          className="absolute right-2 w-8 h-8 flex items-center justify-center bg-primary-600 text-white rounded-full disabled:opacity-50 disabled:bg-slate-300 transition-colors"
                        >
                          <Send className="w-4 h-4 -ml-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. MEDIA ANALYSIS VIEW */}
                {view === 'media-analysis' && (
                  !user ? (
                    <div className="p-6 text-center space-y-4 my-8 animate-fade-in">
                      <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center mx-auto text-amber-500">
                        <ShieldAlert className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-slate-950 dark:text-white">Premium Feature Locked</h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                        Omorfi Forensic Package & Document Audit is a secure feature reserved for registered users. Create a free account or login to unlock.
                      </p>
                      <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
                        <Button onClick={() => { setIsOpen(false); navigate('/register'); }} className="bg-primary-600 text-white rounded-xl font-bold py-2.5">
                          Create Free Account
                        </Button>
                        <button onClick={() => { setIsOpen(false); navigate('/login'); }} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline py-1.5">
                          Login to Account
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 space-y-5">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                        <FileImage className="w-4 h-4 text-emerald-500" /> Upload Image / Document
                      </h4>

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition-colors"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleMediaUploadChange}
                          accept="image/*,video/*"
                          className="hidden"
                        />
                        {mediaPreview ? (
                          <div className="space-y-2">
                            <img src={mediaPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain shadow-sm" />
                            <p className="text-xs text-slate-500 truncate">{mediaFile?.name}</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag & drop or Click to upload</p>
                            <p className="text-[10px] text-slate-400">Supports JPG, PNG, WEBP, MP4, etc.</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Analysis Instructions / Prompt</label>
                        <textarea
                          rows={3}
                          value={mediaPrompt}
                          onChange={(e) => setMediaPrompt(e.target.value)}
                          className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white"
                          placeholder="Type what you want Omorfi to analyze..."
                        />
                      </div>

                      <Button
                        onClick={handleAnalyzeMedia}
                        disabled={!mediaFile || isAnalyzingMedia}
                        className="w-full gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isAnalyzingMedia ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing via Omorfi...
                          </>
                        ) : (
                          <>
                            <Cpu className="w-4 h-4" /> Run Forensic Audit
                          </>
                        )}
                      </Button>
                    </div>

                    {mediaResult && (
                      <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950 p-4 rounded-xl space-y-2 shadow-sm animate-fade-in">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">Omorfi Audit Analysis</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{mediaResult}</p>
                      </div>
                    )}
                  </div>
                )
              )}

                {/* 4. IMAGE GENERATOR VIEW */}
                {view === 'image-generator' && (
                  !user ? (
                    <div className="p-6 text-center space-y-4 my-8 animate-fade-in">
                      <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/20 rounded-full flex items-center justify-center mx-auto text-purple-500">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-slate-950 dark:text-white">Creative Studio Locked</h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                        Omorfi Designer Studio allows users to create custom promotional design assets. Please sign up or login to continue.
                      </p>
                      <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
                        <Button onClick={() => { setIsOpen(false); navigate('/register'); }} className="bg-primary-600 text-white rounded-xl font-bold py-2.5">
                          Create Free Account
                        </Button>
                        <button onClick={() => { setIsOpen(false); navigate('/login'); }} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline py-1.5">
                          Login to Account
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 space-y-5">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-purple-500" /> Omorfi Creative Prompt
                      </h4>

                      <textarea
                        rows={3}
                        value={generatorPrompt}
                        onChange={(e) => setGeneratorPrompt(e.target.value)}
                        className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-1 focus:ring-purple-500 text-slate-900 dark:text-white"
                        placeholder="Describe the image you want Omorfi to generate..."
                      />

                      {/* Aspect Ratio controls */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5 text-purple-500" /> Aspect Ratio Selector
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'].map(ratio => (
                            <button
                              key={ratio}
                              onClick={() => setSelectedRatio(ratio)}
                              className={cn(
                                "py-1.5 text-[10px] font-bold rounded-lg border transition-all",
                                selectedRatio === ratio
                                  ? "bg-purple-600 text-white border-purple-600"
                                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                              )}
                            >
                              {ratio}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quality Controls */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-purple-500" /> Engine Quality
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setSelectedQuality('general')}
                            className={cn(
                              "py-1.5 text-xs font-bold rounded-lg border transition-all",
                              selectedQuality === 'general'
                                ? "bg-purple-600 text-white border-purple-600"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            )}
                          >
                            ⚡ Lite-Image
                          </button>
                          <button
                            onClick={() => setSelectedQuality('studio')}
                            className={cn(
                              "py-1.5 text-xs font-bold rounded-lg border transition-all",
                              selectedQuality === 'studio'
                                ? "bg-purple-600 text-white border-purple-600"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            )}
                          >
                            💎 Studio-Image
                          </button>
                        </div>
                      </div>

                      <Button
                        onClick={handleGenerateImage}
                        disabled={!generatorPrompt.trim() || isGeneratingImage}
                        className="w-full gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {isGeneratingImage ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Generating Studio Design...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" /> Create Omorfi Design
                          </>
                        )}
                      </Button>
                    </div>

                    {generatorError && (
                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-3 rounded-xl text-xs text-red-600 dark:text-red-400">
                        {generatorError}
                      </div>
                    )}

                    {generatedImageUrl && (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-4 shadow-sm animate-fade-in text-center">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-purple-600 dark:text-purple-400">Generated Creative</p>
                        <img src={generatedImageUrl} alt="Generated Layout" className="rounded-lg shadow-sm max-w-full mx-auto border" />
                        <a
                          href={generatedImageUrl}
                          download={`omorfihub-ai-${Date.now()}.png`}
                          className="inline-flex items-center gap-2 text-xs font-bold text-purple-600 hover:underline"
                        >
                          <ArrowDown className="w-4 h-4" /> Download Design
                        </a>
                      </div>
                    )}
                  </div>
                )
              )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Widget Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            drag
            dragConstraints={{ left: -windowWidth + 80, right: 0, top: -window.innerHeight + 80, bottom: 0 }}
            dragElastic={0.1}
            className="pointer-events-auto cursor-grab active:cursor-grabbing flex items-center gap-3 select-none"
          >
            {!user && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="hidden md:flex items-center bg-white dark:bg-slate-900 border border-primary-200 dark:border-primary-900 shadow-xl rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 font-bold gap-2 shrink-0 border-l-4 border-l-primary-600"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Ask Omorfi ⚡</span>
              </motion.div>
            )}
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              style={{ backgroundColor: brandColor }}
              className={cn(
                "text-white rounded-full shadow-xl flex items-center justify-center transition-colors border-4 border-white dark:border-slate-900 shrink-0 overflow-hidden",
                "w-12 h-12 md:w-14 md:h-14 lg:w-12 lg:h-12"
              )}
            >
              {settings?.branding?.appIconUrl || settings?.branding?.logoUrl ? (
                <img
                  src={settings.branding.appIconUrl || settings.branding.logoUrl}
                  alt={settings?.platformName || 'OmorfiHub'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <HelpCircle className="w-5 h-5 md:w-6 md:h-6 lg:w-5 lg:h-5" />
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

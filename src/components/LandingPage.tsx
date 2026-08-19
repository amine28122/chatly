import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Zap, 
  Code2, 
  Palette, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  ShoppingBag, 
  Activity, 
  Layers, 
  ShieldCheck, 
  Headphones, 
  Star,
  MonitorPlay,
  Diamond,
  Sliders,
  ChevronRight,
  Clock,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { Chatbot } from '../types';
import { ChatWidget } from './ChatWidget';

interface LandingPageProps {
  demoBot: Chatbot;
  onGetStarted: () => void;
  onOpenSimulator: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  demoBot,
  onGetStarted,
  onOpenSimulator,
}) => {
  const [activeThemeColor, setActiveThemeColor] = useState('#6366f1');
  const [activePreset, setActivePreset] = useState<'midnight-luxury' | 'emerald-concierge' | 'cyber-violet'>('midnight-luxury');

  const themeVariants: Record<string, { primary: string; name: string; icon: string }> = {
    'midnight-luxury': { primary: '#6366f1', name: 'Haute Horlogerie & Fashion', icon: '💎' },
    'emerald-concierge': { primary: '#059669', name: 'Longevity & Medical Clinic', icon: '✨' },
    'cyber-violet': { primary: '#8b5cf6', name: 'Next-Gen Enterprise Cloud', icon: '⚡' },
  };

  const currentPreviewBot: Chatbot = {
    ...demoBot,
    widgetConfig: {
      ...demoBot.widgetConfig,
      primaryColor: themeVariants[activePreset].primary,
      headerTitle: `${themeVariants[activePreset].name} Concierge`,
      welcomeMessage: `Welcome! 🌟 How may I assist you today? Ask about collections, pricing, or custom viewings.`,
    },
  };

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif] text-neutral-100 selection:bg-indigo-500 selection:text-white">
      {/* HERO SECTION */}
      <section className="relative pt-16 pb-24 sm:pt-24 sm:pb-36 overflow-hidden">
        {/* Luminous Ambient Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-12 w-[450px] h-[450px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Copy & Actions (7 Cols) */}
            <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
              {/* Feature Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-neutral-200 text-xs font-semibold shadow-inner backdrop-blur-md">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span>Powered by Gemini 3.7 Flash & Tailored Knowledge Retrieval</span>
              </div>

              {/* Display Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-6xl font-black text-white leading-[1.12] tracking-tight font-['Outfit',sans-serif]">
                Build & Embed{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400">
                  Ultra-Luxurious AI Chatbots
                </span>{' '}
                for Your Website.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-neutral-300 max-w-2xl leading-relaxed mx-auto lg:mx-0 font-normal">
                Train specialized AI concierges on your products, services, and policies. Customize every pixel to match your brand identity, and embed instantly with a single-line script.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  id="btn-hero-start"
                  onClick={onGetStarted}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2.5"
                >
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Start Building Free</span>
                  <ChevronRight className="w-4 h-4 text-indigo-300" />
                </button>

                <button
                  id="btn-hero-sim"
                  onClick={onOpenSimulator}
                  className="px-7 py-4 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-700/80 text-neutral-200 font-bold text-sm backdrop-blur-md transition-all flex items-center gap-2.5 shadow-lg"
                >
                  <MonitorPlay className="w-4 h-4 text-emerald-400" />
                  <span>Preview in Live Website</span>
                </button>
              </div>

              {/* Highlights Badge Row */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-neutral-400 border-t border-neutral-800/80">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Single <code>&lt;script&gt;</code> Integration</span>
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Instant Sub-Second Latency</span>
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Shopify, WordPress, Webflow, Custom</span>
                </span>
              </div>
            </div>

            {/* Right Column: Live Interactive Widget Experience (5 Cols) */}
            <div className="lg:col-span-5 relative">
              {/* Outer border glow */}
              <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500/30 via-violet-500/20 to-emerald-500/30 rounded-3xl blur-xl opacity-60" />

              <div className="relative bg-neutral-950 border border-neutral-800 rounded-3xl p-3 shadow-2xl space-y-3">
                {/* Interactive Preset Switcher */}
                <div className="p-2.5 bg-neutral-900/90 border border-neutral-800/90 rounded-2xl flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Live Widget Preset:</span>
                  </span>

                  <div className="flex items-center gap-1">
                    {(['midnight-luxury', 'emerald-concierge', 'cyber-violet'] as const).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setActivePreset(preset)}
                        className={`text-xs px-2.5 py-1 rounded-xl transition-all font-semibold flex items-center gap-1 ${
                          activePreset === preset
                            ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        <span>{themeVariants[preset].icon}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Embedded Widget Box */}
                <div className="h-[480px] rounded-2xl overflow-hidden shadow-inner">
                  <ChatWidget bot={currentPreviewBot} isEmbedded={true} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-STEP SEAMLESS WORKFLOW */}
      <section className="py-24 bg-neutral-900/50 border-y border-neutral-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-indigo-400 text-xs font-black uppercase tracking-widest">
              Effortless 3-Step Setup
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit',sans-serif]">
              From Zero to Live Website AI in Minutes
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              No machine learning engineering or complex infrastructure required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-neutral-950 border border-neutral-800/90 rounded-3xl p-8 shadow-xl relative group hover:border-indigo-500/50 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-black mb-6 group-hover:scale-110 transition-transform">
                01
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-['Outfit',sans-serif]">
                Train on Your Website Knowledge
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Add your business descriptions, catalogs, pricing tiers, and policies. Use AI-assisted generators to instantly craft high-value FAQs.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-neutral-950 border border-neutral-800/90 rounded-3xl p-8 shadow-xl relative group hover:border-violet-500/50 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center text-xl font-black mb-6 group-hover:scale-110 transition-transform">
                02
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-['Outfit',sans-serif]">
                Tailor Aesthetic & Widget Branding
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Match your exact brand palette, glassmorphism blur, custom floating triggers, sound effects, and starter conversation chips.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-neutral-950 border border-neutral-800/90 rounded-3xl p-8 shadow-xl relative group hover:border-emerald-500/50 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-black mb-6 group-hover:scale-110 transition-transform">
                03
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-['Outfit',sans-serif]">
                Embed Script & Convert 24/7
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Copy a clean one-line script into your Shopify theme, WordPress header, or React code. Your chatbot goes live immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LUXURY CAPABILITIES BENTO GRID */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-indigo-400 text-xs font-black uppercase tracking-widest">
              State-of-the-Art Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit',sans-serif]">
              Crafted for High-Conversion Brand Experiences
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Bento Card 1 */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-7 space-y-4 hover:border-neutral-700 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Cpu className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white font-['Outfit',sans-serif]">
                Gemini 3.7 Flash Intelligence
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Lightning-fast inference with natural conversational fluency, handling complex multi-turn inquiries with poise and domain mastery.
              </p>
            </div>

            {/* Bento Card 2 */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-7 space-y-4 hover:border-neutral-700 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Palette className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white font-['Outfit',sans-serif]">
                Per-Website Aesthetic Tailoring
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Choose between midnight luxury, emerald concierge, and cyber violet themes, with full control over buttons, fonts, and corner radii.
              </p>
            </div>

            {/* Bento Card 3 */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-7 space-y-4 hover:border-neutral-700 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white font-['Outfit',sans-serif]">
                Grounded Knowledge Guardrails
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Strict adherence to verified store policies, catalogs, and documentation. Zero hallucinated inventory or incorrect terms.
              </p>
            </div>

            {/* Bento Card 4 */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-7 space-y-4 hover:border-neutral-700 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white font-['Outfit',sans-serif]">
                Sub-Second Response Latency
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Optimized serverless streaming provides immediate feedback to visitors, keeping engagement and conversion rates at their peak.
              </p>
            </div>

            {/* Bento Card 5 */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-7 space-y-4 hover:border-neutral-700 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                <Code2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white font-['Outfit',sans-serif]">
                Zero-Dependency Script Tag
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Lightweight widget footprint (under 30KB) that never slows down your Core Web Vitals or SEO performance scores.
              </p>
            </div>

            {/* Bento Card 6 */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-7 space-y-4 hover:border-neutral-700 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                <MonitorPlay className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white font-['Outfit',sans-serif]">
                Live Host Website Simulator
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Preview your customized bot on luxury e-commerce stores, aesthetic medical clinics, and SaaS platforms before publishing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-24 bg-gradient-to-b from-neutral-900 to-neutral-950 border-t border-neutral-800 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-7">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
            <Diamond className="w-3.5 h-3.5 text-indigo-400" />
            <span>Elevate Your Website Conversions Today</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white font-['Outfit',sans-serif] leading-tight">
            Ready to Build Your First Bespoke AI Concierge?
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 max-w-xl mx-auto leading-relaxed">
            Create, train, and test in our live simulator within 60 seconds. No credit card required.
          </p>

          <div className="pt-2">
            <button
              onClick={onGetStarted}
              className="px-9 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-2xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Studio & Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

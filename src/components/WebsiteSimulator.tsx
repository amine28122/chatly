import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Monitor, 
  Tablet, 
  Smartphone, 
  RefreshCw, 
  ExternalLink, 
  Bot, 
  Sliders, 
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Search,
  Menu,
  ChevronRight,
  Star,
  Download
} from 'lucide-react';
import { Chatbot } from '../types';
import { MOCK_WEBSITES, MockWebsite } from '../data/mockWebsites';
import { ChatWidget } from './ChatWidget';

interface WebsiteSimulatorProps {
  currentBot: Chatbot;
  allBots: Chatbot[];
  onSelectBot: (bot: Chatbot) => void;
  onBackToDashboard: () => void;
  onOpenClientPreview?: (bot: Chatbot) => void;
}

export const WebsiteSimulator: React.FC<WebsiteSimulatorProps> = ({
  currentBot,
  allBots,
  onSelectBot,
  onBackToDashboard,
  onOpenClientPreview,
}) => {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('site-ecommerce-aura');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [keyRefresh, setKeyRefresh] = useState(0);

  const activeSite = MOCK_WEBSITES.find((s) => s.id === selectedSiteId) || MOCK_WEBSITES[0];

  const getViewportWidthClass = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-[390px] h-[780px] rounded-[40px] border-[10px] border-neutral-800 shadow-2xl';
      case 'tablet':
        return 'max-w-[768px] h-[820px] rounded-3xl border-4 border-neutral-800 shadow-2xl';
      case 'desktop':
      default:
        return 'w-full h-[820px] rounded-2xl border border-neutral-800 shadow-2xl';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-['Plus_Jakarta_Sans',sans-serif] space-y-6">
      {/* Top Control Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-neutral-900/80 border border-neutral-800 p-4 rounded-3xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-2xl transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-base font-bold text-white font-['Outfit',sans-serif] flex items-center gap-2">
              <span>Live Website Integration Simulator</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Interactive Host Mode
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              Preview your bespoke AI chatbot floating on realistic target websites.
            </p>
          </div>
        </div>

        {/* Website & Bot Selector Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Active Bot Switcher */}
          <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 text-xs">
            <span className="text-neutral-500 font-medium">Mounted Bot:</span>
            <select
              value={currentBot.id}
              onChange={(e) => {
                const target = allBots.find((b) => b.id === e.target.value);
                if (target) onSelectBot(target);
              }}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              {allBots.map((b) => (
                <option key={b.id} value={b.id} className="bg-neutral-900 text-white">
                  {b.avatar} {b.clientName ? `[${b.clientName}] ` : ''}{b.name} ({b.environment?.toUpperCase() || 'PROD'})
                </option>
              ))}
            </select>
          </div>

          {/* Host Website Switcher */}
          <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 text-xs">
            <span className="text-neutral-500 font-medium">Host Site:</span>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              {MOCK_WEBSITES.map((site) => (
                <option key={site.id} value={site.id} className="bg-neutral-900">
                  {site.name} ({site.domain})
                </option>
              ))}
            </select>
          </div>

          {/* Viewport Toggles */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewport === 'desktop' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewport === 'tablet' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Tablet View"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewport === 'mobile' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setKeyRefresh((prev) => prev + 1)}
            className="p-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-colors"
            title="Reload Page"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {onOpenClientPreview && (
            <button
              onClick={() => onOpenClientPreview(currentBot)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-bold text-xs rounded-xl shadow-sm transition-all"
              title="Download Client Pitch Image"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pitch Image</span>
            </button>
          )}
        </div>
      </div>

      {/* Mock Browser Container */}
      <div className="flex justify-center">
        <div className={`overflow-hidden bg-neutral-950 transition-all duration-300 flex flex-col relative ${getViewportWidthClass()}`}>
          {/* Mock Browser Bar */}
          <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2.5 flex items-center justify-between gap-4 select-none shrink-0">
            {/* Window Controls */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>

            {/* URL Input */}
            <div className="flex-1 max-w-md bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1 text-center text-xs text-neutral-300 font-mono flex items-center justify-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>https://{activeSite.domain}</span>
            </div>

            <div className="text-[11px] text-neutral-500 font-medium hidden sm:block">
              {activeSite.category.toUpperCase()}
            </div>
          </div>

          {/* Mock Website Rendered Content Scroll Area */}
          <div key={keyRefresh} className="flex-1 overflow-y-auto bg-neutral-950 text-white relative">
            {/* Host Site Navigation */}
            <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-neutral-950/90 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-xs"
                  style={{ backgroundColor: activeSite.accentColor }}
                >
                  {activeSite.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="font-bold text-sm tracking-tight text-white font-['Outfit',sans-serif]">
                  {activeSite.title}
                </span>
              </div>

              <div className="hidden md:flex items-center gap-6 text-xs text-neutral-300 font-medium">
                {activeSite.navItems.map((item, idx) => (
                  <span key={idx} className="hover:text-white cursor-pointer transition-colors">
                    {item}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  style={{ backgroundColor: activeSite.accentColor }}
                  className="px-3.5 py-1.5 rounded-xl text-white font-bold text-xs shadow-md"
                >
                  Explore Now
                </button>
              </div>
            </header>

            {/* Host Site Hero Banner */}
            <section className="px-6 py-12 sm:py-16 relative overflow-hidden">
              <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
                <span 
                  className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10"
                  style={{ color: activeSite.accentColor }}
                >
                  {activeSite.tagline}
                </span>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Outfit',sans-serif] leading-tight">
                  {activeSite.heroHeadline}
                </h1>

                <p className="text-xs sm:text-sm text-neutral-300 max-w-xl mx-auto leading-relaxed">
                  {activeSite.heroSubheadline}
                </p>
              </div>
            </section>

            {/* Host Site Featured Products / Services Grid */}
            <section className="px-6 py-8 border-t border-white/10 max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white font-['Outfit',sans-serif]">
                  Featured Curations & Protocols
                </h3>
                <span className="text-xs text-neutral-400">Verified Catalog Data</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {activeSite.features.map((item, idx) => (
                  <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg group">
                    {item.image && (
                      <div className="h-44 overflow-hidden bg-neutral-800 relative">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        {item.price && (
                          <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-neutral-950/80 backdrop-blur-md text-white text-xs font-bold">
                            {item.price}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="p-4 space-y-1.5">
                      <h4 className="font-bold text-white text-xs">{item.title}</h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Simulated Live Floating Chatbot Widget Mounted on the Host Site */}
            <ChatWidget
              bot={currentBot}
              isEmbedded={false}
              initialOpen={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

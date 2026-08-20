import React, { useState } from 'react';
import {
  Sparkles,
  PhoneCall,
  Code2,
  ExternalLink,
  Bot,
  ShieldCheck,
  Check,
  Copy,
  Layers,
  ArrowRight,
  Globe,
  Monitor,
  Smartphone
} from 'lucide-react';
import { Chatbot } from '../types';
import { ChatWidget } from './ChatWidget';

interface StandaloneDemoProps {
  bot: Chatbot;
  onOpenClientLogin?: () => void;
}

export function StandaloneDemo({ bot, onOpenClientLogin }: StandaloneDemoProps) {
  const [activeViewMode, setActiveViewMode] = useState<'interactive' | 'embed_instructions'>('interactive');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const iframeCode = `<iframe \n  src="${window.location.origin}/?demo=${bot.id}&embed=true" \n  width="100%" \n  height="680" \n  frameborder="0" \n  style="border:none; border-radius:16px; box-shadow: 0 20px 40px rgba(0,0,0,0.15);"\n></iframe>`;
  const scriptTagCode = `<script src="${window.location.origin}/widget.js" data-bot-id="${bot.id}" async></script>`;

  return (
    <div className="min-h-screen bg-[#07080d] text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-4 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white">
                {bot.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                {bot.clientName || 'Live Client Demo'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Live hosted preview for: {bot.websiteUrl || bot.clientDomain || 'Your Business'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {bot.whatsappNumber && (
            <a
              href={`https://wa.me/${bot.whatsappNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl text-xs font-bold border border-emerald-500/30 transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Direct WhatsApp support</span>
            </a>
          )}

          {onOpenClientLogin && (
            <button
              onClick={onOpenClientLogin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
            >
              <span>Client Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Business Brief & Embed code */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Fully trained AI assistant for your website</span>
              </div>
              <h2 className="text-xl font-extrabold text-white">
                {bot.name}
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {bot.description || 'This assistant answers your visitors\' questions accurately 24/7, captures leads, and handsover interested buyers to WhatsApp instantly.'}
              </p>

              <div className="pt-2 border-t border-zinc-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-500">Target website:</span>
                  <span className="font-semibold text-white">{bot.websiteUrl || bot.clientDomain || 'Your Website'}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-500">WhatsApp handover:</span>
                  <span className="font-mono text-emerald-400">{bot.whatsappNumber || 'Enabled'}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-500">Response speed:</span>
                  <span className="text-indigo-400 font-semibold">&lt; 1s (instant)</span>
                </div>
              </div>
            </div>

            {/* Quick Embed Box for Client Developer */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <span>Embed code for your site (iFrame)</span>
                </span>
                <button
                  onClick={() => copyToClipboard(iframeCode, 'iframe')}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                >
                  {copiedKey === 'iframe' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'iframe' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="bg-black border border-zinc-800/80 rounded-xl p-3 font-mono text-[11px] text-emerald-300 select-all overflow-x-auto">
                {iframeCode}
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Chat Widget */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-md h-[640px] bg-zinc-950 border border-zinc-800/90 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
              <ChatWidget bot={bot} standalone={true} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-4 text-center text-xs text-zinc-500">
        Designed with BotCraft AI • All rights reserved
      </footer>
    </div>
  );
}

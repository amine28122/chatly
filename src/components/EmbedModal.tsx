import React, { useState } from 'react';
import { 
  X, 
  Code2, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Layers, 
  MonitorPlay,
  FileCode,
  ShieldCheck
} from 'lucide-react';
import { Chatbot } from '../types';

interface EmbedModalProps {
  bot: Chatbot;
  isOpen: boolean;
  onClose: () => void;
  onOpenSimulator: () => void;
}

export const EmbedModal: React.FC<EmbedModalProps> = ({
  bot,
  isOpen,
  onClose,
  onOpenSimulator,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [platformTab, setPlatformTab] = useState<'shopify' | 'wordpress' | 'webflow' | 'react' | 'html'>('shopify');

  if (!isOpen) return null;

  const scriptTagCode = `<!-- BotCraft AI Concierge Widget -->
<script
  src="https://cdn.botcraft.ai/v1/widget.js"
  data-bot-id="${bot.id}"
  data-position="${bot.widgetConfig.position}"
  data-theme="${bot.widgetConfig.theme}"
  defer
></script>`;

  const iframeCode = `<iframe
  src="https://botcraft.ai/chat/${bot.id}"
  width="100%"
  height="650"
  frameborder="0"
  style="border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.3);"
></iframe>`;

  const directLink = `https://botcraft.ai/chat/${bot.id}`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-lg font-bold border border-indigo-500/30">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit',sans-serif]">
                Embed & Connect "{bot.name}"
              </h3>
              <p className="text-xs text-neutral-400">
                Integrate your bespoke AI assistant into any store or website in under 2 minutes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Embed Mode Switcher */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>1. Choose Embed Method (طريقة التضمين)</span>
              </label>
            </div>

            {/* Embed Type Selector */}
            <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setPlatformTab('html')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  platformTab === 'html' || platformTab === 'shopify' || platformTab === 'wordpress' || platformTab === 'webflow' || platformTab === 'react'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Floating Widget (سكربت زر عائم)</span>
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(iframeCode, 'iframe')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  copiedKey === 'iframe'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>{copiedKey === 'iframe' ? '✓ Copied iFrame!' : 'Direct iFrame (كود آي فريم)'}</span>
              </button>
            </div>

            {/* iFrame Code Box */}
            <div className="space-y-2 bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  <span>كود الـ iFrame المباشر (انسخه وألصقه في أي صفحة):</span>
                </span>
                <button
                  onClick={() => copyToClipboard(iframeCode, 'iframe_box')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-bold text-xs transition-all"
                >
                  {copiedKey === 'iframe_box' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'iframe_box' ? 'تم النسخ!' : 'نسخ iFrame'}</span>
                </button>
              </div>
              <div className="bg-black border border-neutral-800 rounded-xl p-3 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed select-all">
                {iframeCode}
              </div>
            </div>

            {/* Universal Script Tag Snippet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>كود السكربت العائم (Floating Widget Script):</span>
                </span>
                <button
                  onClick={() => copyToClipboard(scriptTagCode, 'script')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs transition-all shadow-sm"
                >
                  {copiedKey === 'script' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'script' ? 'تم النسخ!' : 'نسخ السكربت'}</span>
                </button>
              </div>

              <div className="bg-black border border-neutral-800 rounded-xl p-3 font-mono text-[11px] text-indigo-300 overflow-x-auto leading-relaxed select-all">
                {scriptTagCode}
              </div>
              <p className="text-[11px] text-neutral-400">
                ضع هذا الكود في نهاية الصفحة قبل إغلاق وسم <code>&lt;/body&gt;</code> ليظهر البوت مباشرة في أسفل الموقع.
              </p>
            </div>
          </div>

          {/* Platform Instructions */}
          <div className="space-y-3 pt-4 border-t border-neutral-800">
            <h4 className="font-bold text-white text-sm font-['Outfit',sans-serif]">
              Platform Installation Guides
            </h4>

            {/* Platform Tabs */}
            <div className="flex flex-wrap gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              {(['shopify', 'wordpress', 'webflow', 'react', 'html'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatformTab(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                    platformTab === p
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-2 text-neutral-300 leading-relaxed text-[11px]">
              {platformTab === 'shopify' && (
                <div>
                  <strong className="text-white block mb-1">Shopify Storefront Guide:</strong>
                  1. Log into your Shopify Admin &gt; Online Store &gt; Themes.<br />
                  2. Click on <strong>Actions &gt; Edit Code</strong>.<br />
                  3. Open the <code>layout/theme.liquid</code> file.<br />
                  4. Scroll to the bottom and paste the script right above <code>&lt;/body&gt;</code>.<br />
                  5. Click Save. Your chatbot widget is live on all store pages!
                </div>
              )}

              {platformTab === 'wordpress' && (
                <div>
                  <strong className="text-white block mb-1">WordPress / WooCommerce Guide:</strong>
                  1. Go to your WP Admin &gt; Plugins &gt; Add New &gt; search for "Insert Headers and Footers" (WPCode).<br />
                  2. Open Code Snippets &gt; Header & Footer.<br />
                  3. Paste the embed script into the <strong>Footer</strong> section.<br />
                  4. Click Save Changes.
                </div>
              )}

              {platformTab === 'webflow' && (
                <div>
                  <strong className="text-white block mb-1">Webflow / Framer Guide:</strong>
                  1. In Project Settings, navigate to the <strong>Custom Code</strong> tab.<br />
                  2. In the <strong>Footer Code</strong> box, paste the snippet.<br />
                  3. Publish your website to apply changes instantly.
                </div>
              )}

              {platformTab === 'react' && (
                <div>
                  <strong className="text-white block mb-1">React & Next.js Guide:</strong>
                  Use the Next.js Script tag or add a standard useEffect hook:
                  <div className="bg-neutral-900 p-2.5 rounded-xl font-mono text-[10px] text-indigo-300 mt-1">
                    {`import Script from 'next/script';\n<Script src="https://cdn.botcraft.ai/v1/widget.js" data-bot-id="${bot.id}" strategy="lazyOnload" />`}
                  </div>
                </div>
              )}

              {platformTab === 'html' && (
                <div>
                  <strong className="text-white block mb-1">Static HTML Guide:</strong>
                  Simply paste the universal script tag right above <code>&lt;/body&gt;</code> in your <code>index.html</code> file.
                </div>
              )}
            </div>
          </div>

          {/* Direct Share Link & Iframe */}
          <div className="space-y-3 pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-white text-xs block">Direct Web Chat URL</strong>
                <span className="text-[11px] text-neutral-400">Shareable full-page chat link</span>
              </div>
              <button
                onClick={() => copyToClipboard(directLink, 'link')}
                className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-semibold text-xs"
              >
                {copiedKey === 'link' ? 'Copied Link!' : 'Copy Link'}
              </button>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 font-mono text-[11px] text-neutral-300 overflow-x-auto">
              {directLink}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <MonitorPlay className="w-4 h-4" />
            <span>Test in Live Website Simulator</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

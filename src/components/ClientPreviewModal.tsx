import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Monitor, 
  Smartphone, 
  Upload, 
  Eye, 
  ExternalLink, 
  Lock, 
  ShieldCheck, 
  RefreshCw,
  Share2,
  FileImage,
  Layers,
  Palette,
  Globe,
  Camera,
  AlertCircle,
  Maximize2,
  Sliders,
  Image
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { Chatbot } from '../types';
import { ChatWidget } from './ChatWidget';
import { MOCK_WEBSITES } from '../data/mockWebsites';

interface ClientPreviewModalProps {
  bot: Chatbot;
  isOpen: boolean;
  onClose: () => void;
}

export const ClientPreviewModal: React.FC<ClientPreviewModalProps> = ({
  bot,
  isOpen,
  onClose,
}) => {
  const [targetUrl, setTargetUrl] = useState<string>(bot.websiteUrl || '');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [widgetDisplayState, setWidgetDisplayState] = useState<'open' | 'closed'>('open');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingScreenshot, setIsFetchingScreenshot] = useState(false);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [renderMode, setRenderMode] = useState<'screenshot' | 'interactive_iframe' | 'mock_backdrop'>('screenshot');
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left'>(
    bot.widgetConfig.position || 'bottom-right'
  );

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Fetch real website screenshot from backend
  const fetchWebsiteScreenshot = async (urlToFetch: string, engineIndex: number = 0) => {
    let clean = urlToFetch.trim();
    if (!clean) return;

    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }

    setIsFetchingScreenshot(true);
    setStatusMessage(`Capturing live webpage from ${clean}...`);

    try {
      const response = await fetch(`/api/screenshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: clean }),
      });

      const data = await response.json();
      if (data.success && data.dataUrl) {
        setScreenshotDataUrl(data.dataUrl);
        setRenderMode('screenshot');
        setStatusMessage('Live screenshot captured!');
        setTimeout(() => setStatusMessage(null), 3500);
      } else {
        throw new Error(data.error || 'Could not fetch screenshot');
      }
    } catch (err: any) {
      console.warn('Screenshot fetch error, trying direct fallback:', err);
      // Alternative direct screenshot endpoint
      const directProvider = `https://image.thum.io/get/width/1280/crop/800/noanimate/${clean}`;
      setScreenshotDataUrl(directProvider);
      setRenderMode('screenshot');
      setStatusMessage('Live site snapshot loaded.');
      setTimeout(() => setStatusMessage(null), 3500);
    } finally {
      setIsFetchingScreenshot(false);
    }
  };

  // Trigger automated screenshot fetch when modal opens with a website URL
  useEffect(() => {
    if (isOpen) {
      const initialUrl = bot.websiteUrl || targetUrl;
      if (initialUrl && initialUrl.trim() && !screenshotDataUrl && !customBgImage) {
        fetchWebsiteScreenshot(initialUrl);
      }
    }
  }, [isOpen, bot.websiteUrl]);

  if (!isOpen) return null;

  // Determine fallback domain name
  const rawDomain = targetUrl || bot.websiteUrl || 'client-brand.com';
  const websiteDomain = rawDomain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0];

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCustomBgImage(event.target.result);
        setScreenshotDataUrl(null);
        setRenderMode('screenshot');
        setStatusMessage('Custom screenshot uploaded!');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Download High-Resolution Mockup as PNG
  const handleDownloadImage = async () => {
    if (!previewContainerRef.current) return;
    setIsGenerating(true);

    try {
      // Allow DOM and widgets to settle
      await new Promise((resolve) => setTimeout(resolve, 350));

      const dataUrl = await toPng(previewContainerRef.current, {
        quality: 0.98,
        pixelRatio: 2, // Crisp 2x retina output
        cacheBust: true,
        backgroundColor: '#0a0c14',
      });

      const link = document.createElement('a');
      link.download = `${(bot.name || 'chatbot').toLowerCase().replace(/\s+/g, '-')}-client-pitch.png`;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to generate preview image with html-to-image:', err);
      alert('Could not render image. Please try again or upload a screenshot.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!previewContainerRef.current) return;
    setIsGenerating(true);

    try {
      const blob = await toBlob(previewContainerRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#0a0c14',
      });

      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 3000);
        } catch (clipErr) {
          const dataUrl = await toPng(previewContainerRef.current, {
            quality: 0.98,
            pixelRatio: 2,
          });
          await navigator.clipboard.writeText(dataUrl);
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 3000);
        }
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-6xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[96vh]">
        
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-neutral-950 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base font-['Outfit',sans-serif]">
                  Client Website Mockup Generator
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  Client-Ready PNG
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Generate high-resolution pitch image of <strong className="text-neutral-200">{bot.name}</strong> on <strong className="text-indigo-300">https://{websiteDomain}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live URL Input & Options Bar */}
        <div className="p-4 bg-neutral-950/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Website URL Input */}
          <div className="flex-1 min-w-[280px] max-w-xl flex items-center gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchWebsiteScreenshot(targetUrl);
                }}
                placeholder="Enter client website URL (e.g. https://nike.com)..."
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-indigo-500 rounded-2xl pl-10 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors font-mono"
              />
            </div>
            <button
              type="button"
              onClick={() => fetchWebsiteScreenshot(targetUrl)}
              disabled={isFetchingScreenshot || !targetUrl.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-indigo-600/20 shrink-0 active:scale-95"
            >
              {isFetchingScreenshot ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
              <span>{isFetchingScreenshot ? 'Capturing...' : 'Capture Site'}</span>
            </button>
          </div>

          {/* Controls: Device Mode, Widget State, Position, Upload */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Viewport Mode */}
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  deviceMode === 'desktop'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  deviceMode === 'mobile'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
            </div>

            {/* Widget State Mode */}
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setWidgetDisplayState('open')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  widgetDisplayState === 'open'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Open Box
              </button>
              <button
                type="button"
                onClick={() => setWidgetDisplayState('closed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  widgetDisplayState === 'closed'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Floating Icon
              </button>
            </div>

            {/* Position Toggle */}
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setWidgetPosition('bottom-right')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  widgetPosition === 'bottom-right'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Position Bottom Right"
              >
                Right
              </button>
              <button
                type="button"
                onClick={() => setWidgetPosition('bottom-left')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  widgetPosition === 'bottom-left'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Position Bottom Left"
              >
                Left
              </button>
            </div>

            {/* Background Style Switcher */}
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setRenderMode('screenshot')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  renderMode === 'screenshot'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Live Screenshot Image"
              >
                Screenshot
              </button>
              <button
                type="button"
                onClick={() => setRenderMode('mock_backdrop')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  renderMode === 'mock_backdrop'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Modern SaaS Digital Backdrop"
              >
                Modern Theme
              </button>
            </div>

            {/* Upload Custom Screenshot */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>{customBgImage ? 'Replace Image' : 'Upload File'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCustomBgUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Status notification bar */}
        {statusMessage && (
          <div className="px-5 py-2 bg-indigo-950/80 border-b border-indigo-500/30 text-indigo-200 text-xs font-medium flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>{statusMessage}</span>
            </span>
          </div>
        )}

        {/* Mockup Canvas Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-950/80 flex items-center justify-center min-h-[500px]">
          
          {/* THE CAPTURE CONTAINER */}
          <div
            ref={previewContainerRef}
            className={`transition-all duration-300 relative bg-[#0a0c14] border border-neutral-800 shadow-2xl rounded-3xl overflow-hidden ${
              deviceMode === 'desktop'
                ? 'w-full max-w-[1020px] aspect-[16/10] min-h-[580px]'
                : 'w-[390px] aspect-[9/18] min-h-[680px] border-8 border-neutral-800 rounded-[44px]'
            }`}
          >
            {/* macOS / Browser Header Bar */}
            <div className="bg-[#121420] border-b border-white/5 px-4 py-2.5 flex items-center justify-between text-xs select-none z-20 relative">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block shadow-sm" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block shadow-sm" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block shadow-sm" />
              </div>

              {/* URL Address Bar */}
              <div className="flex items-center gap-2 bg-[#090a10] border border-white/10 px-4 py-1 rounded-full text-neutral-300 font-mono text-[11px] max-w-[420px] w-full justify-center shadow-inner">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">https://</span>
                <span className="text-white font-medium truncate max-w-[280px]">{websiteDomain}</span>
              </div>

              <div className="flex items-center gap-2 text-neutral-400">
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded font-mono">100%</span>
              </div>
            </div>

            {/* WEBSITE CONTENT FRAME */}
            <div className="relative w-full h-[calc(100%-42px)] overflow-hidden bg-neutral-950">
              
              {/* If user uploaded a custom site screenshot OR fetched live screenshot */}
              {renderMode === 'screenshot' && (customBgImage || screenshotDataUrl) ? (
                <div className="relative w-full h-full bg-[#0d0f1a]">
                  <img
                    src={customBgImage || screenshotDataUrl || ''}
                    alt="Client Website"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Subtle darkening gradient at bottom for floating launcher contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>
              ) : (
                /* Generated Beautiful Realistic Client Website Backdrop */
                <div className="w-full h-full flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-[#070913]">
                  {/* Subtle Grid Pattern */}
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

                  {/* Ambient Glow */}
                  <div 
                    className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{ backgroundColor: bot.widgetConfig.primaryColor }}
                  />

                  {/* Client Website Navbar */}
                  <div className="flex items-center justify-between pb-6 border-b border-white/10 relative z-10">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-md"
                        style={{ backgroundColor: bot.widgetConfig.primaryColor }}
                      >
                        {bot.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-white text-sm tracking-wide font-['Outfit',sans-serif] block uppercase">
                          {websiteDomain.replace(/\..+$/, '')}
                        </span>
                        <span className="text-[10px] text-neutral-400">Official Store & Portal</span>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-6 text-xs text-neutral-300 font-medium">
                      <span>Products</span>
                      <span>Services</span>
                      <span>Pricing</span>
                      <span>About Us</span>
                      <span className="px-3.5 py-1.5 rounded-xl text-white font-bold" style={{ backgroundColor: bot.widgetConfig.primaryColor }}>
                        Contact
                      </span>
                    </div>
                  </div>

                  {/* Client Website Hero Section */}
                  <div className="max-w-xl my-auto py-6 relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-neutral-300">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Welcome to our digital boutique</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Outfit',sans-serif] leading-tight">
                      Elevate Your Experience with Premium Care & Advisory.
                    </h1>

                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-md">
                      Explore our tailored catalog, luxury collections, and seamless online booking. Our intelligent concierge is always available on the right.
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                      <button 
                        type="button"
                        className="px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg"
                        style={{ backgroundColor: bot.widgetConfig.primaryColor }}
                      >
                        Explore Collections
                      </button>
                      <button 
                        type="button"
                        className="px-5 py-2.5 rounded-xl bg-white/10 text-neutral-200 font-semibold text-xs border border-white/10"
                      >
                        Learn More
                      </button>
                    </div>
                  </div>

                  {/* Client Presentation Footer Watermark */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-500 relative z-10">
                    <span>© {new Date().getFullYear()} {websiteDomain}. All rights reserved.</span>
                    <span className="flex items-center gap-1 text-indigo-400/80 font-medium">
                      <span>⚡ AI Concierge Powered by BotCraft</span>
                    </span>
                  </div>
                </div>
              )}

              {/* FLOATING CHAT WIDGET OVERLAY */}
              <div 
                className={`absolute bottom-3 z-30 transition-all ${
                  widgetPosition === 'bottom-left' ? 'left-3' : 'right-3'
                }`}
              >
                {widgetDisplayState === 'open' ? (
                  <div className="w-[330px] max-w-[85vw] h-[450px] max-h-[80%] rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-scaleUp bg-neutral-950">
                    <ChatWidget bot={{
                      ...bot,
                      widgetConfig: {
                        ...bot.widgetConfig,
                        position: widgetPosition,
                      }
                    }} isEmbedded={true} />
                  </div>
                ) : (
                  /* Floating Closed Launcher Preview */
                  <div className="flex items-center gap-3">
                    {/* Proactive Floating Tooltip */}
                    {bot.widgetConfig.launcherShowBadge !== false && (
                      <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-700 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
                        <span>{bot.widgetConfig.launcherBadgeText || bot.widgetConfig.customBadge || 'How may I assist you today? 👋'}</span>
                      </div>
                    )}

                    {/* Floating Button */}
                    <div
                      className={`flex items-center justify-center gap-2.5 shadow-2xl cursor-pointer text-white font-bold transition-all ${
                        bot.widgetConfig.launcherShape === 'circle'
                          ? 'w-14 h-14 rounded-full'
                          : bot.widgetConfig.launcherShape === 'squircle'
                          ? 'w-14 h-14 rounded-2xl'
                          : 'px-5 py-3.5 rounded-full'
                      }`}
                      style={{
                        backgroundColor: bot.widgetConfig.bubbleColor || bot.widgetConfig.primaryColor || '#6366f1',
                      }}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shrink-0">
                        {bot.widgetConfig.avatarType === 'image' && bot.widgetConfig.avatarUrl ? (
                          <img
                            src={bot.widgetConfig.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="flex items-center justify-center w-full h-full text-base">
                            {bot.avatar || '🤖'}
                          </span>
                        )}
                      </div>
                      {bot.widgetConfig.launcherShape === 'pill' && (
                        <span className="text-xs font-bold tracking-wide">
                          {bot.widgetConfig.launcherLabel || 'Chat with AI'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-5 bg-neutral-950 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-neutral-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Ready for client WhatsApp proposals, sales pitch decks, and email presentations.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={isGenerating}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-2xl text-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Image</span>
                </>
              )}
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Rendering PNG...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Downloaded PNG!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Client Preview PNG (تحميل صورة الموقع مع الشات بوت)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

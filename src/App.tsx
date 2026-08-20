import React, { useState, useEffect, useCallback } from 'react';
import { Chatbot, User, ActiveView } from './types';
import { DEFAULT_BOTS } from './data/defaultBots';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { WebsiteSimulator } from './components/WebsiteSimulator';
import { ClientPortal } from './components/ClientPortal';
import { StandaloneDemo } from './components/StandaloneDemo';
import { EmbeddedPage } from './components/EmbeddedPage';

export default function App() {
  const [bots, setBots] = useState<Chatbot[]>(DEFAULT_BOTS);
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('landing');
  const [selectedBot, setSelectedBot] = useState<Chatbot | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [demoBotId, setDemoBotId] = useState<string | null>(null);
  const [isEmbedRoute, setIsEmbedRoute] = useState(false);
  const [liveDemoBot, setLiveDemoBot] = useState<Chatbot | null>(null);

  // Fetch bots for the authenticated session scope (admin = all, client = assigned only)
  const loadBots = useCallback(async () => {
    try {
      const res = await fetch('/api/bots');
      if (res.ok) {
        const data = await res.json();
        if (data.bots && Array.isArray(data.bots) && data.bots.length > 0) {
          setBots(data.bots);
          setSelectedBot((prev) => prev ?? data.bots[0]);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load bots from backend:', e);
    }
    setSelectedBot((prev) => prev ?? DEFAULT_BOTS[0]);
  }, []);

  // URL routing: /chat/:id, /embed/:id, ?demo=, ?portal= + session restore
  useEffect(() => {
    const pathMatch = window.location.pathname.match(/^\/(chat|embed)\/([^/]+)\/?$/);
    const params = new URLSearchParams(window.location.search);
    const demoParam = params.get('demo');

    if (pathMatch) {
      setDemoBotId(decodeURIComponent(pathMatch[2]));
      setIsEmbedRoute(pathMatch[1] === 'embed');
    } else if (demoParam) {
      setDemoBotId(demoParam);
      setIsEmbedRoute(params.get('embed') === 'true' || params.get('embedded') === '1');
    } else {
      setDemoBotId(null);
      setIsEmbedRoute(false);
      if (params.get('portal')) {
        setActiveView('client_portal');
      }
    }

    // Restore existing session (HttpOnly cookie) if present
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          loadBots();
        }
      })
      .catch(() => {
        /* not authenticated */
      });
  }, [loadBots]);

  // Fetch the LIVE published bot profile for embed/demo links so each client's
  // widget always reflects their own saved knowledge base — not the seed data.
  useEffect(() => {
    if (!demoBotId) return;
    setLiveDemoBot(null);
    fetch(`/api/bots/${encodeURIComponent(demoBotId)}/public`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.bot) setLiveDemoBot(data.bot);
      })
      .catch(() => {
        /* fall back to default seed */
      });
  }, [demoBotId]);

  const handleLoginSuccess = (newUser: User) => {
    setUser(newUser);
    loadBots();
    // Everyone lands on the same dashboard; bots are scoped by role server-side.
    setActiveView('dashboard');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* session may already be gone */
    }
    setUser(null);
    setBots(DEFAULT_BOTS);
    setSelectedBot(null);
    setActiveView('landing');
  };

  // If user requested a standalone demo or embed link for a specific bot
  if (demoBotId) {
    const targetBot =
      liveDemoBot ||
      bots.find((b) => b.id === demoBotId) ||
      DEFAULT_BOTS.find((b) => b.id === demoBotId) ||
      bots[0] ||
      DEFAULT_BOTS[0];

    // Embedded floating widget (runs inside the customer's site iframe)
    if (isEmbedRoute) {
      return <EmbeddedPage bot={targetBot} />;
    }

    return (
      <StandaloneDemo
        bot={targetBot}
        onOpenClientLogin={() => {
          setDemoBotId(null);
          setIsAuthOpen(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#07080e] text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-indigo-500 selection:text-white antialiased">
      {/* Top Navigation */}
      <Navbar
        user={user}
        activeView={activeView}
        onNavigate={(view) => {
          if ((view === 'dashboard' || view === 'simulator' || view === 'analytics' || view === 'client_portal') && !user) {
            setIsAuthOpen(true);
            return;
          }
          setActiveView(view);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onCreateNewBot={() => {
          setSelectedBot(null);
          setActiveView('bot_editor');
        }}
      />

      {/* Main Viewport */}
      <main className="flex-1">
        {activeView === 'landing' && (
          <LandingPage
            demoBot={bots[0] || DEFAULT_BOTS[0]}
            onGetStarted={() => {
              if (user) {
                setActiveView('dashboard');
              } else {
                setIsAuthOpen(true);
              }
            }}
            onOpenSimulator={() => {
              setSelectedBot(bots[0] || DEFAULT_BOTS[0]);
              setActiveView('simulator');
            }}
          />
        )}

        {(activeView === 'dashboard' || activeView === 'bot_editor' || activeView === 'analytics') && user && (
          <Dashboard
            user={user}
            bots={bots}
            activeView={activeView}
            selectedBot={selectedBot}
            onUpdateBots={setBots}
            onNavigate={setActiveView}
            onSelectBot={setSelectedBot}
            onOpenClientPortalAsUser={(clientUser) => {
              setUser(clientUser);
              setActiveView('client_portal');
            }}
          />
        )}

        {activeView === 'client_portal' && user && (
          <ClientPortal
            user={user}
            bots={bots}
            onOpenSimulator={(bot) => {
              setSelectedBot(bot);
              setActiveView('simulator');
            }}
            onBackToAdminDashboard={() => {
              if (user.role === 'admin') {
                setActiveView('dashboard');
              }
            }}
          />
        )}

        {activeView === 'simulator' && (
          <WebsiteSimulator
            currentBot={selectedBot || bots[0] || DEFAULT_BOTS[0]}
            allBots={bots}
            onSelectBot={(b) => setSelectedBot(b)}
            onBackToDashboard={() => setActiveView(user ? 'dashboard' : 'landing')}
          />
        )}
      </main>

      {/* Authentication & Signup Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

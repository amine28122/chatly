import React, { useState, useEffect } from 'react';
import { Chatbot, User, ActiveView } from './types';
import { DEFAULT_BOTS, INITIAL_USER } from './data/defaultBots';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { WebsiteSimulator } from './components/WebsiteSimulator';
import { ClientPortal } from './components/ClientPortal';
import { StandaloneDemo } from './components/StandaloneDemo';

export default function App() {
  const [bots, setBots] = useState<Chatbot[]>(DEFAULT_BOTS);
  const [user, setUser] = useState<User | null>(INITIAL_USER);
  const [activeView, setActiveView] = useState<ActiveView>('landing');
  const [selectedBot, setSelectedBot] = useState<Chatbot | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [demoBotId, setDemoBotId] = useState<string | null>(null);

  // Check URL query parameters for standalone demo or portal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demoParam = params.get('demo');
    const portalParam = params.get('portal');

    if (demoParam) {
      setDemoBotId(demoParam);
    } else if (portalParam) {
      setActiveView('client_portal');
    }
  }, []);

  // Fetch bots from persistent backend database on mount
  useEffect(() => {
    const fetchBots = async () => {
      try {
        const res = await fetch('/api/bots');
        if (res.ok) {
          const data = await res.json();
          if (data.bots && Array.isArray(data.bots) && data.bots.length > 0) {
            setBots(data.bots);
            setSelectedBot(data.bots[0]);
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load bots from backend:', e);
      }
      setSelectedBot(DEFAULT_BOTS[0]);
    };
    fetchBots();
  }, []);

  const handleLoginSuccess = (newUser: User) => {
    setUser(newUser);
    if (newUser.role === 'client') {
      setActiveView('client_portal');
    } else {
      setActiveView('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveView('landing');
  };

  // If user requested a standalone demo link for a bot (e.g. ?demo=bot-aura)
  if (demoBotId) {
    const targetBot = bots.find((b) => b.id === demoBotId) || DEFAULT_BOTS.find((b) => b.id === demoBotId) || bots[0] || DEFAULT_BOTS[0];
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
                if (user.role === 'client') {
                  setActiveView('client_portal');
                } else {
                  setActiveView('dashboard');
                }
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
            onBackToDashboard={() => setActiveView(user?.role === 'client' ? 'client_portal' : user ? 'dashboard' : 'landing')}
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

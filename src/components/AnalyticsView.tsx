import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  Clock, 
  ThumbsUp, 
  Search, 
  CheckCircle2,
  Sparkles,
  Bot
} from 'lucide-react';
import { Chatbot } from '../types';

interface AnalyticsViewProps {
  bots: Chatbot[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ bots }) => {
  const [selectedBotId, setSelectedBotId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBots = selectedBotId === 'all' 
    ? bots 
    : bots.filter((b) => b.id === selectedBotId);

  const totalChats = filteredBots.reduce((acc, b) => acc + b.stats.totalConversations, 0);
  const totalMsgs = filteredBots.reduce((acc, b) => acc + b.stats.totalMessages, 0);
  const avgSatisfaction = Math.round(
    filteredBots.reduce((acc, b) => acc + b.stats.satisfactionRate, 0) / (filteredBots.length || 1)
  );

  // Realistic mock visitor inquiries and transcripts in English
  const mockConversations = [
    {
      id: 'conv-1',
      botName: bots[0]?.name || 'AURA Concierge',
      visitor: 'Client #4829 (London, UK)',
      topic: 'Grand Complication Tourbillon sizing & Mayfair VIP viewing schedule',
      status: 'resolved',
      rating: 'positive',
      time: '8 mins ago',
      messagesCount: 5,
    },
    {
      id: 'conv-2',
      botName: bots[1]?.name || 'Apex Clinical Advisor',
      visitor: 'Patient #3910 (Beverly Hills)',
      topic: 'Full-body Multi-Omics screen biomarkers & Dr. Vance private intake',
      status: 'resolved',
      rating: 'positive',
      time: '24 mins ago',
      messagesCount: 6,
    },
    {
      id: 'conv-3',
      botName: bots[2]?.name || 'Nexus Cloud Architect',
      visitor: 'Tech Lead @ ScaleGrid (San Francisco)',
      topic: 'AWS PrivateLink zero-egress peering & SOC2 Type II compliance terms',
      status: 'resolved',
      rating: 'positive',
      time: '1 hour ago',
      messagesCount: 4,
    },
    {
      id: 'conv-4',
      botName: bots[0]?.name || 'AURA Concierge',
      visitor: 'Client #8821 (Geneva, CH)',
      topic: 'Custom alligator leather strap colors & insured courier tracking',
      status: 'resolved',
      rating: 'positive',
      time: '3 hours ago',
      messagesCount: 4,
    },
  ];

  return (
    <div className="space-y-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-['Outfit',sans-serif] flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>AI Fleet Analytics & Conversations</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time engagement telemetry, satisfaction scores, and visitor transcripts.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedBotId}
            onChange={(e) => setSelectedBotId(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
          >
            <option value="all">All Chatbots & Companies ({bots.length})</option>
            {bots.map((b) => (
              <option key={b.id} value={b.id}>
                {b.avatar} {b.clientName ? `[${b.clientName}] ` : ''}{b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900/80 border border-neutral-800/90 rounded-3xl p-5 shadow-lg space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Total Client Sessions</span>
            <MessageSquare className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-['Outfit',sans-serif]">
            {totalChats.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+21.8% WoW Growth</span>
          </div>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800/90 rounded-3xl p-5 shadow-lg space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Messages Exchanged</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-['Outfit',sans-serif]">
            {totalMsgs.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium">
            Avg. 4.1 turns per conversation
          </div>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800/90 rounded-3xl p-5 shadow-lg space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Average Inference Latency</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-['Outfit',sans-serif]">0.48s</div>
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <span>Sub-second Flash Engine ⚡</span>
          </div>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800/90 rounded-3xl p-5 shadow-lg space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Satisfaction & Resolution</span>
            <ThumbsUp className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white font-['Outfit',sans-serif]">{avgSatisfaction}%</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>96% resolved autonomously</span>
          </div>
        </div>
      </div>

      {/* Real-time Visitor Inquiries Logs Table */}
      <div className="bg-neutral-900/80 border border-neutral-800/90 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white font-['Outfit',sans-serif]">
              Recent Visitor Transcripts & Inquiries
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Live inquiries routed through your embedded website widgets
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400">
                <th className="pb-3 font-semibold">Visitor Identifier</th>
                <th className="pb-3 font-semibold">Handling Concierge</th>
                <th className="pb-3 font-semibold">Primary Intent & Topic</th>
                <th className="pb-3 font-semibold">Resolution</th>
                <th className="pb-3 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {mockConversations.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-3.5 font-bold text-white">{c.visitor}</td>
                  <td className="py-3.5 text-neutral-300 font-medium">{c.botName}</td>
                  <td className="py-3.5 text-neutral-300 max-w-sm truncate">{c.topic}</td>
                  <td className="py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      Resolved Autonomously ✓
                    </span>
                  </td>
                  <td className="py-3.5 text-neutral-400 font-mono text-[11px]">{c.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

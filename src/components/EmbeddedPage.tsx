import React from 'react';
import { Chatbot } from '../types';
import { ChatWidget } from './ChatWidget';

/**
 * Minimal stripped page rendered inside the embed iframe (/embed/:id).
 * Only the floating chat window is shown — no platform chrome — so it behaves
 * like a first-class widget on the customer's own website.
 */
export function EmbeddedPage({ bot }: { bot: Chatbot }) {
  return (
    <div
      className="w-full h-full fixed inset-0 overflow-hidden"
      style={{ background: 'transparent' }}
    >
      <ChatWidget bot={bot} isEmbedded standalone />
    </div>
  );
}
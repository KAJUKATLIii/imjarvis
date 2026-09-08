import React, { useEffect, useState } from 'react';
import { api, Ticket } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useVoiceAssistance } from '../../context/VoiceAssistanceContext';
import {
  LifeBuoy,
  MessageSquare,
  Plus,
  Clock,
  CheckCircle2,
  Send,
  AlertCircle,
  Shield,
  User as UserIcon,
  Radio,
} from 'lucide-react';

export const PortalSupport: React.FC = () => {
  const { user } = useAuth();
  const { requestVoiceAssistance } = useVoiceAssistance();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<'BILLING' | 'TECHNICAL' | 'SERVER_UPGRADE' | 'GENERAL'>('GENERAL');
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      const res = await api.crm.getMyTickets();
      setTickets(res.data);
      if (selectedTicket) {
        const updated = res.data.find((t) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newMessage) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.crm.createTicket({
        category: newCategory,
        title: newTitle,
        message: newMessage,
      });
      setIsNewModalOpen(false);
      setNewTitle('');
      setNewMessage('');
      await fetchTickets();
      setSelectedTicket(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setSubmitting(true);
    try {
      await api.crm.replyTicket(selectedTicket.id, replyText.trim());
      setReplyText('');
      await fetchTickets();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reply.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono-tech tracking-widest text-[#ccff00] mb-1">
            OPERATIONS LINE / 04
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Support &amp; CRM
          </h1>
          <p className="text-sm text-[#8a99ad] mt-1">
            Direct operational channel for network inquiries, port mappings, and billing help.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-mono-tech uppercase font-bold tracking-wider btn-lime"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono-tech flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Ticket List + Message Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="bg-[#11161b] border border-[#1e262e] rounded p-4 space-y-3">
          <div className="text-xs font-mono-tech text-[#5c6b73] uppercase tracking-wider px-1">
            Ticket Threads ({tickets.length})
          </div>

          {loading ? (
            <div className="text-xs font-mono-tech text-[#5c6b73] text-center py-6">
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-xs font-mono-tech text-[#5c6b73] text-center py-6">
              No active tickets found.
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                const isOpen = t.status === 'OPEN';

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`cursor-pointer p-3 rounded border transition-all text-xs font-mono-tech ${
                      isSelected
                        ? 'bg-[#131920] border-[#ccff00]'
                        : 'bg-[#0d1115] border-[#1e262e] hover:border-[#2d3844]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#182028] text-[#8a99ad]">
                        {t.category}
                      </span>
                      <span
                        className={`text-[10px] flex items-center gap-1 ${
                          isOpen ? 'text-[#ccff00]' : 'text-[#5c6b73]'
                        }`}
                      >
                        {isOpen ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {t.status}
                      </span>
                    </div>
                    <div className="font-bold text-white truncate">{t.title}</div>
                    <div className="text-[10px] text-[#5c6b73] mt-1">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-2 bg-[#11161b] border border-[#1e262e] rounded p-5 flex flex-col justify-between min-h-[450px]">
          {selectedTicket ? (
            <>
              <div>
                {/* Thread Header */}
                <div className="border-b border-[#1e262e] pb-4 mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white">{selectedTicket.title}</h2>
                    <div className="text-xs font-mono-tech text-[#5c6b73] mt-0.5">
                      Category: {selectedTicket.category} • Thread #{selectedTicket.id.slice(-6)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (user) {
                          requestVoiceAssistance(selectedTicket.id, user.username, user.id);
                        }
                      }}
                      className="px-3 py-1 rounded bg-[#ccff00] hover:bg-[#b8e600] text-black font-mono-tech text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_12px_rgba(204,255,0,0.25)]"
                      title="Request real-time WebRTC audio call with an operator"
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>Voice Remote Assist</span>
                    </button>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono-tech uppercase ${
                        selectedTicket.status === 'OPEN'
                          ? 'bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20'
                          : 'bg-zinc-800 text-[#8a99ad]'
                      }`}
                    >
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                  {selectedTicket.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded text-xs font-mono-tech border ${
                        msg.isAdmin
                          ? 'bg-[#182028] border-[#2d3844] text-white ml-6'
                          : 'bg-[#0d1115] border-[#1e262e] text-[#8a99ad] mr-6'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#5c6b73] mb-1.5">
                        <span className="flex items-center gap-1 font-bold">
                          {msg.isAdmin ? (
                            <>
                              <Shield className="w-3 h-3 text-[#ccff00]" />
                              <span className="text-[#ccff00]">JARVIS Staff</span>
                            </>
                          ) : (
                            <>
                              <UserIcon className="w-3 h-3 text-white" />
                              <span className="text-white">You</span>
                            </>
                          )}
                        </span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="pt-4 border-t border-[#1e262e] mt-4 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response to operations..."
                  className="flex-1 bg-[#0d1115] border border-[#1e262e] focus:border-[#ccff00] rounded px-3 py-2 text-xs text-white font-mono-tech outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="px-4 py-2 rounded text-xs font-mono-tech font-bold btn-lime disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2 text-[#5c6b73]">
              <MessageSquare className="w-8 h-8 stroke-[1.5]" />
              <div className="text-xs font-mono-tech">Select a ticket thread to view the conversation</div>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#11161b] border border-[#1e262e] rounded p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e262e] pb-3">
              <h3 className="text-base font-bold text-white">Create Support Ticket</h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-[#5c6b73] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="text-xs font-mono-tech text-[#5c6b73] uppercase tracking-wider block mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#0d1115] border border-[#1e262e] rounded px-3 py-2 text-xs text-white font-mono-tech outline-none"
                >
                  <option value="GENERAL">General Operational Question</option>
                  <option value="TECHNICAL">Technical Node Configuration / Ports</option>
                  <option value="BILLING">Billing &amp; Tax Receipt Help</option>
                  <option value="SERVER_UPGRADE">Capacity &amp; Server Upgrade</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono-tech text-[#5c6b73] uppercase tracking-wider block mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Reverse proxy mapping for node"
                  className="w-full bg-[#0d1115] border border-[#1e262e] rounded px-3 py-2 text-xs text-white font-mono-tech outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-mono-tech text-[#5c6b73] uppercase tracking-wider block mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Describe your issue or request in detail..."
                  className="w-full bg-[#0d1115] border border-[#1e262e] rounded px-3 py-2 text-xs text-white font-mono-tech outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded text-xs font-mono-tech text-[#8a99ad] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded text-xs font-mono-tech font-bold btn-lime disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Open Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

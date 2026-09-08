import React, { useEffect, useState } from 'react';
import { 
  apiService, 
  Ticket, 
  TicketMessage 
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  LifeBuoy, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  MessageSquare,
  X
} from 'lucide-react';

export const Tickets: React.FC = () => {
  const { user, isAuthenticated, login } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  // New Ticket Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<string>('TECHNICAL');
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Reply state
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchTickets();
  }, [isAuthenticated]);

  const fetchTickets = async () => {
    try {
      const data = await apiService.getTickets();
      setTickets(data);
      if (data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      } else if (selectedTicket) {
        const updated = data.find((t) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) {
      setModalError('Please enter both a title and message.');
      return;
    }

    try {
      setCreatingTicket(true);
      setModalError(null);
      const created = await apiService.createTicket({
        category: newCategory,
        title: newTitle.trim(),
        message: newMessage.trim(),
      });

      setTickets([created, ...tickets]);
      setSelectedTicket(created);
      setModalOpen(false);
      setNewTitle('');
      setNewMessage('');
    } catch (err: any) {
      console.error('Create ticket error:', err);
      setModalError('Failed to create ticket. Please try again.');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      setSendingReply(true);
      const newMsg = await apiService.replyToTicket(selectedTicket.id, replyMessage.trim());
      
      const updatedMessages = [...(selectedTicket.messages || []), newMsg];
      const updatedTicket: Ticket = {
        ...selectedTicket,
        status: selectedTicket.status === 'RESOLVED' ? 'OPEN' : selectedTicket.status,
        messages: updatedMessages,
      };

      setSelectedTicket(updatedTicket);
      setTickets(tickets.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
      setReplyMessage('');
    } catch (err) {
      console.error('Reply ticket error:', err);
    } finally {
      setSendingReply(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
        <LifeBuoy className="w-14 h-14 text-cyan-400 mx-auto" />
        <h2 className="text-3xl font-extrabold text-white">Support & CRM Help Desk</h2>
        <p className="text-slate-400 text-sm">
          Login with Discord to submit support requests, report technical questions, or track payment verifications.
        </p>
        <button onClick={login} className="btn-discord">
          Login with Discord
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 font-medium">Loading your support tickets...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">CRM Help Desk</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Support & Verification Tickets
          </h1>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Tickets Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Ticket List (Left Col) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tickets ({tickets.length})
            </span>
          </div>

          {tickets.length === 0 ? (
            <div className="glass-panel p-8 text-center text-slate-400 text-sm">
              No tickets open. If you need assistance with your server node, create a ticket!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {tickets.map((ticket) => {
                const isSelected = selectedTicket?.id === ticket.id;
                const isResolved = ticket.status === 'RESOLVED';
                const isClosed = ticket.status === 'CLOSED';
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`cursor-pointer glass-panel p-4 transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-slate-900/90 shadow-[0_0_20px_rgba(0,240,255,0.12)]'
                        : 'hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/[0.06] text-cyan-300">
                        {ticket.category}
                      </span>
                      <span className={`badge-glow ${
                        isResolved ? 'badge-success' : isClosed ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white truncate">
                      {ticket.title}
                    </h4>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{ticket.messages?.length || 1} messages</span>
                      <span>{new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ticket Thread Detail (Right Col) */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="glass-panel border-white/[0.1] flex flex-col h-[650px]">
              
              {/* Header */}
              <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-slate-900/50 rounded-t-2xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400 uppercase">
                      {selectedTicket.type} • {selectedTicket.category}
                    </span>
                    <span className="badge-glow badge-warning text-[10px]">
                      {selectedTicket.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-white mt-1">
                    {selectedTicket.title}
                  </h3>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {selectedTicket.messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.isAdmin ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 font-medium">
                      {msg.isAdmin ? (
                        <span className="flex items-center gap-1 text-cyan-400 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Staff Administrator
                        </span>
                      ) : (
                        <span>You</span>
                      )}
                      <span>•</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${
                        msg.isAdmin
                          ? 'bg-slate-900/90 border border-cyan-500/30 text-slate-200 rounded-tl-sm'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-medium rounded-tr-sm'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Input Box */}
              {selectedTicket.status !== 'CLOSED' ? (
                <form onSubmit={handleSendReply} className="p-4 border-t border-white/[0.08] bg-slate-900/60 rounded-b-2xl flex gap-3">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your message to staff..."
                    className="flex-1 bg-slate-950 border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyMessage.trim()}
                    className="btn-primary py-2.5 px-4 text-xs shrink-0 flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              ) : (
                <div className="p-4 border-t border-white/[0.08] text-center text-xs text-slate-500 bg-slate-900/40 rounded-b-2xl">
                  This ticket has been marked as CLOSED by administration.
                </div>
              )}

            </div>
          ) : (
            <div className="glass-panel p-16 text-center text-slate-400 text-sm">
              Select a ticket from the left to view the conversation history.
            </div>
          )}
        </div>

      </div>

      {/* ─── New Ticket Modal ─────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel max-w-lg w-full p-6 sm:p-8 border-white/[0.15] bg-[#0c101a] space-y-6 relative">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-lg text-white">Create Support Ticket</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="TECHNICAL">TECHNICAL — Server Config, Network, Port forwarding</option>
                  <option value="BILLING">BILLING — Payments, Invoices, Renewals</option>
                  <option value="SERVER_UPGRADE">SERVER UPGRADE — Add RAM, Storage, vCPU</option>
                  <option value="GENERAL">GENERAL — Inquiries & Questions</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Title / Subject</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Help configuring custom firewall rules"
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Message</label>
                <textarea
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Describe your issue or request in detail..."
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary py-2.5 px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="btn-primary py-2.5 px-5 text-xs"
                >
                  {creatingTicket ? 'Submitting...' : 'Create Ticket'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

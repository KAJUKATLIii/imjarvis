import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  apiService,
  Payment,
  Server,
  Ticket,
  Order,
  Invoice,
} from '../../api/client';
import { getSubscriptionCountdown } from '../../utils/countdown';
import { downloadInvoicePdf } from '../../utils/download';
import { useVoiceAssistance } from '../../context/VoiceAssistanceContext';
import {
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Server as ServerIcon,
  LifeBuoy,
  Users,
  Check,
  X,
  Send,
  Edit3,
  Terminal,
  AlertCircle,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronRight,
  ShoppingCart,
  Search,
  Filter,
  FileText,
  Calendar,
  RotateCw,
  PlusCircle,
  Download,
  Radio,
  Headphones,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const { startCall } = useVoiceAssistance();
  const [activeTab, setActiveTab] = useState<'payments' | 'orders' | 'servers' | 'invoices' | 'tickets' | 'customers'>('payments');

  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter / Search states
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'FAILED'>('ALL');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Modal / Action states
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Payment fail state
  const [failingPaymentId, setFailingPaymentId] = useState<string | null>(null);
  const [failReason, setFailReason] = useState('');

  // Server edit state
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [consoleUrl, setConsoleUrl] = useState('');
  const [consoleUsername, setConsoleUsername] = useState('');
  const [consolePassword, setConsolePassword] = useState('');
  const [accessNotes, setAccessNotes] = useState('');
  const [accessStatus, setAccessStatus] = useState<'PENDING' | 'ACCESS_AVAILABLE'>('ACCESS_AVAILABLE');

  // Ticket reply state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [ticketStatusUpdate, setTicketStatusUpdate] = useState<string>('IN_PROGRESS');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [paymentsData, ordersData, serversData, invoicesData, ticketsData, customersData] = await Promise.all([
        apiService.admin.getPayments().catch(() => []),
        apiService.admin.getOrders().catch(() => []),
        apiService.admin.getServers().catch(() => []),
        apiService.admin.getInvoices().catch(() => []),
        apiService.admin.getTickets().catch(() => []),
        apiService.admin.getCustomers().catch(() => []),
      ]);
      setPayments(paymentsData);
      setOrders(ordersData);
      setServers(serversData);
      setInvoices(invoicesData);
      setTickets(ticketsData);
      setCustomers(customersData);
      if (ticketsData.length > 0 && !selectedTicket) {
        setSelectedTicket(ticketsData[0]);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(key);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  // ─── Payment Actions ────────────────────────────────────────────────────────
  const handleApprovePayment = async (paymentId: string) => {
    try {
      setProcessingId(paymentId);
      setActionError(null);
      await apiService.admin.approvePayment(paymentId);
      setActionSuccess('Payment approved! Invoice generated, node created, and Discord notified.');
      setTimeout(() => setActionSuccess(null), 4000);
      await loadAdminData();
    } catch (err: any) {
      console.error('Approval failed:', err);
      setActionError(err.response?.data?.error || 'Failed to approve payment.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleFailPayment = async () => {
    if (!failingPaymentId || !failReason.trim()) return;
    try {
      setProcessingId(failingPaymentId);
      setActionError(null);
      await apiService.admin.failPayment(failingPaymentId, failReason.trim());
      setFailingPaymentId(null);
      setFailReason('');
      setActionSuccess('Payment marked as rejected. Logged to Discord.');
      setTimeout(() => setActionSuccess(null), 4000);
      await loadAdminData();
    } catch (err: any) {
      console.error('Rejection failed:', err);
      setActionError(err.response?.data?.error || 'Failed to reject payment.');
    } finally {
      setProcessingId(null);
    }
  };

  // ─── Server Access Update ──────────────────────────────────────────────────
  const handleSaveServerAccess = async () => {
    if (!editingServer) return;
    try {
      setProcessingId(editingServer.id);
      setActionError(null);
      await apiService.admin.updateServerAccess(editingServer.id, {
        consoleUrl,
        consoleUsername,
        consolePassword: consolePassword || undefined,
        accessNotes,
        accessStatus,
        status: 'ACTIVE',
      });
      setEditingServer(null);
      setActionSuccess('Server console credentials updated and customer access unlocked.');
      setTimeout(() => setActionSuccess(null), 4000);
      await loadAdminData();
    } catch (err: any) {
      console.error('Save access failed:', err);
      setActionError(err.response?.data?.error || 'Failed to update server access.');
    } finally {
      setProcessingId(null);
    }
  };

  // ─── Subscription Extension (Admin) ─────────────────────────────────────────
  const handleExtendSubscription = async (serverId: string, days: number) => {
    try {
      setProcessingId(serverId);
      setActionError(null);
      await apiService.admin.extendSubscription(serverId, days);
      setActionSuccess(`Successfully extended server subscription by ${days} days.`);
      setTimeout(() => setActionSuccess(null), 4000);
      await loadAdminData();
    } catch (err: any) {
      console.error('Extend failed:', err);
      setActionError(err.response?.data?.error || 'Failed to extend subscription.');
    } finally {
      setProcessingId(null);
    }
  };

  // ─── PDF Invoice Download (Admin) ──────────────────────────────────────────
  const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      await downloadInvoicePdf(`/api/admin/invoices/${invoiceId}/download`, invoiceNumber);
    } catch (err: any) {
      console.error('Admin invoice download error:', err);
      alert(err.message || 'Failed to download invoice PDF.');
    }
  };

  // ─── Ticket Reply ──────────────────────────────────────────────────────────
  const handleAdminTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !adminReply.trim()) return;
    try {
      setActionError(null);
      await apiService.admin.replyToTicket(selectedTicket.id, adminReply.trim(), ticketStatusUpdate);
      setAdminReply('');
      await loadAdminData();
    } catch (err: any) {
      console.error('Admin reply failed:', err);
      setActionError('Failed to send admin reply.');
    }
  };

  const pendingPayments = payments.filter((p) => p.status === 'PENDING_VERIFICATION');
  const filteredPayments = payments.filter((p) => {
    if (paymentFilter === 'PENDING') return p.status === 'PENDING_VERIFICATION';
    if (paymentFilter === 'APPROVED') return p.status === 'APPROVED';
    if (paymentFilter === 'FAILED') return p.status === 'FAILED';
    return true;
  });

  return (
    <div className="space-y-8 font-mono-tech">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e262e] pb-6">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#5c6b73] uppercase tracking-wider mb-1">
            <span>JARVIS</span>
            <ChevronRight className="w-3 h-3 text-[#ccff00]" />
            <span>OPERATIONS DESK</span>
            <ChevronRight className="w-3 h-3 text-[#ccff00]" />
            <span className="text-[#ccff00]">ADMIN REVIEW</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Infrastructure Control Desk
          </h1>
          <p className="text-xs text-[#8a99ad] mt-0.5">
            Real-time ledger cross-check, subscription renewal manager, and PDF invoice archive.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded bg-[#11161b] border border-[#1e262e] text-xs">
            <span className="text-[#5c6b73]">OPERATOR: </span>
            <span className="text-[#ccff00] font-bold">{user?.username}</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {actionError && (
        <div className="p-4 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#11161b] border border-[#1e262e] rounded p-4">
          <div className="text-[11px] text-[#5c6b73] uppercase">Pending Payments</div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1">
            {pendingPayments.length}
          </div>
          <div className="text-[10px] text-[#5c6b73] mt-0.5">Awaiting UTR audit</div>
        </div>

        <div className="bg-[#11161b] border border-[#1e262e] rounded p-4">
          <div className="text-[11px] text-[#5c6b73] uppercase">Server Nodes</div>
          <div className="text-2xl sm:text-3xl font-bold text-[#ccff00] mt-1">
            {servers.length}
          </div>
          <div className="text-[10px] text-[#5c6b73] mt-0.5">Active instances</div>
        </div>

        <div className="bg-[#11161b] border border-[#1e262e] rounded p-4">
          <div className="text-[11px] text-[#5c6b73] uppercase">Invoices Issued</div>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-1">
            {invoices.length}
          </div>
          <div className="text-[10px] text-[#5c6b73] mt-0.5">Official PDF records</div>
        </div>

        <div className="bg-[#11161b] border border-[#1e262e] rounded p-4">
          <div className="text-[11px] text-[#5c6b73] uppercase">Open Tickets</div>
          <div className="text-2xl sm:text-3xl font-bold text-indigo-400 mt-1">
            {tickets.filter((t) => t.status !== 'CLOSED').length}
          </div>
          <div className="text-[10px] text-[#5c6b73] mt-0.5">CRM support queue</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-[#1e262e] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'payments'
              ? 'bg-[#131920] text-[#ccff00] border border-[#ccff00] shadow-[0_0_12px_rgba(204,255,0,0.1)]'
              : 'text-[#8a99ad] hover:text-white hover:bg-[#11161b]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payments ({pendingPayments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-[#131920] text-[#ccff00] border border-[#ccff00] shadow-[0_0_12px_rgba(204,255,0,0.1)]'
              : 'text-[#8a99ad] hover:text-white hover:bg-[#11161b]'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('servers')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'servers'
              ? 'bg-[#131920] text-[#ccff00] border border-[#ccff00] shadow-[0_0_12px_rgba(204,255,0,0.1)]'
              : 'text-[#8a99ad] hover:text-white hover:bg-[#11161b]'
          }`}
        >
          <ServerIcon className="w-4 h-4" />
          <span>Servers &amp; Renewals ({servers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'invoices'
              ? 'bg-[#131920] text-[#ccff00] border border-[#ccff00] shadow-[0_0_12px_rgba(204,255,0,0.1)]'
              : 'text-[#8a99ad] hover:text-white hover:bg-[#11161b]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>PDF Invoices ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'tickets'
              ? 'bg-[#131920] text-[#ccff00] border border-[#ccff00] shadow-[0_0_12px_rgba(204,255,0,0.1)]'
              : 'text-[#8a99ad] hover:text-white hover:bg-[#11161b]'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Support Desk ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'customers'
              ? 'bg-[#131920] text-[#ccff00] border border-[#ccff00] shadow-[0_0_12px_rgba(204,255,0,0.1)]'
              : 'text-[#8a99ad] hover:text-white hover:bg-[#11161b]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customers ({customers.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: PAYMENTS REVIEW ────────────────────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="bg-[#11161b] border border-[#1e262e] rounded p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Submitted Payments &amp; UTR Queue
              </h2>
              <p className="text-xs text-[#8a99ad]">
                Cross-check the 12-digit UTR on your bank account and approve to generate the invoice and node.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-[#0d1115] border border-[#1e262e] p-1 rounded text-xs">
              {(['ALL', 'PENDING', 'APPROVED', 'FAILED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPaymentFilter(filter)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                    paymentFilter === filter
                      ? 'bg-[#ccff00] text-black'
                      : 'text-[#8a99ad] hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#5c6b73]">
              No payments match the current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e262e] text-[#5c6b73] uppercase tracking-wider">
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">12-Digit UTR</th>
                    <th className="pb-3 font-medium">Anti-Fraud Guard</th>
                    <th className="pb-3 font-medium">Hardware Pack</th>
                    <th className="pb-3 font-medium">Amount Due</th>
                    <th className="pb-3 font-medium">Submitted</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e262e]">
                  {filteredPayments.map((p) => {
                    const isPending = p.status === 'PENDING_VERIFICATION';
                    const isApproved = p.status === 'APPROVED';
                    const isBusy = processingId === p.id;

                    return (
                      <tr key={p.id} className="hover:bg-[#131920]/60 transition-colors">
                        <td className="py-3.5">
                          <div className="font-bold text-white">{p.user?.username || 'Customer'}</div>
                          <div className="text-[10px] text-[#5c6b73]">{p.user?.discordId}</div>
                        </td>
                        <td className="py-3.5 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#ccff00] font-bold text-sm tracking-wider select-all">
                              {p.utr}
                            </span>
                            <button
                              onClick={() => copyToClipboard(p.utr, p.id)}
                              className="text-[#5c6b73] hover:text-white p-1 rounded transition-colors cursor-pointer"
                              title="Copy UTR"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {copiedUtr === p.id && (
                              <span className="text-[10px] text-[#ccff00]">Copied!</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5">
                          {(() => {
                            const fa = (p as any).fraudAssessment;
                            if (!fa) {
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-tech bg-slate-800 text-slate-300">
                                  <span>🛡️</span> Standard
                                </span>
                              );
                            }
                            if (fa.riskLevel === 'HIGH' || fa.isDuplicate || fa.isDummy) {
                              return (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                                    <ShieldAlert className="w-3 h-3" />
                                    <span>HIGH RISK / FRAUD</span>
                                  </span>
                                  <div className="text-[10px] text-red-400/90 font-mono-tech truncate max-w-[170px]" title={fa.flags?.join(', ')}>
                                    {fa.isDuplicate ? 'Duplicate / Recycled' : fa.flags?.[0] || 'Unusual Pattern'}
                                  </div>
                                </div>
                              );
                            }
                            if (fa.riskLevel === 'MEDIUM') {
                              return (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    <span>⚠️</span>
                                    <span>MEDIUM RISK ({fa.riskScore}/100)</span>
                                  </span>
                                  <div className="text-[10px] text-amber-300/80 font-mono-tech truncate max-w-[170px]" title={fa.flags?.join(', ')}>
                                    {fa.flags?.[0] || fa.detectedBank}
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>AUTHENTIC (NPCI)</span>
                                </span>
                                <div className="text-[10px] text-[#5c6b73] font-mono-tech truncate max-w-[170px]">
                                  {fa.detectedBank}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-3.5 text-[#8a99ad]">
                          <div>{p.order?.plan?.name || 'Dedicated Node'}</div>
                          <div className="text-[10px] text-[#5c6b73]">{p.order?.os?.name}</div>
                        </td>
                        <td className="py-3.5 font-bold text-white">
                          ₹{Number(p.amount).toLocaleString('en-IN')} INR
                        </td>
                        <td className="py-3.5 text-[#5c6b73]">
                          {new Date(p.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              isApproved
                                ? 'bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20'
                                : isPending
                                ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {isApproved ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : isPending ? (
                              <Clock className="w-3 h-3 animate-spin" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                            <span>{p.status}</span>
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApprovePayment(p.id)}
                                disabled={isBusy}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#ccff00] text-black font-bold hover:bg-[#d9ff33] transition-colors text-xs disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>{isBusy ? 'Verifying...' : 'Approve'}</span>
                              </button>
                              <button
                                onClick={() => setFailingPaymentId(p.id)}
                                disabled={isBusy}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors text-xs disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#5c6b73]">Logged</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: ORDERS DIRECTORY ───────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <div className="bg-[#11161b] border border-[#1e262e] rounded p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                All Customer Orders
              </h2>
              <p className="text-xs text-[#8a99ad]">
                Every staged, active, and pending hosting order on the platform.
              </p>
            </div>
            <span className="text-xs font-bold text-[#ccff00] bg-[#ccff00]/10 px-2.5 py-1 rounded border border-[#ccff00]/20">
              {orders.length} TOTAL
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#5c6b73]">
              No hosting orders recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e262e] text-[#5c6b73] uppercase tracking-wider">
                    <th className="pb-3 font-medium">Order Number</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Pack</th>
                    <th className="pb-3 font-medium">OS</th>
                    <th className="pb-3 font-medium">Region</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e262e]">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-[#131920]/60 transition-colors">
                      <td className="py-3 font-bold text-white">{o.orderNumber}</td>
                      <td className="py-3 text-[#8a99ad]">{(o as any).user?.username || 'Customer'}</td>
                      <td className="py-3 text-[#ccff00] font-bold">{o.plan?.name}</td>
                      <td className="py-3 text-[#8a99ad]">{o.os?.name}</td>
                      <td className="py-3 text-[#5c6b73]">{o.location}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            o.status === 'ACTIVE'
                              ? 'bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20'
                              : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 text-[#5c6b73]">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: SERVERS & RENEWAL MANAGER ───────────────────────────────── */}
      {activeTab === 'servers' && (
        <div className="bg-[#11161b] border border-[#1e262e] rounded p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Server Instances &amp; Subscription Renewal Tracker
              </h2>
              <p className="text-xs text-[#8a99ad]">
                Monitor real-time subscription countdowns, extend customer billing cycles, and manage credentials.
              </p>
            </div>
            <span className="text-xs font-bold text-[#ccff00] bg-[#ccff00]/10 px-2.5 py-1 rounded border border-[#ccff00]/20">
              {servers.length} ACTIVE NODES
            </span>
          </div>

          {servers.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#5c6b73]">
              No server instances currently active.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e262e] text-[#5c6b73] uppercase tracking-wider">
                    <th className="pb-3 font-medium">Server ID</th>
                    <th className="pb-3 font-medium">Owner</th>
                    <th className="pb-3 font-medium">Pack &amp; OS</th>
                    <th className="pb-3 font-medium">Renewal Countdown</th>
                    <th className="pb-3 font-medium">Console URL</th>
                    <th className="pb-3 font-medium text-right">Subscription Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e262e]">
                  {servers.map((srv) => {
                    const countdown = getSubscriptionCountdown(
                      srv.order?.billingPeriodEnd,
                      srv.order?.billingPeriodStart
                    );
                    const isBusy = processingId === srv.id;

                    return (
                      <tr key={srv.id} className="hover:bg-[#131920]/60 transition-colors">
                        <td className="py-3.5 font-bold text-white truncate max-w-[120px]">
                          {srv.id}
                        </td>
                        <td className="py-3.5 text-white">
                          {(srv as any).user?.username || 'Owner'}
                        </td>
                        <td className="py-3.5 text-[#8a99ad]">
                          <div>{srv.order?.plan?.name}</div>
                          <div className="text-[10px] text-[#5c6b73]">{srv.order?.os?.name}</div>
                        </td>
                        <td className="py-3.5">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                countdown.isExpired
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : countdown.isExpiringSoon
                                  ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                                  : 'bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20'
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              <span>{countdown.formatted}</span>
                            </span>
                            <div className="text-[10px] text-[#5c6b73]">
                              Ends: {srv.order?.billingPeriodEnd ? new Date(srv.order.billingPeriodEnd).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-[#ccff00] truncate max-w-[160px]">
                          {srv.consoleUrl || 'Pending URL'}
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Extend Subscription Buttons */}
                            <button
                              onClick={() => handleExtendSubscription(srv.id, 30)}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded bg-[#182028] border border-[#2d3844] text-[#ccff00] hover:border-[#ccff00] transition-colors text-[11px] font-bold"
                              title="Extend subscription by +30 Days"
                            >
                              +30d
                            </button>
                            <button
                              onClick={() => handleExtendSubscription(srv.id, 7)}
                              disabled={isBusy}
                              className="px-2 py-1 rounded bg-[#182028] border border-[#2d3844] text-[#8a99ad] hover:text-white transition-colors text-[11px]"
                              title="Extend subscription by +7 Days"
                            >
                              +7d
                            </button>

                            {/* Access Credentials Modal */}
                            <button
                              onClick={() => {
                                setEditingServer(srv);
                                setConsoleUrl(srv.consoleUrl || '');
                                setConsoleUsername(srv.consoleUsername || 'root');
                                setConsolePassword('');
                                setAccessNotes(srv.accessNotes || '');
                                setAccessStatus((srv.accessStatus as any) || 'ACCESS_AVAILABLE');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#ccff00] text-black hover:bg-[#d9ff33] transition-colors text-[11px] font-bold"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Access</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: INVOICES & TAX RECEIPTS ────────────────────────────────── */}
      {activeTab === 'invoices' && (
        <div className="bg-[#11161b] border border-[#1e262e] rounded p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Official PDF Tax Invoices
              </h2>
              <p className="text-xs text-[#8a99ad]">
                Generated automatically upon payment approval. Download official PDFs for accounting and audits.
              </p>
            </div>
            <span className="text-xs font-bold text-[#ccff00] bg-[#ccff00]/10 px-2.5 py-1 rounded border border-[#ccff00]/20">
              {invoices.length} GENERATED
            </span>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#5c6b73]">
              No invoices issued yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e262e] text-[#5c6b73] uppercase tracking-wider">
                    <th className="pb-3 font-medium">Invoice Number</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Hardware Pack</th>
                    <th className="pb-3 font-medium">Amount Paid</th>
                    <th className="pb-3 font-medium">Issue Date</th>
                    <th className="pb-3 font-medium text-right">PDF Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e262e]">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#131920]/60 transition-colors">
                      <td className="py-3.5 font-bold text-white font-mono">{inv.invoiceNumber}</td>
                      <td className="py-3.5">
                        <div className="font-bold text-white">{(inv as any).user?.username || 'Customer'}</div>
                        <div className="text-[10px] text-[#5c6b73]">{(inv as any).user?.discordId}</div>
                      </td>
                      <td className="py-3.5 text-[#8a99ad]">
                        {inv.order?.plan?.name || 'Dedicated Node'}
                      </td>
                      <td className="py-3.5 font-bold text-[#ccff00]">
                        ₹{inv.totalAmount.toLocaleString('en-IN')} INR
                      </td>
                      <td className="py-3.5 text-[#5c6b73]">
                        {new Date(inv.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleDownloadInvoice(inv.id, inv.invoiceNumber)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#182028] border border-[#2d3844] text-white hover:border-[#ccff00] hover:text-[#ccff00] transition-colors text-xs font-bold"
                          title="Download Customer PDF Invoice"
                        >
                          <FileText className="w-3.5 h-3.5 text-red-400" />
                          <span>Download PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: SUPPORT DESK CRM ───────────────────────────────────────── */}
      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Ticket list */}
          <div className="lg:col-span-5 bg-[#11161b] border border-[#1e262e] rounded p-4 space-y-2.5 max-h-[600px] overflow-y-auto">
            <div className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-[#1e262e]">
              Support Queue ({tickets.length})
            </div>

            {tickets.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#5c6b73]">
                No customer support tickets.
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`cursor-pointer rounded p-3 border transition-all ${
                      isSelected
                        ? 'bg-[#131920] border-[#ccff00] shadow-[0_0_12px_rgba(204,255,0,0.08)]'
                        : 'bg-[#0d1115] border-[#1e262e] hover:border-[#2d3844]'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-white">
                        {(t as any).user?.username || 'Customer'}
                      </span>
                      <span className="text-[10px] text-amber-400 font-bold uppercase">
                        {t.status}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 truncate">{t.title}</div>
                    <div className="text-[10px] text-[#5c6b73] mt-1">
                      {t.category} • {t.type}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Ticket Conversation */}
          <div className="lg:col-span-7 bg-[#11161b] border border-[#1e262e] rounded flex flex-col h-[600px]">
            {selectedTicket ? (
              <>
                <div className="p-4 border-b border-[#1e262e] bg-[#0d1115] flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white text-sm">{selectedTicket.title}</h4>
                    <span className="text-[11px] text-[#5c6b73]">
                      Customer: {(selectedTicket as any).user?.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      onClick={() => startCall(`ticket-${selectedTicket.id}`, selectedTicket.title)}
                      className="px-3 py-1 rounded bg-[#ccff00] hover:bg-[#b8e600] text-black font-mono-tech text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_10px_rgba(204,255,0,0.2)]"
                      title="Start or Join WebRTC Audio Troubleshooting Room"
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>Voice Assist</span>
                    </button>
                    <span className="text-[#5c6b73]">Status:</span>
                    <select
                      value={ticketStatusUpdate}
                      onChange={(e) => setTicketStatusUpdate(e.target.value)}
                      className="bg-[#11161b] border border-[#1e262e] focus:border-[#ccff00] rounded px-2.5 py-1 text-xs text-white outline-none"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {selectedTicket.messages?.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-[#5c6b73] mb-1">
                        {m.isAdmin ? 'Admin (You)' : 'Customer'} •{' '}
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </div>
                      <div
                        className={`max-w-[85%] p-3.5 rounded text-xs whitespace-pre-wrap ${
                          m.isAdmin
                            ? 'bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00]'
                            : 'bg-[#0d1115] border border-[#1e262e] text-white'
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={handleAdminTicketReply}
                  className="p-3 border-t border-[#1e262e] bg-[#0d1115] flex gap-2"
                >
                  <input
                    type="text"
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    placeholder="Type official admin response (logged to Discord ticket)..."
                    className="flex-1 bg-[#11161b] border border-[#1e262e] focus:border-[#ccff00] rounded px-3 py-2 text-xs text-white outline-none"
                  />
                  <button
                    type="submit"
                    className="btn-lime px-4 py-2 rounded text-xs uppercase font-bold flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="p-12 text-center text-[#5c6b73] text-xs m-auto">
                Select a support ticket to review the thread and reply.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 6: CUSTOMER DIRECTORY ─────────────────────────────────────── */}
      {activeTab === 'customers' && (
        <div className="bg-[#11161b] border border-[#1e262e] rounded p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Customer Directory
              </h2>
              <p className="text-xs text-[#8a99ad]">
                Registered users authenticated through Discord OAuth2.
              </p>
            </div>
            <span className="text-xs font-bold text-[#ccff00] bg-[#ccff00]/10 px-2.5 py-1 rounded border border-[#ccff00]/20">
              {customers.length} REGISTERED
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1e262e] text-[#5c6b73] uppercase tracking-wider">
                  <th className="pb-3 font-medium">Username</th>
                  <th className="pb-3 font-medium">Discord ID</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Orders</th>
                  <th className="pb-3 font-medium">Payments</th>
                  <th className="pb-3 font-medium">Tickets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e262e]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#131920]/60 transition-colors">
                    <td className="py-3 font-bold text-white">{c.username}</td>
                    <td className="py-3 text-[#5c6b73]">{c.discordId}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          c.role === 'ADMIN'
                            ? 'bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20'
                            : 'bg-[#182028] text-[#8a99ad] border border-[#1e262e]'
                        }`}
                      >
                        {c.role}
                      </span>
                    </td>
                    <td className="py-3 text-white">{c._count?.orders || 0}</td>
                    <td className="py-3 text-white">{c._count?.payments || 0}</td>
                    <td className="py-3 text-white">{c._count?.tickets || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Reject Payment Modal ──────────────────────────────────────────── */}
      {failingPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 bg-[#11161b] border border-red-500/40 rounded space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Reject UPI Payment</h3>
            <p className="text-xs text-[#8a99ad]">
              State the reason (e.g. UTR not found on bank statement, amount mismatch). This reason will be logged to Discord and attached to the customer ticket.
            </p>
            <textarea
              rows={3}
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              placeholder="e.g. Bank statement shows transaction failed or UTR does not exist."
              className="w-full bg-[#0d1115] border border-[#1e262e] focus:border-red-400 rounded p-3 text-xs text-white outline-none resize-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFailingPaymentId(null)}
                className="btn-outline-dark px-4 py-2 rounded text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleFailPayment}
                disabled={!failReason.trim()}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Manage Server Access Modal ────────────────────────────────────── */}
      {editingServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-lg w-full p-6 sm:p-8 bg-[#11161b] border border-[#ccff00]/40 rounded space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#1e262e]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#ccff00]" />
                <h3 className="font-bold text-base text-white">Attach Server Console Access</h3>
              </div>
              <button
                onClick={() => setEditingServer(null)}
                className="text-[#5c6b73] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[#5c6b73] uppercase block mb-1">
                  Control Panel URL
                </label>
                <input
                  type="url"
                  value={consoleUrl}
                  onChange={(e) => setConsoleUrl(e.target.value)}
                  placeholder="https://panel.jarvishosting.com or IP:Port"
                  className="w-full bg-[#0d1115] border border-[#1e262e] focus:border-[#ccff00] rounded px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#5c6b73] uppercase block mb-1">
                  Console Username
                </label>
                <input
                  type="text"
                  value={consoleUsername}
                  onChange={(e) => setConsoleUsername(e.target.value)}
                  placeholder="root or panel username"
                  className="w-full bg-[#0d1115] border border-[#1e262e] focus:border-[#ccff00] rounded px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#5c6b73] uppercase block mb-1">
                  Console Password (Encrypted at rest)
                </label>
                <input
                  type="text"
                  value={consolePassword}
                  onChange={(e) => setConsolePassword(e.target.value)}
                  placeholder="Leave blank to keep existing password"
                  className="w-full bg-[#0d1115] border border-[#1e262e] focus:border-[#ccff00] rounded px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#5c6b73] uppercase block mb-1">
                  Access Status
                </label>
                <select
                  value={accessStatus}
                  onChange={(e) => setAccessStatus(e.target.value as any)}
                  className="w-full bg-[#0d1115] border border-[#1e262e] focus:border-[#ccff00] rounded px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="ACCESS_AVAILABLE">ACCESS_AVAILABLE (Customer can view credentials)</option>
                  <option value="PENDING">PENDING (Keep provisioning)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#5c6b73] uppercase block mb-1">
                  Access Instructions / Notes
                </label>
                <textarea
                  rows={3}
                  value={accessNotes}
                  onChange={(e) => setAccessNotes(e.target.value)}
                  placeholder="e.g. Please change root password upon first SSH login. Port 25565 is open."
                  className="w-full bg-[#0d1115] border border-[#1e262e] focus:border-[#ccff00] rounded p-3 text-xs text-white outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingServer(null)}
                className="btn-outline-dark px-4 py-2 rounded text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveServerAccess}
                className="btn-lime px-4 py-2 rounded text-xs font-bold uppercase"
              >
                Save &amp; Unlock for Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

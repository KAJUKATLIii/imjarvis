import React, { useEffect, useState } from 'react';
import { 
  apiService, 
  Invoice, 
  Payment 
} from '../api/client';
import { downloadInvoicePdf } from '../utils/download';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Download, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Receipt,
  ExternalLink
} from 'lucide-react';

export const Billing: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    Promise.all([apiService.getInvoices(), apiService.getPayments()])
      .then(([invoicesData, paymentsData]) => {
        setInvoices(invoicesData);
        setPayments(paymentsData);
      })
      .catch((err) => console.error('Error fetching billing data:', err))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
        <CreditCard className="w-14 h-14 text-cyan-400 mx-auto" />
        <h2 className="text-3xl font-extrabold text-white">Billing & Invoices</h2>
        <p className="text-slate-400 text-sm">
          Login with Discord to view and download your official VAT/GST paid server invoices.
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
        <p className="text-slate-400 font-medium">Retrieving invoices & payment records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6">
        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Accounting & Records</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
          Billing & Invoices
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Download tax invoices for verified payments. Invoices are generated once an administrator confirms your payment.
        </p>
      </div>

      {/* Invoices Table */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Generated Invoices</h2>
        </div>

        {invoices.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-400 text-sm">
            No invoices generated yet. Invoices appear automatically after payment approval.
          </div>
        ) : (
          <div className="glass-panel overflow-hidden border-white/[0.08]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-900/80 border-b border-white/[0.08] text-slate-400 uppercase text-[11px] tracking-wider font-mono">
                  <tr>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Hardware Plan</th>
                    <th className="px-6 py-4">Total Paid</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-cyan-400">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        {inv.order?.plan?.name || 'Server Node'}
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge-glow badge-success">
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => downloadInvoicePdf(`/api/billing/invoices/${inv.id}/download`, inv.invoiceNumber)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors font-medium text-xs cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Payment Submissions Table */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">UPI Payment History</h2>
        </div>

        {payments.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-400 text-sm">
            No payment records found.
          </div>
        ) : (
          <div className="glass-panel overflow-hidden border-white/[0.08]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-900/80 border-b border-white/[0.08] text-slate-400 uppercase text-[11px] tracking-wider font-mono">
                  <tr>
                    <th className="px-6 py-4">UTR Number</th>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Date Submitted</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {payments.map((p) => {
                    const isApproved = p.status === 'APPROVED';
                    const isPending = p.status === 'PENDING_VERIFICATION';
                    const isFailed = p.status === 'FAILED';
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-white select-all">
                          {p.utr}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {p.order?.plan?.name || 'Server Order'}
                        </td>
                        <td className="px-6 py-4 font-bold text-cyan-300">
                          ₹{Number(p.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {new Date(p.createdAt).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge-glow ${
                            isApproved ? 'badge-success' : isPending ? 'badge-warning' : 'badge-danger'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

    </div>
  );
};

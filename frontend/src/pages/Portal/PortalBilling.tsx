import React, { useEffect, useState } from 'react';
import { api, Invoice, Payment, Order } from '../../api/client';
import { downloadInvoicePdf } from '../../utils/download';
import { UPICheckout } from 'upi-pay-kit';
import 'upi-pay-kit/style.css';
import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  FileText,
  QrCode,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const PortalBilling: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [utr, setUtr] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isKitOpen, setIsKitOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [invRes, payRes, ordRes] = await Promise.all([
          api.billing.getMyInvoices().catch(() => ({ data: [] })),
          api.payments.getMyPayments().catch(() => ({ data: [] })),
          api.orders.getMyOrders().catch(() => ({ data: [] })),
        ]);
        setInvoices(invRes.data);
        setPayments(payRes.data);
        setOrders(ordRes.data);

        const pending = ordRes.data.filter((o) => o.status === 'PENDING' && !o.payment);
        if (pending.length > 0) {
          setSelectedOrderId(pending[0].id);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !utr) return;

    if (!/^\d{12}$/.test(utr)) {
      setError('UTR must be exactly 12 numeric digits.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.payments.verifyUtr({
        orderId: selectedOrderId,
        utr,
      });
      setSuccess('UTR submitted successfully. Our operations team is verifying the transaction.');
      setUtr('');
      // Refresh
      const [pRes, oRes] = await Promise.all([
        api.payments.getMyPayments(),
        api.orders.getMyOrders(),
      ]);
      setPayments(pRes.data);
      setOrders(oRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit UTR.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      await downloadInvoicePdf(`/api/billing/invoices/${invoiceId}/download`, invoiceNumber);
    } catch (err: any) {
      console.error('Invoice download error:', err);
      alert(err.message || 'Failed to download invoice PDF.');
    }
  };

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const pendingOrders = orders.filter((o) => o.status === 'PENDING' && !o.payment);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="text-xs font-mono-tech tracking-widest text-[#ccff00] mb-1">
          MONEY TRAIL / 02
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Billing &amp; Receipts
        </h1>
        <p className="text-sm text-[#8a99ad] mt-1">
          Submit UPI transaction references, monitor payment status, and download tax receipts.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono-tech flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00] text-xs font-mono-tech flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Submit UTR Card */}
      <div className="bg-[#11161b] border border-[#1e262e] rounded p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Submit a payment UTR
            </h2>
            <p className="text-xs text-[#8a99ad] mt-0.5">
              After transferring funds via UPI, paste your 12-digit transaction UTR number to attach it to your order.
            </p>
          </div>

          {/* UPI Pay Kit Trigger */}
          {selectedOrder && (
            <button
              onClick={() => setIsKitOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded text-xs font-mono-tech uppercase font-bold bg-[#182028] border border-[#2d3844] text-[#ccff00] hover:border-[#ccff00] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch UPI Pay Kit</span>
            </button>
          )}
        </div>

        {pendingOrders.length === 0 ? (
          <div className="p-4 rounded bg-[#0d1115] border border-[#1e262e] text-xs font-mono-tech text-[#5c6b73]">
            No pending orders require payment right now. All your orders are either completed or verified.
          </div>
        ) : (
          <form onSubmit={handleUtrSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono-tech text-[#5c6b73] uppercase tracking-wider block mb-1.5">
                  Select Pending Order
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full bg-[#0d1115] border border-[#1e262e] focus:border-[#ccff00] rounded px-3 py-2.5 text-xs text-white font-mono-tech outline-none"
                >
                  {pendingOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} — {o.plan?.name} (₹{o.plan?.priceMonthly.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono-tech text-[#5c6b73] uppercase tracking-wider block mb-1.5">
                  12-Digit Transaction UTR
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 423456789012"
                  className="w-full bg-[#0d1115] border border-[#1e262e] focus:border-[#ccff00] rounded px-3 py-2.5 text-xs text-white font-mono-tech outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs font-mono-tech text-[#8a99ad]">
                Payee UPI ID:{' '}
                <span className="text-white font-bold">sharonbabu17042004@okaxis</span>
              </div>
              <button
                type="submit"
                disabled={submitting || !utr || utr.length !== 12}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-xs font-mono-tech uppercase font-bold tracking-wider btn-lime disabled:opacity-50"
              >
                <span>{submitting ? 'Verifying...' : 'Send UTR for Review'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* UPI Pay Kit Modal */}
      {selectedOrder && (
        <UPICheckout
          open={isKitOpen}
          onOpenChange={setIsKitOpen}
          amount={Math.round((selectedOrder.plan?.priceMonthly || 15000) * 100)}
          merchantUpiId="sharonbabu17042004@okaxis"
          merchantName="Sharon (JARVIS Hosting)"
          theme="dark"
          accentColor="#ccff00"
          manualVerification={true}
          onSubmitUTR={async (submittedUtr: string) => {
            setUtr(submittedUtr);
            setIsKitOpen(false);
            try {
              await api.payments.verifyUtr({
                orderId: selectedOrder.id,
                utr: submittedUtr,
              });
              setSuccess('UTR submitted from UPI Pay Kit! Verification underway.');
              const [pRes, oRes] = await Promise.all([
                api.payments.getMyPayments(),
                api.orders.getMyOrders(),
              ]);
              setPayments(pRes.data);
              setOrders(oRes.data);
              return true;
            } catch (err: any) {
              setError(err.response?.data?.error || 'Failed to verify UTR.');
              return false;
            }
          }}
          onClose={() => setIsKitOpen(false)}
        />
      )}

      {/* Payments History */}
      <div className="bg-[#11161b] border border-[#1e262e] rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white tracking-tight">
            Payments
          </h2>
          <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-[#182028] border border-[#1e262e] text-[#8a99ad]">
            {payments.length} RECORDS
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono-tech text-[#5c6b73]">
            No payment records submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-tech">
              <thead>
                <tr className="border-b border-[#1e262e] text-[#5c6b73] uppercase tracking-wider">
                  <th className="pb-3 font-medium">Order Number</th>
                  <th className="pb-3 font-medium">UTR</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e262e]">
                {payments.map((pay) => {
                  const isPending = pay.status === 'PENDING_VERIFICATION';
                  const isApproved = pay.status === 'APPROVED';
                  return (
                    <tr key={pay.id} className="hover:bg-[#131920]/50 transition-colors">
                      <td className="py-3.5 font-bold text-white">{pay.order?.orderNumber || '—'}</td>
                      <td className="py-3.5 text-white font-mono">{pay.utr}</td>
                      <td className="py-3.5 text-[#ccff00] font-bold">₹{pay.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-tech uppercase ${
                            isApproved
                              ? 'bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20'
                              : isPending
                              ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                              : 'bg-red-400/10 text-red-400 border border-red-400/20'
                          }`}
                        >
                          {isApproved ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : isPending ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          <span>{pay.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="py-3.5 text-[#5c6b73]">
                        {new Date(pay.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoices List */}
      <div className="bg-[#11161b] border border-[#1e262e] rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white tracking-tight">
            Invoices
          </h2>
          <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-[#182028] border border-[#1e262e] text-[#8a99ad]">
            {invoices.length} DOCUMENTS
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono-tech text-[#5c6b73]">
            No invoices generated yet. Invoices are issued upon admin payment approval.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-tech">
              <thead>
                <tr className="border-b border-[#1e262e] text-[#5c6b73] uppercase tracking-wider">
                  <th className="pb-3 font-medium">Invoice Number</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Service</th>
                  <th className="pb-3 font-medium">Total Paid</th>
                  <th className="pb-3 font-medium text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e262e]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#131920]/50 transition-colors">
                    <td className="py-3.5 font-bold text-white">{inv.invoiceNumber}</td>
                    <td className="py-3.5 text-[#5c6b73]">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-[#8a99ad]">
                      {inv.order?.plan?.name || 'Dedicated Node'}
                    </td>
                    <td className="py-3.5 text-[#ccff00] font-bold">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(inv.id, inv.invoiceNumber)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#182028] border border-[#2d3844] text-white hover:border-[#ccff00] hover:text-[#ccff00] transition-colors text-xs font-bold"
                        title="Download Official PDF Invoice"
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
    </div>
  );
};

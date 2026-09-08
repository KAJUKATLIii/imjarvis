import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { UPICheckout } from 'upi-pay-kit';
import 'upi-pay-kit/style.css';
import { api, apiService, Order } from '../api/client';
import {
  CheckCircle2,
  Clock,
  Copy,
  ShieldCheck,
  AlertCircle,
  QrCode,
  ArrowRight,
  Server,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Zap,
} from 'lucide-react';

export const Checkout: React.FC = () => {
  const { orderId: paramOrderId } = useParams<{ orderId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = paramOrderId || searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [merchantInfo, setMerchantInfo] = useState<{ upiId: string; merchantName: string }>({
    upiId: 'sharonbabu17042004@okaxis',
    merchantName: 'Sharon',
  });
  const [utr, setUtr] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);

  // State for upi-pay-kit Modal
  const [isKitOpen, setIsKitOpen] = useState(false);

  useEffect(() => {
    if (!orderId) {
      navigate('/portal/orders');
      return;
    }

    Promise.all([
      apiService.getOrder(orderId),
      apiService
        .getMerchantInfo()
        .catch(() => ({ upiId: 'sharonbabu17042004@okaxis', merchantName: 'Sharon' })),
    ])
      .then(([orderData, merchantData]) => {
        setOrder(orderData);
        if (merchantData?.upiId) {
          setMerchantInfo(merchantData);
        }
        if (orderData.payment) {
          setSuccessStatus(orderData.payment.status);
          setUtr(orderData.payment.utr);
        }
      })
      .catch((err) => {
        console.error('Checkout fetch error:', err);
        if (err.response?.status === 401) {
          setErrorMessage('Session expired or unauthorized. Please log in with Discord.');
        } else {
          setErrorMessage('Failed to load order information.');
        }
      })
      .finally(() => setLoading(false));
  }, [orderId, navigate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleUtrSubmit = async (utrCodeToSubmit?: string) => {
    const targetUtr = (utrCodeToSubmit || utr).trim();
    if (!order) return;

    if (!/^\d{12}$/.test(targetUtr)) {
      setErrorMessage('UTR must be exactly 12 numeric digits from your UPI app receipt.');
      return;
    }

    try {
      setSubmittingUtr(true);
      setErrorMessage(null);
      const res = await apiService.submitUTR({
        orderId: order.id,
        utr: targetUtr,
      });

      setSuccessStatus(res.status);
      setOrder({
        ...order,
        payment: {
          id: res.paymentId,
          orderId: order.id,
          userId: order.userId,
          amount: order.plan?.priceMonthly || 0,
          currency: 'INR',
          utr: targetUtr,
          status: 'PENDING_VERIFICATION',
          method: 'UPI',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any,
      });
    } catch (err: any) {
      console.error('UTR submission error:', err);
      const msg =
        err.response?.data?.error ||
        'Failed to submit UTR. Please ensure this UTR has not been used before.';
      setErrorMessage(typeof msg === 'string' ? msg : 'Submission error.');
      throw err;
    } finally {
      setSubmittingUtr(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-[#0a0d10] font-mono-tech">
        <div className="w-10 h-10 border-2 border-[#ccff00] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-[#8a99ad] tracking-wider uppercase">Loading UPI Payment Terminal...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-[#0a0d10] text-center space-y-4 font-mono-tech">
        <div className="w-12 h-12 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Order Not Found</h2>
        <p className="text-xs text-[#8a99ad] max-w-sm">
          {errorMessage || "We couldn't retrieve the specified order details. Please log in or check your orders."}
        </p>
        <div className="flex items-center gap-3 pt-2">
          <Link to="/portal/orders" className="btn-lime px-4 py-2 rounded text-xs font-bold uppercase">
            Browse Orders
          </Link>
          <a href="/api/auth/discord" className="btn-outline-dark px-4 py-2 rounded text-xs font-bold uppercase">
            Login with Discord
          </a>
        </div>
      </div>
    );
  }

  const amount = Number(order.plan?.priceMonthly || 0);
  const upiUrl = `upi://pay?pa=${encodeURIComponent(merchantInfo.upiId)}&pn=${encodeURIComponent(
    merchantInfo.merchantName
  )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`JARVIS Order ${order.orderNumber}`)}`;

  const isPending = successStatus === 'PENDING_VERIFICATION';
  const isApproved = successStatus === 'APPROVED';

  return (
    <div className="bg-[#0a0d10] min-h-screen text-[#8a99ad] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e262e] pb-6">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono-tech text-[#5c6b73] uppercase tracking-wider mb-1">
              <span>JARVIS</span>
              <ChevronRight className="w-3 h-3 text-[#ccff00]" />
              <Link to="/portal" className="hover:text-white transition-colors">
                CUSTOMER
              </Link>
              <ChevronRight className="w-3 h-3 text-[#ccff00]" />
              <span className="text-[#ccff00]">UPI DIRECT HANDOFF</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Order {order.orderNumber}
            </h1>
          </div>

          <div className="flex items-center gap-3 font-mono-tech bg-[#11161b] border border-[#1e262e] px-4 py-2.5 rounded">
            <span className="text-xs text-[#5c6b73]">Total Due:</span>
            <span className="text-xl font-bold text-[#ccff00]">
              ₹{amount.toLocaleString('en-IN')} INR
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono-tech flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Pending Verification Banner */}
        {isPending && (
          <div className="bg-[#181d24] border border-amber-500/40 rounded p-6 space-y-3 font-mono-tech">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
              <Clock className="w-5 h-5 animate-spin" />
              <span>UTR SUBMITTED / PENDING VERIFICATION</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your 12-digit UTR <strong className="text-white font-bold">{utr}</strong> is queued in our
              payment desk. An admin verifies the receipt and generates your node credentials immediately.
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs font-bold">
              <Link to="/portal/billing" className="text-[#ccff00] hover:underline flex items-center gap-1">
                <span>View Billing & Invoices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link to="/portal/support" className="text-[#8a99ad] hover:text-white flex items-center gap-1">
                <span>Open Support Ticket</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Approved Banner */}
        {isApproved && (
          <div className="bg-[#11161b] border border-[#ccff00]/40 rounded p-6 space-y-3 font-mono-tech">
            <div className="flex items-center gap-2.5 text-[#ccff00] font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>PAYMENT APPROVED & CREDENTIALS UNLOCKED</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your payment has been successfully confirmed. Dedicated endpoint and console login credentials are now
              active in your control room.
            </p>
            <div className="pt-2">
              <Link to="/portal/servers" className="btn-lime px-5 py-2.5 rounded text-xs font-bold uppercase inline-flex items-center gap-2">
                <span>Open Server Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Main Grid: QR Left, Summary Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-mono-tech">
          {/* Left: Scan QR and Direct UPI Modal */}
          <div className="lg:col-span-7 bg-[#11161b] border border-[#1e262e] rounded p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#ccff00]" />
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                  Scan to Pay via UPI
                </h3>
              </div>
              <span className="text-[10px] text-[#ccff00] bg-[#ccff00]/10 border border-[#ccff00]/20 px-2 py-0.5 rounded uppercase font-bold">
                Zero Gateway Fee
              </span>
            </div>

            {/* Launch UPI Pay Kit button */}
            {!isPending && !isApproved && (
              <div className="p-4 rounded bg-[#131920] border border-[#1e262e] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#ccff00]" />
                    <span>Quick Checkout with UPI-Pay-Kit</span>
                  </div>
                  <div className="text-[11px] text-[#5c6b73] mt-0.5">
                    Interactive drawer with live QR, intent links, and auto-verifier
                  </div>
                </div>
                <button
                  onClick={() => setIsKitOpen(true)}
                  className="btn-lime py-2 px-4 rounded text-xs uppercase font-bold tracking-wider whitespace-nowrap"
                >
                  Launch UPI Modal
                </button>
              </div>
            )}

            {/* High-Contrast QR Code Card */}
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded max-w-[280px] mx-auto shadow-lg">
              <QRCodeSVG value={upiUrl} size={210} level="H" includeMargin={false} />
              <div className="mt-3 text-center">
                <span className="text-[10px] font-bold text-slate-800 tracking-wider">
                  SCAN WITH ANY UPI APP
                </span>
              </div>
            </div>

            {/* Merchant Details */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between p-3 rounded bg-[#0d1115] border border-[#1e262e] text-xs">
                <div>
                  <div className="text-[10px] text-[#5c6b73] uppercase">Merchant UPI ID</div>
                  <div className="text-white font-bold text-sm tracking-wide select-all">
                    {merchantInfo.upiId}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(merchantInfo.upiId)}
                  className="flex items-center gap-1 text-xs text-[#8a99ad] hover:text-white px-2.5 py-1 rounded bg-[#182028] border border-[#1e262e] transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex justify-between items-center px-1 text-xs text-[#8a99ad]">
                <span>
                  Payee: <strong className="text-white">{merchantInfo.merchantName}</strong>
                </span>
                <span>
                  Amount: <strong className="text-[#ccff00]">₹{amount.toFixed(2)}</strong>
                </span>
              </div>
            </div>

            {/* Mobile Intent Link */}
            <div className="pt-2 block sm:hidden">
              <a
                href={upiUrl}
                className="w-full btn-outline-dark text-xs py-2.5 flex items-center justify-center gap-2 rounded text-center"
              >
                <span>Tap to Open in UPI App (GPay / PhonePe / Paytm)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right: Order Summary & UTR Submission */}
          <div className="lg:col-span-5 space-y-6">
            {/* Order Details Card */}
            <div className="bg-[#11161b] border border-[#1e262e] rounded p-6 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Node Specification
              </h4>
              <div className="space-y-2 text-xs divide-y divide-[#1e262e]">
                <div className="flex justify-between pb-2">
                  <span className="text-[#5c6b73]">Pack</span>
                  <span className="font-bold text-white">{order.plan?.name || 'Dedicated Node'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#5c6b73]">RAM Allocation</span>
                  <span className="font-bold text-white">{order.plan?.ramGb || 0} GB DDR4</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#5c6b73]">vCPU Compute</span>
                  <span className="font-bold text-white">{order.plan?.vcpuCores || 0} Dedicated Cores</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#5c6b73]">NVMe Disk</span>
                  <span className="font-bold text-white">{order.plan?.storageGb || 0} GB NVMe</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#5c6b73]">Operating System</span>
                  <span className="font-bold text-[#ccff00]">{order.os?.name || 'Linux'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#5c6b73]">Region Core</span>
                  <span className="font-bold text-white">{order.location}</span>
                </div>
                <div className="flex justify-between pt-3 text-sm">
                  <span className="font-bold text-white">Amount Due</span>
                  <span className="font-bold text-[#ccff00]">₹{amount.toLocaleString('en-IN')} INR</span>
                </div>
              </div>
            </div>

            {/* UTR Submission Card */}
            <div className="bg-[#11161b] border border-[#1e262e] rounded p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#ccff00]" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  UTR Ledger Verification
                </h4>
              </div>

              <p className="text-xs text-[#8a99ad] leading-relaxed">
                After completing payment, submit your <strong>12-digit transaction UTR</strong> from your UPI app receipt.
              </p>

              <div className="space-y-3 pt-1">
                <input
                  type="text"
                  maxLength={12}
                  disabled={isPending || isApproved || submittingUtr}
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 423819028471"
                  className="w-full bg-[#0d1115] border border-[#1e262e] focus:border-[#ccff00] rounded px-4 py-3 text-sm font-mono-tech tracking-widest text-center text-white outline-none transition-colors disabled:opacity-60"
                />

                {!isPending && !isApproved ? (
                  <button
                    onClick={() => handleUtrSubmit()}
                    disabled={submittingUtr || utr.length !== 12}
                    className="w-full btn-lime py-2.5 rounded text-xs uppercase font-bold tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submittingUtr ? 'Verifying & Submitting...' : 'Submit 12-Digit UTR'}
                  </button>
                ) : (
                  <div className="p-3 rounded bg-[#0d1115] border border-[#1e262e] text-center text-xs">
                    Status:{' '}
                    <span className="font-bold text-[#ccff00]">{successStatus}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-[#5c6b73] pt-1">
                <HelpCircle className="w-3 h-3 shrink-0" />
                <span>Each UTR is unique and validated directly against duplicate requests.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded UPICheckout (from upi-pay-kit) */}
      {isKitOpen && (
        <UPICheckout
          open={isKitOpen}
          onOpenChange={setIsKitOpen}
          amount={Math.round(amount * 100)}
          merchantUpiId={merchantInfo.upiId}
          merchantName={merchantInfo.merchantName}
          theme="dark"
          accentColor="#ccff00"
          manualVerification={true}
          onSubmitUTR={async (submittedUtr) => {
            await handleUtrSubmit(submittedUtr);
            setIsKitOpen(false);
            return true;
          }}
          onSuccess={() => {
            setIsKitOpen(false);
          }}
          onClose={() => setIsKitOpen(false)}
        />
      )}
    </div>
  );
};

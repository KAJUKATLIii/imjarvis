import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, HostingPlan, OperatingSystem, Order } from '../../api/client';
import {
  Check,
  Cpu,
  HardDrive,
  Layers,
  MapPin,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const PortalOrders: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<HostingPlan[]>([]);
  const [operatingSystems, setOperatingSystems] = useState<OperatingSystem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedOsId, setSelectedOsId] = useState<string>('');
  const [location, setLocation] = useState<string>('Mumbai, India (Primary)');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, osRes, oRes] = await Promise.all([
          api.plans.getAll(),
          api.plans.getOperatingSystems(),
          api.orders.getMyOrders().catch(() => ({ data: [] })),
        ]);
        setPlans(pRes.data);
        setOperatingSystems(osRes.data);
        setOrders(oRes.data);

        // Check if there was a pending order waiting for authentication
        const pendingStr = sessionStorage.getItem('pendingOrder');
        if (pendingStr) {
          try {
            const pending = JSON.parse(pendingStr);
            sessionStorage.removeItem('pendingOrder');
            if (pending.planId && pending.osId) {
              const res = await api.orders.create(pending);
              navigate(`/checkout/${res.data.id}`);
              return;
            }
          } catch {}
        }

        if (pRes.data.length > 1) {
          setSelectedPlanId(pRes.data[1].id); // default to Pack 2
        } else if (pRes.data.length > 0) {
          setSelectedPlanId(pRes.data[0].id);
        }

        if (osRes.data.length > 0) {
          setSelectedOsId(osRes.data[0].id);
        }
      } catch (err: any) {
        setError('Failed to load hosting options.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !selectedOsId) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.orders.create({
        planId: selectedPlanId,
        osId: selectedOsId,
        location,
      });
      navigate(`/checkout/${res.data.id}`);
    } catch (err: any) {
      if (err.response?.status === 401) {
        sessionStorage.setItem(
          'pendingOrder',
          JSON.stringify({
            planId: selectedPlanId,
            osId: selectedOsId,
            location,
          })
        );
        window.location.href = '/api/auth/discord';
        return;
      }
      if (err.response?.status === 409 && err.response?.data?.orderId) {
        navigate(`/checkout/${err.response.data.orderId}`);
      } else {
        setError(err.response?.data?.error || 'Failed to stage order.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <div className="text-xs font-mono-tech tracking-widest text-[#ccff00] mb-1">
          CAPACITY / 01
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Orders
        </h1>
        <p className="text-sm text-[#8a99ad] mt-1">
          Stage and configure dedicated compute packs or manage previously booked server configurations.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono-tech flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stage Order Form */}
      <div className="bg-[#11161b] border border-[#1e262e] rounded p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Stage a hosting order
          </h2>
          <p className="text-xs text-[#8a99ad] mt-0.5">
            Select a capacity pack, operating system, and region. Creating the order reserves your configuration for UPI payment.
          </p>
        </div>

        <form onSubmit={handleCreateOrder} className="space-y-6">
          {/* Pack Options Grid */}
          <div className="space-y-2">
            <label className="text-xs font-mono-tech text-[#5c6b73] uppercase tracking-wider block">
              1. Compute Capacity Pack
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const isSelected = plan.id === selectedPlanId;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`cursor-pointer rounded p-4 border transition-all ${
                      isSelected
                        ? 'bg-[#131920] border-[#ccff00] shadow-[0_0_15px_rgba(204,255,0,0.08)]'
                        : 'bg-[#0d1115] border-[#1e262e] hover:border-[#2d3844]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-base">{plan.name}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#ccff00] bg-[#ccff00]' : 'border-[#2d3844]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                      </div>
                    </div>

                    <div className="mt-2 text-xl font-mono-tech font-bold text-[#ccff00]">
                      ₹{plan.priceMonthly.toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-[#5c6b73]"> / mo</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#1e262e] space-y-1.5 text-xs text-[#8a99ad] font-mono-tech">
                      <div className="flex justify-between">
                        <span>RAM:</span>
                        <span className="text-white font-semibold">{plan.ramGb} GB DDR4</span>
                      </div>
                      <div className="flex justify-between">
                        <span>vCPU:</span>
                        <span className="text-white font-semibold">{plan.vcpuCores} Cores</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Storage:</span>
                        <span className="text-white font-semibold">{plan.storageGb} GB NVMe</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Traffic:</span>
                        <span className="text-[#ccff00]">{plan.bandwidth}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configuration Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono-tech text-[#5c6b73] uppercase tracking-wider block mb-1.5">
                2. Operating System
              </label>
              <select
                value={selectedOsId}
                onChange={(e) => setSelectedOsId(e.target.value)}
                className="w-full bg-[#0d1115] border border-[#1e262e] focus:border-[#ccff00] rounded px-3 py-2.5 text-xs text-white font-mono-tech outline-none"
              >
                {operatingSystems.map((os) => (
                  <option key={os.id} value={os.id}>
                    {os.name} ({os.category.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono-tech text-[#5c6b73] uppercase tracking-wider block mb-1.5">
                3. Deployment Region
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#0d1115] border border-[#1e262e] focus:border-[#ccff00] rounded px-3 py-2.5 text-xs text-white font-mono-tech outline-none"
              >
                <option value="Mumbai, India (Primary)">Mumbai, India — BOM1 Low Latency Core</option>
                <option value="Delhi, India (Secondary)">Delhi, India — DEL1 High Throughput</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs font-mono-tech text-[#8a99ad]">
              Order total:{' '}
              <span className="text-[#ccff00] font-bold">
                ₹{selectedPlan?.priceMonthly.toLocaleString('en-IN') || '0'} INR
              </span>
            </div>
            <button
              type="submit"
              disabled={submitting || !selectedPlanId}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-xs font-mono-tech uppercase font-bold tracking-wider btn-lime disabled:opacity-50"
            >
              <span>{submitting ? 'Recording Order...' : 'Record Hosting Order'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Order History */}
      <div className="bg-[#11161b] border border-[#1e262e] rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white tracking-tight">
            Order history
          </h2>
          <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-[#182028] border border-[#1e262e] text-[#8a99ad]">
            {orders.length} RECORDS
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-10 text-xs font-mono-tech text-[#5c6b73]">
            No previous hosting orders found. Stage an order above to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-tech">
              <thead>
                <tr className="border-b border-[#1e262e] text-[#5c6b73] uppercase tracking-wider">
                  <th className="pb-3 font-medium">Order Number</th>
                  <th className="pb-3 font-medium">Pack</th>
                  <th className="pb-3 font-medium">OS</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e262e]">
                {orders.map((order) => {
                  const isPending = order.status === 'PENDING';
                  return (
                    <tr key={order.id} className="hover:bg-[#131920]/50 transition-colors">
                      <td className="py-3.5 font-bold text-white">{order.orderNumber}</td>
                      <td className="py-3.5 text-[#8a99ad]">{order.plan?.name}</td>
                      <td className="py-3.5 text-[#8a99ad]">{order.os?.name}</td>
                      <td className="py-3.5 text-[#5c6b73]">{order.location}</td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-tech uppercase ${
                            isPending
                              ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                              : 'bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20'
                          }`}
                        >
                          {isPending ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          <span>{order.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 text-[#5c6b73]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        {isPending ? (
                          <button
                            onClick={() => navigate(`/checkout/${order.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#ccff00] text-black font-bold hover:bg-[#d9ff33] transition-colors text-[11px]"
                          >
                            <span>Pay via UPI</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[#5c6b73]">Completed</span>
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
    </div>
  );
};

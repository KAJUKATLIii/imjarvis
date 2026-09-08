import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  apiService, 
  HostingPlan, 
  OperatingSystem 
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, 
  Cpu, 
  HardDrive, 
  MapPin, 
  ArrowRight, 
  AlertCircle,
  Layers,
  Terminal,
  ShieldAlert
} from 'lucide-react';

export const Plans: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, login } = useAuth();

  const [plans, setPlans] = useState<HostingPlan[]>([]);
  const [operatingSystems, setOperatingSystems] = useState<OperatingSystem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedOsId, setSelectedOsId] = useState<string>('');
  const [location, setLocation] = useState<string>('Mumbai, India');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([apiService.getPlans(), apiService.getOperatingSystems()])
      .then(([plansData, osData]) => {
        setPlans(plansData);
        setOperatingSystems(osData);

        const queryPlan = searchParams.get('selected');
        if (queryPlan && plansData.some((p) => p.id === queryPlan)) {
          setSelectedPlanId(queryPlan);
        } else if (plansData.length > 0) {
          setSelectedPlanId(plansData[1]?.id || plansData[0].id);
        }

        if (osData.length > 0) {
          setSelectedOsId(osData[0].id);
        }
      })
      .catch((err) => {
        console.error('Error fetching plans/OS:', err);
        setError('Failed to load server configurations. Please refresh the page.');
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const selectedOs = operatingSystems.find((os) => os.id === selectedOsId);

  const handleOrder = async () => {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (!selectedPlanId || !selectedOsId) {
      setError('Please select both a Hosting Plan and an Operating System.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const order = await apiService.createOrder({
        planId: selectedPlanId,
        osId: selectedOsId,
        location,
      });

      // Navigate to checkout with the created order ID
      navigate(`/checkout?orderId=${order.id}`);
    } catch (err: any) {
      console.error('Order creation error:', err);
      const msg = err.response?.data?.error || 'Failed to create order. You may already have a pending order.';
      if (typeof msg === 'string') {
        setError(msg);
        if (err.response?.data?.orderId) {
          // If there's an existing pending order, offer quick redirect
          navigate(`/checkout?orderId=${err.response.data.orderId}`);
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 font-medium">Loading hardware nodes and configurations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Configure Node</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-2">
          Choose Your Server Infrastructure
        </h1>
        <p className="mt-4 text-slate-400 text-sm sm:text-base">
          All tiers include dedicated compute resources, unmetered bandwidth, enterprise DDoS protection, and full console credentials.
        </p>
      </div>

      {error && (
        <div className="max-w-3xl mx-auto p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Select Plan */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h2 className="text-xl font-bold text-white">Select Resource Package</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isSelected = plan.id === selectedPlanId;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`cursor-pointer glass-panel p-6 sm:p-7 relative transition-all duration-200 ${
                  isSelected
                    ? 'border-cyan-400 bg-slate-900/90 shadow-[0_0_30px_rgba(0,240,255,0.18)] scale-[1.01]'
                    : 'hover:border-white/20 hover:bg-slate-900/50'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 text-cyan-400">
                    <CheckCircle2 className="w-6 h-6 fill-cyan-400/20" />
                  </div>
                )}

                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">₹{Number(plan.priceMonthly).toLocaleString('en-IN')}</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>

                <div className="mt-6 space-y-3 text-xs sm:text-sm border-t border-white/[0.08] pt-5">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Memory</span>
                    <span className="font-bold text-white">{plan.ramGb} GB DDR4</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">vCPU Cores</span>
                    <span className="font-bold text-white">{plan.vcpuCores} Dedicated</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Fast NVMe</span>
                    <span className="font-bold text-white">{plan.storageGb} GB Gen4</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Bandwidth</span>
                    <span className="font-bold text-emerald-400">{plan.bandwidth}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Step 2: Select Operating System */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h2 className="text-xl font-bold text-white">Select Operating System</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {operatingSystems.map((os) => {
            const isSelected = os.id === selectedOsId;
            const isWindows = os.category === 'windows';
            return (
              <div
                key={os.id}
                onClick={() => setSelectedOsId(os.id)}
                className={`cursor-pointer glass-panel p-5 flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-cyan-400 bg-slate-900/90 shadow-[0_0_20px_rgba(0,240,255,0.12)]'
                    : 'hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${isWindows ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">{os.name}</div>
                    <div className="text-[11px] text-slate-400 capitalize">{os.category} Platform</div>
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Step 3: Location & Order Summary */}
      <section className="glass-panel p-8 sm:p-10 border-white/[0.1] bg-[#0c111c]/90">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>Deployment Region</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-white">{location}</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                Low Latency BOM1
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              Equipped with carrier-neutral peering, direct NIXI exchange routing, and enterprise anti-DDoS scrubbing for uninterrupted gameplay and sub-10ms Indian pings.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/70 border border-white/[0.08] space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Selected Plan:</span>
                <span className="font-semibold text-white">{selectedPlan?.name || 'None'}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Operating System:</span>
                <span className="font-semibold text-white">{selectedOs?.name || 'None'}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Billing Cycle:</span>
                <span className="font-semibold text-white">Monthly</span>
              </div>
              <div className="pt-2 border-t border-white/[0.08] flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-200">Total Due:</span>
                <span className="text-2xl font-black text-cyan-400">
                  ₹{Number(selectedPlan?.priceMonthly || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={handleOrder}
              disabled={submitting}
              className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{submitting ? 'Creating Order...' : (isAuthenticated ? 'Proceed to UPI Checkout' : 'Login with Discord to Buy')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};

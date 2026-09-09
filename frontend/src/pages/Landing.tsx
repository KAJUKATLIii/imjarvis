import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, HostingPlan, OperatingSystem } from '../api/client';
import { useVoiceAssistance } from '../context/VoiceAssistanceContext';
import {
  ArrowUpRight,
  Shield,
  Zap,
  Server,
  Layers,
  CheckCircle2,
  Lock,
  Cpu,
  HardDrive,
  Globe,
  Hexagon,
  ArrowRight,
  Terminal,
} from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { presence, startDirectVoiceCall } = useVoiceAssistance();
  const [plans, setPlans] = useState<HostingPlan[]>([]);
  const [operatingSystems, setOperatingSystems] = useState<OperatingSystem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedOsId, setSelectedOsId] = useState<string>('');
  const [location, setLocation] = useState<string>('Mumbai, India (Primary)');
  const [staging, setStaging] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [plansRes, osRes] = await Promise.all([
          api.plans.getAll(),
          api.plans.getOperatingSystems(),
        ]);
        setPlans(plansRes.data);
        setOperatingSystems(osRes.data);
        if (plansRes.data.length > 1) {
          setSelectedPlanId(plansRes.data[1].id); // Pack 2 default
        } else if (plansRes.data.length > 0) {
          setSelectedPlanId(plansRes.data[0].id);
        }
        if (osRes.data.length > 0) {
          setSelectedOsId(osRes.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load plans:', err);
      }
    }
    loadData();
  }, []);

  const handleStageOrder = async (overridePlanId?: string) => {
    const planId = overridePlanId || selectedPlanId;
    if (!planId || !selectedOsId) {
      navigate('/portal/orders');
      return;
    }
    setStaging(true);
    try {
      const res = await api.orders.create({
        planId,
        osId: selectedOsId,
        location,
      });
      navigate(`/checkout/${res.data.id}`);
    } catch (err: any) {
      if (err.response?.status === 401) {
        sessionStorage.setItem(
          'pendingOrder',
          JSON.stringify({ planId, osId: selectedOsId, location })
        );
        window.location.href = '/api/auth/discord';
        return;
      }
      if (err.response?.status === 409 && err.response?.data?.orderId) {
        navigate(`/checkout/${err.response.data.orderId}`);
      } else {
        navigate('/portal/orders');
      }
    } finally {
      setStaging(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <div className="bg-[#0a0d10] text-[#8a99ad] min-h-screen relative overflow-hidden">
      {/* Background Radar Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[700px] pointer-events-none opacity-40">
        <div className="radar-circles"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center z-10">
        {/* Status Pill & Click-to-Call Voice Assist */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#11161b] border border-[#1e262e] text-[11px] font-mono-tech tracking-wider text-[#ccff00] mb-8">
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse"></span>
          <span>JARVIS CORE NETWORK ONLINE</span>
          <span className="text-[#2d3844]">•</span>
          <button
            onClick={() => startDirectVoiceCall('Landing Direct Voice Inquiry')}
            className={`flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded-full transition-all cursor-pointer hover:scale-105 ${
              presence.isAvailable
                ? 'text-[#ccff00] hover:bg-[#ccff00]/20'
                : 'text-[#8a99ad] hover:text-white hover:bg-[#182028]'
            }`}
            title="Click to start live voice call"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${presence.isAvailable ? 'bg-[#ccff00] animate-ping' : 'bg-amber-400'}`} />
            <span>
              {presence.isAvailable
                ? `${presence.onlineAdminsCount} ${presence.onlineAdminsCount === 1 ? 'Operator' : 'Operators'} Online • Click to Call`
                : 'Voice Assist Standby • Click to Call'}
            </span>
          </button>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
          Run the world. <br />
          <span className="text-[#ccff00]">We keep it up.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-[#8a99ad] max-w-2xl mx-auto leading-relaxed">
          Game-agnostic server infrastructure for multiplayer communities, studios, and operators. Choose your resources, OS, and location, then provision with a verified UPI handoff.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#plans"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded text-xs font-mono-tech uppercase font-bold tracking-wider btn-lime"
          >
            <span>Configure Your Server</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
          <a
            href="https://discord.gg/rSQqnhWATj"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded text-xs font-mono-tech uppercase font-bold tracking-wider btn-outline-dark"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.022.015.04.037.05a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
            <span>Join Discord</span>
          </a>
          <a
            href="#infrastructure"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded text-xs font-mono-tech uppercase font-bold tracking-wider btn-outline-dark"
          >
            <span>See How It Works</span>
            <span className="text-xs">⌄</span>
          </a>
        </div>

        {/* Metrics Banner */}
        <div className="mt-16 pt-8 border-t border-[#1e262e] grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto font-mono-tech text-xs">
          <div className="bg-[#11161b]/60 border border-[#1e262e] rounded p-4">
            <div className="text-xl font-bold text-white">99.99%</div>
            <div className="text-[11px] text-[#5c6b73] mt-0.5 tracking-wider uppercase">Network Availability</div>
          </div>
          <div className="bg-[#11161b]/60 border border-[#1e262e] rounded p-4">
            <div className="text-xl font-bold text-white">4 - 16 vCPU</div>
            <div className="text-[11px] text-[#5c6b73] mt-0.5 tracking-wider uppercase">Dedicated Compute</div>
          </div>
          <div className="bg-[#11161b]/60 border border-[#1e262e] rounded p-4">
            <div className="text-xl font-bold text-[#ccff00]">UNLIMITED</div>
            <div className="text-[11px] text-[#5c6b73] mt-0.5 tracking-wider uppercase">Unmetered Bandwidth</div>
          </div>
        </div>
      </section>

      {/* Marquee Ticker */}
      <div className="border-y border-[#1e262e] bg-[#0d1115] py-3 overflow-hidden whitespace-nowrap">
        <div className="animate-marquee text-xs font-mono-tech text-[#5c6b73] tracking-widest uppercase">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="inline-flex items-center gap-6 mx-4">
              <span className="text-white font-bold">JARVIS HOSTING</span>
              <span className="text-[#ccff00]">•</span>
              <span>NO GAME LOCK-IN</span>
              <span className="text-[#ccff00]">•</span>
              <span>NVME STORAGE</span>
              <span className="text-[#ccff00]">•</span>
              <span>UPI VERIFIED</span>
              <span className="text-[#ccff00]">•</span>
              <span>OPERATOR FIRST</span>
              <span className="text-[#ccff00]">•</span>
              <span>MUMBAI CORE BOM1</span>
              <span className="text-[#ccff00]">•</span>
              <span>24/7 DISCORD LOGS</span>
              <span className="text-[#ccff00]">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Section 01: THE PROMISE */}
      <section id="infrastructure" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-xs font-mono-tech text-[#ccff00] tracking-widest mb-1">
          01 / THE PROMISE
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            The server is the product. Not the wrapper.
          </h2>
          <div className="text-xs font-mono-tech text-[#5c6b73] max-w-md">
            OPERATIONS NOTE / 001: Headroom is a feature. Overcommitting resources kills ticks and drops frames.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#11161b] border border-[#1e262e] hover:border-[#2d3844] rounded p-6 space-y-3 transition-colors">
            <div className="w-9 h-9 rounded bg-[#182028] border border-[#1e262e] flex items-center justify-center text-[#ccff00]">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Game-agnostic by design</h3>
            <p className="text-xs text-[#8a99ad] leading-relaxed">
              Run whatever engine your community demands. Full root or custom OS with zero restrictions, proprietary wrappers, or forced game panels.
            </p>
          </div>

          <div className="bg-[#11161b] border border-[#1e262e] hover:border-[#2d3844] rounded p-6 space-y-3 transition-colors">
            <div className="w-9 h-9 rounded bg-[#182028] border border-[#1e262e] flex items-center justify-center text-[#ccff00]">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Resources you can actually read</h3>
            <p className="text-xs text-[#8a99ad] leading-relaxed">
              Raw cores, unshared RAM, and NVMe drives. What you pay for is what your binary sees in /proc/cpuinfo and htop.
            </p>
          </div>

          <div className="bg-[#11161b] border border-[#1e262e] hover:border-[#2d3844] rounded p-6 space-y-3 transition-colors">
            <div className="w-9 h-9 rounded bg-[#182028] border border-[#1e262e] flex items-center justify-center text-[#ccff00]">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">People on the other side</h3>
            <p className="text-xs text-[#8a99ad] leading-relaxed">
              Support isn't an automated bot maze. It's operators on Discord who understand memory pressure, kernel configs, and thread contention.
            </p>
          </div>
        </div>
      </section>

      {/* Section 02: CAPACITY PACKS */}
      <section id="plans" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1e262e]">
        <div className="text-xs font-mono-tech text-[#ccff00] tracking-widest mb-1">
          02 / CAPACITY PACKS
        </div>
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Pick your baseline. Scale without renegotiation.
          </h2>
          <p className="text-sm text-[#8a99ad] mt-1">
            Predictable flat pricing with transparent hardware allocations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, index) => {
            const isPack2 = plan.slug === 'pack-2' || index === 1;
            return (
              <div
                key={plan.id}
                className={`panel-card p-6 flex flex-col justify-between transition-all ${
                  isPack2 ? 'panel-card-accent' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono-tech text-[#5c6b73]">PACK 0{index + 1}</span>
                    {isPack2 && (
                      <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00]">
                        POPULAR CHOICE
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white mt-2">{plan.name}</h3>

                  <div className="mt-4 pb-4 border-b border-[#1e262e]">
                    <div className="text-3xl font-mono-tech font-bold text-[#ccff00]">
                      ₹{plan.priceMonthly.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] font-mono-tech text-[#5c6b73] mt-0.5">PER MONTH / BILLED VIA UPI</div>
                  </div>

                  <div className="mt-5 space-y-3 text-xs font-mono-tech text-[#8a99ad]">
                    <div className="flex justify-between">
                      <span>RAM Allocation</span>
                      <span className="text-white font-bold">{plan.ramGb} GB DDR4</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compute vCPU</span>
                      <span className="text-white font-bold">{plan.vcpuCores} Dedicated Cores</span>
                    </div>
                    <div className="flex justify-between">
                      <span>NVMe SSD Storage</span>
                      <span className="text-white font-bold">{plan.storageGb} GB NVMe</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network Uplink</span>
                      <span className="text-[#ccff00]">Unlimited Traffic</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Control Console</span>
                      <span className="text-white">Full Web Panel + Root</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#1e262e] grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      const configEl = document.getElementById('live-config');
                      configEl?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="py-2.5 rounded text-[11px] font-mono-tech uppercase font-bold tracking-wider btn-outline-dark text-center"
                  >
                    Customize
                  </button>
                  <button
                    onClick={() => handleStageOrder(plan.id)}
                    className="py-2.5 rounded text-[11px] font-mono-tech uppercase font-bold tracking-wider btn-lime text-center flex items-center justify-center gap-1"
                  >
                    <span>Deploy</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Configuration Bar */}
        <div id="live-config" className="bg-[#11161b] border border-[#1e262e] rounded p-6 max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e262e] pb-3">
            <div className="flex items-center gap-2 text-xs font-mono-tech font-bold text-white">
              <span className="text-[#ccff00]">&gt;</span>
              <span>LIVE CONFIGURATION: {selectedPlan?.name || 'PACK 2'}</span>
            </div>
            <span className="text-[10px] font-mono-tech text-[#5c6b73]">CFG-02-LIVE</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono-tech">
            <div>
              <label className="text-[#5c6b73] block mb-1">Capacity Pack:</label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full bg-[#0d1115] border border-[#1e262e] focus:border-[#ccff00] rounded px-3 py-2 text-white outline-none"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{p.priceMonthly.toLocaleString('en-IN')}/mo)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[#5c6b73] block mb-1">Operating System:</label>
              <select
                value={selectedOsId}
                onChange={(e) => setSelectedOsId(e.target.value)}
                className="w-full bg-[#0d1115] border border-[#1e262e] focus:border-[#ccff00] rounded px-3 py-2 text-white outline-none"
              >
                {operatingSystems.map((os) => (
                  <option key={os.id} value={os.id}>
                    {os.name} ({os.category.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[#5c6b73] block mb-1">Data Center:</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#0d1115] border border-[#1e262e] focus:border-[#ccff00] rounded px-3 py-2 text-white outline-none"
              >
                <option value="Mumbai, India (Primary)">Mumbai, India (Primary)</option>
                <option value="Delhi, India (Secondary)">Delhi, India (Secondary)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs font-mono-tech text-[#8a99ad]">
              Monthly total:{' '}
              <span className="text-[#ccff00] font-bold text-base">
                ₹{selectedPlan?.priceMonthly.toLocaleString('en-IN') || '0'} INR
              </span>
            </div>

            <button
              onClick={() => handleStageOrder()}
              disabled={staging}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded text-xs font-mono-tech uppercase font-bold tracking-wider btn-lime disabled:opacity-50"
            >
              <span>{staging ? 'Staging Order...' : 'Continue to UPI'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Section 03: UNDER THE HOOD */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1e262e]">
        <div className="text-xs font-mono-tech text-[#ccff00] tracking-widest mb-1">
          03 / UNDER THE HOOD
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-8">
          Enterprise hardware built for persistent workloads.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono-tech">
          <div className="bg-[#11161b] border border-[#1e262e] rounded p-5 space-y-2">
            <div className="text-[#ccff00] font-bold text-sm">DDR4 ECC MEMORY</div>
            <p className="text-[#8a99ad]">
              Unshared memory buffers guaranteed with error-correcting code for multi-week uptime stability.
            </p>
          </div>

          <div className="bg-[#11161b] border border-[#1e262e] rounded p-5 space-y-2">
            <div className="text-[#ccff00] font-bold text-sm">NVME SSD POOLS</div>
            <p className="text-[#8a99ad]">
              High IOPS read/write speeds that eliminate map chunk generation lag and database locking.
            </p>
          </div>

          <div className="bg-[#11161b] border border-[#1e262e] rounded p-5 space-y-2">
            <div className="text-[#ccff00] font-bold text-sm">BOM1 CORE NETWORK</div>
            <p className="text-[#8a99ad]">
              Sub-15ms latency across South Asia via direct tier-1 transit routes and automated DDoS mitigation.
            </p>
          </div>

          <div className="bg-[#11161b] border border-[#1e262e] rounded p-5 space-y-2">
            <div className="text-[#ccff00] font-bold text-sm">DISCORD AUTOMATION</div>
            <p className="text-[#8a99ad]">
              Instant webhook notifications for UTR submissions, admin verifications, and server health.
            </p>
          </div>
        </div>
      </section>

      {/* Section 04: THE HANDOFF */}
      <section id="process" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1e262e]">
        <div className="text-xs font-mono-tech text-[#ccff00] tracking-widest mb-1">
          04 / THE HANDOFF
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-8">
          From stage to provisioned in 4 steps.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#11161b] border border-[#1e262e] rounded p-6 space-y-3">
            <div className="text-2xl font-mono-tech font-bold text-[#ccff00]">01</div>
            <h3 className="text-base font-bold text-white">Choose a Pack</h3>
            <p className="text-xs text-[#8a99ad]">
              Select resources, preferred operating system, and data center region to reserve your instance.
            </p>
          </div>

          <div className="bg-[#11161b] border border-[#1e262e] rounded p-6 space-y-3">
            <div className="text-2xl font-mono-tech font-bold text-[#ccff00]">02</div>
            <h3 className="text-base font-bold text-white">Pay via UPI</h3>
            <p className="text-xs text-[#8a99ad]">
              Transfer funds via GPay, PhonePe, Paytm, or any UPI app with zero gateway fees.
            </p>
          </div>

          <div className="bg-[#11161b] border border-[#1e262e] rounded p-6 space-y-3">
            <div className="text-2xl font-mono-tech font-bold text-[#ccff00]">03</div>
            <h3 className="text-base font-bold text-white">Send the UTR</h3>
            <p className="text-xs text-[#8a99ad]">
              Paste your 12-digit transaction UTR for administrator ledger cross-check and receipt issuance.
            </p>
          </div>

          <div className="bg-[#11161b] border border-[#1e262e] rounded p-6 space-y-3">
            <div className="text-2xl font-mono-tech font-bold text-[#ccff00]">04</div>
            <h3 className="text-base font-bold text-white">Receive Access</h3>
            <p className="text-xs text-[#8a99ad]">
              Get your panel credentials and dedicated endpoint directly inside your customer portal.
            </p>
          </div>
        </div>
      </section>

      {/* Section 05: CONTROL ROOM CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1e262e]">
        <div className="bg-[#11161b] border border-[#1e262e] rounded p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="text-xs font-mono-tech text-[#ccff00] tracking-widest uppercase">
              05 / YOUR CONTROL ROOM
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
              Bring the load. <br />
              <span className="text-[#ccff00]">We'll bring the room.</span>
            </h2>
            <p className="text-sm text-[#8a99ad]">
              Log in with Discord to access the customer workspace, monitor ongoing orders, and view server nodes.
            </p>
            <div className="pt-4">
              <Link
                to="/portal"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded text-xs font-mono-tech uppercase font-bold tracking-wider btn-lime"
              >
                <span>Enter Customer Portal</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e262e] bg-[#0a0d10] py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-mono-tech text-xs text-white">
            <Hexagon className="w-4 h-4 text-[#ccff00]" />
            <span>JARVIS HOSTING / INFRASTRUCTURE</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://discord.gg/rSQqnhWATj"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono-tech text-[#8a99ad] hover:text-[#ccff00] transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.022.015.04.037.05a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              <span>discord.gg/rSQqnhWATj</span>
            </a>
            <div className="text-xs font-mono-tech text-[#5c6b73]">
              Mumbai Core BOM1 • 2026 JARVIS Hosting
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

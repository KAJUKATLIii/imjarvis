import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Server, Activity, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.08] bg-[#06080e] pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Value Prop Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-12 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-white/[0.04]">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Sub-10ms Latency</div>
              <div className="text-xs text-slate-400">Mumbai Edge Nodes</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-white/[0.04]">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">NVMe Gen4 SSD</div>
              <div className="text-xs text-slate-400">7000+ MB/s R/W Speed</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-white/[0.04]">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">DDoS Protected</div>
              <div className="text-xs text-slate-400">Always-on 2Tbps Layer-7</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-white/[0.04]">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">99.9% SLA</div>
              <div className="text-xs text-slate-400">Redundant Power & Uplink</div>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-12">
          
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="JARVIS" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-extrabold text-lg text-white tracking-wider">JARVIS HOSTING</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Industrial-grade game server infrastructure tailored for demanding workloads. Custom OS choices, fast UPI verification, and dedicated administrator console provisioning.
            </p>
            <div className="pt-2">
              <a 
                href="https://discord.com" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#5865F2] hover:text-indigo-400 transition-colors"
              >
                Join the Discord Community <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Infrastructure</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/plans" className="hover:text-cyan-400 transition-colors">Server Plans</Link></li>
              <li><Link to="/plans" className="hover:text-cyan-400 transition-colors">Operating Systems</Link></li>
              <li><Link to="/plans" className="hover:text-cyan-400 transition-colors">Mumbai Data Center</Link></li>
              <li><Link to="/dashboard" className="hover:text-cyan-400 transition-colors">Console Access</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Customer Portal</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/dashboard" className="hover:text-cyan-400 transition-colors">Active Nodes</Link></li>
              <li><Link to="/billing" className="hover:text-cyan-400 transition-colors">Billing & Invoices</Link></li>
              <li><Link to="/tickets" className="hover:text-cyan-400 transition-colors">Support Tickets</Link></li>
              <li><span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">UPI Instant Payments</span></li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} JARVIS Hosting Infrastructure. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>UPI Instant Verification</span>
            <span>Manual Admin Verification</span>
            <span>Discord Realtime Webhooks</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

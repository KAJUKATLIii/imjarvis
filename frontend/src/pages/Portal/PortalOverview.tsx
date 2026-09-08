import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  Server,
  ShoppingCart,
  Receipt,
  LifeBuoy,
  ArrowUpRight,
  ShieldAlert,
  Terminal,
} from 'lucide-react';

export const PortalOverview: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [servers, setServers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [srvRes, ordRes, invRes, tktRes] = await Promise.allSettled([
          api.servers.getMyServers(),
          api.orders.getMyOrders(),
          api.billing.getMyInvoices(),
          api.crm.getMyTickets(),
        ]);

        if (srvRes.status === 'fulfilled') setServers(srvRes.value.data);
        if (ordRes.status === 'fulfilled') setOrders(ordRes.value.data);
        if (invRes.status === 'fulfilled') setInvoices(invRes.value.data);
        if (tktRes.status === 'fulfilled') setTickets(tktRes.value.data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const activeServers = servers.filter((s) => s.status === 'ACTIVE');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="text-xs font-mono-tech tracking-widest text-[#ccff00] mb-1">
          CONTROL ROOM / 00
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Good to see you{user?.username ? `, ${user.username}` : ''}.
        </h1>
        <p className="text-sm text-[#8a99ad] mt-1">
          Monitor your server infrastructure, track payments, review invoices, and manage support.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#11161b] border border-[#1e262e] rounded p-4">
          <div className="text-[11px] font-mono-tech text-[#5c6b73] uppercase tracking-wider">
            Active Servers
          </div>
          <div className="text-2xl font-mono-tech font-bold text-white mt-1">
            {loading ? '...' : activeServers.length}
          </div>
          <div className="text-[10px] font-mono-tech text-[#ccff00] mt-1">
            {servers.length} total provisioned
          </div>
        </div>

        <div className="bg-[#11161b] border border-[#1e262e] rounded p-4">
          <div className="text-[11px] font-mono-tech text-[#5c6b73] uppercase tracking-wider">
            Pending Orders
          </div>
          <div className="text-2xl font-mono-tech font-bold text-white mt-1">
            {loading ? '...' : pendingOrders.length}
          </div>
          <div className="text-[10px] font-mono-tech text-amber-400 mt-1">
            Awaiting UTR submission
          </div>
        </div>

        <div className="bg-[#11161b] border border-[#1e262e] rounded p-4">
          <div className="text-[11px] font-mono-tech text-[#5c6b73] uppercase tracking-wider">
            Paid Invoices
          </div>
          <div className="text-2xl font-mono-tech font-bold text-white mt-1">
            {loading ? '...' : invoices.length}
          </div>
          <div className="text-[10px] font-mono-tech text-[#8a99ad] mt-1">
            Verified tax receipts
          </div>
        </div>

        <div className="bg-[#11161b] border border-[#1e262e] rounded p-4">
          <div className="text-[11px] font-mono-tech text-[#5c6b73] uppercase tracking-wider">
            Open Tickets
          </div>
          <div className="text-2xl font-mono-tech font-bold text-white mt-1">
            {loading ? '...' : tickets.filter((t) => t.status === 'OPEN').length}
          </div>
          <div className="text-[10px] font-mono-tech text-[#8a99ad] mt-1">
            Active support threads
          </div>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stage Order Card */}
        <Link
          to="/portal/orders"
          className="group bg-[#11161b] border border-[#1e262e] hover:border-[#ccff00] rounded p-5 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-mono-tech text-[#5c6b73]">
              <span>CAPACITY / 01</span>
              <ArrowUpRight className="w-4 h-4 text-[#5c6b73] group-hover:text-[#ccff00] transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-white mt-2 group-hover:text-[#ccff00] transition-colors">
              Stage a Hosting Order
            </h3>
            <p className="text-xs text-[#8a99ad] mt-1">
              Select your compute capacity pack (16GB - 64GB DDR4), operating system, and data center node location.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1e262e] flex items-center gap-2 text-xs font-mono-tech text-[#ccff00]">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Configure capacity &gt;</span>
          </div>
        </Link>

        {/* Submit UTR Card */}
        <Link
          to="/portal/billing"
          className="group bg-[#11161b] border border-[#1e262e] hover:border-[#ccff00] rounded p-5 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-mono-tech text-[#5c6b73]">
              <span>MONEY TRAIL / 02</span>
              <ArrowUpRight className="w-4 h-4 text-[#5c6b73] group-hover:text-[#ccff00] transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-white mt-2 group-hover:text-[#ccff00] transition-colors">
              Submit a Payment UTR
            </h3>
            <p className="text-xs text-[#8a99ad] mt-1">
              Made a UPI payment? Submit your 12-digit transaction UTR for automated verification and invoice generation.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1e262e] flex items-center gap-2 text-xs font-mono-tech text-[#ccff00]">
            <Receipt className="w-3.5 h-3.5" />
            <span>Open billing & receipts &gt;</span>
          </div>
        </Link>

        {/* Server Access Card */}
        <Link
          to="/portal/servers"
          className="group bg-[#11161b] border border-[#1e262e] hover:border-[#ccff00] rounded p-5 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-mono-tech text-[#5c6b73]">
              <span>ACCESS / 03</span>
              <ArrowUpRight className="w-4 h-4 text-[#5c6b73] group-hover:text-[#ccff00] transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-white mt-2 group-hover:text-[#ccff00] transition-colors">
              Server Console &amp; Nodes
            </h3>
            <p className="text-xs text-[#8a99ad] mt-1">
              View your active dedicated nodes, copy console credentials, and access server control panels.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1e262e] flex items-center gap-2 text-xs font-mono-tech text-[#ccff00]">
            <Server className="w-3.5 h-3.5" />
            <span>View your nodes &gt;</span>
          </div>
        </Link>

        {/* Support Card */}
        <Link
          to="/portal/support"
          className="group bg-[#11161b] border border-[#1e262e] hover:border-[#ccff00] rounded p-5 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-mono-tech text-[#5c6b73]">
              <span>OPERATIONS LINE / 04</span>
              <ArrowUpRight className="w-4 h-4 text-[#5c6b73] group-hover:text-[#ccff00] transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-white mt-2 group-hover:text-[#ccff00] transition-colors">
              Operations Support &amp; CRM
            </h3>
            <p className="text-xs text-[#8a99ad] mt-1">
              Direct line to JARVIS systems engineers for network adjustments, custom reverse proxies, and capacity changes.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1e262e] flex items-center gap-2 text-xs font-mono-tech text-[#ccff00]">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Open ticket line &gt;</span>
          </div>
        </Link>
      </div>

      {/* Operational Feed */}
      <div className="bg-[#11161b] border border-[#1e262e] rounded p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-mono-tech text-white font-bold">
            <Terminal className="w-4 h-4 text-[#ccff00]" />
            <span>SYSTEM LOG / STREAM</span>
          </div>
          <div className="text-[10px] font-mono-tech text-[#ccff00]">● LIVE</div>
        </div>
        <div className="bg-[#0a0d10] rounded border border-[#1e262e] p-3 text-xs font-mono-tech space-y-1.5 text-[#8a99ad]">
          <div>&gt; [SYSTEM] JARVIS node gateway connected via Mumbai Core BOM1</div>
          <div>&gt; [SECURITY] Console passwords encrypted at rest; zero webhook exposure policy enforced</div>
          <div>&gt; [BILLING] Automated tax invoice generator active (INV-2026-XXXXXX)</div>
          <div>&gt; [READY] Select a pack or submit your UTR to commence provisioning</div>
        </div>
      </div>
    </div>
  );
};

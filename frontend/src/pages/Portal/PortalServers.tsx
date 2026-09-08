import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiService, Server as ServerType } from '../../api/client';
import { getSubscriptionCountdown } from '../../utils/countdown';
import {
  Server,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const PortalServers: React.FC = () => {
  const navigate = useNavigate();
  const [servers, setServers] = useState<ServerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});
  const [renewingId, setRenewingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.servers.getMyServers();
        setServers(res.data);
      } catch (err) {
        console.error('Failed to load servers', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRenewServer = async (serverId: string) => {
    try {
      setRenewingId(serverId);
      const renewalOrder = await apiService.createRenewal(serverId);
      navigate(`/checkout/${renewalOrder.id}`);
    } catch (err) {
      console.error('Failed to start renewal:', err);
      alert('Unable to initiate renewal order. Please try again.');
    } finally {
      setRenewingId(null);
    }
  };

  return (
    <div className="space-y-8 font-mono-tech">
      {/* Page Header */}
      <div>
        <div className="text-xs tracking-widest text-[#ccff00] mb-1">
          ACCESS / 03
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Server Console &amp; Nodes
        </h1>
        <p className="text-sm text-[#8a99ad] mt-1">
          Direct management of your dedicated nodes, control panels, credentials, and renewal cycle.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-[#5c6b73]">
          Loading server nodes...
        </div>
      ) : servers.length === 0 ? (
        <div className="bg-[#11161b] border border-[#1e262e] rounded p-8 text-center space-y-3">
          <Server className="w-10 h-10 text-[#5c6b73] mx-auto" />
          <h3 className="text-base font-bold text-white">No active servers</h3>
          <p className="text-xs text-[#8a99ad] max-w-md mx-auto">
            You don't have any provisioned nodes yet. Stage an order in the Orders tab and complete UPI verification to launch your first node.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {servers.map((server) => {
            const isProvisioning = server.status === 'PROVISIONING';
            const isVisible = !!visiblePasswords[server.id];

            // Subscription Countdown calculations
            const countdown = getSubscriptionCountdown(
              server.order?.billingPeriodEnd,
              server.order?.billingPeriodStart
            );

            const endDateFormatted = server.order?.billingPeriodEnd
              ? new Date(server.order.billingPeriodEnd).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '30 Days Cycle';

            return (
              <div
                key={server.id}
                className="bg-[#11161b] border border-[#1e262e] rounded p-6 space-y-6 shadow-xl"
              >
                {/* Server Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e262e] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#182028] border border-[#1e262e] flex items-center justify-center text-[#ccff00]">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {server.name || `${server.order?.plan?.name || 'Node'} — ${server.location}`}
                      </h3>
                      <div className="text-xs text-[#5c6b73] mt-0.5">
                        Order #{server.order?.orderNumber} • OS: {server.order?.os?.name || 'Linux'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs uppercase font-bold ${
                        isProvisioning
                          ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                          : 'bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20'
                      }`}
                    >
                      {isProvisioning ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>{server.status}</span>
                    </span>
                  </div>
                </div>

                {/* ─── SUBSCRIPTION RENEWAL COUNTDOWN CARD ─── */}
                <div className="bg-[#0d1115] border border-[#1e262e] rounded p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-4 h-4 text-[#ccff00]" />
                      <span className="text-[#8a99ad] uppercase tracking-wider">
                        Subscription Renewal Countdown:
                      </span>
                      <strong
                        className={`font-bold text-sm ${
                          countdown.isExpired
                            ? 'text-red-400'
                            : countdown.isExpiringSoon
                            ? 'text-amber-400'
                            : 'text-[#ccff00]'
                        }`}
                      >
                        {countdown.formatted}
                      </strong>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#5c6b73]">
                        Renewal Date: <span className="text-white font-bold">{endDateFormatted}</span>
                      </span>

                      <button
                        onClick={() => handleRenewServer(server.id)}
                        disabled={renewingId === server.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs uppercase font-bold btn-lime disabled:opacity-50"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${renewingId === server.id ? 'animate-spin' : ''}`} />
                        <span>{renewingId === server.id ? 'Staging...' : 'Renew Node'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress Gauge */}
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-[#182028] rounded-full overflow-hidden border border-[#1e262e]">
                      <div
                        className={`h-full transition-all duration-300 ${
                          countdown.isExpired
                            ? 'bg-red-500'
                            : countdown.isExpiringSoon
                            ? 'bg-amber-400'
                            : 'bg-[#ccff00]'
                        }`}
                        style={{ width: `${countdown.percentageRemaining}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#5c6b73]">
                      <span>Cycle Progress</span>
                      <span>{countdown.percentageRemaining}% active duration remaining</span>
                    </div>
                  </div>

                  {countdown.isExpiringSoon && !countdown.isExpired && (
                    <div className="p-2.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        Your node subscription expires in {countdown.days} days. Renew in advance to preserve your IP and data storage.
                      </span>
                    </div>
                  )}

                  {countdown.isExpired && (
                    <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        Subscription has elapsed. Click "Renew Node" to submit your monthly renewal UTR and reactivate.
                      </span>
                    </div>
                  )}
                </div>

                {isProvisioning ? (
                  <div className="p-4 rounded bg-[#0d1115] border border-[#1e262e] space-y-2">
                    <div className="text-xs text-amber-400 font-bold flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Node in Provisioning Queue</span>
                    </div>
                    <p className="text-xs text-[#8a99ad]">
                      Your payment has been verified and our systems engineers are provisioning your dedicated instance. Console credentials and endpoints will appear here shortly.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Connection Endpoints */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-[#0d1115] border border-[#1e262e] rounded p-3">
                        <span className="text-[#5c6b73] block mb-1">IP &amp; Port:</span>
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold">
                            {server.ipAddress ? `${server.ipAddress}:${server.port || 22}` : 'Allocated dynamically'}
                          </span>
                          {server.ipAddress && (
                            <button
                              onClick={() => copyToClipboard(server.ipAddress!, `ip-${server.id}`)}
                              className="text-[#5c6b73] hover:text-[#ccff00]"
                            >
                              {copiedKey === `ip-${server.id}` ? (
                                <Check className="w-3.5 h-3.5 text-[#ccff00]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="bg-[#0d1115] border border-[#1e262e] rounded p-3">
                        <span className="text-[#5c6b73] block mb-1">Control Panel:</span>
                        <div className="flex items-center justify-between">
                          <span className="text-[#8a99ad] truncate">
                            {server.consoleUrl || 'N/A'}
                          </span>
                          {server.consoleUrl && (
                            <a
                              href={server.consoleUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#ccff00] hover:underline flex items-center gap-1"
                            >
                              <span>Launch</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Console Credentials */}
                    <div className="bg-[#0d1115] border border-[#1e262e] rounded p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs text-white font-bold border-b border-[#1e262e] pb-2">
                        <span className="flex items-center gap-1.5 text-[#ccff00]">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Console Access Credentials</span>
                        </span>
                        <span className="text-[10px] text-[#5c6b73]">ENCRYPTED AT REST</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[#5c6b73] block text-[11px] mb-1">Username:</span>
                          <div className="flex items-center justify-between bg-[#11161b] border border-[#1e262e] rounded px-3 py-2">
                            <span className="text-white font-bold">{server.consoleUsername || 'root'}</span>
                            <button
                              onClick={() => copyToClipboard(server.consoleUsername || 'root', `usr-${server.id}`)}
                              className="text-[#5c6b73] hover:text-[#ccff00]"
                            >
                              {copiedKey === `usr-${server.id}` ? (
                                <Check className="w-3.5 h-3.5 text-[#ccff00]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[#5c6b73] block text-[11px] mb-1">Password:</span>
                          <div className="flex items-center justify-between bg-[#11161b] border border-[#1e262e] rounded px-3 py-2">
                            <span className="text-white font-bold">
                              {isVisible ? server.consolePassword || 'None' : '••••••••••••••••'}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => togglePasswordVisibility(server.id)}
                                className="text-[#5c6b73] hover:text-white"
                              >
                                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              {server.consolePassword && (
                                <button
                                  onClick={() => copyToClipboard(server.consolePassword!, `pwd-${server.id}`)}
                                  className="text-[#5c6b73] hover:text-[#ccff00]"
                                >
                                  {copiedKey === `pwd-${server.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-[#ccff00]" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {server.accessNotes && (
                        <div className="text-xs text-[#8a99ad] pt-1">
                          <span className="text-[#5c6b73]">Notes:</span> {server.accessNotes}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

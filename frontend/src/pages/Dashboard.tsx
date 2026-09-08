import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  apiService, 
  Server as ServerType 
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Terminal, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  LifeBuoy
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, isAuthenticated, login } = useAuth();
  const [servers, setServers] = useState<ServerType[]>([]);
  const [selectedServerAccess, setSelectedServerAccess] = useState<ServerType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    apiService.getServers()
      .then((data) => {
        setServers(data);
        if (data.length > 0) {
          fetchAccess(data[0].id);
        }
      })
      .catch((err) => console.error('Error fetching servers:', err))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const fetchAccess = async (serverId: string) => {
    try {
      const access = await apiService.getServerAccess(serverId);
      setSelectedServerAccess(access as any);
    } catch (err) {
      console.error('Error loading server access:', err);
    }
  };

  const copyValue = (field: string, text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
        <Server className="w-14 h-14 text-cyan-400 mx-auto" />
        <h2 className="text-3xl font-extrabold text-white">Access Your Server Nodes</h2>
        <p className="text-slate-400 text-sm">
          Please login with Discord to view your active server resources and console credentials.
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
        <p className="text-slate-400 font-medium">Loading your server infrastructure...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Node Management</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            My Game Server Nodes
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/plans" className="btn-primary text-xs py-2.5 px-4">
            + Deploy New Node
          </Link>
          <Link to="/tickets" className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-1.5">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Support</span>
          </Link>
        </div>
      </div>

      {servers.length === 0 ? (
        <div className="glass-panel p-12 text-center max-w-xl mx-auto space-y-5">
          <Server className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-xl font-bold text-white">No Active Servers Found</h3>
          <p className="text-sm text-slate-400">
            You don't have any server instances deployed yet. Explore our high-performance hardware plans to get started.
          </p>
          <Link to="/plans" className="btn-primary">
            View Server Plans
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Server List (Left Column) */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Your Instances</h3>
            <div className="space-y-3">
              {servers.map((srv) => {
                const isSelected = selectedServerAccess?.id === srv.id;
                const isReady = srv.accessStatus === 'ACCESS_AVAILABLE';
                return (
                  <div
                    key={srv.id}
                    onClick={() => fetchAccess(srv.id)}
                    className={`cursor-pointer glass-panel p-5 transition-all ${
                      isSelected 
                        ? 'border-cyan-400 bg-slate-900/90 shadow-[0_0_20px_rgba(0,240,255,0.12)]' 
                        : 'hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-white text-base">
                        {srv.order?.plan?.name || 'Server Node'}
                      </span>
                      <span className={`badge-glow ${isReady ? 'badge-success' : 'badge-warning'}`}>
                        {srv.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <div>OS: <span className="text-white font-medium">{srv.order?.os?.name || 'Linux'}</span></div>
                      <div>Location: <span className="text-white font-medium">{srv.location}</span></div>
                      <div>RAM: <span className="text-white font-medium">{srv.order?.plan?.ramGb} GB</span></div>
                      <div>vCPU: <span className="text-white font-medium">{srv.order?.plan?.vcpuCores} Cores</span></div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                      <span>Access: <strong className={isReady ? 'text-emerald-400' : 'text-amber-400'}>{srv.accessStatus}</strong></span>
                      <span className="text-cyan-400 flex items-center gap-1 font-semibold">
                        View Console <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Console Credentials Detail (Right Column) */}
          <div className="lg:col-span-7">
            {selectedServerAccess ? (
              <div className="glass-panel p-6 sm:p-8 border-white/[0.1] space-y-6">
                
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      <Terminal className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-white">Server Console Access</h3>
                      <span className="text-xs text-slate-400">
                        {selectedServerAccess.order?.plan?.name} • {selectedServerAccess.order?.os?.name}
                      </span>
                    </div>
                  </div>

                  <span className={`badge-glow ${selectedServerAccess.accessStatus === 'ACCESS_AVAILABLE' ? 'badge-success' : 'badge-warning'}`}>
                    {selectedServerAccess.accessStatus}
                  </span>
                </div>

                {selectedServerAccess.accessStatus !== 'ACCESS_AVAILABLE' ? (
                  <div className="p-6 rounded-xl bg-slate-900/60 border border-white/[0.06] text-center space-y-3">
                    <Clock className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
                    <h4 className="font-bold text-white text-base">Node In Provisioning</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      Our systems and administrators are setting up your physical node and OS environment. As soon as provisioning completes, your website panel URL, username, and root password will appear right here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    
                    {/* Console URL */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Control Panel URL
                      </label>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-white/[0.1] text-xs">
                        <span className="font-mono text-cyan-300 font-bold truncate mr-2">
                          {selectedServerAccess.consoleUrl || 'Not configured'}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {selectedServerAccess.consoleUrl && (
                            <a
                              href={selectedServerAccess.consoleUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                              title="Open Panel"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => copyValue('url', selectedServerAccess.consoleUrl)}
                            className="p-1.5 rounded bg-white/[0.05] text-slate-300 hover:text-white"
                            title="Copy URL"
                          >
                            {copiedField === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Username */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Console Username
                      </label>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-white/[0.1] text-xs">
                        <span className="font-mono text-white font-bold select-all">
                          {selectedServerAccess.consoleUsername || 'root'}
                        </span>
                        <button
                          onClick={() => copyValue('user', selectedServerAccess.consoleUsername)}
                          className="p-1.5 rounded bg-white/[0.05] text-slate-300 hover:text-white"
                          title="Copy Username"
                        >
                          {copiedField === 'user' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Console Password
                      </label>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-white/[0.1] text-xs">
                        <span className="font-mono text-cyan-400 font-bold select-all">
                          {showPassword 
                            ? (selectedServerAccess.consolePassword || 'Not set') 
                            : '••••••••••••••••'}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-1.5 rounded bg-white/[0.05] text-slate-300 hover:text-white"
                            title={showPassword ? 'Hide Password' : 'Show Password'}
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => copyValue('pass', selectedServerAccess.consolePassword)}
                            className="p-1.5 rounded bg-white/[0.05] text-slate-300 hover:text-white"
                            title="Copy Password"
                          >
                            {copiedField === 'pass' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Access Notes */}
                    {selectedServerAccess.accessNotes && (
                      <div className="p-4 rounded-xl bg-slate-900/50 border border-white/[0.06] space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Administrator Instructions</span>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {selectedServerAccess.accessNotes}
                        </p>
                      </div>
                    )}

                  </div>
                )}

                {/* Safety Notice */}
                <div className="pt-2 flex items-start gap-2.5 text-xs text-slate-400">
                  <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    Keep your credentials private. Passwords are encrypted at rest and never shared in Discord logs.
                  </span>
                </div>

              </div>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-400 text-sm">
                Select a server instance on the left to view console details.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Shield,
  Zap,
  Gamepad2,
  Sparkles,
} from 'lucide-react';

export const NotFound: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('jarvis_404_highscore') || 0);
  });
  const [health, setHealth] = useState<number>(100);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Audio Context (Web Audio API Synthesizer)
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = (freq: number, type: OscillatorType, duration: number) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  // Game Entities refs
  const gameRef = useRef({
    player: { x: 250, y: 280, size: 16, speed: 5 },
    bullets: [] as { x: number; y: number; vy: number }[],
    enemies: [] as { x: number; y: number; vx: number; vy: number; size: number; hp: number }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
    memoryChips: [] as { x: number; y: number; vy: number; size: number }[],
    keys: {} as Record<string, boolean>,
    lastSpawn: 0,
    lastShoot: 0,
    score: 0,
    health: 100,
    animationFrameId: 0,
  });

  const startGame = () => {
    const g = gameRef.current;
    g.player.x = 250;
    g.player.y = 280;
    g.bullets = [];
    g.enemies = [];
    g.particles = [];
    g.memoryChips = [];
    g.score = 0;
    g.health = 100;
    g.lastSpawn = Date.now();
    g.lastShoot = 0;
    setScore(0);
    setHealth(100);
    setGameState('PLAYING');
    playTone(520, 'sine', 0.15);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameRef.current.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' && gameState === 'PLAYING') {
        e.preventDefault();
        shootBullet();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameRef.current.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, soundEnabled]);

  const shootBullet = () => {
    const g = gameRef.current;
    const now = Date.now();
    if (now - g.lastShoot < 160) return;
    g.lastShoot = now;
    g.bullets.push({
      x: g.player.x,
      y: g.player.y - 12,
      vy: -9,
    });
    playTone(880, 'square', 0.08);
  };

  // Main Canvas Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const loop = () => {
      if (!isRunning) return;
      const g = gameRef.current;

      // 1. Player movement
      const k = g.keys;
      if ((k['arrowleft'] || k['a']) && g.player.x > 20) g.player.x -= g.player.speed;
      if ((k['arrowright'] || k['d']) && g.player.x < canvas.width - 20) g.player.x += g.player.speed;
      if ((k['arrowup'] || k['w']) && g.player.y > 30) g.player.y -= g.player.speed;
      if ((k['arrowdown'] || k['s']) && g.player.y < canvas.height - 25) g.player.y += g.player.speed;

      // Continuous firing if Space is held
      if (k[' ']) shootBullet();

      // 2. Spawn Enemies / Corrupt Packets
      const now = Date.now();
      const spawnInterval = Math.max(400, 1000 - Math.floor(g.score / 15) * 50);
      if (now - g.lastSpawn > spawnInterval) {
        g.lastSpawn = now;
        const size = Math.random() * 10 + 14;
        g.enemies.push({
          x: Math.random() * (canvas.width - 40) + 20,
          y: -10,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 1.5 + 2 + Math.min(3, g.score / 200),
          size,
          hp: Math.ceil(size / 14),
        });

        // Spawn Memory Buffer Chip
        if (Math.random() < 0.35) {
          g.memoryChips.push({
            x: Math.random() * (canvas.width - 40) + 20,
            y: -10,
            vy: 2.2,
            size: 10,
          });
        }
      }

      // 3. Clear Screen
      ctx.fillStyle = '#0a0d10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Radar Grid lines
      ctx.strokeStyle = '#141c22';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 4. Update & Draw Bullets
      ctx.fillStyle = '#ccff00';
      for (let i = g.bullets.length - 1; i >= 0; i--) {
        const b = g.bullets[i];
        b.y += b.vy;
        ctx.fillRect(b.x - 2, b.y, 4, 10);

        if (b.y < -10) {
          g.bullets.splice(i, 1);
        }
      }

      // 5. Update & Draw Memory Chips
      for (let i = g.memoryChips.length - 1; i >= 0; i--) {
        const m = g.memoryChips[i];
        m.y += m.vy;

        // Draw diamond chip
        ctx.fillStyle = '#ccff00';
        ctx.beginPath();
        ctx.arc(m.x, m.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Check Collision with Player
        const dist = Math.hypot(m.x - g.player.x, m.y - g.player.y);
        if (dist < g.player.size + 8) {
          g.score += 50;
          setScore(g.score);
          g.health = Math.min(100, g.health + 10);
          setHealth(g.health);
          playTone(660, 'triangle', 0.1);

          // Particles
          for (let p = 0; p < 8; p++) {
            g.particles.push({
              x: m.x,
              y: m.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              color: '#ccff00',
              life: 18,
            });
          }
          g.memoryChips.splice(i, 1);
          continue;
        }

        if (m.y > canvas.height + 20) {
          g.memoryChips.splice(i, 1);
        }
      }

      // 6. Update & Draw Corrupt Packets (Enemies)
      for (let i = g.enemies.length - 1; i >= 0; i--) {
        const e = g.enemies[i];
        e.x += e.vx;
        e.y += e.vy;

        // Draw enemy glitch polygon
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
        ctx.fill();
        ctx.stroke();

        // Cross inside
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(e.x - 3, e.y - 3);
        ctx.lineTo(e.x + 3, e.y + 3);
        ctx.moveTo(e.x + 3, e.y - 3);
        ctx.lineTo(e.x - 3, e.y + 3);
        ctx.stroke();

        // Bullet collisions
        for (let j = g.bullets.length - 1; j >= 0; j--) {
          const b = g.bullets[j];
          if (
            b.x > e.x - e.size &&
            b.x < e.x + e.size &&
            b.y > e.y - e.size &&
            b.y < e.y + e.size
          ) {
            e.hp--;
            g.bullets.splice(j, 1);

            if (e.hp <= 0) {
              g.score += 20;
              setScore(g.score);
              playTone(240, 'sawtooth', 0.1);

              // Spawn hit particles
              for (let p = 0; p < 12; p++) {
                g.particles.push({
                  x: e.x,
                  y: e.y,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  color: '#ef4444',
                  life: 22,
                });
              }

              g.enemies.splice(i, 1);
              break;
            }
          }
        }

        // Collision with player
        const dist = Math.hypot(e.x - g.player.x, e.y - g.player.y);
        if (dist < g.player.size + e.size / 2) {
          g.health -= 25;
          setHealth(Math.max(0, g.health));
          playTone(150, 'square', 0.2);

          // Screen shake particles
          for (let p = 0; p < 15; p++) {
            g.particles.push({
              x: g.player.x,
              y: g.player.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              color: '#ef4444',
              life: 25,
            });
          }

          g.enemies.splice(i, 1);

          if (g.health <= 0) {
            isRunning = false;
            setGameState('GAMEOVER');
            playTone(90, 'sawtooth', 0.4);
            if (g.score > highScore) {
              setHighScore(g.score);
              localStorage.setItem('jarvis_404_highscore', g.score.toString());
            }
            return;
          }
          continue;
        }

        if (e.y > canvas.height + 25) {
          g.enemies.splice(i, 1);
        }
      }

      // 7. Update & Draw Particles
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 2, 2);

        if (p.life <= 0) {
          g.particles.splice(i, 1);
        }
      }

      // 8. Draw Player Node Ship
      ctx.save();
      ctx.translate(g.player.x, g.player.y);

      // Neon Thruster Glow
      ctx.fillStyle = 'rgba(204, 255, 0, 0.4)';
      ctx.beginPath();
      ctx.moveTo(-6, 8);
      ctx.lineTo(6, 8);
      ctx.lineTo(0, 16 + Math.random() * 4);
      ctx.closePath();
      ctx.fill();

      // Ship Polygon (Hexagon/Delta Drone)
      ctx.fillStyle = '#11161b';
      ctx.strokeStyle = '#ccff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(14, 10);
      ctx.lineTo(0, 4);
      ctx.lineTo(-14, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit Light
      ctx.fillStyle = '#ccff00';
      ctx.beginPath();
      ctx.arc(0, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      g.animationFrameId = requestAnimationFrame(loop);
    };

    gameRef.current.animationFrameId = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      cancelAnimationFrame(gameRef.current.animationFrameId);
    };
  }, [gameState, highScore]);

  // Touch / Mouse control for mobile
  const handleCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    gameRef.current.player.x = (e.clientX - rect.left) * scaleX;
    gameRef.current.player.y = (e.clientY - rect.top) * scaleY;
    shootBullet();
  };

  return (
    <div className="bg-[#0a0d10] text-[#8a99ad] min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 font-mono-tech relative overflow-hidden">
      {/* Background Radar Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[600px] pointer-events-none opacity-20">
        <div className="radar-circles"></div>
      </div>

      <div className="relative z-10 max-w-2xl w-full bg-[#11161b] border border-[#1e262e] rounded p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e262e] pb-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0d1115] border border-red-500/30 text-[10px] text-red-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
              <span>ERR_404_UNRESOLVED</span>
            </div>
            <span className="text-xs text-white font-bold tracking-tight">
              MINI-GAME: NODE DEFENDER
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-[#ccff00]">
              <Trophy className="w-3.5 h-3.5" />
              <span>BEST: {highScore}</span>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-[#5c6b73] hover:text-white p-1 rounded transition-colors"
              title="Toggle Audio"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#ccff00]" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Game Canvas Box */}
        <div className="relative bg-[#0d1115] border border-[#1e262e] rounded overflow-hidden">
          {/* Live In-Game HUD overlay */}
          {gameState === 'PLAYING' && (
            <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none text-xs font-mono-tech z-10">
              <div className="flex items-center gap-2">
                <span className="text-[#5c6b73]">SCORE:</span>
                <span className="text-[#ccff00] font-bold text-sm">{score}</span>
              </div>

              {/* Health bar */}
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#ccff00]" />
                <div className="w-24 h-2 bg-[#182028] rounded-full overflow-hidden border border-[#1e262e]">
                  <div
                    className={`h-full transition-all duration-150 ${
                      health > 50 ? 'bg-[#ccff00]' : health > 25 ? 'bg-amber-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${health}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Start Screen Overlay */}
          {gameState === 'IDLE' && (
            <div className="absolute inset-0 bg-[#0d1115]/90 flex flex-col items-center justify-center p-6 text-center space-y-4 z-20">
              <div className="w-12 h-12 rounded-full bg-[#182028] border border-[#ccff00] flex items-center justify-center text-[#ccff00] shadow-[0_0_20px_rgba(204,255,0,0.15)]">
                <Gamepad2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Lost Packet Recovery
                </h2>
                <p className="text-xs text-[#8a99ad] max-w-sm leading-relaxed">
                  Route 404 was dropped. Pilot your core node, vaporize corrupted packets, and gather data buffers!
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={startGame}
                  className="btn-lime px-6 py-2.5 rounded text-xs uppercase font-bold tracking-wider flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Defense</span>
                </button>
              </div>

              <div className="text-[10px] text-[#5c6b73] pt-1">
                [WASD / Arrow Keys] to Move • [Space / Click] to Fire Pulse
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 bg-[#0d1115]/95 flex flex-col items-center justify-center p-6 text-center space-y-4 z-20">
              <div className="text-xs font-bold text-red-400 uppercase tracking-widest">
                SYSTEM BUFFER OVERFLOW
              </div>

              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-white tracking-tight">NODE COMPROMISED</h2>
                <div className="text-sm text-[#8a99ad]">
                  Final Uptime Score:{' '}
                  <strong className="text-[#ccff00] text-base">{score} PTS</strong>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={startGame}
                  className="btn-lime px-5 py-2.5 rounded text-xs uppercase font-bold tracking-wider flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reboot &amp; Retry</span>
                </button>
              </div>
            </div>
          )}

          {/* The Canvas */}
          <canvas
            ref={canvasRef}
            width={520}
            height={320}
            onPointerMove={handleCanvasPointer}
            onPointerDown={handleCanvasPointer}
            className="w-full h-[300px] sm:h-[340px] block cursor-crosshair touch-none"
          />
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#1e262e]">
          <div className="text-xs text-[#5c6b73] text-center sm:text-left">
            <span>Looking for hosting? </span>
            <span className="text-white">All server nodes are operational in BOM1.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded text-xs uppercase font-bold tracking-wider btn-outline-dark"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Core Gateway</span>
            </Link>
            <Link
              to="/portal"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded text-xs uppercase font-bold tracking-wider btn-lime"
            >
              <span>Customer Portal</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

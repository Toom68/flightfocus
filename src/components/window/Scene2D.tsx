import { useEffect, useRef } from 'react';
import type { getSolarPosition } from '@/utils/time';

type SolarData = ReturnType<typeof getSolarPosition> | null;

interface Scene2DProps {
  altitude: number;
  phase: string;
  speed: number;
  progress: number;
  solarData: SolarData;
}

interface Star {
  x: number;
  y: number;
  r: number;
  tw: number;
  phase: number;
}

interface CloudPuff {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  opacity: number;
}

// Sky colour stops based on sun altitude (degrees).
function getSkyGradient(sunAlt: number): [string, string, string] {
  if (sunAlt > 20) return ['#1a4a7a', '#5a9fd4', '#a8d4f0'];
  if (sunAlt > 8) return ['#2a5a8a', '#7ab0d8', '#c8e0f0'];
  if (sunAlt > 2) return ['#3a4a6a', '#e89a5c', '#f0c0a0'];
  if (sunAlt > -3) return ['#1a2744', '#c44d2b', '#e8704a'];
  if (sunAlt > -8) return ['#0f1b33', '#5a2d4e', '#8a3a4a'];
  if (sunAlt > -14) return ['#080f1e', '#1a1a3e', '#2a2050'];
  return ['#030610', '#070d18', '#0a1020'];
}

// Lerp between two hex colours.
function lerpColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 0xff, ag = (pa >> 8) & 0xff, ab = pa & 0xff;
  const br = (pb >> 16) & 0xff, bg = (pb >> 8) & 0xff, bb = pb & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

export function Scene2D({ altitude, phase, speed, progress, solarData }: Scene2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef({
    time: 0,
    clouds: [] as CloudPuff[],
    stars: [] as Star[],
    bank: 0,
    pitch: 0,
    targetBank: 0,
    targetPitch: 0,
    initialized: false,
  });

  // Initialize stars and clouds once.
  useEffect(() => {
    const s = stateRef.current;
    if (s.initialized) return;
    s.initialized = true;

    // Stars
    for (let i = 0; i < 120; i++) {
      s.stars.push({
        x: Math.random(),
        y: Math.random() * 0.65,
        r: 0.3 + Math.random() * 1.2,
        tw: 0.5 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Clouds — multiple layers
    for (let i = 0; i < 14; i++) {
      const layer = Math.random();
      s.clouds.push({
        x: Math.random(),
        y: 0.3 + Math.random() * 0.5,
        w: 0.15 + Math.random() * 0.25,
        h: 0.03 + Math.random() * 0.05,
        speed: 0.003 + layer * 0.008,
        opacity: 0.3 + Math.random() * 0.4,
      });
    }
  }, []);

  // Update targets when phase/altitude changes.
  useEffect(() => {
    const s = stateRef.current;
    switch (phase) {
      case 'BOARDING':
      case 'TAXI':
        s.targetBank = 0; s.targetPitch = 0.02; break;
      case 'TAKEOFF':
        s.targetBank = 0.01; s.targetPitch = 0.12; break;
      case 'CLIMB':
        s.targetBank = 0.06; s.targetPitch = 0.08; break;
      case 'CRUISE':
        s.targetBank = 0.03; s.targetPitch = 0; break;
      case 'DESCENT':
        s.targetBank = 0.04; s.targetPitch = -0.05; break;
      case 'APPROACH':
        s.targetBank = 0.05; s.targetPitch = -0.08; break;
      case 'LANDING':
        s.targetBank = 0.01; s.targetPitch = -0.04; break;
      case 'ARRIVED':
        s.targetBank = 0; s.targetPitch = 0.02; break;
      default:
        s.targetBank = 0; s.targetPitch = 0;
    }
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const sunAlt = solarData?.altitude ?? -20;
    const isDay = solarData?.isDaytime ?? false;
    const warmth = Math.max(0, 1 - Math.abs(sunAlt) / 12);

    let lastT = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const s = stateRef.current;
      s.time += dt;

      // Smooth bank/pitch
      s.bank += (s.targetBank - s.bank) * Math.min(1, dt * 0.8);
      s.pitch += (s.targetPitch - s.pitch) * Math.min(1, dt * 0.8);

      // Gentle oscillation on bank for life
      const bankOsc = Math.sin(s.time * 0.15) * 0.008 + Math.sin(s.time * 0.37) * 0.004;
      const pitchOsc = Math.sin(s.time * 0.2) * 0.004 + Math.sin(s.time * 0.53) * 0.002;

      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;

      ctx.save();

      // Apply camera transform — subtle bank + pitch
      const cx = W / 2;
      const cy = H / 2;
      ctx.translate(cx, cy);
      ctx.rotate((s.bank + bankOsc) * 0.3);
      ctx.translate(0, (s.pitch + pitchOsc) * H * 0.15);
      ctx.translate(-cx, -cy);

      // --- Sky gradient ---
      const [topC, midC, botC] = getSkyGradient(sunAlt);
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, topC);
      skyGrad.addColorStop(0.55, midC);
      skyGrad.addColorStop(1, botC);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-W, -H, W * 3, H * 3);

      // --- Stars (night) ---
      if (sunAlt < -3) {
        const starOpacity = Math.min(1, (-sunAlt - 3) / 8);
        for (const star of s.stars) {
          const tw = 0.4 + 0.6 * Math.abs(Math.sin(s.time * star.tw + star.phase));
          ctx.fillStyle = `rgba(255,255,255,${tw * starOpacity})`;
          ctx.beginPath();
          ctx.arc(star.x * W, star.y * H, star.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- Sun ---
      if (sunAlt > -6) {
        const sunY = H * (0.5 - (sunAlt / 90) * 0.35);
        const sunX = W * (0.2 + ((solarData?.azimuth ?? 180) / 360) * 0.6);
        const sunRadius = 18 + warmth * 14;
        const sunOpacity = Math.min(1, (sunAlt + 6) / 10);

        // Glow
        const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 6);
        const glowColor = warmth > 0.3 ? '255,180,100' : '255,240,200';
        glow.addColorStop(0, `rgba(${glowColor},${0.4 * sunOpacity})`);
        glow.addColorStop(0.3, `rgba(${glowColor},${0.15 * sunOpacity})`);
        glow.addColorStop(1, `rgba(${glowColor},0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(sunX - sunRadius * 6, sunY - sunRadius * 6, sunRadius * 12, sunRadius * 12);

        // Disc
        const discColor = warmth > 0.3 ? lerpColor('#fff6e6', '#ff8c42', warmth) : '#fff8e8';
        ctx.fillStyle = discColor;
        ctx.globalAlpha = sunOpacity;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // --- Moon ---
      if (sunAlt < -4) {
        const moonY = H * 0.25;
        const moonX = W * 0.7;
        const moonR = 14;
        const moonOpacity = Math.min(1, (-sunAlt - 4) / 8);

        // Glow
        const mGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonR * 5);
        mGlow.addColorStop(0, `rgba(200,210,240,${0.2 * moonOpacity})`);
        mGlow.addColorStop(1, 'rgba(200,210,240,0)');
        ctx.fillStyle = mGlow;
        ctx.fillRect(moonX - moonR * 5, moonY - moonR * 5, moonR * 10, moonR * 10);

        ctx.fillStyle = `rgba(232,237,245,${moonOpacity})`;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- Clouds ---
      const isGround = phase === 'BOARDING' || phase === 'TAXI' || phase === 'ARRIVED';
      const cloudYBase = altitude > 20000 ? 0.45 : altitude > 8000 ? 0.5 : 0.55;
      const cloudSpeedMul = isGround ? 0.3 : Math.max(0.5, speed / 450);

      for (const c of s.clouds) {
        c.x += c.speed * cloudSpeedMul * dt * 60;
        if (c.x > 1.3) c.x = -0.3;

        const cx2 = c.x * W;
        const cy2 = (c.y + cloudYBase - 0.3) * H;
        const cw = c.w * W;
        const ch = c.h * H;

        // Cloud colour based on time of day
        const cloudBase = isDay
          ? `rgba(220,230,245,${c.opacity})`
          : `rgba(90,100,130,${c.opacity * 0.6})`;
        const cloudWarm = warmth > 0.2
          ? `rgba(255,200,150,${c.opacity * warmth * 0.5})`
          : cloudBase;

        // Draw soft cloud as overlapping ellipses
        ctx.fillStyle = isDay ? cloudWarm : cloudBase;
        for (let i = 0; i < 5; i++) {
          const ox = (i - 2) * cw * 0.18;
          const oy = Math.sin(i * 1.7) * ch * 0.3;
          const rw = cw * (0.3 + Math.sin(i * 2.1) * 0.1);
          const rh = ch * 1.5;
          ctx.beginPath();
          ctx.ellipse(cx2 + ox, cy2 + oy, rw, rh, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- Ground / horizon ---
      const horizonY = H * (0.62 + (s.pitch + pitchOsc) * 0.3);
      const isHighAlt = altitude > 3000;

      if (isHighAlt) {
        // Distant ground band
        const groundGrad = ctx.createLinearGradient(0, horizonY, 0, H);
        const gDay = '#3a6a6e';
        const gNight = '#101d2c';
        const gColor = isDay
          ? lerpColor(gNight, gDay, Math.min(1, (sunAlt + 6) / 20))
          : gNight;
        groundGrad.addColorStop(0, lerpColor(gColor, botC, 0.5));
        groundGrad.addColorStop(0.3, gColor);
        groundGrad.addColorStop(1, lerpColor(gColor, '#000', 0.4));
        ctx.fillStyle = groundGrad;
        ctx.fillRect(-W, horizonY, W * 3, H * 2);

        // Horizon haze line
        const hazeGrad = ctx.createLinearGradient(0, horizonY - 20, 0, horizonY + 30);
        hazeGrad.addColorStop(0, 'rgba(0,0,0,0)');
        hazeGrad.addColorStop(0.5, isDay ? 'rgba(200,220,240,0.15)' : 'rgba(40,50,80,0.2)');
        hazeGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hazeGrad;
        ctx.fillRect(-W, horizonY - 20, W * 3, 50);
      } else {
        // Low altitude — ground/runway
        const groundGrad = ctx.createLinearGradient(0, horizonY, 0, H);
        groundGrad.addColorStop(0, isDay ? '#4a5a4a' : '#1a2a1a');
        groundGrad.addColorStop(1, isDay ? '#2a3a2a' : '#0a1a0a');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(-W, horizonY, W * 3, H * 2);

        // Runway markings (scrolling)
        if (phase === 'TAXI' || phase === 'TAKEOFF' || phase === 'LANDING' || phase === 'BOARDING') {
          const scrollSpeed = speed * 0.0008;
          const offset = (s.time * scrollSpeed * 60) % 0.1;
          ctx.fillStyle = 'rgba(220,220,220,0.5)';
          const rwW = W * 0.04;
          const rwX = W * 0.48;
          for (let y = 0; y < 1; y += 0.1) {
            const yPos = horizonY + (y + offset) * (H - horizonY);
            if (yPos < H) {
              ctx.fillRect(rwX, yPos, rwW, (H - horizonY) * 0.04);
            }
          }
        }
      }

      // --- Aircraft wing silhouette ---
      // Drawn in screen space (not affected by camera transform) for stability.
      ctx.restore();
      ctx.save();

      const wingColor = isDay ? 'rgba(180,185,195,0.85)' : 'rgba(80,85,100,0.8)';
      const wingShadow = isDay ? 'rgba(120,125,135,0.4)' : 'rgba(30,35,50,0.5)';

      // Wing shape — sweeps from bottom-left
      ctx.fillStyle = wingColor;
      ctx.beginPath();
      ctx.moveTo(-W * 0.05, H * 0.95);
      ctx.lineTo(W * 0.02, H * 0.78);
      ctx.lineTo(W * 0.35, H * 0.82);
      ctx.lineTo(W * 0.38, H * 0.88);
      ctx.lineTo(W * 0.08, H * 0.92);
      ctx.closePath();
      ctx.fill();

      // Wing shadow underside
      ctx.fillStyle = wingShadow;
      ctx.beginPath();
      ctx.moveTo(W * 0.02, H * 0.78);
      ctx.lineTo(W * 0.35, H * 0.82);
      ctx.lineTo(W * 0.38, H * 0.84);
      ctx.lineTo(W * 0.08, H * 0.88);
      ctx.closePath();
      ctx.fill();

      // Winglet
      ctx.fillStyle = wingColor;
      ctx.beginPath();
      ctx.moveTo(W * 0.33, H * 0.82);
      ctx.lineTo(W * 0.36, H * 0.77);
      ctx.lineTo(W * 0.39, H * 0.78);
      ctx.lineTo(W * 0.38, H * 0.84);
      ctx.closePath();
      ctx.fill();

      // Engine nacelle
      ctx.fillStyle = isDay ? 'rgba(160,165,175,0.8)' : 'rgba(50,55,70,0.7)';
      ctx.beginPath();
      ctx.ellipse(W * 0.12, H * 0.86, W * 0.025, H * 0.018, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Nav light at wingtip
      if (!isDay) {
        const strobe = Math.sin(s.time * 1.5) > 0.92;
        if (strobe) {
          ctx.fillStyle = 'rgba(255,40,40,0.9)';
          ctx.beginPath();
          ctx.arc(W * 0.36, H * 0.80, 3, 0, Math.PI * 2);
          ctx.fill();
          // Glow
          const navGlow = ctx.createRadialGradient(W * 0.36, H * 0.80, 0, W * 0.36, H * 0.80, 12);
          navGlow.addColorStop(0, 'rgba(255,40,40,0.4)');
          navGlow.addColorStop(1, 'rgba(255,40,40,0)');
          ctx.fillStyle = navGlow;
          ctx.fillRect(W * 0.36 - 12, H * 0.80 - 12, 24, 24);
        }
      }

      ctx.restore();

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [solarData, altitude, phase, speed, progress]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}

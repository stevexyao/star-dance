
import { ParticleTheme, HandPoint, AudioData } from '../types';

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  color: string;
  originalX: number;
  originalY: number;

  constructor(width: number, height: number, theme: ParticleTheme) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.originalX = this.x;
    this.originalY = this.y;
    this.vx = (Math.random() - 0.5) * theme.maxSpeed;
    this.vy = (Math.random() - 0.5) * theme.maxSpeed;
    this.baseSize = Math.random() * (theme.sizeRange[1] - theme.sizeRange[0]) + theme.sizeRange[0];
    this.size = this.baseSize;
    this.color = theme.colors[Math.floor(Math.random() * theme.colors.length)];
  }

  update(width: number, height: number, theme: ParticleTheme, hands: HandPoint[], audio: AudioData) {
    // React to audio: Bass increases size and adds jitter
    this.size = this.baseSize * (1 + audio.bass * 2.5);
    
    // Add jitter based on treble
    const jitter = audio.treble * 1.5;
    this.vx += (Math.random() - 0.5) * jitter;
    this.vy += (Math.random() - 0.5) * jitter;

    // Basic velocity
    this.x += this.vx;
    this.y += this.vy;

    // Apply friction (reduced when hands are near to feel more responsive)
    let currentFriction = theme.friction;

    // Interaction with hands (Enhanced Sensitivity)
    hands.forEach(hand => {
      const hX = hand.x * width;
      const hY = hand.y * height;
      const dx = hX - this.x;
      const dy = hY - this.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      // Increased interaction radius for better sensitivity
      const interactionRadius = 450; 
      if (dist < interactionRadius) {
        // More aggressive force curve
        const forceFactor = Math.pow(1 - dist / interactionRadius, 1.5);
        const force = forceFactor * theme.interactionForce * 0.8;
        
        this.vx += dx * force;
        this.vy += dy * force;
        
        // Reduce friction near hands for "whippier" movement
        currentFriction = Math.min(currentFriction, 0.94);
      }
    });

    this.vx *= currentFriction;
    this.vy *= currentFriction;

    // Add some random drift based on volume
    const drift = 0.05 + audio.volume * 0.2;
    this.vx += (Math.random() - 0.5) * drift;
    this.vy += (Math.random() - 0.5) * drift;

    // Boundary check
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;

    // Limit speed based on theme and audio peaks
    const maxSpeedLimit = theme.maxSpeed * (2 + audio.volume * 3);
    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (currentSpeed > maxSpeedLimit) {
      this.vx = (this.vx / currentSpeed) * maxSpeedLimit;
      this.vy = (this.vy / currentSpeed) * maxSpeedLimit;
    }
  }

  draw(ctx: CanvasRenderingContext2D, theme: ParticleTheme, audio: AudioData) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    
    if (theme.glow) {
      // Glow intensity reacts to audio mid-range
      const glowScale = theme.glow ? (this.size * (2 + audio.mid * 5)) : 0;
      ctx.shadowBlur = glowScale;
      ctx.shadowColor = this.color;
    } else {
      ctx.shadowBlur = 0;
    }
    
    ctx.fill();
  }
}

export class ParticleEngine {
  particles: Particle[] = [];
  width: number = 0;
  height: number = 0;

  constructor(width: number, height: number, theme: ParticleTheme) {
    this.resize(width, height);
    this.init(theme);
  }

  init(theme: ParticleTheme) {
    this.particles = [];
    for (let i = 0; i < theme.particleCount; i++) {
      this.particles.push(new Particle(this.width, this.height, theme));
    }
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  updateAndDraw(ctx: CanvasRenderingContext2D, theme: ParticleTheme, hands: HandPoint[], audio: AudioData) {
    // Trail depth reacts to volume for dynamic motion blur
    const trailAlpha = Math.max(0.1, 0.3 - audio.volume * 0.2);
    ctx.fillStyle = `rgba(0, 0, 0, ${trailAlpha})`;
    ctx.fillRect(0, 0, this.width, this.height);

    this.particles.forEach(p => {
      p.update(this.width, this.height, theme, hands, audio);
      p.draw(ctx, theme, audio);
    });
  }
}

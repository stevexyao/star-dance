
import { ParticleTheme, ThemeStyle } from './types';

export const DEFAULT_THEME: ParticleTheme = {
  name: ThemeStyle.COSMIC,
  colors: ['#4f46e5', '#9333ea', '#db2777', '#3b82f6'],
  maxSpeed: 2,
  friction: 0.98,
  particleCount: 1500,
  glow: true,
  sizeRange: [1, 3],
  interactionForce: 0.15
};

export const THEMES: Record<ThemeStyle, ParticleTheme> = {
  [ThemeStyle.COSMIC]: {
    name: ThemeStyle.COSMIC,
    colors: ['#4f46e5', '#9333ea', '#db2777', '#3b82f6'],
    maxSpeed: 2,
    friction: 0.98,
    particleCount: 1500,
    glow: true,
    sizeRange: [1, 3],
    interactionForce: 0.15
  },
  [ThemeStyle.FIRE]: {
    name: ThemeStyle.FIRE,
    colors: ['#f59e0b', '#ef4444', '#b91c1c', '#fef3c7'],
    maxSpeed: 4,
    friction: 0.95,
    particleCount: 1200,
    glow: true,
    sizeRange: [2, 5],
    interactionForce: -0.2
  },
  [ThemeStyle.OCEAN]: {
    name: ThemeStyle.OCEAN,
    colors: ['#0ea5e9', '#2563eb', '#1d4ed8', '#06b6d4'],
    maxSpeed: 1.5,
    friction: 0.99,
    particleCount: 2000,
    glow: false,
    sizeRange: [1, 2],
    interactionForce: 0.3
  },
  [ThemeStyle.NEON]: {
    name: ThemeStyle.NEON,
    colors: ['#22c55e', '#a855f7', '#ec4899', '#eab308'],
    maxSpeed: 3.5,
    friction: 0.97,
    particleCount: 1000,
    glow: true,
    sizeRange: [1.5, 4],
    interactionForce: -0.4
  },
  [ThemeStyle.ZEN]: {
    name: ThemeStyle.ZEN,
    colors: ['#f5f5f4', '#d6d3d1', '#78716c', '#a8a29e'],
    maxSpeed: 0.8,
    friction: 0.995,
    particleCount: 800,
    glow: false,
    sizeRange: [0.5, 2],
    interactionForce: 0.05
  }
};

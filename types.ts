
export interface ParticleTheme {
  name: string;
  colors: string[];
  maxSpeed: number;
  friction: number;
  particleCount: number;
  glow: boolean;
  sizeRange: [number, number];
  interactionForce: number; // 正数吸引，负数排斥
}

export interface HandPoint {
  x: number;
  y: number;
  z: number;
}

export interface GestureState {
  isDetected: boolean;
  points: HandPoint[];
}

export interface AudioData {
  volume: number;
  bass: number;
  mid: number;
  treble: number;
}

export enum ThemeStyle {
  COSMIC = '宇宙星云',
  FIRE = '烈焰耀斑',
  OCEAN = '深海暗流',
  NEON = '赛博脉冲',
  ZEN = '禅意之灵'
}

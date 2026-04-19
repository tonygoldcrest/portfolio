import type { ParticleSystemControls } from './types';

export const DEFAULT_PARTICLES_NUM = 1_000_000;

export const DEFAULT_CONTROLS: ParticleSystemControls = {
  particlesNum: DEFAULT_PARTICLES_NUM,
  particleSize: 2,
  particleOpacity: 0.5,
  spawnRadius: 200,
  particleColor: '#1e272e',
  backgroundColor: '#ecf0f1',
  bounceX: true,
  bounceY: true,
  squared: true,
  enableMotionBlur: true,
  party: false,
  image: false,
};

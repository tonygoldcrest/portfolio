import type { ParticleSystem } from '@/projects/particle-system-webgl';
import AppConfig from '@/projects/particle-system-webgl/modules/config';

export function normalize(a: number, b: number, magnitude: number) {
  return (a * magnitude) / Math.sqrt(a * a + b * b);
}

export function resizeCanvasToDisplaySize(
  canvas: HTMLCanvasElement,
  multiplier: number,
) {
  multiplier = multiplier || 1;
  const width = (canvas.clientWidth * multiplier) | 0;
  const height = (canvas.clientHeight * multiplier) | 0;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}

export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : null;
}

export function getDefaultAppConfig(ps: ParticleSystem) {
  return new AppConfig({
    particlesNum: {
      value: 1000000,
      gui: {
        type: 'range',
        from: 1,
        to: 1000000,
        listen: true,
        onChange: (newValue) => {
          ps.createParticles(newValue as number);
        },
        onChangeFunc: 'onFinishChange',
      },
    },
    bounceX: {
      value: true,
      gui: { type: 'bool' },
    },
    bounceY: {
      value: true,
      gui: { type: 'bool' },
    },
    image: {
      value: false,
      gui: {
        type: 'bool',
        onChange: (newValue) => {
          if (!ps.particleProgram) {
            return;
          }
          ps.glContext.useProgram(ps.particleProgram.program);
          ps.glContext.uniform1f(
            ps.particleProgram.uniforms.uReadFromTexture,
            newValue ? 1 : 0,
          );
        },
        onChangeFunc: 'onChange',
      },
    },
    party: {
      value: false,
      gui: {
        type: 'bool',
        onChange: (newValue) => {
          if (!ps.particleProgram) {
            return;
          }
          if (!newValue) {
            ps.glContext.uniform3f(
              ps.particleProgram.uniforms.uCoefficients,
              1,
              1,
              1,
            );
          }
        },
        onChangeFunc: 'onChange',
      },
    },
    squared: {
      value: true,
      gui: { type: 'bool' },
    },
    enableMotionBlur: {
      value: true,
      gui: {
        type: 'bool',
        onChange: (newValue) => {
          if (newValue) {
            ps.clearColors(ps.config.values.particleColor as string);
          }
        },
        onChangeFunc: 'onChange',
      },
    },
    particleSize: {
      value: 2,
      gui: {
        type: 'range',
        from: 1,
        to: 100,
        step: 1,
        onChange: (newValue) => {
          if (!ps.particleProgram) {
            return;
          }
          ps.glContext.uniform1f(
            ps.particleProgram.uniforms.uPointSize,
            newValue as number,
          );
        },
        onChangeFunc: 'onChange',
      },
    },
    spawnRadius: {
      value: 200,
      gui: { type: 'range', from: 20, to: 500 },
    },
    particleOpacity: {
      value: 0.5,
      gui: {
        type: 'range',
        from: 0,
        to: 1,
        step: 0.01,
        onChange: (newValue) => {
          if (!ps.particleProgram) {
            return;
          }
          ps.glContext.uniform1f(
            ps.particleProgram.uniforms.uOpacity,
            newValue as number,
          );
        },
        onChangeFunc: 'onChange',
      },
    },
    'GPU Performance': {
      value: 1000000,
      gui: {
        order: 1,
        type: 'list',
        listValues: {
          UltraLow: 1000,
          SuperLow: 4000,
          VeryLow: 7000,
          Low: 10000,
          Medium: 50000,
          High: 100000,
          VeryHigh: 500000,
          Ultra: 1000000,
          Mega: 2000000,
          Duper: 3000000,
          Nightmare: 4000000,
          UltraNightmare: 5000000,
        },
        onChange: (newValue) => {
          ps.config.values.particlesNum = newValue;
          ps.createParticles(newValue as number);
        },
        onChangeFunc: 'onFinishChange',
      },
    },
    particleColor: {
      value: '#1e272e',
      gui: {
        type: 'color',
        onChange: (newValue) => {
          if (!ps.particleProgram) {
            return;
          }
          const colorRgb = hexToRgb(newValue as string);
          if (!colorRgb) {
            return;
          }
          ps.glContext.useProgram(ps.particleProgram.program);
          ps.glContext.uniform3f(
            ps.particleProgram.uniforms.uColor,
            colorRgb.r,
            colorRgb.g,
            colorRgb.b,
          );
          ps.clearColors(newValue as string);
        },
        onChangeFunc: 'onChange',
      },
    },
    backgroundColor: {
      value: '#ecf0f1',
      gui: {
        type: 'color',
        onChange: (newValue) => {
          if (!ps.triangleProgram) {
            return;
          }
          const backgroundColorRgb = hexToRgb(newValue as string);
          if (!backgroundColorRgb) {
            return;
          }
          ps.cachedBackgroundColor = backgroundColorRgb;
          ps.glContext.useProgram(ps.triangleProgram.program);
          ps.glContext.uniform3f(
            ps.triangleProgram.uniforms.uBackground,
            backgroundColorRgb.r,
            backgroundColorRgb.g,
            backgroundColorRgb.b,
          );
          ps.clearColors(ps.config.values.particleColor as string);
        },
        onChangeFunc: 'onChange',
      },
    },
  });
}

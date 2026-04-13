import type { ParticleSystem } from '@/projects/particle-system-webgl';
import AppConfig from '@/projects/particle-system-webgl/modules/config';

export function createShader(
  gl: WebGL2RenderingContext,
  type: GLenum,
  source: string,
) {
  const shader = gl.createShader(type);

  if (!shader) {
    return;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);

  return null;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
) {
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);

  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);

  return null;
}

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
          if (!ps.particleProgram || !ps.readFromTextureLocation) {
            return;
          }

          ps.gl.useProgram(ps.particleProgram);
          ps.gl.uniform1f(ps.readFromTextureLocation, newValue ? 1 : 0);
        },
        onChangeFunc: 'onChange',
      },
    },
    party: {
      value: false,
      gui: {
        type: 'bool',
        onChange: (newValue) => {
          if (!ps.coefficientsLocation) {
            return;
          }

          if (!newValue) {
            ps.gl.uniform3f(ps.coefficientsLocation, 1, 1, 1);
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
          if (!ps.pointSizeLocation) {
            return;
          }

          ps.gl.uniform1f(ps.pointSizeLocation, newValue as number);
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
          if (!ps.particleOpacityLocation) {
            return;
          }

          ps.gl.uniform1f(ps.particleOpacityLocation, newValue as number);
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
          if (!ps.particleProgram || !ps.particleColorLocation) {
            return;
          }
          const particleColorRgb = hexToRgb(newValue as string);

          if (!particleColorRgb) {
            return;
          }

          ps.gl.useProgram(ps.particleProgram);
          ps.gl.uniform3f(
            ps.particleColorLocation,
            particleColorRgb.r,
            particleColorRgb.g,
            particleColorRgb.b,
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
          if (!ps.triangleProgram || !ps.backgroundColorLocation) {
            return;
          }

          const backgroundColorRgb = hexToRgb(newValue as string);

          if (!backgroundColorRgb) {
            return;
          }

          ps.cachedBackgroundColor = backgroundColorRgb;
          ps.gl.useProgram(ps.triangleProgram);
          ps.gl.uniform3f(
            ps.backgroundColorLocation,
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

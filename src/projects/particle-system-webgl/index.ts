import { hexToRgb, getDefaultAppConfig } from './helpers.js';
import { Vector2 } from './classes.js';
import type { MainModule } from './wasm.js';
import { GlProgram } from './gl-program.js';
import type AppConfig from '@/projects/particle-system-webgl/modules/config.js';

export interface WasmModule extends EmscriptenModule, MainModule {
  calcCoordinates(
    canvasWidth: number,
    canvasHeight: number,
    particleSize: number,
    isForceApplied: boolean,
    fx: number,
    fy: number,
    deltaTime: number,
    isBounceX: boolean,
    isBounceY: boolean,
    isSquared: boolean,
  ): Float32Array;
}

import particleVertexSrc from './shaders/particle.vertex.glsl?raw';
import particleFragmentSrc from './shaders/particle.fragment.glsl?raw';
import triangleVertexSrc from './shaders/triangle.vertex.glsl?raw';
import triangleFragmentSrc from './shaders/triangle.fragment.glsl?raw';

type ParticleUniforms =
  | 'uPointSize'
  | 'uReadFromTexture'
  | 'uCoefficients'
  | 'uOpacity'
  | 'uColor';
type TriangleUniforms = 'uBackground';

export class ParticleSystem {
  positionBuffer?: WebGLBuffer;
  triangleBuffer?: WebGLBuffer;
  cachedBackgroundColor: { r: number; g: number; b: number } | null = null;
  startTime = Date.now();

  glContext: WebGL2RenderingContext;
  config: AppConfig;
  triangles = new Float32Array([-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1]);
  particlesNum: number;
  wasmModule: WasmModule;

  particleProgram: GlProgram<ParticleUniforms> | null = null;
  triangleProgram: GlProgram<TriangleUniforms> | null = null;

  constructor(glContext: WebGL2RenderingContext, wasmModule: WasmModule) {
    this.wasmModule = wasmModule;
    this.glContext = glContext;

    this.config = getDefaultAppConfig(this);
    this.particlesNum = this.config.values.particlesNum as number;

    this.setupGl();
    this.setupParticleProgram();

    if (this.config.values.enableMotionBlur) {
      this.setupTriangleProgram();
      this.glContext.bindBuffer(
        this.glContext.ARRAY_BUFFER,
        this.positionBuffer!,
      );
    }

    this.createParticles(this.particlesNum);

    if (this.config.values.enableMotionBlur) {
      this.clearColors(this.config.values.particleColor as string);
    }
  }

  setupGl() {
    this.positionBuffer = this.glContext.createBuffer();
    this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, this.positionBuffer);
    this.glContext.blendFuncSeparate(
      this.glContext.SRC_ALPHA,
      this.glContext.ONE_MINUS_SRC_ALPHA,
      this.glContext.ONE,
      this.glContext.ONE_MINUS_SRC_ALPHA,
    );
    this.glContext.enable(this.glContext.BLEND);
    this.glContext.disable(this.glContext.DEPTH_TEST);
    this.glContext.viewport(
      0,
      0,
      this.glContext.canvas.width,
      this.glContext.canvas.height,
    );
  }

  setupParticleProgram() {
    this.particleProgram = new GlProgram(
      this.glContext,
      particleVertexSrc,
      particleFragmentSrc,
      ['uPointSize', 'uReadFromTexture', 'uCoefficients', 'uOpacity', 'uColor'],
    );

    this.particleProgram.use();

    const posAttr = this.glContext.getAttribLocation(
      this.particleProgram.program,
      'aPosition',
    );
    this.glContext.enableVertexAttribArray(posAttr);
    this.glContext.vertexAttribPointer(
      posAttr,
      2,
      this.glContext.FLOAT,
      false,
      2 * Float32Array.BYTES_PER_ELEMENT,
      0,
    );

    const { uPointSize, uOpacity, uColor, uCoefficients } =
      this.particleProgram.uniforms;

    this.glContext.uniform1f(
      uPointSize,
      this.config.values.particleSize as number,
    );
    this.glContext.uniform1f(
      uOpacity,
      this.config.values.particleOpacity as number,
    );

    const colorRgb = hexToRgb(this.config.values.particleColor as string);
    if (colorRgb) {
      this.glContext.uniform3f(uColor, colorRgb.r, colorRgb.g, colorRgb.b);
    }

    this.glContext.uniform3f(uCoefficients, 1, 1, 1);
  }

  setupTriangleProgram() {
    this.triangleProgram = new GlProgram(
      this.glContext,
      triangleVertexSrc,
      triangleFragmentSrc,
      ['uBackground'],
    );

    this.triangleProgram.use();

    this.triangleBuffer = this.glContext.createBuffer()!;
    this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, this.triangleBuffer);
    this.glContext.bufferData(
      this.glContext.ARRAY_BUFFER,
      this.triangles,
      this.glContext.STATIC_DRAW,
    );

    const posAttr = this.glContext.getAttribLocation(
      this.triangleProgram.program,
      'aPosition',
    );
    this.glContext.vertexAttribPointer(
      posAttr,
      2,
      this.glContext.FLOAT,
      false,
      0,
      0,
    );
    this.glContext.enableVertexAttribArray(posAttr);

    this.cachedBackgroundColor = hexToRgb(
      this.config.values.backgroundColor as string,
    );
    if (this.cachedBackgroundColor) {
      this.glContext.uniform3f(
        this.triangleProgram.uniforms.uBackground,
        this.cachedBackgroundColor.r,
        this.cachedBackgroundColor.g,
        this.cachedBackgroundColor.b,
      );
    }
  }

  createParticles(N: number) {
    this.wasmModule.createParticles(
      N,
      this.glContext.canvas.width / 2,
      this.glContext.canvas.height / 2,
      this.config.values.spawnRadius as number,
      0.01,
    );
    this.particlesNum = N;
    this.glContext.clear(
      this.glContext.COLOR_BUFFER_BIT | this.glContext.DEPTH_BUFFER_BIT,
    );
  }

  drawTriangles() {
    if (!this.triangleProgram) {
      return;
    }

    this.triangleProgram.use();
    this.glContext.drawArrays(this.glContext.TRIANGLES, 0, 6);
  }

  clearColors(color: string) {
    const colorRgb = hexToRgb(color);
    if (!colorRgb) {
      return;
    }
    this.glContext.clearColor(colorRgb.r, colorRgb.g, colorRgb.b, 1);
    this.glContext.clear(this.glContext.COLOR_BUFFER_BIT);
    for (let i = 0; i < 40; i++) {
      this.drawTriangles();
    }
  }

  loadImage(image: TexImageSource) {
    if (!this.particleProgram) {
      return;
    }

    this.glContext.useProgram(this.particleProgram.program);
    const imageLocation = this.glContext.getUniformLocation(
      this.particleProgram.program,
      'uImage',
    );
    const texture = this.glContext.createTexture();
    this.glContext.activeTexture(this.glContext.TEXTURE0);
    this.glContext.bindTexture(this.glContext.TEXTURE_2D, texture);
    this.glContext.texParameteri(
      this.glContext.TEXTURE_2D,
      this.glContext.TEXTURE_WRAP_S,
      this.glContext.CLAMP_TO_EDGE,
    );
    this.glContext.texParameteri(
      this.glContext.TEXTURE_2D,
      this.glContext.TEXTURE_WRAP_T,
      this.glContext.CLAMP_TO_EDGE,
    );
    this.glContext.texParameteri(
      this.glContext.TEXTURE_2D,
      this.glContext.TEXTURE_MIN_FILTER,
      this.glContext.NEAREST,
    );
    this.glContext.texParameteri(
      this.glContext.TEXTURE_2D,
      this.glContext.TEXTURE_MAG_FILTER,
      this.glContext.NEAREST,
    );
    this.glContext.texImage2D(
      this.glContext.TEXTURE_2D,
      0,
      this.glContext.RGBA,
      this.glContext.RGBA,
      this.glContext.UNSIGNED_BYTE,
      image,
    );
    this.glContext.uniform1i(imageLocation, 0);
  }

  respawn() {
    this.wasmModule.respawn(
      this.glContext.canvas.width / 2,
      this.glContext.canvas.height / 2,
      this.config.values.spawnRadius as number,
      0.01,
    );
  }

  spawnRing() {
    this.wasmModule.spawnEmpty(
      this.glContext.canvas.width / 2,
      this.glContext.canvas.height / 2,
      this.config.values.spawnRadius as number,
      10,
      5,
    );
  }

  explodeAt(x: number, y: number) {
    this.wasmModule.explosion(x, y, 5);
  }

  freeze() {
    this.wasmModule.stop();
  }

  createHeavyParticles(num: number) {
    this.wasmModule.createHeavyParticles(
      num,
      this.glContext.canvas.width,
      this.glContext.canvas.height,
    );
  }

  deleteHeavyParticles() {
    this.wasmModule.deleteHeavyParticles();
  }

  render(forceCenter?: Vector2) {
    let deltaTime = (Date.now() - this.startTime) / 1000;

    if (deltaTime === 0) {
      deltaTime = 0.001;
    }

    if (deltaTime > 1 / 6) {
      deltaTime = 1 / 60;
    }

    this.startTime = Date.now();

    if (this.config.values.enableMotionBlur) {
      this.drawTriangles();
      this.glContext.useProgram(this.particleProgram?.program ?? null);
    } else {
      if (this.cachedBackgroundColor) {
        this.glContext.clearColor(
          this.cachedBackgroundColor.r,
          this.cachedBackgroundColor.g,
          this.cachedBackgroundColor.b,
          1.0,
        );
      }
      this.glContext.clear(this.glContext.COLOR_BUFFER_BIT);
    }

    const particlesCoordinates = this.wasmModule.calcCoordinates(
      this.glContext.canvas.width,
      this.glContext.canvas.height,
      this.config.values.particleSize as number,
      !!forceCenter,
      forceCenter?.x ?? 0,
      forceCenter?.y ?? 0,
      deltaTime,
      Boolean(this.config.values.bounceX),
      Boolean(this.config.values.bounceY),
      Boolean(this.config.values.squared),
    );

    if (!particlesCoordinates) {
      return;
    }

    if (this.config.values.enableMotionBlur) {
      this.glContext.bindVertexArray(this.particleProgram?.vao ?? null);
    }

    this.glContext.bufferData(
      this.glContext.ARRAY_BUFFER,
      particlesCoordinates,
      this.glContext.DYNAMIC_DRAW,
    );
    this.glContext.drawArrays(this.glContext.POINTS, 0, this.particlesNum);

    if (this.config.values.party) {
      const t = Date.now() / 250;
      const s = Math.sin(t);
      this.glContext.uniform3f(
        this.particleProgram?.uniforms.uCoefficients ?? null,
        (s + 1) / 4 + 1 / 4,
        (-s + 1) / 4 + 1 / 4,
        (-Math.cos(t) + 1) / 4 + 1 / 4,
      );
    }
  }

  onImageUpload(file: Blob) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => this.loadImage(img);
      img.src = (event.target?.result as string) ?? '';
    };
    reader.readAsDataURL(file);
  }

  destroy() {
    this.config.gui.destroy();
    this.particleProgram?.destroy();
    this.triangleProgram?.destroy();
    this.glContext.deleteBuffer(this.positionBuffer ?? null);
    this.glContext.deleteBuffer(this.triangleBuffer ?? null);
  }
}

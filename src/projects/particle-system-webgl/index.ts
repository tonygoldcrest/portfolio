import {
  createShader,
  createProgram,
  hexToRgb,
  getDefaultAppConfig,
} from './helpers.js';
import { Vector2 } from './classes.js';
import type { MainModule } from './wasm.js';

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

export class ParticleSystem {
  particleProgram: WebGLProgram | null = null;
  positionBuffer?: WebGLBuffer;
  triangleBuffer?: WebGLBuffer;
  triangleProgram: WebGLProgram | null = null;
  cachedBackgroundColor: { r: number; g: number; b: number } | null = null;
  particlePositionAttributeLocation?: GLint;
  trianglePositionAttributeLocation?: GLint;
  pointSizeLocation?: WebGLUniformLocation | null = null;
  particleColorLocation: WebGLUniformLocation | null = null;
  coefficientsLocation: WebGLUniformLocation | null = null;
  particleOpacityLocation: WebGLUniformLocation | null = null;
  backgroundColorLocation: WebGLUniformLocation | null = null;
  readFromTextureLocation: WebGLUniformLocation | null = null;
  particlesVao: WebGLVertexArrayObject | null = null;
  trianglesVao: WebGLVertexArrayObject | null = null;
  startTime = Date.now();

  glContext: WebGL2RenderingContext;
  config = getDefaultAppConfig(this);
  triangles = new Float32Array([-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1]);
  particlesNum = this.config.values.particlesNum as number;
  wasmModule: WasmModule;

  constructor(glContext: WebGL2RenderingContext, wasmModule: WasmModule) {
    this.wasmModule = wasmModule;

    this.glContext = glContext;

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
    if (!this.triangleProgram || !this.trianglesVao) {
      return;
    }

    this.glContext.useProgram(this.triangleProgram);
    this.glContext.bindVertexArray(this.trianglesVao);
    this.glContext.drawArrays(this.glContext.TRIANGLES, 0, 6);
  }

  clearColors(color: string) {
    const colorRgb = hexToRgb(color);
    if (!colorRgb) {
      return;
    }
    this.glContext.clearColor(colorRgb.r, colorRgb.g, colorRgb.b, 1);
    this.glContext.clear(this.glContext.COLOR_BUFFER_BIT);
    for (let i = 0; i < 40; i++) this.drawTriangles();
  }

  setupParticleProgram() {
    const particleVertexShader = createShader(
      this.glContext,
      this.glContext.VERTEX_SHADER,
      particleVertexSrc,
    );
    const particleFragmentShader = createShader(
      this.glContext,
      this.glContext.FRAGMENT_SHADER,
      particleFragmentSrc,
    );

    if (!particleVertexShader || !particleFragmentShader) {
      return;
    }

    this.particleProgram = createProgram(
      this.glContext,
      particleVertexShader,
      particleFragmentShader,
    );

    if (!this.particleProgram) {
      return;
    }

    this.pointSizeLocation = this.glContext.getUniformLocation(
      this.particleProgram,
      'uPointSize',
    );
    this.readFromTextureLocation = this.glContext.getUniformLocation(
      this.particleProgram,
      'uReadFromTexture',
    );
    this.coefficientsLocation = this.glContext.getUniformLocation(
      this.particleProgram,
      'uCoefficients',
    );
    this.particleOpacityLocation = this.glContext.getUniformLocation(
      this.particleProgram,
      'uOpacity',
    );
    this.particleColorLocation = this.glContext.getUniformLocation(
      this.particleProgram,
      'uColor',
    );

    this.particlesVao = this.glContext.createVertexArray();
    this.glContext.bindVertexArray(this.particlesVao);

    this.particlePositionAttributeLocation = this.glContext.getAttribLocation(
      this.particleProgram,
      'aPosition',
    );
    this.glContext.enableVertexAttribArray(
      this.particlePositionAttributeLocation,
    );
    this.glContext.vertexAttribPointer(
      this.particlePositionAttributeLocation,
      2,
      this.glContext.FLOAT,
      false,
      2 * Float32Array.BYTES_PER_ELEMENT,
      0,
    );

    this.glContext.useProgram(this.particleProgram);
    this.glContext.uniform1f(
      this.pointSizeLocation,
      this.config.values.particleSize as number,
    );
    this.glContext.uniform1f(
      this.particleOpacityLocation,
      this.config.values.particleOpacity as number,
    );
    const particleColorRgb = hexToRgb(
      this.config.values.particleColor as string,
    );
    if (particleColorRgb) {
      this.glContext.uniform3f(
        this.particleColorLocation,
        particleColorRgb.r,
        particleColorRgb.g,
        particleColorRgb.b,
      );
    }
    this.glContext.uniform3f(this.coefficientsLocation, 1, 1, 1);
  }

  loadImage(image: TexImageSource) {
    if (!this.particleProgram) {
      return;
    }
    this.glContext.useProgram(this.particleProgram);
    const imageLocation = this.glContext.getUniformLocation(
      this.particleProgram,
      'uImage',
    );
    const texture = this.glContext.createTexture();
    this.glContext.activeTexture(this.glContext.TEXTURE0 + 0);
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

  setupTriangleProgram() {
    const triangleVertexShader = createShader(
      this.glContext,
      this.glContext.VERTEX_SHADER,
      triangleVertexSrc,
    );
    const triangleFragmentShader = createShader(
      this.glContext,
      this.glContext.FRAGMENT_SHADER,
      triangleFragmentSrc,
    );
    if (!triangleVertexShader || !triangleFragmentShader) {
      return;
    }

    this.triangleProgram = createProgram(
      this.glContext,
      triangleVertexShader,
      triangleFragmentShader,
    );

    if (!this.triangleProgram) {
      return;
    }

    this.glContext.useProgram(this.triangleProgram);

    this.trianglesVao = this.glContext.createVertexArray();
    this.glContext.bindVertexArray(this.trianglesVao);

    this.triangleBuffer = this.glContext.createBuffer()!;
    this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, this.triangleBuffer);
    this.glContext.bufferData(
      this.glContext.ARRAY_BUFFER,
      this.triangles,
      this.glContext.STATIC_DRAW,
    );

    this.backgroundColorLocation = this.glContext.getUniformLocation(
      this.triangleProgram,
      'uBackground',
    );
    this.trianglePositionAttributeLocation = this.glContext.getAttribLocation(
      this.triangleProgram,
      'aPosition',
    );
    this.glContext.vertexAttribPointer(
      this.trianglePositionAttributeLocation,
      2,
      this.glContext.FLOAT,
      false,
      0,
      0,
    );
    this.glContext.enableVertexAttribArray(
      this.trianglePositionAttributeLocation,
    );
    this.glContext.bufferData(
      this.glContext.ARRAY_BUFFER,
      this.triangles,
      this.glContext.STATIC_DRAW,
    );

    this.cachedBackgroundColor = hexToRgb(
      this.config.values.backgroundColor as string,
    );
    if (this.cachedBackgroundColor) {
      this.glContext.uniform3f(
        this.backgroundColorLocation,
        this.cachedBackgroundColor.r,
        this.cachedBackgroundColor.g,
        this.cachedBackgroundColor.b,
      );
    }
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
    if (deltaTime === 0) deltaTime = 0.001;
    if (deltaTime > 1 / 6) deltaTime = 1 / 60;
    this.startTime = Date.now();

    if (this.config.values.enableMotionBlur) {
      this.drawTriangles();
      this.glContext.useProgram(this.particleProgram);
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

    if (this.config.values.enableMotionBlur) {
      this.glContext.bindVertexArray(this.particlesVao);
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
        this.coefficientsLocation,
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
  }
}

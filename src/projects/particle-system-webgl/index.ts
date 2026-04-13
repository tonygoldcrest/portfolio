import Stats from 'stats.js';
import {
  createShader,
  createProgram,
  resizeCanvasToDisplaySize,
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
  particlesCoordinates?: Float32Array;
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
  animFrameId?: number;
  stats!: Stats;
  isMouseDown = false;
  isForceApplied = false;
  mouseDownPosition = new Vector2(0, 0);
  forceCenter = new Vector2(0, 0);
  isPaused = false;
  startTime = Date.now();

  gl!: WebGL2RenderingContext;
  config = getDefaultAppConfig(this);
  triangles = new Float32Array([-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1]);
  particlesNum = this.config.values.particlesNum as number;
  canvas: HTMLCanvasElement;
  Module: WasmModule;

  constructor(canvas: HTMLCanvasElement, Module: WasmModule) {
    this.canvas = canvas;
    this.Module = Module;

    const gl = canvas.getContext('webgl2', {
      preserveDrawingBuffer: this.config.values.enableMotionBlur,
    }) as WebGL2RenderingContext;

    if (!gl) {
      return;
    }

    this.gl = gl;

    this.setupGl();
    this.setupParticleProgram();

    if (this.config.values.enableMotionBlur) {
      this.setupTriangleProgram();

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer!);
    }

    this.stats = new Stats();
    this.stats.showPanel(0);
    this.canvas.parentElement?.appendChild(this.stats.dom);

    this.createParticles(this.particlesNum);

    this.setupEventListeners();
  }

  setupGl() {
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.blendFuncSeparate(
      this.gl.SRC_ALPHA,
      this.gl.ONE_MINUS_SRC_ALPHA,
      this.gl.ONE,
      this.gl.ONE_MINUS_SRC_ALPHA,
    );
    this.gl.enable(this.gl.BLEND);
    this.gl.disable(this.gl.DEPTH_TEST);
    resizeCanvasToDisplaySize(this.gl.canvas as HTMLCanvasElement, 2);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
  }

  createParticles(N: number) {
    this.Module.createParticles(
      N,
      this.gl.canvas.width / 2,
      this.gl.canvas.height / 2,
      this.config.values.spawnRadius as number,
      0.01,
    );
    this.particlesNum = N;
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  drawTriangles() {
    if (!this.triangleProgram || !this.trianglesVao) {
      return;
    }

    this.gl.useProgram(this.triangleProgram);
    this.gl.bindVertexArray(this.trianglesVao);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  clearColors(color: string) {
    const colorRgb = hexToRgb(color);
    if (!colorRgb) {
      return;
    }
    this.gl.clearColor(colorRgb.r, colorRgb.g, colorRgb.b, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    for (let i = 0; i < 40; i++) this.drawTriangles();
  }

  setupParticleProgram() {
    const particleVertexShader = createShader(
      this.gl,
      this.gl.VERTEX_SHADER,
      particleVertexSrc,
    );
    const particleFragmentShader = createShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      particleFragmentSrc,
    );

    if (!particleVertexShader || !particleFragmentShader) {
      return;
    }

    this.particleProgram = createProgram(
      this.gl,
      particleVertexShader,
      particleFragmentShader,
    );

    if (!this.particleProgram) {
      return;
    }

    this.pointSizeLocation = this.gl.getUniformLocation(
      this.particleProgram,
      'uPointSize',
    );
    this.readFromTextureLocation = this.gl.getUniformLocation(
      this.particleProgram,
      'uReadFromTexture',
    );
    this.coefficientsLocation = this.gl.getUniformLocation(
      this.particleProgram,
      'uCoefficients',
    );
    this.particleOpacityLocation = this.gl.getUniformLocation(
      this.particleProgram,
      'uOpacity',
    );
    this.particleColorLocation = this.gl.getUniformLocation(
      this.particleProgram,
      'uColor',
    );

    this.particlesVao = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.particlesVao);

    this.particlePositionAttributeLocation = this.gl.getAttribLocation(
      this.particleProgram,
      'aPosition',
    );
    this.gl.enableVertexAttribArray(this.particlePositionAttributeLocation);
    this.gl.vertexAttribPointer(
      this.particlePositionAttributeLocation,
      2,
      this.gl.FLOAT,
      false,
      2 * Float32Array.BYTES_PER_ELEMENT,
      0,
    );

    this.gl.useProgram(this.particleProgram);
    this.gl.uniform1f(
      this.pointSizeLocation,
      this.config.values.particleSize as number,
    );
    this.gl.uniform1f(
      this.particleOpacityLocation,
      this.config.values.particleOpacity as number,
    );
    const particleColorRgb = hexToRgb(
      this.config.values.particleColor as string,
    );
    if (particleColorRgb) {
      this.gl.uniform3f(
        this.particleColorLocation,
        particleColorRgb.r,
        particleColorRgb.g,
        particleColorRgb.b,
      );
    }
    this.gl.uniform3f(this.coefficientsLocation, 1, 1, 1);
  }

  loadImage(image: TexImageSource) {
    if (!this.particleProgram) {
      return;
    }
    this.gl.useProgram(this.particleProgram);
    const imageLocation = this.gl.getUniformLocation(
      this.particleProgram,
      'uImage',
    );
    const texture = this.gl.createTexture();
    this.gl.activeTexture(this.gl.TEXTURE0 + 0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.NEAREST,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.NEAREST,
    );
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      image,
    );
    this.gl.uniform1i(imageLocation, 0);
  }

  setupTriangleProgram() {
    const triangleVertexShader = createShader(
      this.gl,
      this.gl.VERTEX_SHADER,
      triangleVertexSrc,
    );
    const triangleFragmentShader = createShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      triangleFragmentSrc,
    );
    if (!triangleVertexShader || !triangleFragmentShader) {
      return;
    }

    this.triangleProgram = createProgram(
      this.gl,
      triangleVertexShader,
      triangleFragmentShader,
    );

    if (!this.triangleProgram) {
      return;
    }

    this.gl.useProgram(this.triangleProgram);

    this.trianglesVao = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.trianglesVao);

    this.triangleBuffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.triangleBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.triangles,
      this.gl.STATIC_DRAW,
    );

    this.backgroundColorLocation = this.gl.getUniformLocation(
      this.triangleProgram,
      'uBackground',
    );
    this.trianglePositionAttributeLocation = this.gl.getAttribLocation(
      this.triangleProgram,
      'aPosition',
    );
    this.gl.vertexAttribPointer(
      this.trianglePositionAttributeLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0,
    );
    this.gl.enableVertexAttribArray(this.trianglePositionAttributeLocation);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.triangles,
      this.gl.STATIC_DRAW,
    );

    this.cachedBackgroundColor = hexToRgb(
      this.config.values.backgroundColor as string,
    );
    if (this.cachedBackgroundColor) {
      this.gl.uniform3f(
        this.backgroundColorLocation,
        this.cachedBackgroundColor.r,
        this.cachedBackgroundColor.g,
        this.cachedBackgroundColor.b,
      );
    }
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', (evt) => {
      this.isMouseDown = true;
      this.mouseDownPosition = new Vector2(
        this.gl.canvas.width * (evt.x / this.canvas.clientWidth),
        this.gl.canvas.height -
          this.gl.canvas.height * (evt.y / this.canvas.clientHeight),
      );
      this.forceCenter = this.mouseDownPosition;
      this.isForceApplied = true;
    });

    this.canvas.addEventListener('mousemove', (evt) => {
      this.mouseDownPosition = new Vector2(
        this.gl.canvas.width * (evt.x / this.canvas.clientWidth),
        this.gl.canvas.height -
          this.gl.canvas.height * (evt.y / this.canvas.clientHeight),
      );
      if (this.isMouseDown) this.forceCenter = this.mouseDownPosition;
    });

    document.addEventListener('mouseup', () => {
      this.isMouseDown = false;
      this.isForceApplied = false;
    });

    document.addEventListener('keydown', (evt) => {
      if (document.activeElement?.getAttribute('type') === 'text') return;

      if (evt.key === 'c') {
        if (!this.isForceApplied) {
          this.forceCenter = new Vector2(
            this.gl.canvas.width / 2,
            this.gl.canvas.height / 2,
          );
          this.isForceApplied = true;
        }
      } else if (evt.key === 'X') {
        this.Module.explosion(
          this.mouseDownPosition.x,
          this.mouseDownPosition.y,
          5,
        );
      } else if (evt.key === 'x') {
        this.Module.explosion(
          this.gl.canvas.width / 2,
          this.gl.canvas.height / 2,
          5,
        );
      } else if (evt.key === 'r') {
        this.Module.respawn(
          this.gl.canvas.width / 2,
          this.gl.canvas.height / 2,
          this.config.values.spawnRadius as number,
          0.01,
        );
      } else if (evt.key === 'e') {
        this.Module.spawnEmpty(
          this.gl.canvas.width / 2,
          this.gl.canvas.height / 2,
          this.config.values.spawnRadius as number,
          10,
          5,
        );
      } else if (evt.key === 's') {
        this.Module.stop();
      } else if (evt.key === 'p') {
        this.isPaused = !this.isPaused;
        if (!this.isPaused)
          this.animFrameId = requestAnimationFrame(this.render.bind(this));
      } else if (evt.key === 'd') {
        this.Module.deleteHeavyParticles();
      } else if (parseInt(evt.key)) {
        this.Module.createHeavyParticles(
          parseInt(evt.key),
          this.gl.canvas.width,
          this.gl.canvas.height,
        );
      }
    });

    document.addEventListener('keyup', (evt) => {
      if (document.activeElement?.getAttribute('type') === 'text') return;
      if (evt.key === 'c') this.isForceApplied = false;
    });

    if (this.config.values.enableMotionBlur) {
      this.clearColors(this.config.values.particleColor as string);
    }
  }

  render() {
    this.stats.begin();

    let deltaTime = (Date.now() - this.startTime) / 1000;
    if (deltaTime === 0) deltaTime = 0.001;
    if (deltaTime > 1 / 6) deltaTime = 1 / 60;
    this.startTime = Date.now();

    if (this.config.values.enableMotionBlur) {
      this.drawTriangles();
      this.gl.useProgram(this.particleProgram);
    } else {
      if (this.cachedBackgroundColor) {
        this.gl.clearColor(
          this.cachedBackgroundColor.r,
          this.cachedBackgroundColor.g,
          this.cachedBackgroundColor.b,
          1.0,
        );
      }
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    this.particlesCoordinates = this.Module.calcCoordinates(
      this.gl.canvas.width,
      this.gl.canvas.height,
      this.config.values.particleSize as number,
      this.isForceApplied,
      this.forceCenter.x,
      this.forceCenter.y,
      deltaTime,
      Boolean(this.config.values.bounceX),
      Boolean(this.config.values.bounceY),
      Boolean(this.config.values.squared),
    );

    if (this.config.values.enableMotionBlur) {
      this.gl.bindVertexArray(this.particlesVao);
    }

    if (!this.particlesCoordinates) {
      return;
    }

    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.particlesCoordinates,
      this.gl.DYNAMIC_DRAW,
    );
    this.gl.drawArrays(this.gl.POINTS, 0, this.particlesNum);

    if (this.config.values.party) {
      const t = Date.now() / 250;
      const s = Math.sin(t);
      this.gl.uniform3f(
        this.coefficientsLocation,
        (s + 1) / 4 + 1 / 4,
        (-s + 1) / 4 + 1 / 4,
        (-Math.cos(t) + 1) / 4 + 1 / 4,
      );
    }

    this.stats.end();

    if (!this.isPaused) {
      this.animFrameId = requestAnimationFrame(this.render.bind(this));
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
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.config.gui.destroy();
  }
}

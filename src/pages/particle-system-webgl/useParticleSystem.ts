import Stats from 'stats.js';
import { useCallback, useEffect, useRef } from 'react';
import { useControls } from 'leva';
import {
  ParticleSystem,
  type WasmModule,
} from '@/projects/particle-system-webgl/index.js';
import { resizeCanvasToDisplaySize } from '@/projects/particle-system-webgl/helpers';
import { Vector2 } from '@/projects/particle-system-webgl/classes';

declare global {
  interface Window {
    Module: Partial<WasmModule>;
  }
}

let moduleReady: Promise<WasmModule> | null = null;

function loadWasm() {
  if (!moduleReady) {
    moduleReady = new Promise((resolve) => {
      window.Module = {
        locateFile: (path: string) => `/wasm/particle-system/${path}`,
        onRuntimeInitialized() {
          resolve(window.Module as WasmModule);
        },
      };
      const script = document.createElement('script');
      script.src = '/wasm/particle-system/wasm.js';
      document.head.appendChild(script);
    });
  }
  return moduleReady;
}

export function useParticleSystem() {
  const {
    particlesNum,
    bounceX,
    bounceY,
    squared,
    enableMotionBlur,
    party,
    image,
    particleSize,
    spawnRadius,
    particleOpacity,
    particleColor,
    backgroundColor,
  } = useControls({
    particlesNum: {
      label: 'Particles',
      value: 1_000_000,
      options: {
        UltraLow: 1_000,
        SuperLow: 4_000,
        VeryLow: 7_000,
        Low: 10_000,
        Medium: 50_000,
        High: 100_000,
        VeryHigh: 500_000,
        Ultra: 1_000_000,
        Mega: 2_000_000,
        Duper: 3_000_000,
        Nightmare: 4_000_000,
        UltraNightmare: 5_000_000,
      },
    },
    particleSize: { value: 2, min: 1, max: 100, step: 1 },
    particleOpacity: { value: 0.5, min: 0, max: 1, step: 0.01 },
    spawnRadius: { value: 200, min: 20, max: 500 },
    particleColor: '#1e272e',
    backgroundColor: '#ecf0f1',
    bounceX: true,
    bounceY: true,
    squared: true,
    enableMotionBlur: true,
    party: false,
    image: false,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<ParticleSystem | null>(null);
  const rafRef = useRef<number>(null);

  const statsRef = useRef<Stats>(null!);
  if (!statsRef.current) {
    statsRef.current = new Stats();
  }

  const forceCenterRef = useRef<Vector2 | undefined>(undefined);
  const mousePositionRef = useRef<Vector2 | undefined>(undefined);
  const isPausedRef = useRef(false);

  const renderFrame = useCallback(function renderFrame() {
    if (!appRef.current) {
      return;
    }

    statsRef.current?.begin();
    appRef.current.render(forceCenterRef.current);
    statsRef.current?.end();

    if (!isPausedRef.current) {
      rafRef.current = requestAnimationFrame(renderFrame);
    }
  }, []);

  const mouseMoveHandler = useCallback((evt: MouseEvent) => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;

    mousePositionRef.current = new Vector2(
      canvas.width * (evt.x / canvas.clientWidth),
      canvas.height - canvas.height * (evt.y / canvas.clientHeight),
    );
  }, []);

  const mouseDownMoveHandler = useCallback((evt: MouseEvent) => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;

    forceCenterRef.current = new Vector2(
      canvas.width * (evt.x / canvas.clientWidth),
      canvas.height - canvas.height * (evt.y / canvas.clientHeight),
    );
  }, []);

  const mouseDownHandler = useCallback(
    (evt: MouseEvent) => {
      if (!canvasRef.current) {
        return;
      }

      const canvas = canvasRef.current;

      forceCenterRef.current = new Vector2(
        canvas.width * (evt.x / canvas.clientWidth),
        canvas.height - canvas.height * (evt.y / canvas.clientHeight),
      );

      canvas.addEventListener('mousemove', mouseDownMoveHandler);
    },
    [mouseDownMoveHandler],
  );

  const mouseUpHandler = useCallback(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;

    canvas.removeEventListener('mousemove', mouseDownMoveHandler);
    forceCenterRef.current = undefined;
  }, [mouseDownMoveHandler]);

  const keydownHandler = useCallback(
    (evt: KeyboardEvent) => {
      if (!canvasRef.current || !appRef.current) {
        return;
      }

      const canvas = canvasRef.current;
      const app = appRef.current;

      if (document.activeElement?.getAttribute('type') === 'text') {
        return;
      }

      if (evt.key === 'c') {
        forceCenterRef.current = new Vector2(
          canvas.width / 2,
          canvas.height / 2,
        );
      } else if (evt.key === 'X') {
        if (mousePositionRef.current) {
          app.explodeAt(mousePositionRef.current.x, mousePositionRef.current.y);
        }
      } else if (evt.key === 'x') {
        app.explodeAt(canvas.width / 2, canvas.height / 2);
      } else if (evt.key === 'r') {
        app.respawn();
      } else if (evt.key === 'e') {
        app.spawnRing();
      } else if (evt.key === 's') {
        app.freeze();
      } else if (evt.key === 'p') {
        isPausedRef.current = !isPausedRef.current;
        if (!isPausedRef.current) {
          rafRef.current = requestAnimationFrame(renderFrame);
        }
      } else if (evt.key === 'd') {
        app.deleteHeavyParticles();
      } else if (parseInt(evt.key)) {
        app.createHeavyParticles(parseInt(evt.key));
      }
    },
    [renderFrame],
  );

  const keyupHandler = useCallback((evt: KeyboardEvent) => {
    if (document.activeElement?.getAttribute('type') === 'text') {
      return;
    }

    if (evt.key === 'c') {
      forceCenterRef.current = undefined;
    }
  }, []);

  const setupEventListeners = useCallback(() => {
    if (!canvasRef.current || !appRef.current) {
      return;
    }

    const canvas = canvasRef.current;

    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('mousedown', mouseDownHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('keyup', keyupHandler);
  }, [
    mouseMoveHandler,
    mouseDownHandler,
    mouseUpHandler,
    keydownHandler,
    keyupHandler,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let cancelled = false;

    async function boot() {
      const wasmModule = await loadWasm();

      if (cancelled || !canvas) {
        return;
      }

      const glContext = canvas.getContext('webgl2', {
        preserveDrawingBuffer: true,
      }) as WebGL2RenderingContext;

      if (!glContext) {
        return;
      }

      resizeCanvasToDisplaySize(canvas, 2);
      statsRef.current.showPanel(0);
      canvas.parentElement?.appendChild(statsRef.current.dom);

      appRef.current = new ParticleSystem(glContext, wasmModule);

      setupEventListeners();

      rafRef.current = requestAnimationFrame(renderFrame);
    }

    boot();

    return () => {
      cancelled = true;
      appRef.current?.destroy();
      appRef.current = null;
      statsRef.current.dom.remove();

      canvas.removeEventListener('mousemove', mouseMoveHandler);
      canvas.removeEventListener('mousedown', mouseDownHandler);
      canvas.removeEventListener('mousemove', mouseDownMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      document.removeEventListener('keydown', keydownHandler);
      document.removeEventListener('keyup', keyupHandler);

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    setupEventListeners,
    mouseMoveHandler,
    mouseDownHandler,
    mouseDownMoveHandler,
    mouseUpHandler,
    keydownHandler,
    keyupHandler,
    renderFrame,
  ]);

  useEffect(() => {
    appRef.current?.createParticles(particlesNum);
  }, [particlesNum]);

  useEffect(() => {
    appRef.current?.setParticleSize(particleSize);
  }, [particleSize]);

  useEffect(() => {
    appRef.current?.setParticleOpacity(particleOpacity);
  }, [particleOpacity]);

  useEffect(() => {
    appRef.current?.setParticleColor(particleColor);
  }, [particleColor]);

  useEffect(() => {
    appRef.current?.setBackgroundColor(backgroundColor);
  }, [backgroundColor]);

  useEffect(() => {
    appRef.current?.setReadFromTexture(image);
  }, [image]);

  useEffect(() => {
    appRef.current?.setPartyMode(party);
  }, [party]);

  useEffect(() => {
    appRef.current?.setMotionBlur(enableMotionBlur);
  }, [enableMotionBlur]);

  useEffect(() => {
    if (appRef.current) {
      appRef.current.bounceX = bounceX;
    }
  }, [bounceX]);

  useEffect(() => {
    if (appRef.current) {
      appRef.current.bounceY = bounceY;
    }
  }, [bounceY]);

  useEffect(() => {
    if (appRef.current) {
      appRef.current.squared = squared;
    }
  }, [squared]);

  useEffect(() => {
    if (appRef.current) {
      appRef.current.spawnRadius = spawnRadius;
    }
  }, [spawnRadius]);

  function saveScreenshot() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const link = document.createElement('a');
    link.download = 'particle-system-screenshot.png';
    link.href = canvas
      .toDataURL('image/png')
      .replace(/^data:image\/png/, 'data:application/octet-stream');
    link.click();
  }

  function onImageUpload(file: File) {
    appRef.current?.onImageUpload(file);
  }

  return { canvasRef, saveScreenshot, onImageUpload };
}

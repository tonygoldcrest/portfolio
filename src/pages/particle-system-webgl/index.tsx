import Stats from 'stats.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faFileImage } from '@fortawesome/free-solid-svg-icons';
import styles from './particle-system-webgl.module.css';
import {
  ParticleSystem,
  type WasmModule,
} from '@/projects/particle-system-webgl/index.js';
import { resizeCanvasToDisplaySize } from '@/projects/particle-system-webgl/helpers';
import { Vector2 } from '@/projects/particle-system-webgl/classes';

const HOTKEYS = [
  { key: 'x', description: 'Explosion at the center of the screen' },
  { key: 'X', description: 'Explosion at the current mouse position' },
  { key: 'r', description: 'Respawn a filled circle of particles' },
  { key: 'e', description: 'Respawn an empty circle of particles' },
  {
    key: '1–9',
    description:
      'Spawn N heavy particles in an N-polygon shape that all particles fly towards',
  },
  { key: 'd', description: 'Delete all heavy particles' },
  { key: 'c', description: 'Hold to drag all particles towards the center' },
  { key: 'LMB', description: 'Hold to drag all particles towards the cursor' },
  { key: 'p', description: 'Pause (preserves motion blur for screenshots)' },
  { key: 's', description: 'Stop particles by zeroing their velocities' },
];

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

export default function ParticleSystemWebGL() {
  const forceCenterRef = useRef<Vector2 | undefined>(undefined);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<ParticleSystem | null>(null);
  const rafRef = useRef<number>(null);
  const statsRef = useRef(new Stats());

  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);

  function mouseMoveHandler(evt: MouseEvent) {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;

    forceCenterRef.current = new Vector2(
      canvas.width * (evt.x / canvas.clientWidth),
      canvas.height - canvas.height * (evt.y / canvas.clientHeight),
    );
  }

  const mouseDownHandler = useCallback((evt: MouseEvent) => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;

    forceCenterRef.current = new Vector2(
      canvas.width * (evt.x / canvas.clientWidth),
      canvas.height - canvas.height * (evt.y / canvas.clientHeight),
    );

    canvas.addEventListener('mousemove', mouseMoveHandler);
  }, []);

  const mouseUpHandler = useCallback(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;

    canvas.removeEventListener('mousemove', mouseMoveHandler);
    forceCenterRef.current = undefined;
  }, []);

  const keydownHandler = useCallback((evt: KeyboardEvent) => {
    if (!canvasRef.current || !appRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const app = appRef.current;

    if (document.activeElement?.getAttribute('type') === 'text') return;

    if (evt.key === 'c') {
      forceCenterRef.current = new Vector2(canvas.width / 2, canvas.height / 2);
    } else if (evt.key === 'X') {
      // app.explodeAt(app.mouseDownPosition.x, app.mouseDownPosition.y);
    } else if (evt.key === 'x') {
      app.explodeAt(canvas.width / 2, canvas.height / 2);
    } else if (evt.key === 'r') {
      app.respawn();
    } else if (evt.key === 'e') {
      app.spawnRing();
    } else if (evt.key === 's') {
      app.freeze();
    } else if (evt.key === 'p') {
      // pause
      // app.isPaused = !app.isPaused;
      // if (!app.isPaused)
      //   app.animFrameId = requestAnimationFrame(app.render.bind(app));
    } else if (evt.key === 'd') {
      app.deleteHeavyParticles();
    } else if (parseInt(evt.key)) {
      app.createHeavyParticles(parseInt(evt.key));
    }
  }, []);

  const keyupHandler = useCallback((evt: KeyboardEvent) => {
    if (document.activeElement?.getAttribute('type') === 'text') return;

    if (evt.key === 'c') {
      forceCenterRef.current = undefined;
    }
  }, []);

  const setupEventListeners = useCallback(() => {
    if (!canvasRef.current || !appRef.current) {
      return;
    }

    const canvas = canvasRef.current;

    canvas.addEventListener('mousedown', mouseDownHandler);

    document.addEventListener('mouseup', mouseUpHandler);

    document.addEventListener('keydown', keydownHandler);

    document.addEventListener('keyup', keyupHandler);
  }, [mouseDownHandler, mouseUpHandler, keydownHandler, keyupHandler]);

  const renderFrame = useCallback(function renderFrame() {
    if (!appRef.current) {
      return;
    }

    statsRef.current.begin();
    appRef.current.render(forceCenterRef.current);
    statsRef.current.end();

    rafRef.current = requestAnimationFrame(renderFrame);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

      canvas.removeEventListener('mousedown', mouseDownHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      document.removeEventListener('keydown', keydownHandler);
      document.removeEventListener('keyup', keyupHandler);

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    setupEventListeners,
    mouseDownHandler,
    mouseUpHandler,
    keydownHandler,
    keyupHandler,
    renderFrame,
  ]);

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

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />

      <div
        className={`${styles.cheatsheet} ${cheatsheetOpen ? '' : styles.cheatsheetHidden}`}
      >
        <button
          className={styles.cheatsheetToggle}
          onClick={() => setCheatsheetOpen((o) => !o)}
        >
          {cheatsheetOpen ? 'Close cheatsheet' : 'Open cheatsheet'}
        </button>
        <div className={styles.hotkeysList}>
          {HOTKEYS.map(({ key, description }) => (
            <div key={key}>
              <div className={styles.hotkey}>{key}</div>
              <div className={styles.hotkeyDescription}>{description}</div>
              <div className={styles.hotkeySeparator} />
            </div>
          ))}
        </div>
      </div>

      <button
        className={`${styles.iconButton} ${styles.screenshotButton}`}
        onClick={saveScreenshot}
        title="Take a screenshot"
      >
        <FontAwesomeIcon icon={faCamera} />
      </button>

      <label
        className={`${styles.iconButton} ${styles.uploadButton}`}
        title="Upload image"
      >
        <FontAwesomeIcon icon={faFileImage} />
        <input
          type="file"
          accept="image/*"
          className={styles.fileInput}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) appRef.current?.onImageUpload(file);
          }}
        />
      </label>
    </div>
  );
}

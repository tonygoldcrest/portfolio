import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faFileImage } from '@fortawesome/free-solid-svg-icons';
import styles from './particle-system-webgl.module.css';
import { useParticleSystem } from './useParticleSystem';

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

export default function ParticleSystemWebGL() {
  const { canvasRef, saveScreenshot, onImageUpload } = useParticleSystem();
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);

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
            if (file) {
              onImageUpload(file);
            }
          }}
        />
      </label>
    </div>
  );
}

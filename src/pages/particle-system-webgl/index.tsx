import { Fragment } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCamera,
  faChevronUp,
  faFileImage,
} from '@fortawesome/free-solid-svg-icons';
import styles from './particle-system-webgl.module.css';
import { useParticleSystem } from './useParticleSystem';
import { Accordion, Button, Kbd } from '@heroui/react';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

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

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />

      <Accordion className="absolute bottom-3 left-5 w-80" variant="surface">
        <Accordion.Item>
          <Accordion.Heading>
            <Accordion.Trigger>
              Hotkeys
              <Accordion.Indicator>
                <FontAwesomeIcon icon={faChevronUp} />
              </Accordion.Indicator>
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body className="grid grid-cols-[max-content_1fr] gap-x-2 divide-y items-center">
              {HOTKEYS.map(({ key, description }) => (
                <Fragment key={key}>
                  <Kbd className="justify-self-center">{key}</Kbd>
                  <span className="text-sm py-1">{description}</span>
                </Fragment>
              ))}
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <div className="flex gap-1 absolute bottom-3 right-5">
        <Button isIconOnly variant="tertiary" onPress={saveScreenshot}>
          <FontAwesomeIcon icon={faCamera} />
        </Button>
        <Button
          isIconOnly
          variant="tertiary"
          onPress={() => {
            const input = document.createElement('input');

            input.type = 'file';
            input.accept = 'image/*';

            input.onchange = () => {
              const file = input.files?.[0];
              if (file) {
                onImageUpload(file);
              }
              input.remove();
            };

            input.click();
          }}
        >
          <FontAwesomeIcon icon={faFileImage} />
        </Button>

        <Button
          isIconOnly
          variant="tertiary"
          onPress={() =>
            window.open(
              'https://github.com/tonygoldcrest/portfolio/tree/main/src/pages/particle-system-webgl',
              '_blank',
            )
          }
        >
          <FontAwesomeIcon icon={faGithub} />
        </Button>
      </div>
    </div>
  );
}

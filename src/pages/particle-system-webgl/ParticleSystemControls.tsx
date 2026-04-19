import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp } from '@fortawesome/free-solid-svg-icons';
import {
  Accordion,
  ColorArea,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ListBox,
  Select,
  Slider,
  Switch,
} from '@heroui/react';
import { parseColor } from 'react-aria-components';
import type { ParticleSystemControls as ParticleSystemControlsType } from './types';

const PARTICLES_OPTIONS = [
  { label: 'UltraLow (1k)', value: 1_000 },
  { label: 'SuperLow (4k)', value: 4_000 },
  { label: 'VeryLow (7k)', value: 7_000 },
  { label: 'Low (10k)', value: 10_000 },
  { label: 'Medium (50k)', value: 50_000 },
  { label: 'High (100k)', value: 100_000 },
  { label: 'VeryHigh (500k)', value: 500_000 },
  { label: 'Ultra (1m)', value: 1_000_000 },
  { label: 'Mega (2m)', value: 2_000_000 },
  { label: 'Duper (3m)', value: 3_000_000 },
  { label: 'Nightmare (4m)', value: 4_000_000 },
  { label: 'UltraNightmare (5m)', value: 5_000_000 },
];

interface Props {
  controls: ParticleSystemControlsType;
  setControl: <K extends keyof ParticleSystemControlsType>(
    key: K,
    value: ParticleSystemControlsType[K],
  ) => void;
}

const SLIDERS = [
  { key: 'particleSize', label: 'Particle Size', min: 1, max: 10, step: 1 },
  { key: 'particleOpacity', label: 'Opacity', min: 0, max: 1, step: 0.01 },
  { key: 'spawnRadius', label: 'Spawn Radius', min: 20, max: 500, step: 1 },
] as const;

const COLORS = [
  { key: 'particleColor', label: 'Particles' },
  { key: 'backgroundColor', label: 'Background' },
] as const;

const TOGGLES = [
  { key: 'bounceX', label: 'Bounce X' },
  { key: 'bounceY', label: 'Bounce Y' },
  { key: 'squared', label: 'Squared' },
  { key: 'enableMotionBlur', label: 'Motion Blur' },
  { key: 'party', label: 'Party' },
  { key: 'image', label: 'Image' },
] as const;

export function ParticleSystemControls({ controls, setControl }: Props) {
  return (
    <Accordion
      className="absolute top-3 right-5 w-80"
      variant="surface"
      defaultExpandedKeys={['controls']}
    >
      <Accordion.Item id="controls">
        <Accordion.Heading>
          <Accordion.Trigger>
            Controls
            <Accordion.Indicator>
              <FontAwesomeIcon icon={faChevronUp} />
            </Accordion.Indicator>
          </Accordion.Trigger>
        </Accordion.Heading>

        <Accordion.Panel>
          <Accordion.Body className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm">Number of particles</span>
              <Select
                value={String(controls.particlesNum)}
                onChange={(key) => setControl('particlesNum', Number(key))}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {PARTICLES_OPTIONS.map(({ label, value }) => (
                      <ListBox.Item key={String(value)} id={String(value)}>
                        {label}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            {SLIDERS.map(({ key, label, min, max, step }) => (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span>{label}</span>
                  <span>{controls[key]}</span>
                </div>
                <Slider
                  value={controls[key]}
                  onChange={(v) => setControl(key, v as number)}
                  minValue={min}
                  maxValue={max}
                  step={step}
                >
                  <Slider.Track>
                    <Slider.Fill />
                    <Slider.Thumb />
                  </Slider.Track>
                </Slider>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-y-4 gap-x-2 items-center">
              {COLORS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3 text-sm">
                  <ColorPicker
                    value={parseColor(controls[key])}
                    onChange={(c) => setControl(key, c.toString('hex'))}
                  >
                    <ColorPicker.Trigger aria-label={label}>
                      <ColorSwatch />
                    </ColorPicker.Trigger>
                    <ColorPicker.Popover>
                      <div className="flex flex-col gap-2 p-2">
                        <ColorArea
                          colorSpace="hsb"
                          xChannel="saturation"
                          yChannel="brightness"
                        >
                          <ColorArea.Thumb />
                        </ColorArea>
                        <ColorSlider colorSpace="hsb" channel="hue">
                          <ColorSlider.Track>
                            <ColorSlider.Thumb />
                          </ColorSlider.Track>
                        </ColorSlider>
                      </div>
                    </ColorPicker.Popover>
                  </ColorPicker>
                  {label}
                </div>
              ))}
              {TOGGLES.map(({ key, label }) => (
                <Switch
                  key={key}
                  isSelected={controls[key]}
                  onChange={(v) => setControl(key, v)}
                  size="sm"
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <Switch.Content className="text-sm">{label}</Switch.Content>
                </Switch>
              ))}
            </div>
          </Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}

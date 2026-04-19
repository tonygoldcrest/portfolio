import { Fragment } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Accordion, Kbd } from '@heroui/react';

interface Hotkey {
  key: string;
  description: string;
}

interface Props {
  hotkeys: Hotkey[];
  className?: string;
}

export function HotkeysPanel({ hotkeys, className }: Props) {
  return (
    <Accordion className={className} variant="surface">
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
            {hotkeys.map(({ key, description }) => (
              <Fragment key={key}>
                <Kbd className="justify-self-center">{key}</Kbd>
                <span className="text-sm py-1">{description}</span>
              </Fragment>
            ))}
          </Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}

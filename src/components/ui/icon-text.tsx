import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './icon-text.module.css';
import { cn } from '@/lib/utils';

export type IconTextProps = {
  icon: IconDefinition;
  text: string;
  className?: string;
};

export function IconText({ icon, text, className }: IconTextProps) {
  return (
    <div className={cn(styles.root, className)}>
      <FontAwesomeIcon icon={icon} />
      <span>{text}</span>
    </div>
  );
}

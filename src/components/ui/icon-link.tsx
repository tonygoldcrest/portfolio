import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type {
  IconDefinition,
  SizeProp,
} from '@fortawesome/fontawesome-svg-core';
import { cn } from '@/lib/utils';
import styles from './icon-link.module.css';

export type IconLinkProps = {
  icon: IconDefinition;
  href: string;
  label?: string;
  className?: string;
  size?: SizeProp;
  color?: string;
};

export function IconLink({
  icon,
  href,
  label,
  className,
  size,
  color,
}: IconLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{ '--brand-color': color } as React.CSSProperties}
      className={cn(styles.link, className)}
    >
      <FontAwesomeIcon icon={icon} size={size} className={styles.icon} />
    </a>
  );
}

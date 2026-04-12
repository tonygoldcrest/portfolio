import { cn } from '@/lib/utils';
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export type IconTextProps = {
  icon: IconDefinition;
  text: string;
  className?: string;
};

export function IconText({ icon, text, className }: IconTextProps) {
  return (
    <div className={cn('flex gap-1 items-center', className)}>
      <FontAwesomeIcon icon={icon} />
      <div>{text}</div>
    </div>
  );
}

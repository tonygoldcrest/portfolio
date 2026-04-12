import { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAt, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { IconText } from '@/components/ui/icon-text';
import { cn } from '@/lib/utils';
import cvData from '@/cv.yaml';
import styles from './hero.module.css';

export default function Hero() {
  const summaryRef = useRef<HTMLParagraphElement>(null);

  return (
    <section
      className="flex gap-4 flex-col py-8 flex-1"
      onMouseMove={(e) => {
        if (!summaryRef.current) return;
        const rect = summaryRef.current.getBoundingClientRect();
        summaryRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        summaryRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }}
    >
      <h1 className={cn('text-5xl font-bold', styles.neonText)}>{cvData.name}</h1>
      <h2 className="text-3xl font-bold">{cvData.title}</h2>
      <IconText icon={faAt} text={cvData.email} />
      <IconText icon={faLocationDot} text={cvData.location} />
      <IconText icon={faLinkedin} text={cvData.links.linkedin} />
      <IconText icon={faGithub} text={cvData.links.github} />
      <p ref={summaryRef} className="text-lg/relaxed">
        {cvData.summary}
      </p>
    </section>
  );
}

import { faAt, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { IconText } from '@/components/ui/icon-text';
import { IconLink } from '@/components/ui/icon-link';
import cvData from '@/cv.yaml';
import styles from './hero.module.css';

export default function Hero() {
  return (
    <section className={styles.section}>
      <h1 className={styles.name}>{cvData.name}</h1>
      <h2 className={styles.title}>{cvData.title}</h2>
      <IconText icon={faAt} text={cvData.email} />
      <IconText icon={faLocationDot} text={cvData.location} />
      <div className={styles.socialLinks}>
        <IconLink
          icon={faLinkedin}
          href={cvData.links.linkedin}
          size="lg"
          color="#0077b5"
          label="LinkedIn"
        />
        <IconLink
          icon={faGithub}
          href={cvData.links.github}
          size="lg"
          color="#5C2D83"
          label="GitHub"
        />
      </div>
      <p className={styles.summary}>{cvData.summary}</p>
    </section>
  );
}

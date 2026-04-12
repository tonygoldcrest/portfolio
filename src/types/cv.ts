export interface CvExperience {
  role: string;
  company: string;
  location: string;
  period: string;
  highlights: string[];
}

export interface CvEducation {
  degree: string;
  institution: string;
  location: string;
  period: string;
  note?: string;
  courses?: string[];
  activities?: string;
}

export interface CvLinks {
  linkedin: string;
  github: string;
}

export interface Cv {
  name: string;
  title: string;
  email: string;
  location: string;
  links: CvLinks;
  summary: string;
  skills: string[];
  languages: string[];
  experience: CvExperience[];
  education: CvEducation[];
}

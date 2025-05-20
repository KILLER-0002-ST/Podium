export interface PersonalInfo {
  name: string
  gender: string
  contact_no: string
  email: string
  github: string
  linkedin: string
  website: string
}

export interface Education {
  title: string
  description: string
  dt: string
  url: string
}

export interface Skill {
  name: string
  level?: number
}

export interface WorkEXP {
  company_name: string
  job_title: string
  duration: string
  key_responsbilities: string[]
}

export interface Project {
  title: string
  skills_used?: Skill[]
  description: string
}

export interface Publication {
  title: string
  authors: string
  date: string
  journal: string
  url: string
  description: string
}

export interface Patent {
  title: string
  patent_number: string
  date: string
  inventors: string
  status: string
  description: string
}

export interface Reference {
  name: string
  position: string
  company: string
  contact: string
  relation: string
}

export interface Award {
  title: string
  date: string
  description: string
}

export interface ResumeData {
  personal_info: PersonalInfo
  education: Education[]
  skills: Skill[]
  work_experience: WorkEXP[]
  projects: Project[]
  publications: Publication[]
  patents: Patent[]
  references: Reference[]
  awards: Award[]
  qualifications?: Education[] // For backward compatibility
}

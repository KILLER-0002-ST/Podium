export interface Template {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
}

export const templates: Record<string, Template> = {
  base: {
    id: 'base',
    name: 'Base',
    thumbnail: '/templates/base.png',
    description: 'A clean and professional template'
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    thumbnail: '/templates/minimal.png',
    description: 'A modern, compact and easy-to-scan design'
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    thumbnail: '/templates/modern.png',
    description: 'A contemporary and stylish layout'
  }
} 
'use client'

// Import polyfill to prevent Promise.withResolvers errors
import '~/lib/polyfills'

import { Mail, Phone, MapPin, Globe, Github, Linkedin, Loader2 } from 'lucide-react'
import type { ResumeData } from '../../../types'
import { cn } from '~/lib/utils'
import { useEffect, useState } from 'react'
import { getAllNotes, type Note } from '../../queries'
import { ReadOnlyHighlightedText } from './shared/ReadOnlyHighlightedText'
import { findNotesForItem } from './shared/helpers'

interface MinimalTemplateProps {
  resumeData: ResumeData
  isEditable?: boolean
  onDataChange?: (newData: ResumeData) => void
  slugId?: string
  initialNotes?: Note[]
}

export default function MinimalTemplate({ 
  resumeData, 
  isEditable = false, 
  onDataChange, 
  slugId,
  initialNotes = [] 
}: MinimalTemplateProps) {
  const { personal_info, skills, work_experience, education, projects } = resumeData
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  
  // Define section name constants for consistency
  const SECTIONS = {
    PERSONAL_INFO: 'personal_info',
    SKILLS: 'skills',
    WORK_EXPERIENCE: 'work_experience',
    PROJECTS: 'projects',
    QUALIFICATIONS: 'qualifications'
  }
  
  // Fetch notes when slugId changes
  useEffect(() => {
    if (slugId) {
      setIsLoadingNotes(true);
      getAllNotes(slugId)
        .then((fetchedNotes: Note[]) => {
          setNotes(fetchedNotes);
        })
        .catch((error: Error) => {
          console.error('Error fetching notes:', error);
        })
        .finally(() => {
          setIsLoadingNotes(false);
        });
    }
  }, [slugId]);
  
  // Simple text component that replaces the editable components
  const SimpleText = ({ value, section, field }: { value: string; section: string; field?: string }) => {
    // Find notes for this text
    const matchingNotes = findNotesForItem(notes, section, value, field);
    
    if (matchingNotes.length > 0) {
      return (
        <ReadOnlyHighlightedText 
          text={value}
          note={matchingNotes[0]}
          identifier={matchingNotes[0].identifier}
        />
      );
    }
    
    return <span>{value}</span>;
  }
  
  // Simple responsibility component to replace EditableResponsibility
  const SimpleResponsibility = ({ value, section, itemIndex, respIndex }: { 
    value: string; 
    section: string; 
    itemIndex: number; 
    respIndex: number 
  }) => {
    // Convert to 1-based indexing for finding notes (matches base template)
    const oneBasedIndex = respIndex + 1;
    // Find notes for this responsibility with field context
    const matchingNotes = findNotesForItem(
      notes, 
      section, 
      value, 
      `responsibility_${oneBasedIndex}`
    );
    
    if (matchingNotes.length > 0) {
      // Implementation similar to base template's EditableResponsibility
      let lastIndex = 0;
      const parts: React.ReactNode[] = [];
      
      // Helper function to find exact text position using context
      const findExactTextPosition = (fullText: string, selectedText: string, context?: { beforeText?: string; afterText?: string }) => {
        if (!context || (!context.beforeText && !context.afterText)) {
          return fullText.indexOf(selectedText);
        }

        const possibleIndices: number[] = [];
        let startIndex = 0;
        
        // Find all occurrences of the selected text
        while (true) {
          const index = fullText.indexOf(selectedText, startIndex);
          if (index === -1) break;
          possibleIndices.push(index);
          startIndex = index + 1;
        }

        // If only one occurrence, return it
        if (possibleIndices.length === 1) {
          return possibleIndices[0];
        }

        // Find the occurrence that best matches the context
        return possibleIndices.reduce((bestIndex, currentIndex) => {
          const beforeMatch = context.beforeText 
            ? fullText.substring(Math.max(0, currentIndex - context.beforeText.length), currentIndex).includes(context.beforeText)
            : true;
          
          const afterMatch = context.afterText
            ? fullText.substring(currentIndex + selectedText.length, currentIndex + selectedText.length + context.afterText.length).includes(context.afterText)
            : true;

          if (beforeMatch && afterMatch) {
            return currentIndex;
          }
          return bestIndex;
        }, possibleIndices[0]);
      };
      
      // Sort notes by their position in the text
      const sortedNotes = matchingNotes.sort((a, b) => {
        const aIndex = findExactTextPosition(value, a.selected_text, a.context);
        const bIndex = findExactTextPosition(value, b.selected_text, b.context);
        return aIndex - bIndex;
      });
      
      sortedNotes.forEach((note) => {
        const exactIndex = findExactTextPosition(value, note.selected_text, note.context);
        if (exactIndex >= lastIndex) {
          if (exactIndex > lastIndex) {
            parts.push(value.substring(lastIndex, exactIndex));
          }
          parts.push(
            <ReadOnlyHighlightedText 
              key={note.identifier} 
              text={note.selected_text}
              note={note}
              identifier={note.identifier}
            />
          );
          lastIndex = exactIndex + note.selected_text.length;
        }
      });
      
      if (lastIndex < value.length) {
        parts.push(value.substring(lastIndex));
      }

      return (
        <span
          data-section={section}
          data-field={`responsibility_${oneBasedIndex}`}
          className="relative"
        >
          {parts}
        </span>
      );
    }
    
    return <span>{value}</span>;
  }
  
  // Section header without edit toggle
  const SectionHeader = ({ title }: { title: string }) => {
    return <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-100 pb-2">{title}</h2>;
  }
  
  // Loading overlay component
  const LoadingOverlay = () => {
    if (!isLoadingNotes) return null;
    
    return (
      <div className="fixed inset-0 bg-white/75 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white shadow-lg">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="text-sm font-medium">Loading notes...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 text-gray-900 rounded-lg overflow-hidden shadow-lg max-w-5xl mx-auto relative">
      {/* Loading overlay */}
      <LoadingOverlay />
      
      {/* Left Sidebar */}
      <aside className="w-full md:w-[300px] bg-[#1E2A3B] text-white p-6 md:p-8 flex flex-col items-center md:items-start">
        {/* Contact Section */}
        <div className="w-full mb-8">
          <h2 className="uppercase text-sm mb-4 text-center md:text-left font-semibold tracking-wider">Contact</h2>
          <div className="space-y-3 text-sm">
            {personal_info.email && personal_info.email !== '-' && (
              <div className="flex items-center gap-3 transition-colors hover:text-blue-300">
                <Mail className="w-4 h-4 text-blue-300" />
                <SimpleText 
                  value={personal_info.email} 
                  section={SECTIONS.PERSONAL_INFO} 
                  field="email" 
                />
              </div>
            )}
            {personal_info.contact_no && personal_info.contact_no !== '-' && (
              <div className="flex items-center gap-3 transition-colors hover:text-blue-300">
                <Phone className="w-4 h-4 text-blue-300" />
                <SimpleText 
                  value={personal_info.contact_no} 
                  section={SECTIONS.PERSONAL_INFO} 
                  field="contact_no" 
                />
              </div>
            )}
            {personal_info.github && personal_info.github !== '-' && (
              <div className="flex items-center gap-3">
                <Github className="w-4 h-4 text-blue-300" />
                <a href={personal_info.github} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </div>
            )}
            {personal_info.linkedin && personal_info.linkedin !== '-' && (
              <div className="flex items-center gap-3">
                <Linkedin className="w-4 h-4 text-blue-300" />
                <a href={personal_info.linkedin} target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              </div>
            )}
            {personal_info.website && personal_info.website !== '-' && (
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-blue-300" />
                <a href={personal_info.website} target="_blank" rel="noopener noreferrer">
                  Portfolio
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Education Section */}
        <div className="w-full">
          <h2 className="uppercase text-sm mb-4 text-center md:text-left font-semibold tracking-wider">Education</h2>
          <div className="space-y-5 text-sm">
            {education?.filter(edu => edu.title !== '-').map((edu, index) => (
              <div key={index} className="border-l-2 border-blue-400 pl-3 transition-all hover:border-blue-300 hover:pl-4">
                <div className="font-medium">
                  <SimpleText 
                    value={edu.title} 
                    section={SECTIONS.QUALIFICATIONS} 
                    field="title" 
                  />
                </div>
                <div className="text-gray-400">
                  <SimpleText 
                    value={edu.description} 
                    section={SECTIONS.QUALIFICATIONS} 
                    field="description" 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-full bg-white p-6 md:p-8">
        {/* Personal Info/Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-1 uppercase">
            <SimpleText 
              value={personal_info.name} 
              section={SECTIONS.PERSONAL_INFO} 
              field="name" 
            />
          </h1>
        </div>
        
        {/* Summary */}
        {personal_info.gender && personal_info.gender !== '-' && (
          <div className="mb-10">
            <SectionHeader title="About" />
            <p className="text-gray-700">
              <SimpleText 
                value={personal_info.gender} 
                section={SECTIONS.PERSONAL_INFO} 
                field="gender" 
              />
            </p>
          </div>
        )}
        
        {/* Work Experience */}
        {work_experience.filter(exp => exp.company_name !== '' && exp.company_name !== '-').length > 0 && (
          <div className="mb-10">
            <SectionHeader title="Experience" />
            <div className="space-y-5">
              {work_experience.filter(exp => exp.company_name !== '' && exp.company_name !== '-').map((exp, index) => (
                <div key={index} className="space-y-1">
                  <h3 className="font-medium">
                    <SimpleText 
                      value={exp.company_name} 
                      section={SECTIONS.WORK_EXPERIENCE} 
                      field="company_name" 
                    />
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-600">
                    <SimpleText 
                      value={exp.job_title} 
                      section={SECTIONS.WORK_EXPERIENCE} 
                      field="job_title" 
                    />
                    <span className="h-1 w-1 rounded-full bg-gray-600"></span>
                    <SimpleText 
                      value={exp.duration} 
                      section={SECTIONS.WORK_EXPERIENCE} 
                      field="duration" 
                    />
                  </div>
                  {exp.key_responsbilities && exp.key_responsbilities.length > 0 && (
                    <ul className="list-disc list-inside text-gray-700 ml-3 space-y-1">
                      {exp.key_responsbilities.map((resp, idx) => (
                        <li key={idx}>
                          <SimpleResponsibility 
                            value={resp} 
                            section={SECTIONS.WORK_EXPERIENCE} 
                            itemIndex={index} 
                            respIndex={idx} 
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Skills */}
        {skills.filter(skill => skill.name !== '' && skill.name !== '-').length > 0 && (
          <div className="mb-10">
            <SectionHeader title="Skills" />
            <div className="flex flex-wrap gap-2">
              {skills.filter(skill => skill.name !== '' && skill.name !== '-').map((skill, index) => (
                <div key={index} className="bg-gray-100 rounded-full px-3 py-1 text-sm">
                  <SimpleText 
                    value={skill.name} 
                    section={SECTIONS.SKILLS} 
                    field="name" 
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Projects */}
        {projects.filter(project => project.title !== '' && project.title !== '-').length > 0 && (
          <div>
            <SectionHeader title="Projects" />
            <div className="space-y-5">
              {projects.filter(project => project.title !== '' && project.title !== '-').map((project, index) => (
                <div key={index} className="space-y-1">
                  <h3 className="font-medium">
                    <SimpleText 
                      value={project.title} 
                      section={SECTIONS.PROJECTS} 
                      field="title" 
                    />
                  </h3>
                  <p className="text-gray-700">
                    <SimpleText 
                      value={project.description} 
                      section={SECTIONS.PROJECTS} 
                      field="description" 
                    />
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

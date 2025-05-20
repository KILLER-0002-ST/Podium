'use client'

// Import polyfill to prevent Promise.withResolvers errors
import '~/lib/polyfills'

import { cn } from '~/lib/utils'
import { Mail, Phone, Globe, Github, Linkedin, Loader2, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react'
import type { ResumeData } from '../../../types'
import { useEffect, useState, useRef } from 'react'
import { getAllNotes, type Note } from '../../queries'
import { ReadOnlyHighlightedText } from './shared/ReadOnlyHighlightedText'
import { findNotesForItem } from './shared/helpers'
import { Separator } from '~/components/ui/separator'
import { Button } from '~/components/ui/button'

interface ModernTemplateProps {
  resumeData: ResumeData
  isEditable?: boolean
  onDataChange?: (newData: ResumeData) => void
  slugId?: string
  initialNotes?: Note[]
}

export default function ModernTemplate({ 
  resumeData, 
  isEditable = false, 
  onDataChange, 
  slugId,
  initialNotes = [] 
}: ModernTemplateProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const slideContainerRef = useRef<HTMLDivElement>(null)

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
  
  // Define slides based on resume sections
  const slides = [
    { id: 'intro', title: 'Introduction' },
    { id: 'experience', title: 'Work Experience' },
    { id: 'skills', title: 'Skills' },
    { id: 'projects', title: 'Projects' },
    { id: 'education', title: 'Education' }
  ].filter(slide => {
    // Only include slides that have content
    if (slide.id === 'intro') return true;
    if (slide.id === 'experience') return resumeData.work_experience.filter(exp => exp.company_name !== '').length > 0;
    if (slide.id === 'skills') return resumeData.skills.filter(skill => skill.name !== '').length > 0;
    if (slide.id === 'projects') return resumeData.projects.filter(project => project.title !== '').length > 0;
    if (slide.id === 'education') return resumeData.education.filter(edu => edu.title !== '').length > 0;
    return false;
  });

  // Handle slide navigation
  const goToSlide = (index: number) => {
    if (index >= 0 && index < slides.length && index !== currentSlide) {
      setDirection(index > currentSlide ? 'next' : 'prev');
      setAnimating(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setAnimating(false);
      }, 300);
    }
  };

  const goToNextSlide = () => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    }
  };

  const goToPrevSlide = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft') {
        goToPrevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentSlide, slides.length]);
  
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

  // Simple section header
  const SectionHeader = ({ title }: { title: string }) => {
    return (
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <div className="w-16 h-1 bg-gray-800 mx-auto mt-2 rounded"></div>
      </div>
    );
  }
  
  // Render social links
  const renderSocialLinks = () => {
    return (
      <div className="flex gap-6 justify-center text-gray-700">
        {resumeData.personal_info.email && (
          <a href={`mailto:${resumeData.personal_info.email}`} className="hover:text-gray-900 transition-colors duration-200">
            <Mail className="h-6 w-6" />
          </a>
        )}
        {resumeData.personal_info.website && (
          <a href={resumeData.personal_info.website} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors duration-200">
            <Globe className="h-6 w-6" />
          </a>
        )}
        {resumeData.personal_info.linkedin && (
          <a href={resumeData.personal_info.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors duration-200">
            <Linkedin className="h-6 w-6" />
          </a>
        )}
        {resumeData.personal_info.github && (
          <a href={resumeData.personal_info.github} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors duration-200">
            <Github className="h-6 w-6" />
          </a>
        )}
      </div>
    )
  }
  
  // Loading overlay component
  const LoadingOverlay = () => {
    if (!isLoadingNotes) return null;
    
    return (
      <div className="fixed inset-0 bg-white/75 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white shadow-lg">
          <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
          <span className="text-sm font-medium">Loading notes...</span>
        </div>
      </div>
    );
  }

  // Progress indicators
  const renderProgressIndicators = () => {
  return (
      <div className="flex justify-center mt-6 gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              index === currentSlide 
                ? "bg-gray-800 scale-125" 
                : "bg-gray-300 hover:bg-gray-400"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    );
  };

  // Filter notes for a specific slide
  const getNotesForCurrentSlide = () => {
    const currentSlideId = slides[currentSlide]?.id;
    if (!currentSlideId) return [];

    let sectionName = '';
    switch (currentSlideId) {
      case 'intro':
        sectionName = SECTIONS.PERSONAL_INFO;
        break;
      case 'experience':
        sectionName = SECTIONS.WORK_EXPERIENCE;
        break;
      case 'skills':
        sectionName = SECTIONS.SKILLS;
        break;
      case 'projects':
        sectionName = SECTIONS.PROJECTS;
        break;
      case 'education':
        sectionName = SECTIONS.QUALIFICATIONS;
        break;
      default:
        return [];
    }

    return notes.filter(note => note.section === sectionName);
  };

  // Render notes summary for current slide
  const renderNotesSummary = () => {
    const currentSlideNotes = getNotesForCurrentSlide();
    
    if (currentSlideNotes.length === 0) {
      return null;
    }

    return (
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Bookmark className="h-4 w-4 text-gray-700" />
          <h3 className="text-sm font-semibold text-gray-800">Notes on this slide</h3>
        </div>
        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
          {currentSlideNotes.map((note, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-md text-sm">
              <div className="text-gray-600 mb-1 line-clamp-1">
                <span className="font-medium text-gray-700">Highlighted text:</span> "{note.selected_text}"
              </div>
              <div className="text-gray-700">{note.note}</div>
                </div>
              ))}
            </div>
          </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-white p-8 text-gray-900 max-w-5xl mx-auto relative">
      {/* Loading overlay */}
      <LoadingOverlay />
      
      {/* Slide container */}
      <div 
        ref={slideContainerRef}
        className="relative overflow-hidden bg-white rounded-lg shadow-lg min-h-[70vh] p-8 border border-gray-200"
      >
        {/* Navigation arrows */}
        <button 
          onClick={goToPrevSlide}
          disabled={currentSlide === 0}
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-all border border-gray-200",
            currentSlide === 0 ? "opacity-30 cursor-not-allowed" : "opacity-100 cursor-pointer"
          )}
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        
        <button 
          onClick={goToNextSlide}
          disabled={currentSlide === slides.length - 1}
          className={cn(
            "absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-all border border-gray-200",
            currentSlide === slides.length - 1 ? "opacity-30 cursor-not-allowed" : "opacity-100 cursor-pointer"
          )}
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6 text-gray-700" />
        </button>
        
        {/* Slides */}
        {slides.map((slide, index) => (
          <div 
            key={slide.id}
            className={cn(
              "absolute inset-0 p-8 transition-all duration-300 ease-in-out overflow-hidden", 
              currentSlide === index ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none",
            )}
            style={{
              transform: currentSlide !== index ? 'scale(0.97)' : 'scale(1)',
              transition: 'transform 0.4s ease, opacity 0.4s ease'
            }}
          >
            <div className={cn(
              "h-full flex flex-col",
              (slide.id === 'experience' || slide.id === 'projects' || slide.id === 'education') && "overflow-hidden"
            )}>
              {slide.id === 'intro' && (
                <div className="flex flex-col items-center justify-center flex-grow animate-fadeIn">
                  <div className="text-center mb-10">
                    <h1 className="text-5xl font-bold mb-6 text-gray-800 tracking-tight">
                      <SimpleText 
                        value={resumeData.personal_info.name} 
                        section={SECTIONS.PERSONAL_INFO}
                        field="name"
                      />
                    </h1>
                    <div className="text-xl text-gray-600 mb-6">
                      <SimpleText 
                        value={resumeData.personal_info.contact_no} 
                        section={SECTIONS.PERSONAL_INFO}
                        field="contact_no"
                      />
                    </div>
                    {renderSocialLinks()}
        </div>

                  {resumeData.personal_info.gender && resumeData.personal_info.gender !== '-' && (
                    <div className="max-w-2xl mx-auto bg-gray-50 p-6 rounded-lg border border-gray-200 animate-fadeIn animate-delay-1">
                      <p className="text-gray-700 italic text-center">
                        <SimpleText 
                          value={resumeData.personal_info.gender} 
                          section={SECTIONS.PERSONAL_INFO}
                          field="gender"
                        />
                      </p>
          </div>
                  )}
                  
                  {renderNotesSummary()}
                </div>
              )}

              {slide.id === 'experience' && (
                <div className="animate-fadeIn h-full flex flex-col">
                  <SectionHeader title="Work Experience" />
                  <div className="overflow-y-auto pr-2 flex-grow hide-scrollbar">
                    <div className="space-y-6 max-w-3xl mx-auto">
                {resumeData.work_experience
                        .filter(exp => exp.company_name !== '')
                        .map((experience, idx) => (
                          <div 
                            key={idx} 
                            className="bg-white p-5 rounded-lg border-l-4 border-gray-700 shadow-md hover:shadow-lg transition-shadow animate-slideInRight"
                            style={{ animationDelay: `${idx * 150}ms` }}
                          >
                            <div className="mb-2 font-bold text-xl text-gray-800">
                              <SimpleText 
                                value={experience.company_name} 
                                section={SECTIONS.WORK_EXPERIENCE}
                                field="company_name"
                              />
                            </div>
                            <div className="text-gray-700 mb-2 font-medium">
                              <SimpleText 
                                value={experience.job_title} 
                                section={SECTIONS.WORK_EXPERIENCE}
                                field="job_title"
                              />
                            </div>
                            <div className="text-gray-500 text-sm mb-3">
                              <SimpleText 
                                value={experience.duration} 
                                section={SECTIONS.WORK_EXPERIENCE}
                                field="duration"
                              />
                            </div>
                            {experience.key_responsbilities && experience.key_responsbilities.length > 0 && (
                              <ul className="list-disc list-inside space-y-2 text-gray-600">
                                {experience.key_responsbilities.map((responsibility, respIndex) => (
                                  <li 
                                    key={respIndex}
                                    className="animate-fadeIn"
                                    style={{ animationDelay: `${200 + respIndex * 100}ms` }}
                                  >
                                    <SimpleResponsibility 
                                      value={responsibility} 
                                      section={SECTIONS.WORK_EXPERIENCE}
                                      itemIndex={idx}
                                      respIndex={respIndex}
                                    />
                                  </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ))}
              </div>
                  </div>
                  {renderNotesSummary()}
            </div>
          )}

              {slide.id === 'skills' && (
                <div className="animate-fadeIn h-full flex flex-col">
                  <SectionHeader title="Skills" />
                  <div className="flex-grow">
                    <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
                {resumeData.skills
                        .filter(skill => skill.name !== '')
                        .map((skill, idx) => (
                          <div 
                            key={idx} 
                            className="bg-gray-800 px-4 py-2 rounded-full text-white shadow-sm hover:shadow-md transition-all animate-fadeIn"
                            style={{ animationDelay: `${idx * 70}ms` }}
                          >
                            <SimpleText 
                              value={skill.name} 
                              section={SECTIONS.SKILLS}
                              field="name"
                            />
                          </div>
                  ))}
              </div>
                  </div>
                  {renderNotesSummary()}
            </div>
          )}

              {slide.id === 'projects' && (
                <div className="animate-fadeIn h-full flex flex-col">
                  <SectionHeader title="Projects" />
                  <div className="overflow-y-auto pr-2 flex-grow hide-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {resumeData.projects
                        .filter(project => project.title !== '')
                        .map((project, idx) => (
                          <div 
                            key={idx} 
                            className="bg-white p-5 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow animate-slideInUp"
                            style={{ animationDelay: `${idx * 150}ms` }}
                          >
                            <div className="font-bold text-lg mb-2 text-gray-800">
                              <SimpleText 
                                value={project.title} 
                                section={SECTIONS.PROJECTS}
                                field="title"
                              />
                            </div>
                            <div className="text-gray-600 mb-3">
                              <SimpleText 
                                value={project.description} 
                                section={SECTIONS.PROJECTS}
                                field="description"
                              />
                            </div>
                            {project.skills_used && project.skills_used.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                          {project.skills_used
                                  .filter(skill => skill.name !== '-')
                                  .map((skill, skillIdx) => (
                                    <span 
                                      key={skillIdx} 
                                      className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                                    >
                                {skill.name}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
                  </div>
                  {renderNotesSummary()}
                </div>
              )}

              {slide.id === 'education' && (
                <div className="animate-fadeIn h-full flex flex-col">
                  <SectionHeader title="Education" />
                  <div className="overflow-y-auto pr-2 flex-grow hide-scrollbar">
                    <div className="space-y-6 max-w-3xl mx-auto">
                      {resumeData.education
                        .filter(edu => edu.title !== '')
                        .map((education, idx) => (
                          <div 
                            key={idx} 
                            className="bg-white p-5 rounded-lg shadow-md border-l-4 border-gray-600 hover:shadow-lg transition-shadow animate-slideInLeft"
                            style={{ animationDelay: `${idx * 150}ms` }}
                          >
                            <div className="font-bold text-lg text-gray-800 mb-2">
                              <SimpleText 
                                value={education.title} 
                                section={SECTIONS.QUALIFICATIONS}
                                field="title"
                              />
                            </div>
                            <div className="text-gray-600">
                              <SimpleText 
                                value={education.description} 
                                section={SECTIONS.QUALIFICATIONS}
                                field="description"
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  {renderNotesSummary()}
            </div>
          )}
        </div>
          </div>
        ))}
      </div>
      
      {/* Progress indicators */}
      {renderProgressIndicators()}
      
      {/* Add CSS animations and style adjustments */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInRight {
          from { transform: translateX(-15px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideInLeft {
          from { transform: translateX(15px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideInUp {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out forwards;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out forwards;
        }
        
        .animate-slideInUp {
          animation: slideInUp 0.5s ease-out forwards;
        }
        
        .animate-delay-1 {
          animation-delay: 0.2s;
        }
        
        /* Custom scrollbar styling */
        .hide-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .hide-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .hide-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 6px;
        }
        
        .hide-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  )
}
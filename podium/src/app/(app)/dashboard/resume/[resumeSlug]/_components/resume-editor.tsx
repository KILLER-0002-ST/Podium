'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getResumeDetails, updateResumeData, parseResume, type Note } from '../queries'
import { match } from 'ts-pattern'
import { Loader2, Share2, Save, Download, ChevronDown, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '~/components/ui/button'
import type { ResumeData } from '../../types'
import BaseTemplate from './templates/base'
import { ShareDialog } from './shared-dialog'
import { toast } from 'sonner'
import { templates } from './templates/types'
import MinimalTemplate from './templates/minimal'
import ModernTemplate from './templates/modern'

type ResumeEditorProps = {
  slug: string
  initialTemplate?: string
}

export default function ResumeEditor({ slug, initialTemplate = 'base' }: ResumeEditorProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [editedResumeData, setEditedResumeData] = useState<ResumeData | null>(null)
  const [activeTemplate, setActiveTemplate] = useState(initialTemplate)
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false)
  const queryClient = useQueryClient()

  const resumeQuery = useQuery({
    queryKey: ['resume', slug],
    queryFn: () => getResumeDetails(slug),
    staleTime: 0,
    refetchOnWindowFocus: true
  })

  const updateResumeMutation = useMutation({
    mutationFn: (data: ResumeData) => updateResumeData(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume', slug] })
      toast.success('Resume updated successfully')
    },
    onError: (error) => {
      console.error('Error updating resume:', error)
      toast.error('Failed to update resume')
    }
  })

  const parseResumeMutation = useMutation({
    mutationFn: () => parseResume(slug),
    onSuccess: () => {
      // Refetch resume after parse request
      queryClient.invalidateQueries({ queryKey: ['resume', slug] })
      toast.success('Resume parsing initiated. This may take a moment.')
      
      // Set up polling to check for resume data every 3 seconds
      const pollInterval = setInterval(() => {
        getResumeDetails(slug).then(data => {
          if (data.resume_data) {
            // Resume has been parsed, stop polling and refresh the data
            clearInterval(pollInterval)
            queryClient.invalidateQueries({ queryKey: ['resume', slug] })
          }
        }).catch(error => {
          console.error('Error checking resume status:', error)
          // Stop polling after error
          clearInterval(pollInterval)
        })
      }, 3000)
      
      // Clear interval after 2 minutes (safety measure)
      setTimeout(() => clearInterval(pollInterval), 120000)
    },
    onError: (error) => {
      console.error('Error parsing resume:', error)
      toast.error('Failed to parse resume')
    }
  })

  const handleParseResume = () => {
    parseResumeMutation.mutate()
  }

  const handleSaveChanges = () => {
    if (editedResumeData) {
      updateResumeMutation.mutate(editedResumeData)
    }
  }

  const handleDataChange = (newData: ResumeData) => {
    setEditedResumeData(newData)
  }

  const handleDownload = async () => {
    if (!resumeQuery.data?.resume_file) return;
    
    try {
      const response = await fetch(resumeQuery.data.resume_file);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resumeQuery.data.resume_file.split('/').pop() || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading resume:', error);
    }
  };

  return match(resumeQuery)
    .with({ status: 'pending' }, () => (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p>Loading resume... This may take a few moments.</p>
      </div>
    ))
    .with({ status: 'success' }, ({ data }) => {
      if (!data.resume_data) {
        return (
          <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
            <FileText className="h-16 w-16 text-gray-300 mb-2" />
            <h2 className="text-xl font-semibold">Resume needs parsing</h2>
            <p className="text-gray-500 text-center max-w-md mb-4">
              To view and edit your resume, we need to extract the information from your PDF. This will allow you to use all features of PulPit.
            </p>
            
            <Button 
              onClick={handleParseResume}
              disabled={parseResumeMutation.isPending}
              size="lg"
              variant="default"
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {parseResumeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Parsing Resume...
                </>
              ) : (
                'Parse Resume Now'
              )}
            </Button>
            
            <div className="mt-8 flex flex-col items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="mt-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Original PDF
              </Button>
            </div>
          </div>
        )
      }

      let resumeData: ResumeData;
      try {
        // Check if resume_data is already a parsed object or a string
        if (typeof data.resume_data === 'string') {
          resumeData = JSON.parse(data.resume_data);
        } else {
          resumeData = data.resume_data;
        }
        
        // Handle compatibility between old and new format
        if (resumeData.qualifications && !resumeData.education) {
          resumeData.education = resumeData.qualifications;
        }
        
        // Initialize edited data if not already set
        if (!editedResumeData) {
          setEditedResumeData(resumeData)
        }
      } catch (error) {
        console.error('Error processing resume data:', error);
        return (
          <div className="flex h-screen w-full items-center justify-center">
            <p className="text-red-500">Failed to process resume data. Please try again later.</p>
          </div>
        )
      }

      // Use the edited data if available, otherwise use the original data
      const displayData = editedResumeData || resumeData

      // Use the appropriate template component based on activeTemplate
      const renderTemplate = () => {
        switch (activeTemplate) {
          case 'minimal':
            return (
              <MinimalTemplate 
                resumeData={displayData} 
                onDataChange={handleDataChange}
                isEditable={true}
                slugId={slug}
              />
            );
          case 'modern':
            return (
              <ModernTemplate 
                resumeData={displayData} 
                onDataChange={handleDataChange}
                isEditable={true}
                slugId={slug}
              />
            );
          case 'base':
          default:
            return (
              <BaseTemplate 
                resumeData={displayData} 
                onDataChange={handleDataChange} 
                isEditable={true} 
                slugId={slug}
                initialNotes={data.get_all_notes as unknown as Note[] || []}
                key={JSON.stringify(data.get_all_notes)}
              />
            );
        }
      };

      return (
        <div className="relative min-h-screen">
          {/* Floating Action Buttons */}
          <div className="fixed top-6 right-4 z-50 flex gap-2">
            {/* Custom Template Selector */}
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white shadow-md hover:bg-gray-100 w-[180px] flex justify-between items-center"
                onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
              >
                <span>{templates[activeTemplate]?.name || 'Select Template'}</span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
              
              {isTemplateDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-md shadow-lg z-50">
                  {Object.values(templates).map((template) => (
                    <div 
                      key={template.id} 
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                      onClick={() => {
                        setActiveTemplate(template.id);
                        setIsTemplateDropdownOpen(false);
                      }}
                    >
                      {template.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Existing buttons */}
            <Button
              variant="outline"
              size="sm"
              className="bg-white shadow-md hover:bg-gray-100"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
            {/* <Button
              variant="outline"
              size="sm"
              className="bg-white shadow-md hover:bg-gray-100"
              onClick={handleSaveChanges}
              disabled={updateResumeMutation.isPending || !editedResumeData}
            >
              {updateResumeMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button> */}
            <Button
              variant="outline"
              size="sm"
              className="bg-white shadow-md hover:bg-gray-100"
              onClick={() => setIsShareDialogOpen(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Render the appropriate template */}
          {renderTemplate()}

          {/* Share Dialog */}
          <ShareDialog
            isOpen={isShareDialogOpen}
            onClose={() => setIsShareDialogOpen(false)}
            resumeSlug={slug}
            resumeData={displayData}
            notes={data.get_all_notes as unknown as Note[] || []}
          />
        </div>
      )
    })
    .otherwise(() => null)
}
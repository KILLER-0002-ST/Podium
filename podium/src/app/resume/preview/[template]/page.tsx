'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import BaseTemplate from '~/app/(app)/dashboard/resume/[resumeSlug]/_components/templates/base'
import MinimalTemplate from '~/app/(app)/dashboard/resume/[resumeSlug]/_components/templates/minimal'
import ModernTemplate from '~/app/(app)/dashboard/resume/[resumeSlug]/_components/templates/modern'
import type { ResumeData } from '~/app/(app)/dashboard/resume/types'

// Create wrapped components with default props for preview
const BaseTemplatePreview = (props: { resumeData: ResumeData }) => (
  <BaseTemplate 
    resumeData={props.resumeData} 
    isEditable={false}
    onDataChange={() => {}}
    slugId="preview"
    initialNotes={[]}
  />
)

const MinimalTemplatePreview = (props: { resumeData: ResumeData }) => (
  <MinimalTemplate resumeData={props.resumeData} isEditable={false} slugId="preview" />
)

const ModernTemplatePreview = (props: { resumeData: ResumeData }) => (
  <ModernTemplate resumeData={props.resumeData} isEditable={false} slugId="preview" />
)

// Map of template IDs to their wrapped preview components
const templateComponents: Record<string, React.ComponentType<{ resumeData: ResumeData }>> = {
  base: BaseTemplatePreview,
  minimal: MinimalTemplatePreview,
  modern: ModernTemplatePreview,
}

type PreviewPageProps = {
  params: Promise<{ template: string }>
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const searchParams = useSearchParams()
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [template, setTemplate] = useState<string>('base')

  useEffect(() => {
    // Resolve params to get the template
    Promise.resolve(params).then(resolvedParams => {
      setTemplate(resolvedParams.template)
    })
  }, [params])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const dataParam = searchParams.get('data')
        
        if (dataParam) {
          // Data is passed directly via URL
          const parsedData = JSON.parse(decodeURIComponent(dataParam))
          setResumeData(parsedData)
        } else {
          setError('No resume data provided')
        }
      } catch (err) {
        console.error('Error loading preview data:', err)
        setError('Failed to load resume data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading preview...</p>
        </div>
      </div>
    )
  }

  if (error || !resumeData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
          <p>{error || 'No resume data available for preview'}</p>
        </div>
      </div>
    )
  }

  // Get the template component based on the template ID
  const TemplateComponent = templateComponents[template] || templateComponents.base

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <TemplateComponent resumeData={resumeData} />
      </div>
    </div>
  )
} 
'use client'

import { useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { verifyPassword, decryptResumeData } from './queries'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import type { ResumeData } from '../../../(app)/dashboard/resume/types'
import ResumeViewer from './_components/resume-viewer'
import BaseTemplate from '~/app/(app)/dashboard/resume/[resumeSlug]/_components/templates/base'
import MinimalTemplate from '~/app/(app)/dashboard/resume/[resumeSlug]/_components/templates/minimal'
import ModernTemplate from '~/app/(app)/dashboard/resume/[resumeSlug]/_components/templates/modern'
import { Note } from '~/app/(app)/dashboard/resume/[resumeSlug]/queries'
import { SharedChatbot } from './_components/SharedChatbot'

// Extended type that includes notes
interface SharedResumeData extends ResumeData {
  notes?: Note[];
}

// Create wrapped components with default props for preview
const BaseTemplatePreview = (props: { resumeData: SharedResumeData }) => {
  const { notes = [], ...resumeData } = props.resumeData;
  return (
    <BaseTemplate 
      resumeData={resumeData} 
      isEditable={false}
      onDataChange={() => {}}
      slugId="shared"
      initialNotes={notes}
      isShared={true}
    />
  )
}

const MinimalTemplatePreview = (props: { resumeData: SharedResumeData }) => {
  const { notes = [], ...resumeData } = props.resumeData;
  return (
    <MinimalTemplate 
      resumeData={resumeData} 
      isEditable={false}
      slugId="shared"
      initialNotes={notes}
    />
  )
}

const ModernTemplatePreview = (props: { resumeData: SharedResumeData }) => {
  const { notes = [], ...resumeData } = props.resumeData;
  return (
    <ModernTemplate 
      resumeData={resumeData} 
      isEditable={false}
      slugId="shared"
      initialNotes={notes}
    />
  )
}

// Map of template IDs to their wrapped preview components
const templateComponents: Record<string, React.ComponentType<{ resumeData: SharedResumeData }>> = {
  base: BaseTemplatePreview,
  minimal: MinimalTemplatePreview,
  modern: ModernTemplatePreview,
}

export default function SharedResume() {
  const searchParams = useSearchParams()
  const params = useParams<{ resumeSlug: string }>()
  const resumeSlug = params.resumeSlug
  const [resume, setResume] = useState<SharedResumeData | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const encodedData = searchParams.get('data')
  const key = searchParams.get('key')
  const template = searchParams.get('template') || 'base'
  const includeChatbot = searchParams.get('chatbot') === 'true'
  const isPasswordProtected = !!key

  if (!encodedData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Invalid share link
      </div>
    )
  }

  const handlePasswordSubmit = async () => {
    try {
      if (!key || !await verifyPassword(password, decodeURIComponent(key))) {
        setError('Invalid password')
        return
      }

      const encryptedData = decodeURIComponent(encodedData)
      const decodedResume = decryptResumeData(encryptedData)
      setResume(decodedResume)
    } catch (err) {
      setError('Invalid share link')
      console.log(err)
    }
  }
  
  // Render the selected template component
  const renderResumeTemplate = (resumeData: SharedResumeData) => {
    const TemplateComponent = templateComponents[template] || templateComponents.base
    return <TemplateComponent resumeData={resumeData} />
  }

  // If not password protected, decode and show resume directly
  if (!isPasswordProtected && !resume) {
    try {
      const encryptedData = decodeURIComponent(encodedData)
      const decodedResume = decryptResumeData(encryptedData)
      return (
        <div className="container mx-auto py-8 relative">
          {renderResumeTemplate(decodedResume)}
          <div className="py-2 text-center text-4xl font-bold">Pulpit</div>
          {includeChatbot && <SharedChatbot resumeData={decodedResume} />}
        </div>
      )
    } catch {
      return (
        <div className="flex items-center justify-center min-h-screen">
          Invalid share link
        </div>
      )
    }
  }

  // Show password entry if protected and not yet verified
  if (isPasswordProtected && !resume) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="max-w-sm w-full space-y-4">
          <h1 className="text-2xl font-bold text-center">Password Protected Resume</h1>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button 
              className="w-full" 
              onClick={handlePasswordSubmit}
              disabled={!password}
            >
              View Resume
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show resume after password verification
  return (
    <div className="container mx-auto py-8 relative">
      {renderResumeTemplate(resume!)}
      <div className="py-2 text-center text-4xl font-bold">Pulpit</div>
      {includeChatbot && <SharedChatbot resumeData={resume!} />}
    </div>
  )
}
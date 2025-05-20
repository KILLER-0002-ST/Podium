'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getAllResume } from '../queries'
import { templates } from '../resume/[resumeSlug]/_components/templates/types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import ResumeUploader from '../_components/resume-uploader'
import { match } from 'ts-pattern'
import { Loader2 } from 'lucide-react'

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false)
  const router = useRouter()

  const resumesQuery = useQuery({
    queryKey: ['all-resume'],
    queryFn: getAllResume,
  })

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    setIsResumeDialogOpen(true)
  }

  const handleResumeSelect = (resumeSlug: string) => {
    if (selectedTemplate) {
      router.push(`/dashboard/resume/${resumeSlug}?template=${selectedTemplate}`)
    }
    setIsResumeDialogOpen(false)
  }

  return (
    <div className="p-6">
      <h1 className="mb-8 text-3xl font-bold">Resume Templates</h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.values(templates).map((template) => (
          <Card key={template.id} className="overflow-hidden">
            <div className="relative h-48 overflow-hidden">
              <Image 
                src={template.thumbnail} 
                alt={template.name}
                fill
                className="object-cover object-top transition-transform hover:scale-105"
              />
            </div>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handleTemplateSelect(template.id)}
              >
                Use This Template
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Resume Selection Dialog */}
      <Dialog open={isResumeDialogOpen} onOpenChange={setIsResumeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select a Resume</DialogTitle>
            <DialogDescription>
              Choose an existing resume or upload a new one
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {match(resumesQuery)
              .with({ status: 'pending' }, () => (
                <div className="flex h-40 w-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                </div>
              ))
              .with({ status: 'error' }, () => (
                <div className="rounded-md bg-red-50 p-4 text-red-700">
                  Something went wrong while fetching your resumes
                </div>
              ))
              .with({ status: 'success' }, ({ data }) => (
                <>
                  {data.length === 0 ? (
                    <div className="rounded-md bg-blue-50 p-4 text-blue-700">
                      <p className="mb-2">You don't have any resumes yet.</p>
                      <ResumeUploader />
                    </div>
                  ) : (
                    <div className="max-h-60 space-y-2 overflow-y-auto">
                      {data.map((resume) => (
                        <Card 
                          key={resume.id} 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleResumeSelect(resume.slug)}
                        >
                          <CardHeader className="p-4">
                            <CardTitle className="text-lg">{resume.title}</CardTitle>
                          </CardHeader>
                        </Card>
                      ))}
                      <div className="pt-2">
                        <ResumeUploader closeParentDialog={() => setIsResumeDialogOpen(false)} />
                      </div>
                    </div>
                  )}
                </>
              ))
              .exhaustive()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
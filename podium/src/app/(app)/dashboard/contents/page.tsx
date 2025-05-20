'use client'

import { useState } from 'react'
import { Loader2, Award, Briefcase, Lightbulb, BookOpen, Code } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { ScrollArea } from '~/components/ui/scroll-area'
import ContentUploader from './_components/content-uploader'
import { useRouter } from 'next/navigation'
import { getAllResume } from '~/app/(app)/dashboard/queries'
import { useQuery } from '@tanstack/react-query'

interface ContentCardProps {
  title: string
  icon: React.ReactNode
  description: string
  type: string

  onClick: () => void
}

function ContentCard({ title, icon, description, type, onClick }: ContentCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-gray-900 h-full"
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
        <div className="bg-gray-50 p-3 rounded-full mb-4">
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm mb-2">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function ContentsPage() {
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()
  const { data: resumesQuery } = useQuery({ 
    queryKey: ['resumes'],
    queryFn: getAllResume,
  })
  const contentSections = [
    {
      title: "Work Experience",
      icon: <Briefcase className="w-6 h-6 text-gray-900" />,
      description: "Manage your work experience entries across all resumes",
      type: "work_experience"
    },
    {
      title: "Education",
      icon: <BookOpen className="w-6 h-6 text-gray-900" />,
      description: "Manage your education history across all resumes",
      type: "education"
    },
    {
      title: "Skills",
      icon: <Code className="w-6 h-6 text-gray-900" />,
      description: "Manage your skills across all resumes",
      type: "skills"
    },
    {
      title: "Projects",
      icon: <Lightbulb className="w-6 h-6 text-gray-900" />,
      description: "Manage your projects across all resumes",
      type: "projects"
    },
    {
      title: "Awards",
      icon: <Award className="w-6 h-6 text-gray-900" />,
      description: "Manage your awards and achievements across all resumes",
      type: "awards"
    }
  ]

  const navigateToSection = (type: string) => {
    router.push(`/dashboard/contents/${type}`)
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold" style={{ paddingLeft: '10px' }}>Manage Content</h1>
        <div className="flex items-center gap-3">
          {isUploading && (
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Uploading resume...</span>
            </div>
          )}
          <ContentUploader 
            onUploadStart={() => setIsUploading(true)} 
            onUploadEnd={() => setIsUploading(false)} 
          />
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-150px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
          {contentSections.map((section) => (
            <ContentCard
              key={section.type}
              title={section.title}
              icon={section.icon}
              description={section.description}
              type={section.type}
              onClick={() => navigateToSection(section.type)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
} 
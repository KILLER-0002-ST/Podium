'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { FileText, MessageSquare } from 'lucide-react'

interface Resume {
  slug: string
  title: string
  created_at: string
}

interface ResumeSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  resumes: Resume[]
  onSelectResume: (slug: string, title: string) => void
}

export function ResumeSelectionModal({
  isOpen,
  onClose,
  resumes,
  onSelectResume,
}: ResumeSelectionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-center flex flex-col items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary/70" />
            <span>Select a resume to chat about</span>
          </DialogTitle>
          <p className="text-center text-muted-foreground mt-2">
            Our AI assistant will answer questions about the resume you select
          </p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto mt-4 p-1">
          {resumes.map((resume) => (
            <Card 
              key={resume.slug}
              onClick={() => onSelectResume(resume.slug, resume.title)}
              className="cursor-pointer transition-all hover:shadow-md border border-opacity-50 hover:border-primary/50 hover:bg-primary/5 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary/70" />
                  {resume.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(resume.created_at).toLocaleDateString()}
                </p>
                <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
} 
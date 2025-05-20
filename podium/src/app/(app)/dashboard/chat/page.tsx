'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { getAllResume } from '~/app/(app)/dashboard/queries'
import { DashboardChat } from './_components/DashboardChat'
import { ResumeSelectionModal } from './_components/ResumeSelectionModal'
import { AnimatePresence, motion } from 'framer-motion'
import { FileText, MessageSquare, Plus } from 'lucide-react'
import { Button } from '~/components/ui/button'

export default function ChatPage() {
  const [selectedResumeSlug, setSelectedResumeSlug] = useState<string | null>(null)
  const [selectedResumeTitle, setSelectedResumeTitle] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch all resumes
  const resumesQuery = useQuery({
    queryKey: ['all-resume'],
    queryFn: getAllResume,
  })

  // Open modal if no resume is selected on initial load
  useEffect(() => {
    if (resumesQuery.data && resumesQuery.data.length > 0 && !selectedResumeSlug) {
      setIsModalOpen(true)
    }
  }, [resumesQuery.data, selectedResumeSlug])

  // Handle resume selection
  const handleSelectResume = (slug: string, title: string) => {
    setSelectedResumeSlug(slug)
    setSelectedResumeTitle(title)
    setIsModalOpen(false)
  }

  // Reset selection to go back to resume selection screen
  const handleOpenResumeModal = () => {
    setIsModalOpen(true)
  }

  if (resumesQuery.isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center">
        <div className="text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary"></div>
            <h3 className="font-medium">Loading your resumes...</h3>
          </div>
        </div>
      </div>
    )
  }

  if (resumesQuery.error) {
    return (
      <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-500">Failed to load resumes</h3>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    )
  }

  if (resumesQuery.data && resumesQuery.data.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center">
        <div className="text-center max-w-md">
          <MessageSquare className="mx-auto h-12 w-12 text-primary/50 mb-4" />
          <h3 className="text-xl font-medium mb-2">No resumes found</h3>
          <p className="text-muted-foreground mb-4">
            To use the AI assistant, you need to create at least one resume first.
          </p>
          <Button asChild>
            <a href="/dashboard">Go to Dashboard</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Resume Assistant</h1>
        {selectedResumeSlug && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{selectedResumeTitle}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1.5 hover:bg-background"
              onClick={handleOpenResumeModal}
            >
              <Plus className="h-3.5 w-3.5" />
              Change Resume
            </Button>
          </div>
        )}
      </div>
      
      {selectedResumeSlug ? (
        <motion.div 
          key="chat"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col"
        >
          <DashboardChat resumeSlug={selectedResumeSlug} />
        </motion.div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <MessageSquare className="mx-auto h-12 w-12 text-primary/50 mb-4" />
            <h3 className="text-xl font-medium mb-2">Select a resume to start chatting</h3>
            <p className="text-muted-foreground mb-6">
              Choose a resume from your collection to get personalized assistance and answers about it.
            </p>
            <Button 
              onClick={handleOpenResumeModal}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Select Resume
            </Button>
          </div>
        </div>
      )}
      
      <ResumeSelectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        resumes={resumesQuery.data || []}
        onSelectResume={handleSelectResume}
      />
    </div>
  )
}

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllResume, deleteResume } from '../queries'
import { parseResume } from '../resume/[resumeSlug]/queries'
import { match } from 'ts-pattern'
import { Skeleton } from '~/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '~/components/ui/card'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '~/components/ui/button'
import { Trash2, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { useState } from 'react'
dayjs.extend(relativeTime)

export function ResumeList() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [resumeToDelete, setResumeToDelete] = useState<{ slug: string, title: string } | null>(null)
  const [parsingResumes, setParsingResumes] = useState<Record<string, boolean>>({})
  
  const resumesQuery = useQuery({
    queryKey: ['all-resume'],
    queryFn: getAllResume,
  })

  const parseResumeMutation = useMutation({
    mutationFn: parseResume,
    onSuccess: (_, slug) => {
      // Mark parsing as complete
      setParsingResumes(prev => ({ ...prev, [slug]: false }))
      // Refetch resumes to update the UI
      queryClient.invalidateQueries({ queryKey: ['all-resume'] })
      toast.success('Resume parsing initiated')
      // Navigate to the resume detail page
      router.push(`/dashboard/resume/${slug}`)
    },
    onError: (error, slug) => {
      // Mark parsing as complete even on error
      setParsingResumes(prev => ({ ...prev, [slug]: false }))
      console.error('Error parsing resume:', error)
      toast.error('Failed to parse resume. Please try again.')
    }
  })

  const deleteResumeMutation = useMutation({
    mutationFn: deleteResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-resume'] })
      toast.success(`Resume "${resumeToDelete?.title}" deleted successfully`)
      setResumeToDelete(null)
    },
    onError: (error) => {
      console.error('Error deleting resume:', error)
      toast.error('Failed to delete resume. Please try again.')
    },
  })

  const handleResumeClick = (e: React.MouseEvent, resume: any) => {
    if (!resume.resume_data) {
      e.preventDefault()
      // Set parsing state for this resume
      setParsingResumes(prev => ({ ...prev, [resume.slug]: true }))
      // Call the parse resume API
      parseResumeMutation.mutate(resume.slug)
    }
  }

  const handleDelete = (e: React.MouseEvent, slug: string, title: string) => {
    e.preventDefault()
    e.stopPropagation()
    setResumeToDelete({ slug, title })
  }

  const confirmDelete = () => {
    if (resumeToDelete) {
      deleteResumeMutation.mutate(resumeToDelete.slug)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {match(resumesQuery)
          .with({ status: 'pending' }, () =>
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-md" />
            )),
          )
          .with({ status: 'error' }, () => (
            <div className="">Something went wrong while fetching resumes</div>
          ))
          .with({ status: 'success' }, ({ data }) =>
            data.map((resume) => (
              <Link 
                key={resume.id} 
                href={`/dashboard/resume/${resume.slug}`}
                onClick={(e) => handleResumeClick(e, resume)}
              >
                <Card className="max-w-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle>{resume.title}</CardTitle>
                    <CardDescription>Uploaded {dayjs(resume.created_at).fromNow()}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    {resume.resume_data ? (
                      <div className="flex items-center text-green-600 font-medium">
                        <span className="mr-1.5 text-lg">●</span> 
                        <span>Parsed</span>
                      </div>
                    ) : parsingResumes[resume.slug] ? (
                      <div className="flex items-center text-blue-600">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span>Parsing Resume...</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-amber-600 font-medium">
                        <span className="mr-1.5 text-lg">○</span>
                        <span>Click to Parse</span>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-500">
                      <Eye className="h-4 w-4 mr-1" />
                      <span>{resume.views || 0} views</span>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={(e) => handleDelete(e, resume.slug, resume.title)}
                      disabled={parsingResumes[resume.slug]}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            )),
          )
          .exhaustive()}
      </div>

      <Dialog open={!!resumeToDelete} onOpenChange={(open: boolean) => !open && setResumeToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this resume?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the resume
              "{resumeToDelete?.title}" and all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResumeToDelete(null)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteResumeMutation.isPending}
            >
              {deleteResumeMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

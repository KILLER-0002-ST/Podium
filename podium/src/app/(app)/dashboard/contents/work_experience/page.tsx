'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Separator } from '~/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { ArrowLeft, Briefcase, Edit, Plus, Trash2, Search, Bold, Underline } from 'lucide-react'
import { Input } from '~/components/ui/input'
import { Skeleton } from '~/components/ui/skeleton'
import { Badge } from '~/components/ui/badge'
import { Textarea } from '~/components/ui/textarea'
import Link from 'next/link'
import { SectionNav } from '~/components/ui/section-nav'
import { getAllResume } from '~/app/(app)/dashboard/queries'
import { ResumeData, WorkEXP } from '~/app/(app)/dashboard/resume/types'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import { toast } from '~/hooks/use-toast'
import { 
  getResumeDetails, 
  updateResumeData, 
  createNote, 
  getAllNotes, 
  deleteNote,
  updateNote,
  type Note 
} from '~/app/(app)/dashboard/resume/[resumeSlug]/queries'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog"

export default function WorkExperiencePage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<WorkEXP & { resumeId: string, resumeTitle: string } | null>(null)
  const [highlightText, setHighlightText] = useState('')
  const [highlightPosition, setHighlightPosition] = useState<{ x: number, y: number } | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isResumeSelectDialogOpen, setIsResumeSelectDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedResumeForAdd, setSelectedResumeForAdd] = useState<{ slug: string, title: string } | null>(null)
  const [formData, setFormData] = useState<Partial<WorkEXP>>({
    company_name: '',
    job_title: '',
    duration: '',
    key_responsbilities: ['']
  })
  const [startMonth, setStartMonth] = useState<string>('')
  const [startYear, setStartYear] = useState<string>('')
  const [endMonth, setEndMonth] = useState<string>('')
  const [endYear, setEndYear] = useState<string>('')
  const [isPresent, setIsPresent] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [isNotePopoverOpen, setIsNotePopoverOpen] = useState(false)
  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [editedNoteText, setEditedNoteText] = useState('')
  const detailsRef = useRef<HTMLDivElement>(null)
  const selectionRef = useRef<{ 
    range: Range | null, 
    text: string, 
    parentElement: Element | null 
  }>({ range: null, text: '', parentElement: null })
  
  // Fetch all resumes to extract work experience entries
  const resumesQuery = useQuery({
    queryKey: ['all-resume'],
    queryFn: getAllResume,
  })

  // Query for notes if a resume is selected
  const notesQuery = useQuery({
    queryKey: ['notes', selectedItem?.resumeId],
    queryFn: () => selectedItem ? getAllNotes(selectedItem.resumeId) : Promise.resolve([]),
    enabled: !!selectedItem,
  })

  // Update existing notes when they're loaded
  useEffect(() => {
    if (notesQuery.data) {
      setNotes(notesQuery.data || [])
    }
  }, [notesQuery.data])

  // Mutation for updating resume data
  const updateResumeMutation = useMutation({
    mutationFn: async ({ resumeId, resumeData }: { resumeId: string, resumeData: ResumeData }) => {
      return updateResumeData(resumeId, resumeData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-resume'] })
      toast({
        title: "Success",
        description: isEditDialogOpen 
          ? "Work experience updated successfully" 
          : "New work experience added successfully",
      })
      setIsEditDialogOpen(false)
      setIsAddDialogOpen(false)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update data: ${error.message}`,
        variant: "destructive",
      })
    }
  })

  // Mutation for creating notes
  const createNoteMutation = useMutation({
    mutationFn: async ({ resumeId, noteData }: { resumeId: string, noteData: any }) => {
      return createNote(resumeId, noteData)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes', selectedItem?.resumeId] })
      setNotes(prev => [...prev, data])
      setNoteText('')
      setIsNotePopoverOpen(false)
      toast({
        title: "Success",
        description: "Note added successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add note: ${error.message}`,
        variant: "destructive",
      })
    }
  })

  // Mutation for deleting notes
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      return deleteNote(noteId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', selectedItem?.resumeId] })
      toast({
        title: "Success",
        description: "Note deleted successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete note: ${error.message}`,
        variant: "destructive",
      })
    }
  })

  // Mutation for deleting work experience
  const deleteWorkExperienceMutation = useMutation({
    mutationFn: async ({ resumeId, resumeData }: { resumeId: string, resumeData: ResumeData }) => {
      return updateResumeData(resumeId, resumeData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-resume'] })
      setSelectedItem(null)
      setIsDeleteDialogOpen(false)
      toast({
        title: "Success",
        description: "Work experience deleted successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete work experience: ${error.message}`,
        variant: "destructive",
      })
    }
  })

  // Extract all work experience items from all resumes
  const workExperiences = resumesQuery.data?.flatMap((resume: any) => {
    if (!resume.resume_data) return []
    
    let resumeData: ResumeData
    try {
      if (typeof resume.resume_data === 'string') {
        resumeData = JSON.parse(resume.resume_data)
      } else {
        resumeData = resume.resume_data
      }
      
      return (resumeData.work_experience || []).map((exp: WorkEXP) => ({
        ...exp,
        resumeId: resume.slug,
        resumeTitle: resume.title
      }))
    } catch (error) {
      console.error('Error parsing resume data:', error)
      return []
    }
  }) || []
  
  // Highlighted text with notes (for displaying notes in the details section)
  const [hoveredNote, setHoveredNote] = useState<Note | null>(null)

  // Filter work experiences based on search query
  const filteredWorkExperiences = workExperiences.filter((exp: WorkEXP & { resumeId: string, resumeTitle: string }) => 
    exp.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.job_title.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Handle item selection
  const handleSelectItem = (item: WorkEXP & { resumeId: string, resumeTitle: string }) => {
    setSelectedItem(item)
  }

  // Month options for dropdowns
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]

  // Generate years from 1980 to current year
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1979 }, (_, i) => {
    const year = (currentYear - i).toString()
    return { value: year, label: year }
  })

  // Format month and year to readable date string
  const formatDateDisplay = (month: string, year: string): string => {
    if (!month || !year) return ''
    
    const monthIndex = parseInt(month, 10) - 1
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[monthIndex]} ${year}`
  }

  // Update duration when dates change
  useEffect(() => {
    // Only create duration if we have start month and year
    if (startMonth && startYear) {
      const startDate = formatDateDisplay(startMonth, startYear)
      let duration = startDate
      
      if (isPresent) {
        duration += ' - Present'
      } else if (endMonth && endYear) {
        const endDate = formatDateDisplay(endMonth, endYear)
        duration += ` - ${endDate}`
      } else {
        // If no end date specified and not present, just show start date
        duration = startDate
      }
      
      setFormData(prev => ({
        ...prev,
        duration
      }))
    }
  }, [startMonth, startYear, endMonth, endYear, isPresent])

  // Reset date fields
  const resetDateFields = () => {
    setStartMonth('')
    setStartYear('')
    setEndMonth('')
    setEndYear('')
    setIsPresent(false)
  }

  // Handle resume selection for adding new experience
  const handleResumeSelect = (resume: { slug: string, title: string }) => {
    setSelectedResumeForAdd(resume)
    setIsResumeSelectDialogOpen(false)
    setFormData({
      company_name: '',
      job_title: '',
      duration: '',
      key_responsbilities: ['']
    })
    resetDateFields()
    setIsAddDialogOpen(true)
  }

  // Parse duration string to populate date fields
  const parseDuration = (durationStr: string) => {
    resetDateFields()
    
    if (!durationStr) return
    
    const parts = durationStr.split(' - ')
    
    // Parse start date (e.g., "Jan 2020")
    if (parts[0]) {
      const startParts = parts[0].split(' ')
      if (startParts.length === 2) {
        const monthName = startParts[0]
        const year = startParts[1]
        
        // Convert month name to month number
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const monthIndex = monthNames.findIndex(m => m === monthName)
        
        if (monthIndex !== -1) {
          // Add 1 and pad with leading zero if needed
          const monthNum = (monthIndex + 1).toString().padStart(2, '0')
          setStartMonth(monthNum)
          setStartYear(year)
        }
      }
    }
    
    // Parse end date if it exists (e.g., "Dec 2022" or "Present")
    if (parts.length > 1) {
      const endValue = parts[1].trim()
      
      if (endValue.toLowerCase() === 'present') {
        setIsPresent(true)
      } else {
        const endParts = endValue.split(' ')
        if (endParts.length === 2) {
          const monthName = endParts[0]
          const year = endParts[1]
          
          // Convert month name to month number
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const monthIndex = monthNames.findIndex(m => m === monthName)
          
          if (monthIndex !== -1) {
            // Add 1 and pad with leading zero if needed
            const monthNum = (monthIndex + 1).toString().padStart(2, '0')
            setEndMonth(monthNum)
            setEndYear(year)
          }
        }
      }
    }
  }

  // Handle editing existing work experience
  const handleEditClick = () => {
    if (selectedItem) {
      setFormData({
        company_name: selectedItem.company_name,
        job_title: selectedItem.job_title,
        duration: selectedItem.duration,
        key_responsbilities: [...selectedItem.key_responsbilities]
      })
      
      // Parse duration to set date fields
      parseDuration(selectedItem.duration)
      
      setIsEditDialogOpen(true)
    }
  }

  // Check if form has valid dates for saving
  const hasValidDates = (): boolean => {
    if (!startMonth || !startYear) return false
    if (!isPresent && (!endMonth || !endYear)) return false
    
    // If both start and end dates are provided, ensure end date is not before start date
    if (!isPresent && endMonth && endYear && startMonth && startYear) {
      const startDate = new Date(`${startYear}-${startMonth}-01`)
      const endDate = new Date(`${endYear}-${endMonth}-01`)
      if (endDate < startDate) return false
    }
    
    return true
  }

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle responsibilities changes
  const handleResponsibilityChange = (index: number, value: string) => {
    setFormData(prev => {
      const newResponsibilities = [...(prev.key_responsbilities || [])]
      newResponsibilities[index] = value
      return { ...prev, key_responsbilities: newResponsibilities }
    })
  }

  // Add new responsibility field
  const addResponsibility = () => {
    setFormData(prev => ({
      ...prev,
      key_responsbilities: [...(prev.key_responsbilities || []), '']
    }))
  }

  // Remove responsibility field
  const removeResponsibility = (index: number) => {
    setFormData(prev => {
      const newResponsibilities = [...(prev.key_responsbilities || [])]
      newResponsibilities.splice(index, 1)
      return { ...prev, key_responsbilities: newResponsibilities }
    })
  }

  // Save work experience (edit or add)
  const handleSaveWorkExperience = async () => {
    if (!formData.company_name || !formData.job_title) {
      toast({
        title: "Validation Error",
        description: "Job title and company name are required",
        variant: "destructive",
      })
      return
    }
    
    if (!hasValidDates()) {
      toast({
        title: "Validation Error",
        description: "Please provide valid date range",
        variant: "destructive",
      })
      return
    }

    try {
      // For edit mode
      if (isEditDialogOpen && selectedItem) {
        const resumeDetails = await getResumeDetails(selectedItem.resumeId)
        let resumeData: ResumeData
        
        if (typeof resumeDetails.resume_data === 'string') {
          resumeData = JSON.parse(resumeDetails.resume_data)
        } else {
          resumeData = resumeDetails.resume_data
        }
        
        // Find index of the work experience to update
        const workExpIndex = resumeData.work_experience.findIndex(
          exp => 
            exp.company_name === selectedItem.company_name && 
            exp.job_title === selectedItem.job_title
        )
        
        if (workExpIndex !== -1) {
          // Update existing work experience
          resumeData.work_experience[workExpIndex] = formData as WorkEXP
          await updateResumeMutation.mutateAsync({ 
            resumeId: selectedItem.resumeId, 
            resumeData 
          })
          
          // Immediately update the UI by updating selectedItem
          setSelectedItem({
            ...formData as WorkEXP,
            resumeId: selectedItem.resumeId,
            resumeTitle: selectedItem.resumeTitle
          })
        }
      } 
      
      // For add mode
      else if (isAddDialogOpen && selectedResumeForAdd) {
        const resumeDetails = await getResumeDetails(selectedResumeForAdd.slug)
        
        let resumeData: ResumeData
        if (typeof resumeDetails.resume_data === 'string') {
          resumeData = JSON.parse(resumeDetails.resume_data)
        } else {
          resumeData = resumeDetails.resume_data
        }
        
        // Add new work experience
        resumeData.work_experience.push(formData as WorkEXP)
        await updateResumeMutation.mutateAsync({ 
          resumeId: selectedResumeForAdd.slug, 
          resumeData 
        })
        
        // Immediately select the newly added item
        const newWorkExp = {
          ...formData as WorkEXP,
          resumeId: selectedResumeForAdd.slug,
          resumeTitle: selectedResumeForAdd.title
        }
        setSelectedItem(newWorkExp)
        
        // Clear the selected resume
        setSelectedResumeForAdd(null)
      }
    } catch (error) {
      console.error('Error updating work experience:', error)
      toast({
        title: "Error",
        description: "Failed to save work experience",
        variant: "destructive",
      })
    }
  }

  // Handle delete work experience
  const handleDeleteWorkExperience = async () => {
    if (!selectedItem) return
    
    try {
      const resumeDetails = await getResumeDetails(selectedItem.resumeId)
      let resumeData: ResumeData
      
      if (typeof resumeDetails.resume_data === 'string') {
        resumeData = JSON.parse(resumeDetails.resume_data)
      } else {
        resumeData = resumeDetails.resume_data
      }
      
      // Filter out the work experience to delete
      resumeData.work_experience = resumeData.work_experience.filter(
        exp => 
          !(exp.company_name === selectedItem.company_name && 
            exp.job_title === selectedItem.job_title)
      )
      
      await deleteWorkExperienceMutation.mutateAsync({ 
        resumeId: selectedItem.resumeId, 
        resumeData 
      })
    } catch (error) {
      console.error('Error deleting work experience:', error)
    }
  }

  // Handle text highlighting for note creation
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) {
      const text = selection.toString()
      setHighlightText(text)
      
      // Store selection range and parent element for later use
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        selectionRef.current = {
          range: range.cloneRange(),
          text,
          parentElement: range.commonAncestorContainer.parentElement
        }
        
        // Calculate position for popover
        const rect = range.getBoundingClientRect()
        if (detailsRef.current) {
          const detailsRect = detailsRef.current.getBoundingClientRect()
          setHighlightPosition({
            x: rect.left - detailsRect.left + rect.width / 2,
            y: rect.top - detailsRect.top
          })
        }
        
        setIsNotePopoverOpen(true)
      }
    }
  }

  // Handle saving a note
  const handleSaveNote = async () => {
    if (!selectedItem || !highlightText || !noteText) return
    
    try {
      const noteData = {
        identifier: `work_exp:${selectedItem.company_name}:${selectedItem.job_title}`,
        note: noteText,
        section: 'work_experience',
        selected_text: highlightText,
        context: selectionRef.current.parentElement ? {
          beforeText: selectionRef.current.parentElement.textContent?.split(highlightText)[0] || '',
          afterText: selectionRef.current.parentElement.textContent?.split(highlightText)[1] || '',
          parentElement: selectionRef.current.parentElement.tagName
        } : undefined
      }
      
      // Add note and update UI
      const createdNote = await createNoteMutation.mutateAsync({
        resumeId: selectedItem.resumeId,
        noteData
      })
      
      // Close the note popover and reset form
      setHighlightText('')
      setNoteText('')
      setIsNotePopoverOpen(false)
      
      // Update the notes list immediately
      setNotes(prev => [...prev, createdNote])
      
      // Show success message
      toast({
        title: "Success",
        description: "Note added successfully",
      })
    } catch (error) {
      console.error('Error saving note:', error)
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      })
    }
  }

  // Handle deleting a note
  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNoteMutation.mutateAsync(noteId)
      setNotes(notes.filter(note => note.id !== noteId))
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  // Handle edit note button click
  const handleEditNoteClick = (note: Note) => {
    setSelectedNote(note)
    setEditedNoteText(note.note)
    setIsEditNoteDialogOpen(true)
  }
  
  // Handle saving edited note
  const handleSaveEditedNote = async () => {
    if (!selectedNote || !editedNoteText) return
    
    try {
      await updateNote(selectedNote.id, { note: editedNoteText })
      
      // Update the note in the UI immediately
      setNotes(prev => prev.map(note => 
        note.id === selectedNote.id 
          ? { ...note, note: editedNoteText } 
          : note
      ))
      
      setIsEditNoteDialogOpen(false)
      toast({
        title: "Success",
        description: "Note updated successfully",
      })
    } catch (error) {
      console.error('Error updating note:', error)
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      })
    }
  }

  // Handle opening add dialog with resume selection
  const handleAddClick = () => {
    if (resumesQuery.data && resumesQuery.data.length > 0) {
      if (resumesQuery.data.length === 1) {
        // If there's only one resume, use it directly
        setSelectedResumeForAdd({
          slug: resumesQuery.data[0].slug,
          title: resumesQuery.data[0].title
        })
        setFormData({
          company_name: '',
          job_title: '',
          duration: '',
          key_responsbilities: ['']
        })
        resetDateFields()
        setIsAddDialogOpen(true)
      } else {
        // If there are multiple resumes, show selection dialog
        setIsResumeSelectDialogOpen(true)
      }
    } else {
      toast({
        title: "No Resumes Found",
        description: "Please create a resume first before adding work experiences.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-4">
      <div className="flex flex-col gap-5 mb-6 top-10 z-10 w-full justify-between items-center ">
        {/* <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Briefcase className="h-5 w-5 text-blue-600" />
          Work Experience
        </h1> */}
        <SectionNav />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel - List of work experiences */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="px-4 py-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-md font-medium">All Experiences</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleAddClick}>
                <Plus className="h-4 w-4" /> Add New
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="relative mb-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search experiences..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <ScrollArea className="h-[calc(100vh-270px)]">
                {resumesQuery.isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="mb-3">
                      <Skeleton className="h-6 w-3/4 mb-1" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))
                ) : (
                  filteredWorkExperiences.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      No work experiences found
                    </div>
                  ) : (
                    filteredWorkExperiences.map((exp: WorkEXP & { resumeId: string, resumeTitle: string }, index: number) => (
                      <div key={`${exp.resumeId}-${index}`} className="mb-3">
                        <div 
                          className={`p-3 rounded-md cursor-pointer hover:bg-slate-50 border-l-4 ${
                            selectedItem === exp ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                          }`}
                          onClick={() => handleSelectItem(exp)}
                        >
                          <div className="font-medium">{exp.job_title}</div>
                          <div className="text-sm text-muted-foreground">{exp.company_name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{exp.duration}</div>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {exp.resumeTitle}
                          </Badge>
                        </div>
                        {index < filteredWorkExperiences.length - 1 && <Separator className="my-2" />}
                      </div>
                    ))
                  )
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        {/* Right panel - Selected experience details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="px-4 py-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-md font-medium">
                {selectedItem ? 'Experience Details' : 'Select an experience'}
              </CardTitle>
              {selectedItem && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8" onClick={handleEditClick}>
                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {!selectedItem ? (
                <div className="flex flex-col items-center justify-center h-[calc(100vh-270px)] text-center text-muted-foreground">
                  <Briefcase className="h-12 w-12 mb-4 text-slate-300" />
                  <p>Select a work experience item to view details</p>
                </div>
              ) : (
                <div onMouseUp={handleTextSelection} ref={detailsRef} className="relative">
                  <Tabs defaultValue="details">
                    <TabsList className="mb-4">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold">{selectedItem.job_title}</h3>
                        <p className="text-muted-foreground">{selectedItem.company_name}</p>
                        <p className="text-sm text-muted-foreground">{selectedItem.duration}</p>
                        <Badge className="mt-2" variant="outline">
                          From: {selectedItem.resumeTitle}
                        </Badge>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Key Responsibilities</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedItem.key_responsbilities.map((resp, idx) => {
                            // Find notes related to this responsibility
                            const respNotes = notes.filter(note => 
                              note.selected_text && resp.includes(note.selected_text)
                            );
                            
                            if (respNotes.length === 0) {
                              // No notes, just render the text
                              return (
                                <li key={idx} className="text-sm">
                                  {resp}
                                </li>
                              );
                            } else {
                              // For simplicity, just highlight the first matching note
                              const note = respNotes[0];
                              const parts = resp.split(note.selected_text);
                              
                              if (parts.length === 1) {
                                return (
                                  <li key={idx} className="text-sm">
                                    {resp}
                                  </li>
                                );
                              }
                              
                              return (
                                <li key={idx} className="text-sm">
                                  {parts[0]}
                                  <span 
                                    className="font-bold underline text-gray-900 cursor-help relative"
                                    onMouseEnter={() => setHoveredNote(note)}
                                    onMouseLeave={() => setHoveredNote(null)}
                                  >
                                    {note.selected_text}
                                    {hoveredNote === note && (
                                      <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-white shadow-lg rounded-md border z-50">
                                        <div className="text-xs text-gray-500 mb-1">Note:</div>
                                        <div className="text-sm font-normal">{note.note}</div>
                                      </div>
                                    )}
                                  </span>
                                  {parts[1]}
                                </li>
                              );
                            }
                          })}
                        </ul>
                      </div>
                      
                      {/* Selection popover for adding notes */}
                      {isNotePopoverOpen && highlightPosition && (
                        <div 
                          className="absolute bg-white shadow-lg rounded-md border p-3 z-10 w-80"
                          style={{ 
                            top: `${highlightPosition.y - 10}px`, 
                            left: `${highlightPosition.x - 40}px`,
                            transform: 'translate(-50%, -100%)'
                          }}
                        >
                          <div className="mb-2 font-medium">Add Note</div>
                          <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                            {highlightText}
                          </div>
                          <Textarea 
                            placeholder="Enter your note" 
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="mb-2"
                          />
                          <div className="flex justify-between">
                            <div className="flex space-x-1">
                              <Button size="sm" variant="outline" className="px-2 py-1 h-7">
                                <Bold className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" className="px-2 py-1 h-7">
                                <Underline className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <div className="flex space-x-1">
                              <Button size="sm" variant="outline" onClick={() => setIsNotePopoverOpen(false)}>
                                Cancel
                              </Button>
                              <Button size="sm" onClick={handleSaveNote}>
                                Save Note
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="notes">
                      <div className="space-y-4">
                        <div className="p-4 border rounded-md">
                          <h4 className="font-medium mb-2">How to Add Notes</h4>
                          <p className="text-sm text-muted-foreground">
                            Select text in the details tab to create a note. Notes will highlight text and make it actionable.
                          </p>
                        </div>
                        
                        <h4 className="font-medium">Existing Notes</h4>
                        
                        {notesQuery.isLoading ? (
                          <div className="space-y-2">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                          </div>
                        ) : notes.length === 0 ? (
                          <div className="text-muted-foreground text-sm text-center py-4">
                            No notes added yet
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {notes.map(note => (
                              <div key={note.id} className="p-3 border rounded-md">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm font-medium">
                                    "{note.selected_text}"
                                  </div>
                                  <div className="flex space-x-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 text-blue-500" 
                                      onClick={() => handleEditNoteClick(note)}
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 text-red-500" 
                                      onClick={() => handleDeleteNote(note.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm">{note.note}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Edit Work Experience Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Work Experience</DialogTitle>
            <DialogDescription>
              Update the details of this work experience.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                name="job_title"
                value={formData.job_title}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid gap-2">
              <Label>Duration</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm mb-1 block">Start Date</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <select
                        value={startMonth}
                        onChange={(e) => setStartMonth(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Month</option>
                        {months.map(month => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={startYear}
                        onChange={(e) => setStartYear(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Year</option>
                        {years.map(year => (
                          <option key={year.value} value={year.value}>
                            {year.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_present"
                    checked={isPresent}
                    onChange={(e) => {
                      setIsPresent(e.target.checked);
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is_present" className="text-sm font-normal">
                    I currently work here
                  </Label>
                </div>
                
                {!isPresent && (
                  <div>
                    <Label className="text-sm mb-1 block">End Date</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <select
                          value={endMonth}
                          onChange={(e) => setEndMonth(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Month</option>
                          {months.map(month => (
                            <option key={month.value} value={month.value}>
                              {month.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={endYear}
                          onChange={(e) => setEndYear(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Year</option>
                          {years.map(year => (
                            <option key={year.value} value={year.value}>
                              {year.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                
                {startMonth && startYear && (
                  <div className="text-sm text-muted-foreground">
                    Duration: {formData.duration}
                  </div>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Key Responsibilities</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addResponsibility}>
                  <Plus className="h-4 w-4" /> Add 
                </Button>
              </div>
              {formData.key_responsbilities?.map((resp, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={resp}
                    onChange={(e) => handleResponsibilityChange(index, e.target.value)}
                    placeholder={`Responsibility ${index + 1}`}
                  />
                  {formData.key_responsbilities!.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      className="h-10 w-10 text-red-500"
                      onClick={() => removeResponsibility(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveWorkExperience}
              disabled={updateResumeMutation.isPending || !hasValidDates()}
            >
              {updateResumeMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Work Experience Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Work Experience</DialogTitle>
            <DialogDescription>
              Add a new work experience to your resume.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add_job_title">Job Title</Label>
              <Input
                id="add_job_title"
                name="job_title"
                value={formData.job_title}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add_company_name">Company Name</Label>
              <Input
                id="add_company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid gap-2">
              <Label>Duration</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm mb-1 block">Start Date</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <select
                        value={startMonth}
                        onChange={(e) => setStartMonth(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Month</option>
                        {months.map(month => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={startYear}
                        onChange={(e) => setStartYear(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Year</option>
                        {years.map(year => (
                          <option key={year.value} value={year.value}>
                            {year.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="add_is_present"
                    checked={isPresent}
                    onChange={(e) => {
                      setIsPresent(e.target.checked);
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="add_is_present" className="text-sm font-normal">
                    I currently work here
                  </Label>
                </div>
                
                {!isPresent && (
                  <div>
                    <Label className="text-sm mb-1 block">End Date</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <select
                          value={endMonth}
                          onChange={(e) => setEndMonth(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Month</option>
                          {months.map(month => (
                            <option key={month.value} value={month.value}>
                              {month.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={endYear}
                          onChange={(e) => setEndYear(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Year</option>
                          {years.map(year => (
                            <option key={year.value} value={year.value}>
                              {year.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                
                {startMonth && startYear && (
                  <div className="text-sm text-muted-foreground">
                    Duration: {formData.duration}
                  </div>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Key Responsibilities</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addResponsibility}>
                  <Plus className="h-4 w-4" /> Add 
                </Button>
              </div>
              {formData.key_responsbilities?.map((resp, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={resp}
                    onChange={(e) => handleResponsibilityChange(index, e.target.value)}
                    placeholder={`Responsibility ${index + 1}`}
                  />
                  {formData.key_responsbilities!.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      className="h-10 w-10 text-red-500"
                      onClick={() => removeResponsibility(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveWorkExperience}
              disabled={updateResumeMutation.isPending || !hasValidDates()}
            >
              {updateResumeMutation.isPending ? "Saving..." : "Add Experience"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this work experience entry from your resume.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteWorkExperience}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Resume Selection Dialog */}
      <Dialog open={isResumeSelectDialogOpen} onOpenChange={setIsResumeSelectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Resume</DialogTitle>
            <DialogDescription>
              Choose which resume to add this work experience to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {resumesQuery.data?.map((resume) => (
                <div 
                  key={resume.slug}
                  className="p-3 border rounded-md cursor-pointer hover:bg-slate-50"
                  onClick={() => handleResumeSelect({ slug: resume.slug, title: resume.title })}
                >
                  <div className="font-medium">{resume.title}</div>
                  <div className="text-sm text-muted-foreground">
                    Last updated: {new Date(resume.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsResumeSelectDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Note Dialog */}
      <Dialog open={isEditNoteDialogOpen} onOpenChange={setIsEditNoteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Update your note for the selected text.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedNote && (
              <>
                <div className="mb-4">
                  <Label>Selected Text</Label>
                  <div className="p-2 mt-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    {selectedNote.selected_text}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note_text">Note</Label>
                  <Textarea 
                    id="note_text"
                    value={editedNoteText}
                    onChange={(e) => setEditedNoteText(e.target.value)}
                    placeholder="Enter your note"
                    className="min-h-[100px]"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveEditedNote}
              disabled={!editedNoteText}
            >
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Separator } from '~/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { ArrowLeft, BookOpen, Edit, Plus, Trash2, Search, Calendar, Link as LinkIcon, Bold, Underline } from 'lucide-react'
import { Input } from '~/components/ui/input'
import { Skeleton } from '~/components/ui/skeleton'
import { Badge } from '~/components/ui/badge'
import { Textarea } from '~/components/ui/textarea'
import Link from 'next/link'
import { SectionNav } from '~/components/ui/section-nav'
import { getAllResume } from '~/app/(app)/dashboard/queries'
import { ResumeData, Education } from '~/app/(app)/dashboard/resume/types'
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

export default function EducationPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<Education & { resumeId: string, resumeTitle: string } | null>(null)
  const [highlightText, setHighlightText] = useState('')
  const [highlightPosition, setHighlightPosition] = useState<{ x: number, y: number } | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isResumeSelectDialogOpen, setIsResumeSelectDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedResumeForAdd, setSelectedResumeForAdd] = useState<{ slug: string, title: string } | null>(null)
  const [formData, setFormData] = useState<Partial<Education>>({
    title: '',
    description: '',
    dt: '',
    url: ''
  })
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
  
  // Fetch all resumes to extract education entries
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
          ? "Education updated successfully" 
          : "New education added successfully",
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

  // Mutation for deleting education
  const deleteEducationMutation = useMutation({
    mutationFn: async ({ resumeId, resumeData }: { resumeId: string, resumeData: ResumeData }) => {
      return updateResumeData(resumeId, resumeData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-resume'] })
      setSelectedItem(null)
      setIsDeleteDialogOpen(false)
      toast({
        title: "Success",
        description: "Education deleted successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete education: ${error.message}`,
        variant: "destructive",
      })
    }
  })

  // Extract all education items from all resumes
  const educationEntries = resumesQuery.data?.flatMap((resume: any) => {
    if (!resume.resume_data) return []
    
    let resumeData: ResumeData
    try {
      if (typeof resume.resume_data === 'string') {
        resumeData = JSON.parse(resume.resume_data)
      } else {
        resumeData = resume.resume_data
      }
      
      return (resumeData.education || []).map((edu: Education) => ({
        ...edu,
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

  // Filter education entries based on search query
  const filteredEducation = educationEntries.filter((edu: Education & { resumeId: string, resumeTitle: string }) => 
    edu.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    edu.description.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Handle item selection
  const handleSelectItem = (item: Education & { resumeId: string, resumeTitle: string }) => {
    setSelectedItem(item)
  }

  // Handle opening edit dialog
  const handleEditClick = () => {
    if (selectedItem) {
      setFormData({
        title: selectedItem.title,
        description: selectedItem.description,
        dt: selectedItem.dt,
        url: selectedItem.url
      })
      setIsEditDialogOpen(true)
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
          title: '',
          description: '',
          dt: '',
          url: ''
        })
        setIsAddDialogOpen(true)
      } else {
        // If there are multiple resumes, show selection dialog
        setIsResumeSelectDialogOpen(true)
      }
    } else {
      toast({
        title: "No Resumes Found",
        description: "Please create a resume first before adding education entries.",
        variant: "destructive",
      })
    }
  }
  
  // Handle resume selection for adding new education
  const handleResumeSelect = (resume: { slug: string, title: string }) => {
    setSelectedResumeForAdd(resume)
    setIsResumeSelectDialogOpen(false)
    setFormData({
      title: '',
      description: '',
      dt: '',
      url: ''
    })
    setIsAddDialogOpen(true)
  }

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Save education (edit or add)
  const handleSaveEducation = async () => {
    if ((!selectedItem && !formData.title) || (!selectedItem && !formData.description)) {
      toast({
        title: "Validation Error",
        description: "Title and description are required",
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
        
        // Find index of the education to update
        const eduIndex = resumeData.education.findIndex(
          edu => 
            edu.title === selectedItem.title && 
            edu.description === selectedItem.description
        )
        
        if (eduIndex !== -1) {
          // Update existing education
          resumeData.education[eduIndex] = formData as Education
          await updateResumeMutation.mutateAsync({ 
            resumeId: selectedItem.resumeId, 
            resumeData 
          })
          
          // Immediately update the UI by updating selectedItem
          setSelectedItem({
            ...formData as Education,
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
        
        // Add new education
        resumeData.education.push(formData as Education)
        await updateResumeMutation.mutateAsync({ 
          resumeId: selectedResumeForAdd.slug, 
          resumeData 
        })
        
        // Immediately select the newly added item
        const newEducation = {
          ...formData as Education,
          resumeId: selectedResumeForAdd.slug,
          resumeTitle: selectedResumeForAdd.title
        }
        setSelectedItem(newEducation)
        
        // Clear the selected resume
        setSelectedResumeForAdd(null)
      }
    } catch (error) {
      console.error('Error updating education:', error)
      toast({
        title: "Error",
        description: "Failed to save education",
        variant: "destructive",
      })
    }
  }

  // Handle delete education
  const handleDeleteEducation = async () => {
    if (!selectedItem) return
    
    try {
      const resumeDetails = await getResumeDetails(selectedItem.resumeId)
      let resumeData: ResumeData
      
      if (typeof resumeDetails.resume_data === 'string') {
        resumeData = JSON.parse(resumeDetails.resume_data)
      } else {
        resumeData = resumeDetails.resume_data
      }
      
      // Filter out the education to delete
      resumeData.education = resumeData.education.filter(
        edu => 
          !(edu.title === selectedItem.title && 
            edu.description === selectedItem.description)
      )
      
      await deleteEducationMutation.mutateAsync({ 
        resumeId: selectedItem.resumeId, 
        resumeData 
      })
    } catch (error) {
      console.error('Error deleting education:', error)
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
        identifier: `education:${selectedItem.title}`,
        note: noteText,
        section: 'education',
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

  // Handle deleting a note
  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNoteMutation.mutateAsync(noteId)
      setNotes(notes.filter(note => note.id !== noteId))
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  return (
    <div className="p-4">
      <div className="flex flex-col gap-5 mb-6 top-10 z-10 w-full justify-between items-center ">
        {/* <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          Education
        </h1> */}
        <SectionNav />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel - List of education entries */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="px-4 py-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-md font-medium">All Education</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleAddClick}>
                <Plus className="h-4 w-4" /> Add New
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="relative mb-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search education..."
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
                  filteredEducation.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      No education entries found
                    </div>
                  ) : (
                    filteredEducation.map((edu: Education & { resumeId: string, resumeTitle: string }, index: number) => (
                      <div key={`${edu.resumeId}-${index}`} className="mb-3">
                        <div 
                          className={`p-3 rounded-md cursor-pointer hover:bg-slate-50 border-l-4 ${
                            selectedItem === edu ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                          }`}
                          onClick={() => handleSelectItem(edu)}
                        >
                          <div className="font-medium">{edu.title}</div>
                          <div className="text-sm text-muted-foreground truncate">{edu.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">{edu.dt}</div>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {edu.resumeTitle}
                          </Badge>
                        </div>
                        {index < filteredEducation.length - 1 && <Separator className="my-2" />}
                      </div>
                    ))
                  )
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        {/* Right panel - Selected education details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="px-4 py-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-md font-medium">
                {selectedItem ? 'Education Details' : 'Select an education entry'}
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
                  <BookOpen className="h-12 w-12 mb-4 text-slate-300" />
                  <p>Select an education entry to view details</p>
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
                        <h3 className="text-lg font-semibold">{selectedItem.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{selectedItem.dt}</span>
                        </div>
                        
                        {selectedItem.url && (
                          <div className="flex items-center gap-2 text-sm text-blue-600 mt-1">
                            <LinkIcon className="h-3.5 w-3.5" />
                            <a href={selectedItem.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {selectedItem.url}
                            </a>
                          </div>
                        )}
                        
                        <Badge className="mt-2" variant="outline">
                          From: {selectedItem.resumeTitle}
                        </Badge>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm whitespace-pre-wrap">
                          {notes.length === 0 ? (
                            selectedItem.description
                          ) : (
                            (() => {
                              // Find notes related to the description
                              const descNotes = notes.filter(note => 
                                note.selected_text && selectedItem.description.includes(note.selected_text)
                              );
                              
                              if (descNotes.length === 0) {
                                return selectedItem.description;
                              } else {
                                // For simplicity, just highlight the first matching note
                                const note = descNotes[0];
                                const parts = selectedItem.description.split(note.selected_text);
                                
                                if (parts.length === 1) {
                                  return selectedItem.description;
                                }
                                
                                return (
                                  <>
                                    {parts[0]}
                                    <span 
                                      className="font-bold underline text-blue-600 cursor-help relative"
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
                                  </>
                                );
                              }
                            })()
                          )}
                        </p>
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
      
      {/* Edit Education Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Education</DialogTitle>
            <DialogDescription>
              Update the details of this education entry.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Degree</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Bachelor of Science in Computer Science"
                value={formData.title}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">University/Board</Label>
              <Input
                id="description"
                name="description"
                placeholder="e.g., Harvard University"
                value={formData.description}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dt">Year</Label>
              <Input
                id="dt"
                name="dt"
                placeholder="e.g., 2018-2022"
                value={formData.dt}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL (Optional)</Label>
              <Input
                id="url"
                name="url"
                placeholder="e.g., https://university.edu"
                value={formData.url}
                onChange={handleFormChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveEducation}
              disabled={updateResumeMutation.isPending}
            >
              {updateResumeMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Education Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Education</DialogTitle>
            <DialogDescription>
              Add a new education entry to your resume.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add_title">Degree</Label>
              <Input
                id="add_title"
                name="title"
                placeholder="e.g., Bachelor of Science in Computer Science"
                value={formData.title}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add_description">University/Board</Label>
              <Input
                id="add_description"
                name="description"
                placeholder="e.g., Harvard University"
                value={formData.description}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add_dt">Year</Label>
              <Input
                id="add_dt"
                name="dt"
                placeholder="e.g., 2018-2022"
                value={formData.dt}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add_url">URL (Optional)</Label>
              <Input
                id="add_url"
                name="url"
                placeholder="e.g., https://university.edu"
                value={formData.url}
                onChange={handleFormChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveEducation}
              disabled={updateResumeMutation.isPending}
            >
              {updateResumeMutation.isPending ? "Saving..." : "Add Education"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Selection Dialog */}
      <Dialog open={isResumeSelectDialogOpen} onOpenChange={setIsResumeSelectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Resume</DialogTitle>
            <DialogDescription>
              Choose which resume to add this education entry to.
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this education entry from your resume.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEducation}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
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
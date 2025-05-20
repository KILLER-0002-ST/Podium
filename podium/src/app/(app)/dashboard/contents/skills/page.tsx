'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { ArrowLeft, Code, Edit, Plus, Trash2, Search, Bold, Underline } from 'lucide-react'
import { Input } from '~/components/ui/input'
import { Skeleton } from '~/components/ui/skeleton'
import { Badge } from '~/components/ui/badge'
import { Textarea } from '~/components/ui/textarea'
import Link from 'next/link'
import { SectionNav } from '~/components/ui/section-nav'
import { getAllResume } from '~/app/(app)/dashboard/queries'
import { ResumeData, Skill } from '~/app/(app)/dashboard/resume/types'
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
// import { useRouter } from 'next/navigation'
// import { zodResolver } from "@hookform/resolvers/zod"
// import { useForm } from "react-hook-form"
// import { FaTrash, FaPen, FaPlus, FaRegStickyNote } from "react-icons/fa"
// import {
//   Table,
//   TableBody,
//   TableCaption,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "~/components/ui/table"
// import { Slider } from "~/components/ui/slider"
// import { ScrollArea } from "~/components/ui/scroll-area"

export default function SkillsPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<Skill & { resumeId: string, resumeTitle: string } | null>(null)
  const [highlightText, setHighlightText] = useState('')
  const [highlightPosition, setHighlightPosition] = useState<{ x: number, y: number } | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isResumeSelectDialogOpen, setIsResumeSelectDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedResumeForAdd, setSelectedResumeForAdd] = useState<{ slug: string, title: string } | null>(null)
  const [formData, setFormData] = useState<Partial<Skill>>({
    name: '',
    level: 5
  })
  const [noteText, setNoteText] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [isNotePopoverOpen, setIsNotePopoverOpen] = useState(false)
  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [editedNoteText, setEditedNoteText] = useState('')
  const [hoveredNote, setHoveredNote] = useState<Note | null>(null)
  const detailsRef = useRef<HTMLDivElement>(null)
  const selectionRef = useRef<{ 
    range: Range | null, 
    text: string, 
    parentElement: Element | null 
  }>({ range: null, text: '', parentElement: null })
  
  // Fetch all resumes to extract skills entries
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
          ? "Skill updated successfully" 
          : "New skill added successfully",
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

  // Mutation for deleting skill
  const deleteSkillMutation = useMutation({
    mutationFn: async ({ resumeId, resumeData }: { resumeId: string, resumeData: ResumeData }) => {
      return updateResumeData(resumeId, resumeData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-resume'] })
      setSelectedItem(null)
      setIsDeleteDialogOpen(false)
      toast({
        title: "Success",
        description: "Skill deleted successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete skill: ${error.message}`,
        variant: "destructive",
      })
    }
  })

  // Extract all skill items from all resumes
  const skillEntries = resumesQuery.data?.flatMap((resume: any) => {
    if (!resume.resume_data) return []
    
    let resumeData: ResumeData
    try {
      if (typeof resume.resume_data === 'string') {
        resumeData = JSON.parse(resume.resume_data)
      } else {
        resumeData = resume.resume_data
      }
      
      return (resumeData.skills || []).map((skill: Skill) => ({
        ...skill,
        resumeId: resume.slug,
        resumeTitle: resume.title
      }))
    } catch (error) {
      console.error('Error parsing resume data:', error)
      return []
    }
  }) || []

  // Filter skills based on search query
  const filteredSkills = skillEntries.filter((skill: Skill & { resumeId: string, resumeTitle: string }) => 
    skill.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Handle item selection
  const handleSelectItem = (item: Skill & { resumeId: string, resumeTitle: string }) => {
    setSelectedItem(item)
  }

  // Handle opening edit dialog
  const handleEditClick = () => {
    if (selectedItem) {
      setFormData({
        name: selectedItem.name,
        level: selectedItem.level || 5
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
          name: '',
          level: 5
        })
        setIsAddDialogOpen(true)
      } else {
        // If there are multiple resumes, show selection dialog
        setIsResumeSelectDialogOpen(true)
      }
    } else {
      toast({
        title: "No Resumes Found",
        description: "Please create a resume first before adding skills.",
        variant: "destructive",
      })
    }
  }
  
  // Handle resume selection for adding new skill
  const handleResumeSelect = (resume: { slug: string, title: string }) => {
    setSelectedResumeForAdd(resume)
    setIsResumeSelectDialogOpen(false)
    setFormData({
      name: '',
      level: 5
    })
    setIsAddDialogOpen(true)
  }

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle level slider change
  const handleLevelChange = (value: number) => {
    setFormData(prev => ({ ...prev, level: value }))
  }

  // Save skill (edit or add)
  const handleSaveSkill = async () => {
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Skill name is required",
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
        
        // Find index of the skill to update
        const skillIndex = resumeData.skills.findIndex(
          skill => skill.name === selectedItem.name
        )
        
        if (skillIndex !== -1) {
          // Update existing skill
          resumeData.skills[skillIndex] = formData as Skill
          await updateResumeMutation.mutateAsync({ 
            resumeId: selectedItem.resumeId, 
            resumeData 
          })
          
          // Immediately update the UI by updating selectedItem
          setSelectedItem({
            ...formData as Skill,
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
        
        // Add new skill
        resumeData.skills.push(formData as Skill)
        await updateResumeMutation.mutateAsync({ 
          resumeId: selectedResumeForAdd.slug, 
          resumeData 
        })
        
        // Immediately select the newly added item
        const newSkill = {
          ...formData as Skill,
          resumeId: selectedResumeForAdd.slug,
          resumeTitle: selectedResumeForAdd.title
        }
        setSelectedItem(newSkill)
        
        // Clear the selected resume
        setSelectedResumeForAdd(null)
      }
    } catch (error) {
      console.error('Error updating skill:', error)
      toast({
        title: "Error",
        description: "Failed to save skill",
        variant: "destructive",
      })
    }
  }

  // Handle delete skill
  const handleDeleteSkill = async () => {
    if (!selectedItem) return
    
    try {
      const resumeDetails = await getResumeDetails(selectedItem.resumeId)
      let resumeData: ResumeData
      
      if (typeof resumeDetails.resume_data === 'string') {
        resumeData = JSON.parse(resumeDetails.resume_data)
      } else {
        resumeData = resumeDetails.resume_data
      }
      
      // Filter out the skill to delete
      resumeData.skills = resumeData.skills.filter(
        skill => skill.name !== selectedItem.name
      )
      
      await deleteSkillMutation.mutateAsync({ 
        resumeId: selectedItem.resumeId, 
        resumeData 
      })
    } catch (error) {
      console.error('Error deleting skill:', error)
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
        identifier: `skill:${selectedItem.name}`,
        note: noteText,
        section: 'skills',
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
          <Code className="h-5 w-5 text-blue-600" />
          Skills
        </h1> */}
        <SectionNav />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left panel - List of skills */}
        <div>
          <Card>
            <CardHeader className="px-4 py-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-md font-medium">All Skills</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleAddClick}>
                <Plus className="h-4 w-4" /> Add New
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="relative mb-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search skills..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="h-[calc(100vh-270px)] overflow-auto pr-2">
                {resumesQuery.isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="mb-3">
                      <Skeleton className="h-6 w-3/4 mb-1" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))
                ) : (
                  filteredSkills.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      No skills found
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {filteredSkills.map((skill, index) => (
                        <div 
                          key={`${skill.resumeId}-${index}`}
                          className={`p-2 rounded-md cursor-pointer border ${
                            selectedItem === skill 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => handleSelectItem(skill)}
                        >
                          <div className="font-medium">{skill.name}</div>
                          {skill.level && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Level: {skill.level}/10
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right panel - Selected skill details */}
        <div>
          <Card>
            <CardHeader className="px-4 py-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-md font-medium">
                {selectedItem ? 'Skill Details' : 'Select a skill'}
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
                  <Code className="h-12 w-12 mb-4 text-slate-300" />
                  <p>Select a skill to view details</p>
                </div>
              ) : (
                <div onMouseUp={handleTextSelection} ref={detailsRef} className="relative space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedItem.name}</h3>
                    {selectedItem.level && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-1">Proficiency Level</p>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${(selectedItem.level / 10) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-right mt-1 text-muted-foreground">{selectedItem.level}/10</p>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Associated Resume</h4>
                      <Badge variant="outline">
                        {selectedItem.resumeTitle}
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    {notesQuery.isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ) : notes.length === 0 ? (
                      <div className="text-muted-foreground text-sm">
                        No notes added yet. Select text above to add a note.
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Edit Skill Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
            <DialogDescription>
              Update the skill's details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="skill_name">Skill Name</Label>
              <Input
                id="skill_name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="skill_level">Proficiency Level</Label>
                <span className="text-sm text-muted-foreground">{formData.level}/10</span>
              </div>
              <input
                type="range"
                id="skill_level"
                min="1"
                max="10"
                step="1"
                value={formData.level}
                onChange={(e) => handleLevelChange(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Beginner</span>
                <span>Intermediate</span>
                <span>Expert</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSkill} disabled={updateResumeMutation.isPending}>
              {updateResumeMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Skill Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Skill</DialogTitle>
            <DialogDescription>
              Enter the details for your new skill.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add_skill_name">Skill Name</Label>
              <Input
                id="add_skill_name"
                name="name"
                placeholder="e.g., JavaScript, React, Python"
                value={formData.name}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="add_skill_level">Proficiency Level</Label>
                <span className="text-sm text-muted-foreground">{formData.level}/10</span>
              </div>
              <input
                type="range"
                id="add_skill_level"
                min="1"
                max="10"
                step="1"
                value={formData.level}
                onChange={(e) => handleLevelChange(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Beginner</span>
                <span>Intermediate</span>
                <span>Expert</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSkill} disabled={updateResumeMutation.isPending}>
              {updateResumeMutation.isPending ? "Saving..." : "Add Skill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Selection Dialog */}
      <Dialog open={isResumeSelectDialogOpen} onOpenChange={setIsResumeSelectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Resume</DialogTitle>
            <DialogDescription>
              Choose which resume to add this skill to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
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
            <Button variant="outline" onClick={() => setIsResumeSelectDialogOpen(false)}>
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
              This will permanently delete this skill from your resume.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSkill}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Note Dialog */}
      <Dialog open={isEditNoteDialogOpen} onOpenChange={setIsEditNoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
            <Button variant="outline" onClick={() => setIsEditNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
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
'use client'

import { encryptResumeData, hashPassword } from '../queries'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import { Copy, Check, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import type { ResumeData } from '../../types'
import { TemplatePicker } from './template-picker'
import { templates } from './templates/types'
import { Note } from '../queries'

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
  resumeSlug: string
  resumeData: ResumeData
  notes?: Note[]
}

export function ShareDialog({ isOpen, onClose, resumeSlug, resumeData, notes = [] }: ShareDialogProps) {
  const [isPasswordProtected, setIsPasswordProtected] = useState(false)
  const [password, setPassword] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('base')
  const [includeNotes, setIncludeNotes] = useState(true)
  const [includeChatbot, setIncludeChatbot] = useState(true)
  const [shareLink, setShareLink] = useState<{ url: string; password?: string } | null>(null)
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})

  const handleGenerateLink = async () => {
    try {
      // Create a copy of resumeData with notes if needed
      const dataToShare = { 
        ...resumeData,
        notes: includeNotes ? notes : [] 
      }
      
      const encryptedData = encryptResumeData(dataToShare)

      let passwordHash = undefined
      if (isPasswordProtected && password) {
        passwordHash = await hashPassword(password)
      }

      const baseUrl = window.location.origin
      let shareUrl = `${baseUrl}/resume/shared/${resumeSlug}?data=${encodeURIComponent(encryptedData)}&template=${selectedTemplate}`
      
      // Add chatbot parameter if enabled
      if (includeChatbot) {
        shareUrl += `&chatbot=true`
      }

      const link = {
        url: passwordHash ? `${shareUrl}&key=${encodeURIComponent(passwordHash)}` : shareUrl,
        password: isPasswordProtected ? password : undefined
      }

      setShareLink(link)
    } catch (error) {
      console.error('Error generating share link:', error)
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)

    // Set the copied state for the specific text
    setCopied((prev) => ({ ...prev, [text]: true }))

    setTimeout(() => {
      setCopied((prev) => ({ ...prev, [text]: false }))
    }, 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Resume</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!shareLink ? (
            <>
              <div className="space-y-2">
                <Label>Choose Template</Label>
                <TemplatePicker
                  currentTemplate={selectedTemplate}
                  onSelect={setSelectedTemplate}
                  resumeData={resumeData}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="include-notes"
                  checked={includeNotes}
                  onCheckedChange={setIncludeNotes}
                />
                <Label htmlFor="include-notes">Include notes and highlights</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="include-chatbot"
                  checked={includeChatbot}
                  onCheckedChange={setIncludeChatbot}
                />
                <Label htmlFor="include-chatbot" className="flex items-center">
                  <MessageCircle className="h-4 w-4 mr-2 text-gray-500" />
                  Include resume assistant (chatbot)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="password-protection"
                  checked={isPasswordProtected}
                  onCheckedChange={setIsPasswordProtected}
                />
                <Label htmlFor="password-protection">Password protect</Label>
              </div>

              {isPasswordProtected && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
              )}

              <Button
                onClick={handleGenerateLink}
                disabled={isPasswordProtected && !password}
              >
                Generate Link
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Shareable Link</Label>
                <div className="flex gap-2">
                  <Input value={shareLink.url} readOnly />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(shareLink.url)}
                  >
                    {copied[shareLink.url] ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {shareLink.password && (
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="flex gap-2">
                    <Input value={shareLink.password} readOnly />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(shareLink.password!)}
                    >
                      {copied[shareLink.password!] ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Share this password separately with the people you want to give access to.
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setShareLink(null)
                  setPassword('')
                  setIsPasswordProtected(false)
                }}
              >
                Generate New Link
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
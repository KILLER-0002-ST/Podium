'use client'

import React, { useState, useRef, useEffect } from 'react'
import { sendChatPrompt } from '../queries'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { Card } from '~/components/ui/card'
import { cn } from '~/lib/utils'
import { Bot, Send, User, Sparkles } from 'lucide-react'

type MessageType = 'user' | 'assistant' | 'system'

interface Message {
  id: string
  content: string
  type: MessageType
  timestamp: Date
}

interface DashboardChatProps {
  resumeSlug: string
}

export function DashboardChat({ resumeSlug }: DashboardChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your Resume Assistant. Ask me anything about your resume, and I'll provide insights and answer your questions.",
      type: 'system',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messageContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of messages on new message
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-focus textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      type: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Call the API using the same endpoint as the original chatbot
      const response = await sendChatPrompt(inputValue, resumeSlug)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        type: 'assistant',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        type: 'assistant',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      // Focus back on textarea after sending
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send message on Enter (without Shift key)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="flex flex-col h-full p-0 border bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
      {/* Chat history */}
      <div 
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
        style={{ scrollbarWidth: 'thin' }}
      >
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={cn(
              "flex items-start gap-3 mb-6",
              message.type === 'user' && "justify-end"
            )}
          >
            {message.type !== 'user' && (
              <div 
                className={cn(
                  "rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0",
                  message.type === 'system'
                    ? "bg-purple-100 text-purple-600"
                    : "bg-primary/10 text-primary"
                )}
              >
                {message.type === 'system' ? (
                  <Sparkles className="h-5 w-5" />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </div>
            )}
            
            <div className={cn(
              "flex flex-col",
              message.type === 'user' ? "items-end" : "items-start"
            )}>
              <div 
                className={cn(
                  "px-4 py-3 rounded-2xl shadow-sm",
                  message.type === 'user' 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : message.type === 'system'
                    ? "bg-purple-100 text-purple-900 rounded-tl-none"
                    : "bg-muted text-foreground rounded-tl-none"
                )}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              </div>
              <div className="text-[11px] mt-1.5 opacity-70 px-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            
            {message.type === 'user' && (
              <div className="rounded-full w-9 h-9 bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start gap-3 mb-6">
            <div className="rounded-full w-9 h-9 bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            <div className="bg-muted text-foreground px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t bg-background mt-auto">
        <div className="flex gap-3 items-end">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[60px] max-h-[120px] resize-none rounded-xl px-4 py-3 bg-muted/50"
            disabled={isLoading}
          />
          <Button
            className="rounded-full h-12 w-12 p-0 flex-shrink-0 shadow-sm"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  )
} 
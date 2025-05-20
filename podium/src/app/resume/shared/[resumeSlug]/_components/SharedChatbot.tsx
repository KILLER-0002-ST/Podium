'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { cn } from '~/lib/utils';
import { sendSharedChatbotPrompt } from '../queries';
import type { ResumeData } from '../../../../(app)/dashboard/resume/types';
import { useParams } from 'next/navigation';

// Import the ChatMessage and ChatInput components from the original Chatbot
import { ChatMessage, type MessageType } from '../../../../(app)/dashboard/resume/[resumeSlug]/_components/chatbot/ChatMessage';
import { ChatInput } from '../../../../(app)/dashboard/resume/[resumeSlug]/_components/chatbot/ChatInput';

interface Message {
  id: string;
  content: string;
  type: MessageType;
  timestamp: Date;
}

interface SharedChatbotProps {
  resumeData: ResumeData;
}

export const SharedChatbot: React.FC<SharedChatbotProps> = ({ resumeData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hi there! Ask me anything about my resume.',
      type: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const params = useParams<{ resumeSlug: string }>();
  const resumeSlug = params.resumeSlug;

  // Scroll to bottom of messages on new message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleOpen = () => {
    setIsOpen((prev) => !prev);
    if (isFullScreen) {
      setIsFullScreen(false);
    }
  };

  const handleToggleFullScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullScreen((prev) => !prev);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      type: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call the API with the actual resumeSlug from params
      const response = await sendSharedChatbotPrompt(content, resumeData, resumeSlug);

      // Add bot response to chat
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        type: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      // Add error message if API call fails
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I had trouble processing that request. Please try again.',
        type: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error('Error sending message to chatbot:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'fixed z-50 transition-all duration-300 ease-in-out',
        isFullScreen
          ? 'inset-4 md:inset-10'
          : isOpen
          ? 'bottom-4 right-4 w-80 h-96 md:w-96 md:h-[450px]'
          : 'bottom-4 right-4'
      )}
    >
      {isOpen ? (
        <Card className="flex h-full flex-col shadow-lg">
          <CardHeader className="p-3 flex-shrink-0 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Resume Assistant
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleToggleFullScreen}
                >
                  {isFullScreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {isFullScreen ? 'Minimize' : 'Maximize'}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleToggleOpen}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-3 flex flex-col">
            <div className="flex-1 space-y-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  content={message.content}
                  type={message.type}
                  timestamp={message.timestamp}
                />
              ))}
              <div ref={messagesEndRef} />
              {isLoading && (
                <div className="flex justify-start mb-3">
                  <div className="bg-gray-100 text-gray-800 rounded-lg rounded-tl-none px-3 py-2 text-sm">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <div className="p-3 border-t">
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </Card>
      ) : (
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={handleToggleOpen}
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">Open chat</span>
        </Button>
      )}
    </div>
  );
}; 
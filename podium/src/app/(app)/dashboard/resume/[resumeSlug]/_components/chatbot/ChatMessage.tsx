import React from 'react';
import { cn } from '~/lib/utils';

export type MessageType = 'user' | 'bot';

export interface ChatMessageProps {
  content: string;
  type: MessageType;
  timestamp: Date;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ content, type, timestamp }) => {
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);

  return (
    <div
      className={cn(
        'mb-3 flex',
        type === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2 text-sm',
          type === 'user'
            ? 'bg-blue-500 text-white rounded-tr-none'
            : 'bg-gray-100 text-gray-800 rounded-tl-none'
        )}
      >
        <div className="whitespace-pre-wrap break-words">{content}</div>
        <div
          className={cn(
            'mt-1 text-xs',
            type === 'user' ? 'text-blue-100' : 'text-gray-500'
          )}
        >
          {formattedTime}
        </div>
      </div>
    </div>
  );
}; 
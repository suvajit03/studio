'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/components/providers/user-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Mic, Bot, User, BrainCircuit } from 'lucide-react';
import type { ChatMessage, Contact } from '@/lib/types';
import { cn } from '@/lib/utils';
import { scheduleMeeting } from '@/ai/flows/schedule-meeting';
import { answerQuestion } from '@/ai/flows/answer-questions';
import { modifyWebsite } from '@/ai/flows/modify-website';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface ChatbotWindowProps {
  onClose: () => void;
}

type ChatMode = 'schedule' | 'question' | 'modify';

export default function ChatbotWindow({ onClose }: ChatbotWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm MeetAI. How can I help you? You can ask me to schedule a meeting, answer a question, or even modify this website's description."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, addMeeting } = useUser();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ChatMode>('schedule');

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let response: string;
      if (mode === 'schedule') {
        const result = await scheduleMeeting({
          instruction: input,
          contacts: user.contacts as {name: string, email: string, number?: string}[],
          userName: user.name,
          userLocation: user.location,
          workTime: `${user.workTime.start}-${user.workTime.end}`,
          offDays: user.offDays.join(','),
        });
        response = result.meetingDetails;
        if(result.inviteSent) {
          // In a real app we might create a meeting object from the details
          // For now, we'll just show a toast
          toast({ title: 'Meeting Scheduled!', description: 'Invite has been sent.'});
        }
      } else if (mode === 'question') {
        const result = await answerQuestion({ query: input });
        response = result.answer;
      } else {
        const result = await modifyWebsite({ websiteDescription: 'A meeting scheduler app', desiredChanges: input });
        response = "Okay, I've updated the website description to: " + result.modifiedWebsite;
      }
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
      };
      setMessages((prev) => [...prev, assistantMessage]);

    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[550px] bg-card border shadow-xl rounded-lg flex flex-col">
      <header className="p-4 border-b flex items-center gap-3">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h3 className="text-lg font-semibold font-headline">MeetAI Assistant</h3>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
      </header>
      
      <div className='p-2 border-b'>
        <p className='text-xs text-muted-foreground mb-2 px-1'>Select AI Mode:</p>
        <div className='flex gap-2'>
            <Button size="sm" variant={mode === 'schedule' ? 'default' : 'outline'} onClick={() => setMode('schedule')}>Schedule</Button>
            <Button size="sm" variant={mode === 'question' ? 'default' : 'outline'} onClick={() => setMode('question')}>Q&A</Button>
            <Button size="sm" variant={mode === 'modify' ? 'default' : 'outline'} onClick={() => setMode('modify')}>Modify Site</Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef as any}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-end gap-2',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback><Bot size={20}/></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {message.content}
              </div>
               {message.role === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback><User size={20}/></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <Avatar className="h-8 w-8">
                <AvatarFallback><Bot size={20}/></AvatarFallback>
              </Avatar>
              <div className="max-w-[80%] rounded-lg px-3 py-2 bg-muted flex items-center gap-1">
                <span className="h-2 w-2 bg-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-foreground rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
          />
          <Button type="button" variant="ghost" size="icon" disabled={isLoading}>
            <Mic className="h-5 w-5" />
          </Button>
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

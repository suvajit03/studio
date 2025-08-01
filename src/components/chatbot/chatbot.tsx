'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/components/providers/user-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Mic, Bot, User, Volume2, Loader } from 'lucide-react';
import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { scheduleMeeting } from '@/ai/flows/schedule-meeting';
import { answerQuestion } from '@/ai/flows/answer-questions';
import { modifyWebsite } from '@/ai/flows/modify-website';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Card, CardContent, CardHeader } from '../ui/card';

type ChatMode = 'schedule' | 'question' | 'modify';

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm MeetAI. How can I help you? You can ask me to schedule a meeting, answer a question, or even modify this website's description.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState<string | null>(null);
  const { user } = useUser();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [mode, setMode] = useState<ChatMode>('schedule');

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);
  
  const playAudio = (audioDataUri: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioDataUri;
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
    }
  };

  const handleSynthesize = async (text: string, messageId: string) => {
    setIsSynthesizing(messageId);
    try {
        const { audioDataUri } = await textToSpeech({ text });
        playAudio(audioDataUri);
    } catch(e) {
        console.error(e)
        toast({ title: 'Error', description: 'Could not synthesize audio.', variant: 'destructive' })
    } finally {
        setIsSynthesizing(null);
    }
  }


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

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
          contacts: user.contacts,
          userName: user.name,
          userLocation: user.location,
          workTime: `${user.workTime.start}-${user.workTime.end}`,
          offDays: user.offDays.map(d => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]).join(','),
        });
        response = result.meetingDetails;
        if (result.inviteSent) {
          toast({ title: 'Meeting Scheduled!', description: 'Invite has been sent.' });
        }
      } else if (mode === 'question') {
        const result = await answerQuestion({ query: input });
        response = result.answer;
      } else {
        const result = await modifyWebsite({
          websiteDescription: 'A meeting scheduler app',
          desiredChanges: input,
        });
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
    <Card className="w-full max-w-3xl mx-auto h-full flex flex-col">
       <audio ref={audioRef} />
      <CardHeader className="flex flex-row items-center gap-3">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h3 className="text-lg font-semibold font-headline">MeetAI Assistant</h3>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden p-0">
        <div className="p-2 border-b px-6">
          <p className="text-xs text-muted-foreground mb-2 px-1">Select AI Mode:</p>
          <div className="flex gap-2">
            <Button size="sm" variant={mode === 'schedule' ? 'default' : 'outline'} onClick={() => setMode('schedule')}>
              Schedule
            </Button>
            <Button size="sm" variant={mode === 'question' ? 'default' : 'outline'} onClick={() => setMode('question')}>
              Q&A
            </Button>
            <Button size="sm" variant={mode === 'modify' ? 'default' : 'outline'} onClick={() => setMode('modify')}>
              Modify Site
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef as any}>
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn('flex items-start gap-2', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Bot size={20} />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2 text-sm relative group',
                    message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  {message.content}
                   {message.role === 'assistant' && (
                     <div className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSynthesize(message.content, message.id)} disabled={!!isSynthesizing}>
                            {isSynthesizing === message.id ? <Loader className="animate-spin" size={16}/> : <Volume2 size={16}/>}
                        </Button>
                     </div>
                   )}
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      <User size={20} />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot size={20} />
                  </AvatarFallback>
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
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="icon" disabled={isLoading}>
              <Mic className="h-5 w-5" />
            </Button>
            <Button type="submit" size="icon" disabled={isLoading}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

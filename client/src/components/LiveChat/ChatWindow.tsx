import { useState, useEffect, useRef } from 'react';
import { X, Send, ArrowDown, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  isTyping?: boolean;
}

interface ChatWindowProps {
  onClose: () => void;
  minimized: boolean;
  onMinimize: () => void;
  agentName?: string;
  agentAvatar?: string;
}

export const ChatWindow = ({
  onClose,
  minimized,
  onMinimize,
  agentName = 'Support Agent',
  agentAvatar = '',
}: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'agent',
      text: `Hi there! 👋 I'm ${agentName} from TechBazaar support. How can I help you today?`,
      timestamp: new Date(),
      status: 'read',
    },
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAgentTyping, minimized]);

  useEffect(() => {
    const messageArea = messageAreaRef.current;
    if (!messageArea) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messageArea;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
      setShowScrollButton(isScrolledUp);
    };

    messageArea.addEventListener('scroll', handleScroll);
    return () => messageArea.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current && !minimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date(),
      status: 'sending',
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    
    // Update status to sent
    setTimeout(() => {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );
      
      // Simulate agent typing
      setIsAgentTyping(true);
      
      // Delay agent response
      const typingDelay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        simulateAgentResponse(userMessage.text);
      }, typingDelay);
    }, 500);
  };

  const simulateAgentResponse = (userText: string) => {
    const responses = [
      "Thank you for reaching out. Let me look into that for you.",
      "I understand your concern. How else can I assist you today?",
      "That's a great question. Let me find the answer for you.",
      "I'm sorry to hear that. Let me see what we can do to resolve this.",
      "I appreciate your patience. I'll check our system for more information.",
    ];
    
    // Simple response selection - in a real app, this would be handled by a support system
    const responseIndex = Math.floor(Math.random() * responses.length);
    const agentMessage: Message = {
      id: Date.now().toString(),
      sender: 'agent',
      text: responses[responseIndex],
      timestamp: new Date(),
      status: 'sent',
    };
    
    setIsAgentTyping(false);
    setMessages(prevMessages => [...prevMessages, agentMessage]);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (minimized) {
    return null;
  }

  return (
    <Card className="w-full max-w-md shadow-lg flex flex-col h-[500px] max-h-[80vh]">
      <CardHeader className="p-3 border-b flex-shrink-0 flex flex-row items-center">
        <div className="flex items-center space-x-3 flex-grow">
          <Avatar>
            <AvatarImage src={agentAvatar} alt={agentName} />
            <AvatarFallback>{agentName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{agentName}</h3>
            <p className="text-xs text-gray-500">TechBazaar Support</p>
          </div>
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onMinimize}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent 
        className="flex-grow overflow-y-auto p-3 space-y-4" 
        ref={messageAreaRef}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.sender === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg p-3",
                message.sender === 'user'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <div className="text-sm">{message.text}</div>
              <div className="mt-1 flex items-center justify-end space-x-1">
                <span className="text-xs opacity-70">
                  {format(message.timestamp, 'h:mm a')}
                </span>
                {message.sender === 'user' && message.status && (
                  <span className="text-xs">
                    {message.status === 'sending' && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-300 animate-spin"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    )}
                    {message.status === 'sent' && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {message.status === 'read' && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6L7 17L2 12" />
                        <path d="M22 10L13 19L10 16" />
                      </svg>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isAgentTyping && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-muted flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback>{agentName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </CardContent>
      
      {showScrollButton && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" 
                className="absolute bottom-16 right-4 rounded-full w-8 h-8 shadow-md"
                onClick={scrollToBottom}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Scroll to latest messages</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      <CardFooter className="p-3 border-t flex-shrink-0">
        <div className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleInputKeyPress}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!inputValue.trim()}
            onClick={handleSendMessage}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ChatWindow;
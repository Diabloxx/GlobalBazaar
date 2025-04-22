import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import ChatWindow from './ChatWindow';
import { useToast } from '@/hooks/use-toast';
import { useCookieConsent } from '@/contexts/CookieConsentContext';

interface LiveChatWidgetProps {
  agentName?: string;
  agentAvatar?: string;
}

export const LiveChatWidget = ({
  agentName = 'Sarah',
  agentAvatar = '',
}: LiveChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const { toast } = useToast();
  const { hasConsented } = useCookieConsent();

  // Check if functional cookies are allowed
  const functionalCookiesAllowed = hasConsented('functional');

  // Effect to handle chat session persistence
  useEffect(() => {
    if (functionalCookiesAllowed) {
      // Only try to restore chat state if functional cookies are allowed
      const chatState = localStorage.getItem('liveChatState');
      if (chatState) {
        try {
          const { isOpen: savedIsOpen, isMinimized: savedIsMinimized } = JSON.parse(chatState);
          setIsOpen(savedIsOpen);
          setIsMinimized(savedIsMinimized);
        } catch (e) {
          console.error('Error parsing saved chat state:', e);
        }
      }
    }
  }, [functionalCookiesAllowed]);

  // Save chat state when it changes
  useEffect(() => {
    if (functionalCookiesAllowed && (isOpen || isMinimized)) {
      localStorage.setItem('liveChatState', JSON.stringify({ isOpen, isMinimized }));
    }
  }, [isOpen, isMinimized, functionalCookiesAllowed]);

  // Simulated new message arrival (would be triggered by actual messages in production)
  useEffect(() => {
    if (isMinimized) {
      const timer = setTimeout(() => {
        setHasUnreadMessages(true);
        
        // Notification about new message
        toast({
          title: `New message from ${agentName}`,
          description: "You have a new message in your support chat.",
          duration: 5000,
        });
      }, 30000); // 30 seconds after minimizing
      
      return () => clearTimeout(timer);
    } else {
      setHasUnreadMessages(false);
    }
  }, [isMinimized, agentName, toast]);

  const toggleChat = () => {
    if (isOpen && isMinimized) {
      setIsMinimized(false);
      setHasUnreadMessages(false);
    } else {
      setIsOpen(!isOpen);
      setIsMinimized(false);
      setHasUnreadMessages(false);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setHasUnreadMessages(false);
    
    if (functionalCookiesAllowed) {
      localStorage.removeItem('liveChatState');
    }
  };

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end space-y-2">
      {/* Main chat window */}
      {isOpen && (
        <div
          className={`${
            isMinimized ? "opacity-0 pointer-events-none" : "opacity-100"
          } transition-opacity duration-200`}
        >
          <ChatWindow
            onClose={handleClose}
            onMinimize={handleMinimize}
            minimized={isMinimized}
            agentName={agentName}
            agentAvatar={agentAvatar}
          />
        </div>
      )}
      
      {/* Minimized chat indicator/button */}
      {isOpen && isMinimized && (
        <div className="bg-primary text-primary-foreground rounded-lg p-3 shadow-md flex items-center justify-between cursor-pointer w-64 animate-in slide-in-from-right"
          onClick={toggleChat}
        >
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">Chat with {agentName}</p>
              <p className="text-xs opacity-80">Click to restore chat</p>
            </div>
          </div>
          {hasUnreadMessages && <Badge variant="secondary" className="animate-pulse">New</Badge>}
        </div>
      )}
      
      {/* Chat button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="lg" 
              className={`rounded-full w-14 h-14 shadow-md ${
                hasUnreadMessages && "animate-bounce"
              }`}
              onClick={toggleChat}
            >
              {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{isOpen ? "Close chat" : "Chat with support"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default LiveChatWidget;
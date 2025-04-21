import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Define tutorial step type
export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  order: number;
  category: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  estimatedTimeMinutes: number | null;
  prerequisites: string[] | null;
  createdAt: Date;
}

// Define tutorial progress type
export interface TutorialProgress {
  id: number;
  userId: number;
  stepId: number;
  isCompleted: boolean;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  step: TutorialStep;
}

// Define tutorial context type
interface TutorialContextType {
  steps: TutorialStep[];
  progress: TutorialProgress[];
  activeStepId: number | null;
  isLoading: boolean;
  error: Error | null;
  filterByCategory: (category: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  categories: string[];
  setActiveStepId: (id: number | null) => void;
  completeTutorialStep: (stepId: number, notes?: string) => Promise<void>;
  resetTutorialProgress: () => Promise<void>;
}

// Create context with default values
const defaultContextValue: TutorialContextType = {
  steps: [],
  progress: [],
  activeStepId: null,
  isLoading: false,
  error: null,
  filterByCategory: () => {},
  selectedCategory: null,
  setSelectedCategory: () => {},
  categories: [],
  setActiveStepId: () => {},
  completeTutorialStep: async () => {},
  resetTutorialProgress: async () => {},
};

const TutorialContext = createContext<TutorialContextType>(defaultContextValue);

// Tutorial provider props
interface TutorialProviderProps {
  children: ReactNode;
}

// Tutorial provider component
export function TutorialProvider({ children }: TutorialProviderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeStepId, setActiveStepId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch all tutorial steps
  const {
    data: steps = [],
    isLoading: isStepsLoading,
    error: stepsError,
  } = useQuery({
    queryKey: ['/api/tutorial/steps'],
    queryFn: async () => {
      const response = await fetch('/api/tutorial/steps');
      if (!response.ok) {
        throw new Error('Failed to fetch tutorial steps');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!user,
  });

  // Fetch tutorial progress for the current user if they are a seller
  const {
    data: progress = [],
    isLoading: isProgressLoading,
    error: progressError,
  } = useQuery({
    queryKey: ['/api/seller/tutorial/progress'],
    queryFn: async () => {
      const response = await fetch('/api/seller/tutorial/progress');
      if (!response.ok) {
        throw new Error('Failed to fetch tutorial progress');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!user && (user.role === 'seller' || user.role === 'admin' || user.isVerifiedSeller),
  });

  // Extract unique categories from steps
  useEffect(() => {
    if (steps && steps.length > 0) {
      const uniqueCategories = [...new Set(steps.map((step: TutorialStep) => step.category))];
      setCategories(uniqueCategories);
    }
  }, [steps]);

  // If there's no active step and we have steps, set the first one as active
  useEffect(() => {
    if (!activeStepId && steps.length > 0) {
      // Check if there's an uncompleted step to start with
      const firstIncompleteStep = steps.find((step: TutorialStep) => 
        !progress.some(p => p.stepId === step.id && p.isCompleted)
      );
      
      if (firstIncompleteStep) {
        setActiveStepId(firstIncompleteStep.id);
      } else {
        // If all steps are completed, start with the first one
        setActiveStepId(steps[0].id);
      }
    }
  }, [steps, progress, activeStepId]);

  // Mutation to mark a tutorial step as completed
  const completeStepMutation = useMutation({
    mutationFn: async ({ stepId, notes }: { stepId: number; notes?: string }) => {
      const response = await fetch(`/api/seller/tutorial/progress/${stepId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark step as completed');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Step completed',
        description: 'Tutorial step marked as completed',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/seller/tutorial/progress'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to reset tutorial progress
  const resetProgressMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/seller/tutorial/progress', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset tutorial progress');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Progress reset',
        description: 'Your tutorial progress has been reset',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/seller/tutorial/progress'] });
      // Set the first step as active after reset
      if (steps.length > 0) {
        setActiveStepId(steps[0].id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Complete a tutorial step
  const completeTutorialStep = async (stepId: number, notes?: string) => {
    await completeStepMutation.mutateAsync({ stepId, notes });
  };

  // Reset tutorial progress
  const resetTutorialProgress = async () => {
    await resetProgressMutation.mutateAsync();
  };

  // Filter steps by category
  const filterByCategory = (category: string) => {
    setSelectedCategory(category);
  };

  // Filter steps by selected category
  const filteredSteps = selectedCategory
    ? steps.filter((step: TutorialStep) => step.category === selectedCategory)
    : steps;

  // Context value
  const contextValue: TutorialContextType = {
    steps: filteredSteps,
    progress,
    activeStepId,
    isLoading: isStepsLoading || isProgressLoading,
    error: stepsError || progressError,
    filterByCategory,
    selectedCategory,
    setSelectedCategory,
    categories,
    setActiveStepId,
    completeTutorialStep,
    resetTutorialProgress,
  };

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
    </TutorialContext.Provider>
  );
}

// Hook for using tutorial context
export function useTutorial() {
  const context = useContext(TutorialContext);
  return context;
}
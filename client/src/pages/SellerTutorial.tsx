import React, { useState } from 'react';
import { useTutorial } from '@/contexts/TutorialContext';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function SellerTutorial() {
  const { user } = useAuth();
  const {
    steps,
    progress,
    activeStepId,
    isLoading,
    error,
    filterByCategory,
    selectedCategory,
    setSelectedCategory,
    categories,
    setActiveStepId,
    completeTutorialStep,
    resetTutorialProgress,
  } = useTutorial();
  
  const [notes, setNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Check if user is authenticated and is a seller
  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading tutorial content...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Tutorial</h2>
        <p className="text-center text-muted-foreground mb-4">
          {error.message || 'An error occurred while loading the tutorial. Please try again later.'}
        </p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  // Calculate completion percentage
  const completedSteps = progress.filter(p => p.isCompleted).length;
  const totalSteps = steps.length;
  const completionPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  // Get the active step
  const activeStep = steps.find(step => step.id === activeStepId);
  
  // Get the progress for the active step
  const activeStepProgress = progress.find(p => p.stepId === activeStepId);

  // Handle step completion
  const handleCompleteStep = async () => {
    if (activeStepId) {
      setIsCompleting(true);
      try {
        await completeTutorialStep(activeStepId, notes);
        setNotes('');
        
        // Find the next uncompleted step
        const uncompleteSteps = steps.filter(step => 
          !progress.some(p => p.stepId === step.id && p.isCompleted)
        );
        
        if (uncompleteSteps.length > 0) {
          setActiveStepId(uncompleteSteps[0].id);
        }
      } catch (error) {
        console.error('Failed to complete step:', error);
      } finally {
        setIsCompleting(false);
      }
    }
  };

  // Handle reset progress
  const handleResetProgress = async () => {
    setIsResetting(true);
    try {
      await resetTutorialProgress();
    } catch (error) {
      console.error('Failed to reset progress:', error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Seller Onboarding Tutorial</h1>
          <p className="text-muted-foreground mb-4">
            Learn how to become a successful seller on our platform with our step-by-step guide.
          </p>
        </div>
        
        <div className="flex flex-col w-full md:w-auto gap-4 items-end">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-sm font-medium">
              {completedSteps} of {totalSteps} steps completed
            </span>
            <Progress value={completionPercentage} className="w-[150px]" />
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Progress
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Tutorial Progress?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all your tutorial progress. You'll need to start from the beginning.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleResetProgress}
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Progress'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar - Steps List */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Tutorial Steps</CardTitle>
              <CardDescription>
                Work through each step to complete the tutorial
              </CardDescription>
              
              {categories.length > 0 && (
                <Select
                  value={selectedCategory || ''}
                  onValueChange={(value) => value ? filterByCategory(value) : setSelectedCategory(null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {steps.map((step) => {
                  const stepProgress = progress.find(p => p.stepId === step.id);
                  const isCompleted = stepProgress?.isCompleted || false;
                  const isActive = step.id === activeStepId;
                  
                  return (
                    <div
                      key={step.id}
                      className={`
                        flex items-center p-3 rounded-md cursor-pointer transition-colors
                        ${isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'}
                        ${isCompleted ? 'border-l-4 border-l-green-500' : ''}
                      `}
                      onClick={() => setActiveStepId(step.id)}
                    >
                      <div className="mr-3">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted-foreground/20 text-xs font-medium">
                            {step.order}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${isCompleted ? 'text-muted-foreground' : ''}`}>
                          {step.title}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content - Active Step */}
        <div className="lg:col-span-8">
          {activeStep ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {activeStep.category}
                    </Badge>
                    <CardTitle className="text-2xl">{activeStep.title}</CardTitle>
                    <CardDescription className="text-base mt-1">
                      {activeStep.description}
                    </CardDescription>
                  </div>
                  
                  {activeStep.estimatedTimeMinutes && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-4 w-4" />
                      <span>{activeStep.estimatedTimeMinutes} min</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="content">
                  <TabsList className="mb-4">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="notes">
                      Notes
                      {activeStepProgress?.notes && (
                        <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-primary"></span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="min-h-[300px]">
                    {activeStep.imageUrl && (
                      <div className="mb-4">
                        <img
                          src={activeStep.imageUrl}
                          alt={activeStep.title}
                          className="rounded-md w-full object-cover max-h-[300px]"
                        />
                      </div>
                    )}
                    
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: activeStep.content }} />
                    </div>
                    
                    {activeStep.prerequisites && activeStep.prerequisites.length > 0 && (
                      <div className="mt-6 p-4 bg-muted rounded-md">
                        <h4 className="font-medium mb-2">Prerequisites</h4>
                        <ul className="text-sm space-y-1">
                          {activeStep.prerequisites.map((prerequisite, index) => (
                            <li key={index} className="flex items-center">
                              <span className="mr-2">•</span>
                              {prerequisite}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="notes">
                    <div className="space-y-4">
                      {activeStepProgress?.notes ? (
                        <div className="p-4 bg-muted rounded-md">
                          <h4 className="font-medium mb-2">Your Notes</h4>
                          <p className="text-sm whitespace-pre-wrap">{activeStepProgress.notes}</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          You haven't added any notes for this step yet.
                        </p>
                      )}
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium mb-2">Add Notes</h4>
                        <Textarea
                          placeholder="Add notes about this step..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="min-h-[150px]"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Find previous step based on order
                    const currentStepIndex = steps.findIndex(s => s.id === activeStep.id);
                    if (currentStepIndex > 0) {
                      setActiveStepId(steps[currentStepIndex - 1].id);
                    }
                  }}
                  disabled={steps.findIndex(s => s.id === activeStep.id) === 0}
                >
                  Previous
                </Button>
                
                <div className="flex gap-2">
                  {activeStepProgress?.isCompleted ? (
                    <Button
                      variant="default"
                      onClick={() => {
                        // Find next step based on order
                        const currentStepIndex = steps.findIndex(s => s.id === activeStep.id);
                        if (currentStepIndex < steps.length - 1) {
                          setActiveStepId(steps[currentStepIndex + 1].id);
                        }
                      }}
                      disabled={steps.findIndex(s => s.id === activeStep.id) === steps.length - 1}
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCompleteStep}
                      disabled={isCompleting}
                    >
                      {isCompleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Completed
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center p-8">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-medium">No Tutorial Steps Available</h3>
                <p className="text-muted-foreground">
                  There are no tutorial steps available at the moment.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
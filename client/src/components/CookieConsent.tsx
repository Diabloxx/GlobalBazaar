import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface CookieConsentProps {
  onClose: () => void;
}

// Define cookie preferences structure
export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

// Default cookie preferences
const defaultPreferences: CookiePreferences = {
  necessary: true, // Always required
  functional: true,
  analytics: false,
  marketing: false,
};

export const CookieConsent = ({ onClose }: CookieConsentProps) => {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [activeTab, setActiveTab] = useState('simple');

  // Load preferences from localStorage on mount if they exist
  useEffect(() => {
    const savedPreferences = localStorage.getItem('cookiePreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({
          ...defaultPreferences,
          ...parsed,
          necessary: true, // Ensure necessary cookies are always accepted
        });
      } catch (e) {
        console.error('Error parsing saved cookie preferences:', e);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      ...preferences,
      functional: true,
      analytics: true,
      marketing: true,
    };
    savePreferences(allAccepted);
    onClose();
  };

  const handleAcceptSelected = () => {
    savePreferences(preferences);
    onClose();
  };

  const handleDeclineAll = () => {
    const allDeclined = {
      ...preferences,
      functional: false,
      analytics: false,
      marketing: false,
    };
    savePreferences(allDeclined);
    onClose();
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookiePreferences', JSON.stringify(prefs));
    // Here you would typically also set actual cookies based on preferences
    // or trigger analytics based on consents
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md md:max-w-lg shadow-lg animate-in fade-in zoom-in duration-300">
        <CardHeader className="pb-2 flex flex-row items-start justify-between">
          <div>
            <CardTitle>Cookie Preferences</CardTitle>
            <CardDescription>
              Control how TechBazaar uses cookies on your device
            </CardDescription>
          </div>
          <Button 
            variant="ghost"
            size="icon"
            className="mt-0 -mr-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <Tabs defaultValue="simple" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-4 py-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="simple">Simple View</TabsTrigger>
              <TabsTrigger value="detailed">Detailed View</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="simple" className="m-0">
            <CardContent className="pt-4 pb-0">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                We use cookies to enhance your browsing experience, personalize content, and analyze site traffic. 
                By clicking "Accept All", you consent to our use of cookies. You can also customize your preferences
                for different categories of cookies in the "Detailed View" tab.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button variant="outline" onClick={handleDeclineAll}>
                Decline All
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('detailed')}>
                Customize
              </Button>
              <Button onClick={handleAcceptAll}>
                Accept All
              </Button>
            </CardFooter>
          </TabsContent>
          
          <TabsContent value="detailed" className="m-0">
            <CardContent className="space-y-4 pt-4 pb-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="necessary" className="font-medium">Necessary Cookies</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Required for the website to function. Cannot be disabled.
                    </p>
                  </div>
                  <Switch 
                    id="necessary" 
                    checked={true} 
                    disabled={true}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="functional" className="font-medium">Functional Cookies</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enhance functionality, such as saving preferences and remembering your cart items.
                    </p>
                  </div>
                  <Switch 
                    id="functional" 
                    checked={preferences.functional}
                    onCheckedChange={(checked) => 
                      setPreferences({ ...preferences, functional: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="analytics" className="font-medium">Analytics Cookies</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Help us understand how visitors interact with our website.
                    </p>
                  </div>
                  <Switch 
                    id="analytics" 
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => 
                      setPreferences({ ...preferences, analytics: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="marketing" className="font-medium">Marketing Cookies</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Used to deliver relevant ads and track engagement.
                    </p>
                  </div>
                  <Switch 
                    id="marketing" 
                    checked={preferences.marketing}
                    onCheckedChange={(checked) => 
                      setPreferences({ ...preferences, marketing: checked })}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button variant="outline" onClick={() => setActiveTab('simple')}>
                Back
              </Button>
              <Button onClick={handleAcceptSelected}>
                Save Preferences
              </Button>
            </CardFooter>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default CookieConsent;
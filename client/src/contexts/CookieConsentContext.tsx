import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import CookieConsent, { CookiePreferences } from '@/components/CookieConsent';

interface CookieConsentContextType {
  cookieConsented: boolean;
  showConsentPopup: boolean;
  cookiePreferences: CookiePreferences;
  setShowConsentPopup: (show: boolean) => void;
  resetCookieConsent: () => void;
  hasConsented: (cookieType: keyof CookiePreferences) => boolean;
}

const defaultPreferences: CookiePreferences = {
  necessary: true,
  functional: true,
  analytics: false,
  marketing: false,
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const [cookieConsented, setCookieConsented] = useState<boolean>(false);
  const [showConsentPopup, setShowConsentPopup] = useState<boolean>(false);
  const [cookiePreferences, setCookiePreferences] = useState<CookiePreferences>(defaultPreferences);

  // Check if consent has been given previously
  useEffect(() => {
    const hasConsented = localStorage.getItem('cookieConsented') === 'true';
    const savedPreferences = localStorage.getItem('cookiePreferences');
    
    setCookieConsented(hasConsented);
    
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setCookiePreferences({
          ...defaultPreferences,
          ...parsed,
          necessary: true, // Always needed
        });
      } catch (e) {
        console.error('Error parsing saved cookie preferences:', e);
      }
    }
    
    // Show popup if no consent yet
    if (!hasConsented) {
      // Brief delay before showing the popup to avoid immediately overwhelming the user
      const timer = setTimeout(() => {
        setShowConsentPopup(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseConsentPopup = () => {
    setShowConsentPopup(false);
    setCookieConsented(true);
    localStorage.setItem('cookieConsented', 'true');
  };

  const resetCookieConsent = () => {
    localStorage.removeItem('cookieConsented');
    localStorage.removeItem('cookiePreferences');
    setCookieConsented(false);
    setCookiePreferences(defaultPreferences);
    setShowConsentPopup(true);
  };

  const hasConsented = (cookieType: keyof CookiePreferences): boolean => {
    // Always return true for necessary cookies
    if (cookieType === 'necessary') return true;
    
    // If user hasn't consented yet, return false for non-necessary cookies
    if (!cookieConsented) return false;
    
    // Otherwise check preferences
    return cookiePreferences[cookieType];
  };

  return (
    <CookieConsentContext.Provider
      value={{
        cookieConsented,
        showConsentPopup,
        cookiePreferences,
        setShowConsentPopup,
        resetCookieConsent,
        hasConsented,
      }}
    >
      {children}
      {showConsentPopup && <CookieConsent onClose={handleCloseConsentPopup} />}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};

export default CookieConsentContext;
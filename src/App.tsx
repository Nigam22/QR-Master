import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { AdsProvider, useAds } from "@/contexts/AdsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useEffect } from "react";

import { SplashScreen } from "@/pages/SplashScreen";
import { Home } from "@/pages/Home";
import { Scanner } from "@/pages/Scanner";
import { ScanResult } from "@/pages/ScanResult";
import { Generator } from "@/pages/Generator";
import { QRPreview } from "@/pages/QRPreview";
import { History } from "@/pages/History";
import { Settings } from "@/pages/Settings";
import { Premium } from "@/pages/Premium";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Custom hook for handling back button
const useBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Handle browser back button
    const handlePopState = (event: PopStateEvent) => {
      // Always go to home screen when back button is pressed
      if (location.pathname !== '/home') {
        event.preventDefault();
        navigate('/home');
      } else {
        // On home screen, allow default behavior (exit app)
        window.history.pushState(null, '', location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Also push initial state to handle back button
    window.history.pushState(null, '', location.pathname);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location, navigate]);
};

const AppLayout = () => {
  const location = useLocation();
  const hideNavRoutes = ['/', '/result', '/preview', '/premium'];
  const showNav = !hideNavRoutes.includes(location.pathname);
  
  // Apply back button handling
  useBackButton();
  
  return (
    <>
      <AdRouteCleanup />
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/home" element={<Home />} />
        <Route path="/scan" element={<Scanner />} />
        <Route path="/result" element={<ScanResult />} />
        <Route path="/generate" element={<Generator />} />
        <Route path="/preview" element={<QRPreview />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/premium" element={<Premium />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  );
};

// Hide any residual banners on route changes to avoid leaks between screens
const AdRouteCleanup = () => {
  const { hideBanner } = useAds();
  const location = useLocation();

  useEffect(() => {
    hideBanner();
    return () => {
      hideBanner();
    };
  }, [location.pathname, hideBanner]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AdsProvider>
        <TooltipProvider>
          <Toaster position="top-center" />
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </TooltipProvider>
      </AdsProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
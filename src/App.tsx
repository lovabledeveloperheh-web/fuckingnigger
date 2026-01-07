import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { TrashPage } from "./pages/TrashPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { RecentFilesPage } from "./pages/RecentFilesPage";
import { GalleryPage } from "./pages/GalleryPage";
import { SharedLinksPage } from "./pages/SharedLinksPage";
import { OfflineFilesPage } from "./pages/OfflineFilesPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { BackupSchedulesPage } from "./pages/BackupSchedulesPage";
import { SharedFilePage } from "./pages/SharedFilePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard/trash" element={<TrashPage />} />
            <Route path="/dashboard/favorites" element={<FavoritesPage />} />
            <Route path="/dashboard/recent" element={<RecentFilesPage />} />
            <Route path="/dashboard/gallery" element={<GalleryPage />} />
            <Route path="/dashboard/shared" element={<SharedLinksPage />} />
            <Route path="/dashboard/offline" element={<OfflineFilesPage />} />
            <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
            <Route path="/dashboard/backup" element={<BackupSchedulesPage />} />
            <Route path="/share/:token" element={<SharedFilePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

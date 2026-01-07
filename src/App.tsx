/**
 * Main Application Component
 * Sets up providers and routing with proper authentication protection
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { AudioAnalyzerProvider } from './context/AudioAnalyzerContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout';
import { ProtectedRoute, AdminRoute } from './components/auth';
import {
  Landing,
  Home,
  Login,
  Register,
  MusicPage,
  Podcasts,
  Search,
  Playlists,
  AdminUpload,
  Profile,
  Favorites,
  Settings
} from './pages';
import History from './pages/History';

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <PlayerProvider>
            <AudioAnalyzerProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public routes (no auth required) */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected routes (auth required) */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/home" element={<Home />} />
                    <Route path="/music" element={<MusicPage />} />
                    <Route path="/podcasts" element={<Podcasts />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/playlists" element={<Playlists />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />

                    {/* Admin only route */}
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminUpload />
                        </AdminRoute>
                      }
                    />
                  </Route>
                </Routes>
              </BrowserRouter>
            </AudioAnalyzerProvider>
          </PlayerProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

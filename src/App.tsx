/**
 * Main Application Component
 * Sets up providers and routing with proper authentication protection
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { AudioAnalyzerProvider } from './context/AudioAnalyzerContext';
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
  Favorites
} from './pages';

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
                <Route element={<Layout />}>
                  <Route
                    path="/home"
                    element={
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/music"
                    element={
                      <ProtectedRoute>
                        <MusicPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/podcasts"
                    element={
                      <ProtectedRoute>
                        <Podcasts />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/search"
                    element={
                      <ProtectedRoute>
                        <Search />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/playlists"
                    element={
                      <ProtectedRoute>
                        <Playlists />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/favorites"
                    element={
                      <ProtectedRoute>
                        <Favorites />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />

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
    </QueryClientProvider>
  );
}

export default App;

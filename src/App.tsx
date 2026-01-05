/**
 * Main Application Component
 * Sets up providers and routing
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { AudioAnalyzerProvider } from './context/AudioAnalyzerContext';
import { Layout } from './components/layout';
import { Home, Login, Register, MusicPage, Podcasts, Search, Playlists, AdminUpload, Profile, Favorites } from './pages';

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
  console.log('App component rendering');

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PlayerProvider>
          <AudioAnalyzerProvider>
            <BrowserRouter>
              <Routes>
                {/* Auth routes (no layout) */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* App routes (with layout) */}
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/music" element={<MusicPage />} />
                  <Route path="/podcasts" element={<Podcasts />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/playlists" element={<Playlists />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<AdminUpload />} />
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

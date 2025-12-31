import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { signIn, signUp } from '../../services/authService';
import { loadProgressFromServer, saveProgressToServer, testAuth } from '../../services/syncService';
import { getUserData } from '../utils/localStorage';
import { Loader2, BookOpen, X } from 'lucide-react';
import { getTranslations, getStoredLanguage } from '../utils/translations';

interface AuthProps {
  onAuthSuccess: () => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const language = getStoredLanguage();
  const t = getTranslations(language);
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  
  // Check if user is coming from a group join attempt
  const isFromGroupJoin = redirect.includes('/groups/');
  const groupType = redirect.includes('khatmah-') ? 'Khatmah Circle' : redirect.includes('surah-') ? 'Memorization Circle' : 'Circle';

  const handleClose = () => {
    // Navigate to dashboard if there's no history to go back to
    if (window.history.length <= 1) {
      navigate('/dashboard');
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      
      if (isSignUp) {
        if (!name.trim()) {
          setError('Please enter your name');
          setLoading(false);
          return;
        }
        result = await signUp(email, password, name);
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Load and merge progress from server (this merges local + server data)
      console.log('🔐 Sign-in successful, syncing with database...');
      console.log('📊 Current localStorage data:', JSON.stringify(getUserData(), null, 2));
      
      // TEST: First verify JWT decoding works
      console.log('🧪 === TESTING JWT AUTHENTICATION ===');
      await testAuth();
      console.log('🧪 === END TEST ===');
      
      // First, load progress from server
      console.log('⬇️  Loading progress from server...');
      const loadResult = await loadProgressFromServer();
      console.log('⬇️  Load result:', loadResult);
      
      if (loadResult.success) {
        console.log('✅ Successfully loaded from server');
        if (loadResult.data) {
          console.log('📦 Server data received:', JSON.stringify(loadResult.data, null, 2));
        } else {
          console.log('ℹ️  No data on server yet (first time user)');
        }
      } else {
        console.error('❌ Failed to load from server:', loadResult.error);
      }
      
      // Save the merged progress back to server to sync any guest progress
      console.log('⬆️  Saving merged progress back to server...');
      const saveResult = await saveProgressToServer();
      console.log('⬆️  Save result:', saveResult);
      
      if (saveResult.success) {
        console.log('✅ Successfully saved to server');
      } else {
        console.error('❌ Failed to save to server:', saveResult.error);
      }

      // Call success callback and navigate
      onAuthSuccess();
      navigate(redirect);
    } catch (err) {
      console.error('Auth error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 border-emerald-200 dark:border-emerald-700 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl text-emerald-900 dark:text-emerald-100 mb-2">
            {t.appName}
          </h1>
          
          {isFromGroupJoin ? (
            <div className="space-y-2">
              <p className="text-emerald-700 dark:text-emerald-300">
                {isSignUp ? 'Sign up to join this goal' : 'Sign in to join this goal'}
              </p>
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-lg p-4 text-left">
                <p className="text-sm text-emerald-900 dark:text-emerald-100 mb-2">
                  <strong>Why join {groupType} goals?</strong>
                </p>
                <ul className="text-xs text-emerald-700 dark:text-emerald-300 space-y-1.5">
                  <li className="flex items-start">
                    <span className="text-emerald-600 dark:text-emerald-400 mr-2">•</span>
                    <span>Stay motivated with real-time community progress</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-600 dark:text-emerald-400 mr-2">•</span>
                    <span>Track your progress alongside others on the same journey</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-600 dark:text-emerald-400 mr-2">•</span>
                    <span>Build consistent habits through collective accountability</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-600 dark:text-emerald-400 mr-2">•</span>
                    <span>Earn the reward of reading together as an Ummah</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-emerald-600 dark:text-emerald-400">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="name" className="block text-sm text-emerald-900 dark:text-emerald-100 mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter your name"
                required={isSignUp}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm text-emerald-900 dark:text-emerald-100 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-emerald-900 dark:text-emerald-100 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter your password"
              required
              minLength={6}
            />
            {isSignUp && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Minimum 6 characters
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 h-12"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isSignUp ? 'Creating account...' : 'Signing in...'}
              </>
            ) : (
              <>{isSignUp ? 'Sign Up' : 'Sign In'}</>
            )}
          </Button>
        </form>

        {/* Toggle between Sign In and Sign Up */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>

        {/* Benefits of Registration */}
        {!isFromGroupJoin && (
          <div className="mt-6 space-y-2">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                <span className="font-semibold">✓ Sync progress across devices</span>
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Access your reading and memorization progress from any device
              </p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                <span className="font-semibold">✓ Join community goals</span>
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Participate in group khatmah challenges and memorization goals
              </p>
            </div>
            <p className="text-xs text-center text-emerald-500 dark:text-emerald-500 mt-2">
              Or continue as guest - you can always sign up later!
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
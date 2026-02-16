import { Link } from 'react-router';
import { Book, ArrowLeft, Heart, Users, Target, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import ProfileMenu from './ProfileMenu';

interface HelpPageProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
}

export default function HelpPage({ isAuthenticated, onSignOut }: HelpPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/dashboard">
            <Button variant="ghost" className="text-emerald-600 hover:bg-emerald-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <ProfileMenu isAuthenticated={isAuthenticated} onSignOut={onSignOut} />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Book className="w-10 h-10 text-emerald-600" />
          <h1 className="text-3xl text-emerald-900">Help & About</h1>
        </div>

        {/* About Section */}
        <Card className="p-6 mb-6 border-emerald-100">
          <h2 className="text-xl text-emerald-900 mb-4">About Quran Companion</h2>
          <p className="text-emerald-600 mb-4">
            A distraction-free platform designed to help you build a meaningful relationship with the Quran through reading and memorization.
          </p>
          <p className="text-emerald-600">
            We believe in anonymous, goal-oriented practice that respects your privacy while keeping you motivated through gentle community presence.
          </p>
        </Card>

        {/* Features */}
        <Card className="p-6 mb-6 border-emerald-100">
          <h2 className="text-xl text-emerald-900 mb-4">Features</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <BookOpen className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-emerald-900 mb-1">Quran Reader</h3>
                <p className="text-sm text-emerald-600">
                  Clean, distraction-free reading experience with two modes: reading and memorization.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Target className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-emerald-900 mb-1">Progress Tracking</h3>
                <p className="text-sm text-emerald-600">
                  Track your reading, memorization, and khatma completion with streaks and statistics.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-emerald-900 mb-1">Group Goals</h3>
                <p className="text-sm text-emerald-600">
                  Join anonymous group challenges for reading and memorization. Stay motivated together without social pressure.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Heart className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-emerald-900 mb-1">Privacy First</h3>
                <p className="text-sm text-emerald-600">
                  Your personal progress is stored locally on your device. Group features only sync what's necessary.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Guest Mode Info */}
        {!isAuthenticated && (
          <Card className="p-6 mb-6 border-emerald-100 bg-emerald-50">
            <h2 className="text-xl text-emerald-900 mb-4">Guest Mode</h2>
            <p className="text-emerald-600 mb-4">
              You're currently using the app in guest mode. Your reading and memorization progress is saved locally on this device.
            </p>
            <p className="text-emerald-600 mb-4">
              To access group goals and real-time presence features, please sign in.
            </p>
            <Link to="/auth">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                Sign In / Sign Up
              </Button>
            </Link>
          </Card>
        )}

        {/* Quick Guide */}
        <Card className="p-6 mb-6 border-emerald-100">
          <h2 className="text-xl text-emerald-900 mb-4">Quick Guide</h2>
          <div className="space-y-3 text-sm text-emerald-600">
            <div>
              <strong className="text-emerald-900">Reading Mode:</strong> Navigate through pages, tap to turn pages, track your reading progress automatically.
            </div>
            <div>
              <strong className="text-emerald-900">Memorization Mode:</strong> Focus on specific surahs, mark ayahs as memorized, and track your progress with auto-scroll.
            </div>
            <div>
              <strong className="text-emerald-900">Group Goals:</strong> Browse available groups, join challenges, and see how many people are reading alongside you (requires sign-in).
            </div>
            <div>
              <strong className="text-emerald-900">Settings:</strong> Customize your reading experience, adjust preferences, and manage your account.
            </div>
          </div>
        </Card>

        {/* Privacy Notice */}
        <Card className="p-6 border-emerald-100">
          <h2 className="text-xl text-emerald-900 mb-4">Privacy & Data</h2>
          <p className="text-sm text-emerald-600 mb-3">
            Your personal reading and memorization data is stored locally on your device. We do not collect or share your personal information.
          </p>
          <p className="text-sm text-emerald-600">
            When you join group goals, we only sync your membership status and presence (when you're actively reading) to enable the community features. Your specific progress and statistics remain private.
          </p>
        </Card>

        <div className="mt-8 text-center">
          <Link to="/dashboard">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

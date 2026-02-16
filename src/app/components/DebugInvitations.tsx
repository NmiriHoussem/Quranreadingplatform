import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ArrowLeft, RefreshCw, Bug, CheckCircle, XCircle } from 'lucide-react';
import { getPendingInvitations, type PrivateKhatmahInvitation } from '../../services/privateKhatmahService';
import { getCurrentSession } from '../../services/authService';
import { supabase } from '../../lib/supabase';

export default function DebugInvitations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [invitations, setInvitations] = useState<any[]>([]);
  const [rawInvitations, setRawInvitations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<any>(null);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    const { user } = await getCurrentSession();
    if (user?.email) {
      setUserEmail(user.email);
      setUserId(user.id);
    }
  };

  const fetchInvitations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Starting invitation fetch...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('📧 Current user:', user?.email);

      // Method 1: Use the service function
      const { invitations: serviceInvitations, error: serviceError } = await getPendingInvitations();
      console.log('📧 Service invitations:', serviceInvitations);
      setInvitations(serviceInvitations || []);
      
      if (serviceError) {
        setError(serviceError);
      }

      // Method 2: Direct query to see raw data
      const { data: rawData, error: rawError } = await supabase
        .from('private_khatmah_invitations')
        .select('*')
        .eq('status', 'pending');
      
      console.log('📧 Raw invitations from DB:', rawData);
      setRawInvitations(rawData || []);

      if (rawError) {
        console.error('Raw query error:', rawError);
      }

      // Get database statistics
      const stats = await getDatabaseStats();
      setDbStats(stats);

    } catch (err: any) {
      console.error('Error fetching invitations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDatabaseStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Count total invitations
      const { count: totalInvitations } = await supabase
        .from('private_khatmah_invitations')
        .select('*', { count: 'exact', head: true });

      // Count pending invitations
      const { count: pendingInvitations } = await supabase
        .from('private_khatmah_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Count invitations for current user email
      const { count: userInvitations } = await supabase
        .from('private_khatmah_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('email', user?.email?.toLowerCase());

      // Count khatmahs
      const { count: totalKhatmahs } = await supabase
        .from('private_khatmahs')
        .select('*', { count: 'exact', head: true });

      return {
        totalInvitations,
        pendingInvitations,
        userInvitations,
        totalKhatmahs,
      };
    } catch (err) {
      console.error('Error getting stats:', err);
      return null;
    }
  };

  const testEmailMatching = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      // Test case-insensitive matching
      const { data: exactMatch } = await supabase
        .from('private_khatmah_invitations')
        .select('*')
        .eq('email', user.email);

      const { data: lowerMatch } = await supabase
        .from('private_khatmah_invitations')
        .select('*')
        .eq('email', user.email.toLowerCase());

      const { data: iLikeMatch } = await supabase
        .from('private_khatmah_invitations')
        .select('*')
        .ilike('email', user.email);

      console.log('🔍 Email matching tests:');
      console.log('  Exact match:', exactMatch);
      console.log('  Lowercase match:', lowerMatch);
      console.log('  iLike match:', iLikeMatch);
    } catch (err) {
      console.error('Email matching test failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/home')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Bug className="w-8 h-8" />
                Debug Invitations
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Diagnose private khatmah invitation issues
              </p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <Card className="p-6 mb-6 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            Current User
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Email:</span>
              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                {userEmail || 'Not logged in'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-600 dark:text-gray-400">User ID:</span>
              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs text-gray-800 dark:text-gray-200">
                {userId || 'Not logged in'}
              </span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card className="p-6 mb-6 bg-white dark:bg-gray-800">
          <div className="flex gap-4 flex-wrap">
            <Button
              onClick={fetchInvitations}
              disabled={loading}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Fetch Invitations
            </Button>
            <Button
              onClick={testEmailMatching}
              variant="outline"
              className="gap-2"
            >
              Test Email Matching
            </Button>
          </div>
        </Card>

        {/* Database Stats */}
        {dbStats && (
          <Card className="p-6 mb-6 bg-white dark:bg-gray-800">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              Database Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {dbStats.totalInvitations || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Invitations</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {dbStats.pendingInvitations || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {dbStats.userInvitations || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">For You</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {dbStats.totalKhatmahs || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Khatmahs</div>
              </div>
            </div>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="p-6 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="w-5 h-5" />
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* Service Invitations Result */}
        <Card className="p-6 mb-6 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            Service Function Result (getPendingInvitations)
          </h2>
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No pending invitations found via service function</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((inv: any) => (
                <div key={inv.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-semibold">ID:</span> {inv.id}</div>
                    <div><span className="font-semibold">Email:</span> {inv.email}</div>
                    <div><span className="font-semibold">Status:</span> {inv.status}</div>
                    <div><span className="font-semibold">Khatmah:</span> {inv.khatmah?.name || 'N/A'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Raw Invitations */}
        <Card className="p-6 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            Raw Database Query (All Pending)
          </h2>
          {rawInvitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No pending invitations in database</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(rawInvitations, null, 2)}
              </pre>
            </div>
          )}
        </Card>

        {/* Console Reminder */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            💡 <strong>Tip:</strong> Open your browser console (F12) to see detailed debug logs starting with 📧
          </p>
        </div>
      </div>
    </div>
  );
}

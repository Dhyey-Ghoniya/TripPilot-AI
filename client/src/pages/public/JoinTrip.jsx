import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import tripService from '../../services/tripService';

const PENDING_INVITE_KEY = 'trippilot_pending_invite';

const JoinTrip = () => {
  const { inviteCode = '' } = useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoading || !inviteCode) return undefined;
    if (!isAuthenticated) {
      localStorage.setItem(PENDING_INVITE_KEY, inviteCode);
      return undefined;
    }

    let cancelled = false;
    setJoining(true);
    tripService.joinTrip(inviteCode)
      .then((response) => {
        localStorage.removeItem(PENDING_INVITE_KEY);
        const result = response?.data || response;
        if (!cancelled) navigate(`/trips/${result.tripId}`, { replace: true });
      })
      .catch((requestError) => {
        localStorage.removeItem(PENDING_INVITE_KEY);
        if (!cancelled) setError(requestError.customMessage || requestError.response?.data?.message || 'This trip invite is invalid or has expired.');
      })
      .finally(() => {
        if (!cancelled) setJoining(false);
      });
    return () => { cancelled = true; };
  }, [inviteCode, isAuthenticated, isLoading, navigate]);

  if (isLoading || joining) {
    return <div className="page-shell flex min-h-[50vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="page-shell py-16">
      <Card className="mx-auto max-w-lg space-y-4 p-8 text-center">
        <Users className="mx-auto h-10 w-10 text-secondary-600" />
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Join a trip workspace</h1>
        {error ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>
        ) : isAuthenticated ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Adding you to the shared trip…</p>
        ) : (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400">Sign in or create an account to join as an editor and plan this trip with the group.</p>
            <div className="flex justify-center gap-3">
              <Link to="/login"><Button variant="outline">Log in</Button></Link>
              <Link to="/register"><Button variant="primary">Create account</Button></Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default JoinTrip;

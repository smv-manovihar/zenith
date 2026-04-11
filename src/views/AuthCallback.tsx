import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '@/components/ProgressProvider';
import { Loader2 } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const { setToken } = useProgress();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        setToken(accessToken);
        navigate('/import');
      }
    } else {
      // If no hash, maybe already have token or error
      navigate('/');
    }
  }, [setToken, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <p className="text-xl font-medium animate-pulse">Authenticating with AniList...</p>
    </div>
  );
};

export default AuthCallback;

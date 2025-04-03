
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';

export function useAuthSession() {
  const auth = useAuth();
  const [origin, setOrigin] = useState<string | null>(null);

  useEffect(() => {
    // Set the original domain that the user logged in from
    if (auth.user && !origin) {
      setOrigin(window.location.hostname);
      localStorage.setItem('auth_origin', window.location.hostname);
    }
    
    // Clear origin on logout
    if (!auth.user) {
      setOrigin(null);
      localStorage.removeItem('auth_origin');
    }
  }, [auth.user, origin]);

  // Get the domain the user originally logged in from
  const getLoginOrigin = () => {
    return origin || localStorage.getItem('auth_origin') || window.location.hostname;
  };

  return {
    ...auth,
    origin: getLoginOrigin(),
  };
}

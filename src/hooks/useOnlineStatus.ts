import { useState, useEffect } from 'react';

interface OnlineStatusOptions {
  pingInterval?: number;
  pingUrl?: string;
  pingTimeout?: number;
}

export function useOnlineStatus({
  pingInterval = 30000,
  pingUrl = '/ping',
  pingTimeout = 5000
}: OnlineStatusOptions = {}) {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);
  
  const handleOnline = () => {
    setOnline(true);
    setLastChecked(new Date());
  };
  
  const handleOffline = () => {
    setOnline(false);
    setLastChecked(new Date());
  };
  
  const checkConnection = async () => {
    if (checking) return;
    
    try {
      setChecking(true);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), pingTimeout);
      
      await fetch(pingUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      setOnline(true);
      setLastChecked(new Date());
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('network')) {
          setOnline(false);
        }
      }
      
      setLastChecked(new Date());
    } finally {
      setChecking(false);
    }
  };
  
  useEffect(() => {
    checkConnection();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const intervalId = setInterval(checkConnection, pingInterval);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [pingInterval]);
  
  return {
    online,
    lastChecked,
    checking,
    checkNow: checkConnection
  };
}
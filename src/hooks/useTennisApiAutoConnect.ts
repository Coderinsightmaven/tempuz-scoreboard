import { useEffect } from 'react';
import { useLiveDataStore } from '../stores/useLiveDataStore';

/**
 * Hook that automatically connects to the tennis API on app startup.
 * 
 * This hook:
 * - Attempts to connect to IonCourt WebSocket on mount
 * - Skips auto-connection if already connected
 * - Skips auto-connection if user has manually configured a connection
 * - Handles errors silently (doesn't interrupt user workflow)
 * 
 * @returns void - This hook only performs side effects
 */
export const useTennisApiAutoConnect = () => {
  const { connectToWebSocket, tennisApiConnected, clearError } = useLiveDataStore();

  useEffect(() => {
    autoConnectToTennisApi();
  }, []); // Empty dependency array - only run once on mount

  /**
   * Attempts to automatically connect to the tennis API WebSocket.
   * Uses IonCourt WebSocket URL with a hardcoded token.
   * 
   * Side effects:
   * - Sets localStorage flags to track connection attempts
   * - Clears any previous connection errors
   * - Logs connection attempts to console
   */
  const autoConnectToTennisApi = async () => {
    // Only attempt auto-connection if not already connected
    if (tennisApiConnected) {
      console.log('🎾 App: Already connected to tennis API');
      return;
    }

    // Check if user has manually configured a connection (skip auto-connect)
    const hasManualConnection = localStorage.getItem('tennisApiManualConnection') === 'true';
    if (hasManualConnection) {
      console.log('🎾 App: Manual connection detected, skipping auto-connection');
      return;
    }

    console.log('🎾 App: Attempting automatic connection to tennis API...');

    // Clear any previous errors
    clearError();

    try {
      // Use IonCourt WebSocket URL
      const wsUrl = 'wss://sub.ioncourt.com/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXJ0bmVyX25hbWUiOiJiYXR0bGUtaW4tYmF5IiwiZXhwaXJ5IjoiMjAyNS0xMC0xMFQwMzo1OTo1OS45OTlaIiwidXNlcklkIjoiNWQ4OTVmZThjNzhhNWFhNTk4OThhOGIxIiwidG9rZW5JZCI6IjkxNTY5NjdmOTkzNjY2YTRjMTY0ZGQ0ZTllZWIyYTU0MGNiNGM3YTg5MGNlNmQwMTIzYTRkZjNiMWI3ZjdkOTAiLCJpYXQiOjE3NTc0MzY3ODEsImV4cCI6MTc2MDA2ODc5OX0.KaHcIiOKPnGl0oYwV8Iy0dHxRiUClnlV--jO2sAlwrE';

      console.log('🎾 App: Connecting to:', wsUrl.replace(/token=[^&]*/, 'token=[HIDDEN]'));
      console.log('🎾 App: Full WebSocket URL:', wsUrl);

      // Store auto-connection flag in localStorage to track attempts
      localStorage.setItem('tennisApiAutoConnecting', 'true');

      connectToWebSocket(wsUrl);

      console.log('🎾 App: Auto-connection initiated, connection will happen asynchronously');
    } catch (error) {
      console.warn('🎾 App: Auto-connection failed:', error);
      localStorage.removeItem('tennisApiAutoConnecting');
      // Don't show error to user - this is automatic and shouldn't interrupt workflow
    }
  };
};

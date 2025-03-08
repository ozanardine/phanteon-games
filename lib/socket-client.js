// lib/socket-client.js
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { API_SERVER_URL, SOCKET_OPTIONS } from './api-config';

// Singleton socket instance
let socket;

/**
 * Initialize Socket.io connection
 * @returns {Object} Socket.io instance
 */
export function initializeSocket() {
  if (!socket) {
    socket = io(API_SERVER_URL, SOCKET_OPTIONS);
    
    socket.on('connect', () => {
      console.log('[Socket] Connected to server');
    });
    
    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
    });
    
    socket.on('error', (error) => {
      console.error('[Socket] Error:', error);
    });
  }
  
  return socket;
}

/**
 * React hook for Socket.io
 * @returns {Object} Socket instance and connection status
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    // Initialize the socket connection
    const socketInstance = initializeSocket();
    
    // Set up event listeners
    const onConnect = () => {
      setIsConnected(true);
    };
    
    const onDisconnect = () => {
      setIsConnected(false);
    };
    
    // Register event listeners
    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    
    // Set initial connection state
    setIsConnected(socketInstance.connected);
    
    // Clean up event listeners on unmount
    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
    };
  }, []);
  
  return { socket, isConnected };
}

/**
 * Hook for subscribing to specific socket events
 * @param {string} eventName - Name of the event to subscribe to
 * @param {Function} callback - Event handler function
 */
export function useSocketEvent(eventName, callback) {
  useEffect(() => {
    const socketInstance = initializeSocket();
    
    // Register event handler
    socketInstance.on(eventName, callback);
    
    // Clean up on unmount
    return () => {
      socketInstance.off(eventName, callback);
    };
  }, [eventName, callback]);
}

/**
 * Hook for real-time server stats
 * @returns {Object} Server stats and loading state
 */
export function useServerStats() {
  const [serverStats, setServerStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const socketInstance = initializeSocket();
    
    // Handler for server stats updates
    const handleServerStats = (stats) => {
      setServerStats(stats);
      setIsLoading(false);
    };
    
    // Register event listener
    socketInstance.on('server_stats', handleServerStats);
    
    // Request initial data
    socketInstance.emit('get_server_stats');
    
    // Clean up on unmount
    return () => {
      socketInstance.off('server_stats', handleServerStats);
    };
  }, []);
  
  return { serverStats, isLoading };
}

/**
 * Hook for real-time server events
 * @returns {Object} Server events and loading state
 */
export function useServerEvents() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const socketInstance = initializeSocket();
    
    // Handler for server events
    const handleServerEvent = (event) => {
      setEvents((prevEvents) => [event, ...prevEvents]);
    };
    
    // Handler for initial events list
    const handleInitialEvents = (eventsList) => {
      setEvents(eventsList);
      setIsLoading(false);
    };
    
    // Register event listeners
    socketInstance.on('server_event', handleServerEvent);
    socketInstance.on('initial_events', handleInitialEvents);
    
    // Request initial events
    socketInstance.emit('get_initial_events');
    
    // Clean up on unmount
    return () => {
      socketInstance.off('server_event', handleServerEvent);
      socketInstance.off('initial_events', handleInitialEvents);
    };
  }, []);
  
  return { events, isLoading };
}
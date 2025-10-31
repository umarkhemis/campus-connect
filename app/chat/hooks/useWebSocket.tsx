


import { useState, useEffect, useRef } from 'react';
import ConnectionAPI from '../../api/connectionService';

export const useWebSocket = (roomId) => {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);

  const connect = async () => { // Make this async
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      ws.current = await ConnectionAPI.createWebSocket( // Await the WebSocket creation
        roomId,
        (data) => {
          // Handle incoming messages
          console.log('WebSocket message:', data);
        },
        () => setIsConnected(true),
        () => setIsConnected(false)
      );
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  };

  const sendWebSocketMessage = (data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  };

  useEffect(() => {
    if (roomId) {
      connect(); // This will now properly handle the async token retrieval
    }

    return () => {
      disconnect();
    };
  }, [roomId]);

  return {
    isConnected,
    sendWebSocketMessage,
    connect,
    disconnect,
  };
};







































// import { useState, useEffect, useRef } from 'react';
// import ConnectionAPI from '../../api/connectionService';

// export const useWebSocket = (roomId) => {
//   const [isConnected, setIsConnected] = useState(false);
//   const ws = useRef(null);

//   const connect = () => {
//     if (ws.current?.readyState === WebSocket.OPEN) return;

//     ws.current = ConnectionAPI.createWebSocket(
//       roomId,
//       (data) => {
//         // Handle incoming messages
//         console.log('WebSocket message:', data);
//       },
//       () => setIsConnected(true),
//       () => setIsConnected(false)
//     );
//   };

//   const disconnect = () => {
//     if (ws.current) {
//       ws.current.close();
//       ws.current = null;
//     }
//   };

//   const sendWebSocketMessage = (data) => {
//     if (ws.current?.readyState === WebSocket.OPEN) {
//       ws.current.send(JSON.stringify(data));
//     }
//   };

//   useEffect(() => {
//     if (roomId) {
//       connect();
//     }

//     return () => {
//       disconnect();
//     };
//   }, [roomId]);

//   return {
//     isConnected,
//     sendWebSocketMessage,
//     connect,
//     disconnect,
//   };
// };
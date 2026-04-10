import { useState, useEffect, useCallback } from 'react';
import { database } from './firebase';
import { ref, onValue, set, update, get } from 'firebase/database';

export const useFirebaseRoom = (roomCode: string, initialPlayerId: string, userName: string) => {
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    if (!roomCode || roomCode.length < 6) return;

    const roomRef = ref(database, `rooms/${roomCode}`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameState(data);
      } else {
        setGameState(null);
      }
    });

    return () => unsubscribe();
  }, [roomCode]);

  const joinGame = useCallback(async () => {
    if (!roomCode) return false;
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return false;

    const currentData = snapshot.val();
    const players = currentData.players || {};
    
    if (!players[initialPlayerId]) {
      // Add the player if they don't exist
      await update(roomRef, {
        [`players/${initialPlayerId}`]: {
          id: initialPlayerId,
          name: userName || "Guest",
          avatar: `https://picsum.photos/seed/${initialPlayerId}/100`,
          hand: [],
          isActive: false,
          score: 0,
          isBot: false,
          isHost: false,
        }
      });
    }
    return true;
  }, [roomCode, initialPlayerId, userName]);

  const updateGameState = useCallback(async (updates: any) => {
    if (!roomCode) return;
    const roomRef = ref(database, `rooms/${roomCode}`);
    await update(roomRef, updates);
  }, [roomCode]);

  return {
    gameState,
    joinGame,
    updateGameState
  };
};

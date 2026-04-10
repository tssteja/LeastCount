/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Settings, 
  Info, 
  ChevronRight, 
  ChevronLeft,
  Play,
  RotateCcw,
  Hand,
  Crown,
  User,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Volume2,
  VolumeX,
  LogOut,
  Timer as TimerIcon
} from 'lucide-react';

// --- Types ---
type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'Joker';

interface CardData {
  id: string;
  suit: Suit | 'none';
  rank: Rank;
  value: number;
  color: 'red' | 'black';
}

interface Player {
  id: number;
  name: string;
  avatar: string;
  hand: CardData[];
  isActive: boolean;
  score: number;
  isBot: boolean;
  isHost: boolean;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

enum GameStatus {
  HOME = 'HOME',
  LOBBY = 'LOBBY',
  ROOM = 'ROOM',
  DEALING = 'DEALING',
  PLAYING = 'PLAYING',
  ROUND_END = 'ROUND_END',
}

enum TurnPhase {
  SELECTING = 'SELECTING',
  DRAWING = 'DRAWING',
}

// --- Constants ---
const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUIT_ORDER: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANK_SORT_ORDER: Record<Exclude<Rank, 'Joker'>, number> = {
  A: 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
};

const getRankValue = (rank: Rank): number => {
  if (rank === 'Joker') return 0;
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  if (rank === 'A') return 1;
  return parseInt(rank);
};

const sortCardsAscending = (cards: CardData[]): CardData[] => {
  return [...cards].sort((a, b) => {
    if (a.rank === 'Joker' && b.rank !== 'Joker') return 1;
    if (b.rank === 'Joker' && a.rank !== 'Joker') return -1;

    const rankDiff = RANK_SORT_ORDER[a.rank as Exclude<Rank, 'Joker'>] - RANK_SORT_ORDER[b.rank as Exclude<Rank, 'Joker'>];
    if (rankDiff !== 0) return rankDiff;

    const suitDiff = SUIT_ORDER.indexOf(a.suit as Suit) - SUIT_ORDER.indexOf(b.suit as Suit);
    if (suitDiff !== 0) return suitDiff;

    return a.rank.localeCompare(b.rank);
  });
};

let cardIdCounter = 0;

const createDeck = (deckIndex: number = 0): CardData[] => {
  const deck: CardData[] = [];
  const timestamp = Date.now();
  
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      cardIdCounter++;
      deck.push({
        id: `${suit}-${rank}-${deckIndex}-${timestamp}-${cardIdCounter}-${Math.random().toString(36).substr(2, 9)}`,
        suit,
        rank,
        value: getRankValue(rank),
        color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black',
      });
    });
  });

  // Add 2 Jokers
  for (let i = 1; i <= 2; i++) {
    cardIdCounter++;
    deck.push({
      id: `joker-${i}-${deckIndex}-${timestamp}-${cardIdCounter}-${Math.random().toString(36).substr(2, 9)}`,
      suit: 'hearts',
      rank: 'Joker',
      value: 0,
      color: i === 1 ? 'red' : 'black',
    });
  }

  return deck;
};

// --- Components ---

const TURN_TIME = 30;

// --- Components ---

const ChatPanel: React.FC<{ 
  messages: Message[]; 
  onSendMessage: (text: string) => void; 
  onClose: () => void;
}> = ({ messages, onSendMessage, onClose }) => {
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText("");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="chat-panel"
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-white font-black uppercase tracking-widest text-xs">Game Chat</h3>
        <button onClick={onClose} className="text-white/40 hover:text-white">
          <XCircle className="w-5 h-5" />
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scoreboard-scroll">
        {messages.map(msg => (
          <div key={msg.id} className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{msg.sender}</span>
            <div className="bg-white/5 rounded-xl rounded-tl-none p-3 border border-white/5">
              <p className="text-sm text-white/90 leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="chat-input-container">
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        <button 
          onClick={handleSend}
          className="p-2 bg-indigo-600 rounded-xl text-white hover:bg-indigo-500 transition-all"
        >
          <Play className="w-4 h-4 fill-white" />
        </button>
      </div>
    </motion.div>
  );
};

const Card: React.FC<{ 
  card: CardData; 
  index: number; 
  total: number; 
  isSelected?: boolean;
  onClick?: () => void;
  isPlayable?: boolean;
  isHidden?: boolean;
  onDragStart?: () => void;
  onDrag?: (event: any, info: any) => void;
  onDragEnd?: (event: any, info: any) => void;
  onDoubleClick?: () => void;
  draggingCardId?: string | null;
  isDragging?: boolean;
  isCompact?: boolean;
}> = ({ card, index, total, isSelected, onClick, onDoubleClick, isPlayable = true, isHidden = false, onDragStart, onDrag, onDragEnd, draggingCardId, isDragging = false, isCompact = false }) => {
  const angle = (index - (total - 1) / 2) * 6;
  
  if (isHidden) {
    return (
      <motion.div
        layoutId={card.id}
        className="card-fan-item card relative w-12 h-[4.5rem] md:w-20 md:h-28 bg-indigo-900 rounded-lg shadow-xl border-2 border-indigo-400/30 flex items-center justify-center overflow-hidden"
        style={{ rotate: angle }}
      >
        <div className="w-full h-full border-4 border-white/10 rounded-md flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-white/10"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  const springTransition = { type: 'spring' as const, stiffness: 380, damping: 32 };
  const cardDimensions = isCompact
    ? 'w-[2.75rem] h-16 md:w-20 md:h-28'
    : 'w-[3.15rem] h-[4.4rem] sm:w-16 sm:h-24 md:w-24 md:h-36';
  const cardText = isCompact ? 'text-[6px] md:text-lg' : 'text-[6px] sm:text-[7px] md:text-lg';
  const cardFace = isCompact ? 'text-sm md:text-4xl' : 'text-base sm:text-lg md:text-4xl';

  return (
    <motion.div
      layoutId={card.id}
      layout
      initial={{ y: 60, opacity: 0, rotate: angle }}
      animate={{ 
        y: isSelected ? -32 : 0,
        opacity: 1,
        rotate: angle,
        scale: isSelected ? 1.06 : 1
      }}
      transition={springTransition}
      whileHover={isPlayable ? { y: isSelected ? -44 : -18, scale: 1.12, transition: { duration: 0.15 } } : {}}
      onClick={() => !isDragging && onClick?.()}
      onDoubleClick={() => !isDragging && onDoubleClick?.()}
      drag={isPlayable && (!draggingCardId || draggingCardId === card.id)}
      dragSnapToOrigin
      dragElastic={0.08}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 260, bounceDamping: 32 }}
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      whileDrag={{ 
        scale: 1.08,
        rotate: angle + 2,
        zIndex: 9999, 
        cursor: 'grabbing',
        filter: 'drop-shadow(0 14px 24px rgba(99,102,241,0.35))',
        transition: { duration: 0.12 }
      }}
      className={`card-fan-item card relative ${cardDimensions} bg-white rounded-xl shadow-xl flex flex-col items-center justify-between p-1 md:p-2 border-2 ${isSelected ? 'selected border-indigo-500 ring-4 ring-indigo-500/20' : 'border-gray-200'} cursor-grab select-none overflow-hidden`}
      style={{ 
        color: card.color === 'red' ? '#ef4444' : '#1f2937',
        zIndex: isSelected ? 1000 + index : 10 + index,
        willChange: 'transform',
        touchAction: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserDrag: 'none',
      }}
    >
      <div className={`absolute left-1 top-1 flex flex-col items-start font-bold leading-none ${cardText}`}>
        {card.rank === 'Joker' ? 'J' : card.rank}
        <div className="text-[6px] sm:text-[7px] md:text-sm">{getSuitIcon(card.suit)}</div>
      </div>
      
      <div className={cardFace}>
        {card.rank === 'Joker' ? '🃏' : getSuitIcon(card.suit)}
      </div>
      
      <div className={`absolute bottom-1 right-1 flex flex-col items-end font-bold leading-none rotate-180 ${cardText}`}>
        {card.rank === 'Joker' ? 'J' : card.rank}
        <div className="text-[6px] sm:text-[7px] md:text-sm">{getSuitIcon(card.suit)}</div>
      </div>
    </motion.div>
  );
};

const getSuitIcon = (suit: Suit | 'none') => {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
    default: return '';
  }
};

const PlayerAvatar: React.FC<{ player: Player; position: string; isWinner?: boolean; isLeader?: boolean; isActive?: boolean; isCompact?: boolean }> = ({ player, position, isWinner, isLeader, isActive, isCompact = false }) => {
  return (
    <div className={`absolute ${position} flex flex-col items-center ${isCompact ? 'gap-1.5' : 'gap-2'} z-20 transition-all duration-500`}>
      <div className={`relative p-1 rounded-full transition-all duration-300 ${isActive ? 'player active bg-green-500' : 'bg-white/10'} ${isWinner ? 'ring-4 ring-amber-400 animate-bounce' : ''}`}>
        {isLeader && (
          <div className={`absolute left-1/2 -translate-x-1/2 text-amber-400 animate-pulse ${isCompact ? '-top-4' : '-top-6'}`}>
            <Crown className={isCompact ? "w-4 h-4 fill-amber-400" : "w-6 h-6 fill-amber-400"} />
          </div>
        )}
        <img 
          src={player.avatar} 
          alt={player.name} 
          className={`player-avatar rounded-full object-cover border-2 border-white/20 ${isCompact ? 'w-8 h-8 md:w-12 md:h-12' : 'w-10 h-10 md:w-16 md:h-16'}`}
        />
        <div className={`player-badge absolute -bottom-0.5 -right-0.5 bg-indigo-600 text-white font-bold px-1 py-0.5 rounded-full border border-white/20 ${isCompact ? 'text-[7px] md:text-[9px]' : 'text-[7px] md:text-[10px]'}`}>
          {player.hand.length}
        </div>
        {isActive && (
          <div className={`absolute -top-1 -right-1 bg-green-500 rounded-full border-2 border-[#0f172a] animate-ping ${isCompact ? 'w-3 h-3' : 'w-4 h-4'}`}></div>
        )}
      </div>
      <div className="flex flex-col items-center">
        <span className={`font-semibold drop-shadow-md ${player.id === 0 ? 'text-indigo-400' : 'text-white/90'} ${isCompact ? 'text-[10px] md:text-xs' : 'text-xs md:text-sm'}`}>
          {player.name}
        </span>
        <span className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} text-white/50`}>{player.score} pts</span>
      </div>
    </div>
  );
};

export default function App() {
  // --- Game State ---
  const [status, setStatus] = useState<GameStatus>(GameStatus.HOME);
  const [userName, setUserName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [initialCardCount, setInitialCardCount] = useState(7);
  const [playerCount, setPlayerCount] = useState(4);
  const [players, setPlayers] = useState<Player[]>([]);
  const [deck, setDeck] = useState<CardData[]>([]);
  const [discardPile, setDiscardPile] = useState<CardData[]>([]);
  const [joker, setJoker] = useState<CardData | null>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>(TurnPhase.SELECTING);
  const [lastPlayedCards, setLastPlayedCards] = useState<CardData[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);
  const [roundWinner, setRoundWinner] = useState<Player | null>(null);
  const [startingPlayerIndex, setStartingPlayerIndex] = useState(0);
  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TURN_TIME);
  const [isMuted, setIsMuted] = useState(false);
  const [roomCode, setRoomCode] = useState("SR-12D");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [playAreaCards, setPlayAreaCards] = useState<CardData[]>([]);
  const [isRoundEnding, setIsRoundEnding] = useState(false);
  const [isCompactLandscape, setIsCompactLandscape] = useState(false);
  
  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [isOverPlayArea, setIsOverPlayArea] = useState(false);
  const playAreaRef = useRef<HTMLDivElement>(null);

  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const actionLockRef = useRef(false);

  // --- Audio / Effects ---
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    if (status === GameStatus.ROUND_END) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [status]);

  useEffect(() => {
    // Preload sounds
    const sounds = {
      deal: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
      play: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3',
      draw: 'https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3',
      win: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
      error: 'https://assets.mixkit.co/active_storage/sfx/2016/2016-preview.mp3',
      select: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'
    };

    Object.entries(sounds).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.volume = 0.3;
      audioRefs.current[key] = audio;
    });
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px) and (orientation: landscape)');
    const update = () => setIsCompactLandscape(mediaQuery.matches);

    update();
    mediaQuery.addEventListener('change', update);
    window.addEventListener('resize', update);

    return () => {
      mediaQuery.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const playSound = (type: 'deal' | 'play' | 'draw' | 'win' | 'error' | 'select') => {
    if (isMuted) return;
    const audio = audioRefs.current[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  };

  const showMessage = (text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const resetInteractionState = useCallback((keepSelection: boolean = false) => {
    setIsDragging(false);
    setDraggingCardId(null);
    setIsOverPlayArea(false);
    if (!keepSelection) {
      setSelectedCardIds([]);
    }
  }, []);

  const sendMessage = (text: string) => {
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: userName || "You",
      text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // --- Game Logic ---

  const initGame = useCallback(() => {
    console.log("--- Game Initialization Started ---");
    setIsRoundEnding(false);
    setRoundWinner(null);
    setPlayAreaCards([]);
    setLastPlayedCards([]);
    setTurnPhase(TurnPhase.SELECTING);
    setTimeLeft(TURN_TIME);
    resetInteractionState();

    // Calculate how many decks are needed based on player count and cards per player
    const decksNeeded = Math.max(1, Math.ceil((playerCount * initialCardCount + 10) / 52));
    
    let newDeck: CardData[] = [];
    for (let i = 0; i < decksNeeded; i++) {
      newDeck = [...newDeck, ...createDeck(i)];
    }

    // Shuffle
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }

    // Create new players with current scores
    const newPlayers: Player[] = Array.from({ length: playerCount }).map((_, i) => ({
      id: i,
      name: i === 0 ? userName || "You" : `Player ${i}`,
      avatar: `https://picsum.photos/seed/${i === 0 ? userName || "You" : `p${i}`}/100`,
      hand: [],
      isActive: false,
      score: players.find(p => p.id === i)?.score || 0,
      isBot: i !== 0,
      isHost: i === 0,
    }));

    // Initial Table Setup - Pick Joker BEFORE dealing
    const jokerIndex = Math.floor(Math.random() * newDeck.length);
    const [jokerCard] = newDeck.splice(jokerIndex, 1);
    const jokerRank = jokerCard.rank;
    
    // Set value 0 for all cards of the same rank in the deck
    newDeck = newDeck.map(c => c.rank === jokerRank ? { ...c, value: 0 } : c);

    // Deal
    for (let i = 0; i < initialCardCount; i++) {
      newPlayers.forEach(p => {
        const card = newDeck.pop();
        if (card) p.hand.push(card);
      });
    }

    const startCard = newDeck.pop();
    if (!startCard || !jokerCard) {
      showMessage("Not enough cards in the deck to start the game!", "error");
      setStatus(GameStatus.HOME);
      return;
    }
    if (startCard.rank === jokerRank) startCard.value = 0;

    // Set active player
    const startIndex = startingPlayerIndex % playerCount;
    newPlayers[startIndex].isActive = true;
    newPlayers.forEach(player => {
      player.hand = sortCardsAscending(player.hand);
    });
    
    setDeck(newDeck);
    setDiscardPile([startCard]);
    setJoker(jokerCard);
    setPlayers(newPlayers);
    setCurrentPlayerIndex(startIndex);
    actionLockRef.current = false;
    setIsProcessingAction(false);
    
    setStatus(GameStatus.PLAYING);
    playSound('deal');
  }, [playerCount, initialCardCount, startingPlayerIndex, userName, players]);

  const handleStartGame = () => {
    if (status === GameStatus.DEALING) return;
    setStatus(GameStatus.DEALING);
    setTimeout(initGame, 1000);
  };

  const handleExit = () => {
    setStatus(GameStatus.HOME);
    setPlayers([]);
    setDeck([]);
    setDiscardPile([]);
    setPlayAreaCards([]);
    setLastPlayedCards([]);
    setRoundWinner(null);
    setIsRoundEnding(false);
    resetInteractionState();
  };

  const nextTurn = useCallback(() => {
    const nextIndex = (currentPlayerIndex - 1 + playerCount) % playerCount;
    
    // Move play area cards to discard pile before switching turns
    if (playAreaCards.length > 0) {
      setDiscardPile(prev => [...prev, ...playAreaCards]);
    }

    setPlayers(prev => prev.map((p, i) => ({
      ...p,
      isActive: i === nextIndex
    })));
    setCurrentPlayerIndex(nextIndex);
    setTurnPhase(TurnPhase.SELECTING);
    setPlayAreaCards([]);
    setLastPlayedCards([]);
    setTimeLeft(TURN_TIME);
    actionLockRef.current = false;
    setIsProcessingAction(false);
    resetInteractionState();
  }, [currentPlayerIndex, playerCount, playAreaCards, resetInteractionState]);

  const handleCardSelect = (cardId: string) => {
    if (status !== GameStatus.PLAYING || currentPlayerIndex !== 0 || turnPhase !== TurnPhase.SELECTING || isDragging || isRoundEnding) return;

    const player = players[0];
    const selectedCard = player.hand.find(c => c.id === cardId);
    if (!selectedCard) return;

    setSelectedCardIds(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      }

      if (prev.length > 0) {
        const anchorCard = player.hand.find(c => c.id === prev[0]);
        if (anchorCard && anchorCard.rank !== selectedCard.rank) {
          showMessage('Select cards with the same rank to group them.', 'error');
          return [cardId];
        }
      }

      playSound('select');
      return [...prev, cardId];
    });
  };

  const handleCardDoubleClick = (cardId: string) => {
    if (status !== GameStatus.PLAYING || currentPlayerIndex !== 0 || turnPhase !== TurnPhase.SELECTING || isRoundEnding) return;
    const player = players[0];
    const selectedCard = player?.hand.find(c => c.id === cardId);
    if (!selectedCard) return;

    setSelectedCardIds(prev => {
      const sameRankCards = player.hand
        .filter(c => c.rank === selectedCard.rank)
        .map(c => c.id);
      const nextSelection = Array.from(new Set([...prev.filter(id => sameRankCards.includes(id)), ...sameRankCards]));
      return nextSelection.length > 0 ? nextSelection : [cardId];
    });
    playSound('select');
  };

  const playCards = useCallback((cardIdToPlay?: string) => {
    if (actionLockRef.current || isRoundEnding) return;
    
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;

    const idsToPlay = cardIdToPlay ? [cardIdToPlay] : selectedCardIds;
    if (idsToPlay.length === 0) return;

    actionLockRef.current = true;
    setIsProcessingAction(true);
    
    const cardsToPlay = currentPlayer.hand.filter(c => idsToPlay.includes(c.id));
    const sortedCardsToPlay = sortCardsAscending(cardsToPlay);
    const remainingHand = sortCardsAscending(currentPlayer.hand.filter(c => !idsToPlay.includes(c.id)));

    // Validate if cards can be played (same rank OR sequence of 3+ same suit)
    const firstRank = cardsToPlay[0].rank;
    const allSameRank = cardsToPlay.every(c => c.rank === firstRank || c.rank === 'Joker' || firstRank === 'Joker');
    const isHumanPlayer = !currentPlayer.isBot;
    
    const isSequence = (() => {
      if (cardsToPlay.length < 3) return false;
      const nonJokers = cardsToPlay.filter(c => c.rank !== 'Joker');
      if (nonJokers.length === 0) return true;
      
      const suit = nonJokers[0].suit;
      if (!nonJokers.every(c => c.suit === suit)) return false;
      
      const sorted = [...nonJokers].sort((a, b) => a.value - b.value);
      const min = sorted[0].value;
      const max = sorted[sorted.length - 1].value;
      const range = max - min + 1;
      
      // Check for duplicates
      const hasDuplicates = new Set(nonJokers.map(c => c.value)).size !== nonJokers.length;
      if (hasDuplicates) return false;

      return range <= cardsToPlay.length;
    })();

    if (!allSameRank && !isSequence) {
      if (!currentPlayer.isBot) showMessage("Invalid combination! Must be same rank or sequence of 3+ same suit.", "error");
      actionLockRef.current = false;
      setIsProcessingAction(false);
      return;
    }

    // Move previous play area cards to discard pile
    if (playAreaCards.length > 0) {
      setDiscardPile(prev => [...prev, ...playAreaCards]);
    }

    setPlayers(prev => prev.map((p, i) => {
      if (i === currentPlayerIndex) {
        return { ...p, hand: remainingHand };
      }
      return p;
    }));
    
    setPlayAreaCards(sortedCardsToPlay);
    setLastPlayedCards(sortedCardsToPlay);
    setSelectedCardIds([]);

    const topDiscard = discardPile[discardPile.length - 1];
    const isMultiCardPower = sortedCardsToPlay.length >= 3;
    const isMatch = isMultiCardPower || sortedCardsToPlay.some(c => c.rank === topDiscard.rank || c.rank === 'Joker' || topDiscard.rank === 'Joker');

    playSound('play');

    if (isMatch) {
      setTimeout(() => {
        setDiscardPile(prev => [...prev, ...sortedCardsToPlay]);
        setPlayAreaCards([]);
        nextTurn();
      }, 1000);
    } else {
      setTurnPhase(TurnPhase.DRAWING);
      actionLockRef.current = false;
      setIsProcessingAction(false);
      if (!currentPlayer.isBot) showMessage(`${currentPlayer.name} must draw a card!`, "info");
    }
  }, [players, currentPlayerIndex, selectedCardIds, discardPile, nextTurn, isRoundEnding, playAreaCards]);

  const handleDragStart = (cardId: string) => {
    if (!selectedCardIds.includes(cardId)) {
      setSelectedCardIds([cardId]);
    }
    setIsDragging(true);
    setDraggingCardId(cardId);
  };

  const handleDrag = (event: any, info: any) => {
    let overPlayArea = false;
    if (playAreaRef.current) {
      const rect = playAreaRef.current.getBoundingClientRect();
      const { x, y } = info.point;
      overPlayArea = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      setIsOverPlayArea(overPlayArea);
    }
  };

  const handleDragEnd = (cardId: string, info: any) => {
    if (playAreaRef.current) {
      const rect = playAreaRef.current.getBoundingClientRect();
      const { x, y } = info.point;
      
      // Use a buffer for better drop detection
      const buffer = 30;
      const isInside = x >= rect.left - buffer && x <= rect.right + buffer && 
                       y >= rect.top - buffer && y <= rect.bottom + buffer;
      
      if (isInside) {
        // If the dragged card is part of the current selection, play the whole selection
        if (selectedCardIds.includes(cardId)) {
          playCards();
        } else {
          // Otherwise just play the dragged card
          playCards(cardId);
        }
      }
    }
    
    setTimeout(() => resetInteractionState(), 0);
  };

  const callLeastCount = useCallback(() => {
    if (status !== GameStatus.PLAYING || actionLockRef.current || isRoundEnding) return;
    actionLockRef.current = true;
    setIsProcessingAction(true);
    setIsRoundEnding(true);
    
    const caller = players[currentPlayerIndex];
    const callerScore = caller.hand.reduce((sum, c) => sum + c.value, 0);

    // Resolution
    const allScores = players.map(p => ({
      id: p.id,
      score: p.hand.reduce((sum, c) => sum + c.value, 0)
    }));

    const minScore = Math.min(...allScores.map(s => s.score));
    const highestScore = Math.max(...allScores.map(s => s.score));
    const winners = allScores.filter(s => s.score === minScore);

    const isCallerWinner = winners.some(w => w.id === caller.id);
    
    let roundWinnerPlayer: Player | null = null;
    
    const updatedPlayers = players.map(p => {
      let roundPoints = p.hand.reduce((sum, c) => sum + c.value, 0);
      
      if (p.id === caller.id) {
        if (!isCallerWinner) {
          // Penalty
          roundPoints = 2 * highestScore;
        } else {
          // Winner points
          roundPoints = 0;
        }
      }

      return { ...p, score: p.score + roundPoints };
    });

    if (isCallerWinner) {
      roundWinnerPlayer = caller;
      showMessage(`${caller.name} won the round with ${callerScore} points!`, "success");
    } else {
      const actualWinner = players.find(p => p.id === winners[0].id) || players[0];
      roundWinnerPlayer = actualWinner;
      showMessage(`${caller.name} failed! ${actualWinner.name} wins the round.`, "error");
    }

    setPlayers(updatedPlayers);
    setRoundWinner(roundWinnerPlayer);
    setStatus(GameStatus.ROUND_END);
    setStartingPlayerIndex(prev => (prev + 1) % playerCount);
    resetInteractionState();
    
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
    playSound('win');
    
    setIsProcessingAction(false);
    actionLockRef.current = false;
  }, [players, currentPlayerIndex, initialCardCount, isMuted, status, isRoundEnding, playerCount]);

  const drawCard = useCallback((from: 'deck' | 'discard') => {
    if (turnPhase !== TurnPhase.DRAWING || actionLockRef.current || isRoundEnding) return;

    actionLockRef.current = true;
    setIsProcessingAction(true);
    
    let drawnCard: CardData | undefined;
    let newDeck = [...deck];
    let newDiscard = [...discardPile];

    if (from === 'deck') {
      if (newDeck.length === 0) {
        if (newDiscard.length <= 1) {
          showMessage("No more cards available! Round ends.", "info");
          setTimeout(callLeastCount, 500);
          resetInteractionState();
          setIsProcessingAction(false);
          actionLockRef.current = false;
          return;
        }
        
        const topDiscard = newDiscard.pop()!;
        newDeck = [...newDiscard];
        // Shuffle
        for (let i = newDeck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }
        newDiscard = [topDiscard];
      }
      
      drawnCard = newDeck.pop();
    } else {
      if (newDiscard.length === 0) {
        setIsProcessingAction(false);
        actionLockRef.current = false;
        return;
      }
      drawnCard = newDiscard.pop();
    }

    if (drawnCard) {
      setPlayers(prev => prev.map((p, idx) => {
        if (idx === currentPlayerIndex) {
          return { ...p, hand: sortCardsAscending([...p.hand, drawnCard!]) };
        }
        return p;
      }));
      setDeck(newDeck);
      setDiscardPile(newDiscard);
      playSound('draw');
      resetInteractionState();
      
      setTimeout(() => {
        nextTurn();
        setIsProcessingAction(false);
        actionLockRef.current = false;
      }, 500);
    } else {
      setIsProcessingAction(false);
      actionLockRef.current = false;
    }
  }, [turnPhase, deck, discardPile, players, currentPlayerIndex, nextTurn, callLeastCount, isRoundEnding]);

  const handleAutoPlay = useCallback(() => {
    if (actionLockRef.current || isRoundEnding || status !== GameStatus.PLAYING) return;
    
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;

    if (turnPhase === TurnPhase.SELECTING) {
      const topDiscard = discardPile[discardPile.length - 1];
      const validCards = currentPlayer.hand.filter(c => 
        c.rank === topDiscard.rank || 
        c.rank === 'Joker' || 
        topDiscard.rank === 'Joker'
      );
      
      if (validCards.length > 0) {
        const randomCard = validCards[Math.floor(Math.random() * validCards.length)];
        playCards(randomCard.id);
      } else {
        // If no valid move, must draw
        drawCard('deck');
      }
    } else {
      drawCard('deck');
    }
  }, [players, currentPlayerIndex, turnPhase, discardPile, playCards, drawCard, isRoundEnding, status]);

  // --- Timer Logic ---
  useEffect(() => {
    if (status !== GameStatus.PLAYING || isRoundEnding) {
      setTimeLeft(TURN_TIME);
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAutoPlay();
          return TURN_TIME;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, currentPlayerIndex, handleAutoPlay, isRoundEnding]);

  useEffect(() => {
    setTimeLeft(TURN_TIME);
  }, [currentPlayerIndex]);

  // --- Bot Logic ---
  // --- Effects ---
  useEffect(() => {
    // Reset drag and selection state on turn change
    resetInteractionState();
  }, [currentPlayerIndex, resetInteractionState]);

  useEffect(() => {
    if (status === GameStatus.PLAYING && players[currentPlayerIndex]?.isBot) {
      if (actionLockRef.current) return;
      
      const bot = players[currentPlayerIndex];
      const timer = setTimeout(() => {
        if (turnPhase === TurnPhase.SELECTING) {
          // Bot logic: try to match discard, or pick lowest card
          const topDiscard = discardPile[discardPile.length - 1];
          const matches = bot.hand.filter(c => c.rank === topDiscard.rank);
          
          let toPlay: string[] = [];
          if (matches.length > 0) {
            toPlay = matches.map(m => m.id);
          } else {
            // Pick lowest card
            const lowest = [...bot.hand].sort((a, b) => a.value - b.value)[0];
            toPlay = [lowest.id];
          }

          // Check if bot should call Least Count
          const botScore = bot.hand.reduce((sum, c) => sum + c.value, 0);
          if (botScore < initialCardCount && Math.random() > 0.5) {
            callLeastCount();
          } else {
            setSelectedCardIds(toPlay);
            setTimeout(playCards, 1000);
          }
        } else if (turnPhase === TurnPhase.DRAWING) {
          // Bot logic: draw from deck or discard
          const topDiscard = discardPile[discardPile.length - 1];
          if (topDiscard.value < 5) {
            drawCard('discard');
          } else {
            drawCard('deck');
          }
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, currentPlayerIndex, turnPhase, players, discardPile, initialCardCount, callLeastCount, playCards, drawCard]);

  // --- UI Helpers ---
  const playerHandScore = useMemo(() => {
    if (players.length === 0) return 0;
    return players[0].hand.reduce((sum, c) => sum + c.value, 0);
  }, [players]);

  const leaderId = useMemo(() => {
    if (players.length === 0) return -1;
    const sorted = [...players].sort((a, b) => a.score - b.score);
    return sorted[0].score < sorted[1]?.score ? sorted[0].id : -1;
  }, [players]);

  const tableBoundsClass = isCompactLandscape
    ? 'absolute inset-x-6 inset-y-4 border-2 rounded-[42px]'
    : 'absolute inset-x-20 inset-y-10 md:inset-x-28 md:inset-y-12 border-4 rounded-[80px]';
  const centerGapClass = isCompactLandscape ? 'table-center flex items-center gap-2' : 'table-center flex items-center gap-4 md:gap-10';
  const topBarClass = isCompactLandscape ? 'top-bar flex-shrink-0 flex justify-between items-center px-3 py-1.5 z-[1000] relative' : 'top-bar flex-shrink-0 flex justify-between items-center px-4 md:px-6 py-2 md:py-3 z-[1000] relative';
  const scoreBoardClass = isCompactLandscape ? `fixed top-12 left-2 transition-all duration-300 ${isScoreboardOpen ? 'w-40' : 'w-9'} z-[800]` : `fixed top-16 left-4 transition-all duration-300 ${isScoreboardOpen ? 'w-48 md:w-64' : 'w-10 md:w-12'} z-[800]`;
  const bottomPanelPaddingClass = isCompactLandscape ? 'bottom-panel compact-landscape' : 'bottom-panel';
  const actionBarClass = isCompactLandscape ? 'action-bar w-full px-2 py-1.5' : 'action-bar w-full px-4 py-2';

  return (
    <div className="min-h-screen bg-[#0f172a] font-sans selection:bg-indigo-500/30">
      {/* Landscape Only Overlay */}
      <div className="rotate-overlay">
        <div className="w-24 h-24 bg-indigo-600/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <RotateCcw className="w-12 h-12 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Rotate Your Device</h2>
        <p className="text-white/40 text-sm max-w-[240px]">Please rotate your device to landscape mode for the best gaming experience.</p>
      </div>

      <div className={`app-content min-h-screen ${status === GameStatus.ROUND_END ? 'game-ended' : ''}`}>
        {status === GameStatus.HOME && (
          <div className="flex items-center justify-center min-h-screen p-4 md:p-8">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="home-shell w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-[28px] md:rounded-[40px] p-5 md:p-12 shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
              
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-8 lg:gap-12">
                {/* Left Side: Branding */}
                <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-4 md:gap-6">
                  <div className="w-14 h-14 md:w-24 md:h-24 bg-indigo-600 rounded-[20px] md:rounded-[32px] flex items-center justify-center shadow-2xl shadow-indigo-500/40 rotate-3 hover:rotate-0 transition-transform duration-500">
                    <User className="w-8 h-8 md:w-12 md:h-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">Least<br/><span className="text-indigo-500">Count</span></h1>
                    <p className="text-white/40 text-sm md:text-lg mt-2 md:mt-4 font-medium">The ultimate card game of strategy and skill.</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden lg:block w-px h-32 md:h-48 bg-white/10"></div>

                {/* Right Side: Action */}
                <div className="flex-1 w-full space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Player Identity</label>
                    <input 
                      type="text" 
                      placeholder="Enter your name..."
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-6 py-4 md:px-8 md:py-5 bg-white/5 border border-white/10 rounded-2xl text-white text-base md:text-lg placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (!userName.trim()) setUserName(`Guest_${Math.floor(Math.random() * 1000)}`);
                      setStatus(GameStatus.LOBBY);
                    }}
                    className="w-full py-4 md:py-6 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-black text-base md:text-xl uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95 group flex items-center justify-center gap-3"
                  >
                    Start Playing
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {status === GameStatus.LOBBY && (
          <div className="flex items-center justify-center min-h-screen p-4 md:p-8">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="lobby-shell w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-[28px] md:rounded-[40px] p-5 md:p-12 shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
              
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-8 lg:gap-12">
                {/* Left Side */}
                <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-4 md:gap-6">
                  <div className="w-14 h-14 md:w-20 md:h-20 bg-indigo-600/20 rounded-2xl md:rounded-3xl flex items-center justify-center border border-indigo-500/30">
                    <Plus className="w-8 h-8 md:w-10 md:h-10 text-indigo-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">Game Lobby</h1>
                    <p className="text-white/40 text-base md:text-lg mt-1 md:mt-2 font-medium">Ready to challenge others?</p>
                  </div>
                </div>

                <div className="hidden lg:block w-px h-32 md:h-48 bg-white/10"></div>

                {/* Right Side */}
                <div className="flex-1 w-full space-y-6 md:space-y-8">
                  <button 
                    onClick={() => {
                      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                      setRoomCode(code);
                      setStatus(GameStatus.ROOM);
                    }}
                    className="w-full py-4 md:py-6 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-black text-base md:text-lg uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4"
                  >
                    <Plus className="w-5 h-5 md:w-6 md:h-6" />
                    Create New Game
                  </button>

                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-full border-t border-white/10"></div>
                    <span className="relative bg-[#0f172a] px-4 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Or Join Room</span>
                  </div>

                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="ROOM CODE"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 px-6 py-4 md:px-8 md:py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-mono text-lg md:text-xl tracking-widest placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                    <button 
                      onClick={() => {
                        if (roomCodeInput.length === 6) {
                          setRoomCode(roomCodeInput);
                          setStatus(GameStatus.ROOM);
                        } else {
                          showMessage("Invalid room code", "error");
                        }
                      }}
                      className="px-6 py-4 md:px-10 md:py-5 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-black text-sm md:text-base uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {status === GameStatus.ROOM && (
          <div className="flex items-center justify-center min-h-screen p-4 md:p-8">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="room-shell w-full max-w-5xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-[28px] md:rounded-[40px] p-5 md:p-12 shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
              
              <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                {/* Left Side: Players */}
                <div className="flex-1 space-y-5 md:space-y-8">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Waiting Room</h1>
                    <div className="mt-2 md:mt-3 px-3 py-1.5 md:px-4 md:py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl inline-flex items-center gap-3">
                      <span className="text-indigo-400/60 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]">Room Code:</span>
                      <span className="text-indigo-400 font-mono font-black text-lg md:text-xl tracking-widest">{roomCode}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Players (1/{playerCount})</label>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                        <div className="relative">
                          <img src={`https://picsum.photos/seed/${userName}/100`} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl border-2 border-indigo-500" alt="" />
                          <div className="absolute -top-2 -right-2 bg-indigo-500 text-[8px] font-black text-white px-1.5 py-0.5 rounded-md uppercase">Host</div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <span className="text-white font-black truncate block text-sm md:text-base">{userName}</span>
                          <span className="text-indigo-400/60 text-[10px] font-bold uppercase tracking-widest">Connected</span>
                        </div>
                      </div>
                      {Array.from({ length: playerCount - 1 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white/5 border border-white/5 rounded-2xl opacity-40">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                            <User className="w-5 h-5 md:w-6 md:h-6 text-white/20" />
                          </div>
                          <span className="text-white/20 font-bold italic text-xs md:text-sm">Waiting...</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="hidden lg:block w-px bg-white/10"></div>

                {/* Right Side: Settings */}
                <div className="w-full lg:w-80 space-y-6 md:space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Game Configuration</label>
                    
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-white/60">Initial Cards</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[7, 10, 13].map(count => (
                          <button
                            key={count}
                            onClick={() => setInitialCardCount(count)}
                            className={`py-2 md:py-3 rounded-xl font-black text-xs md:text-sm transition-all ${initialCardCount === count ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-xs font-bold text-white/60">Total Players</span>
                      <div className="flex items-center justify-between bg-white/5 p-2 rounded-2xl border border-white/10">
                        <button 
                          onClick={() => setPlayerCount(Math.max(2, playerCount - 1))}
                          className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all active:scale-90"
                        >
                          <Minus className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                        <span className="text-xl md:text-2xl font-black text-white">{playerCount}</span>
                        <button 
                          onClick={() => setPlayerCount(Math.min(6, playerCount + 1))}
                          className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all active:scale-90"
                        >
                          <Plus className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleStartGame}
                    className="w-full py-4 md:py-6 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-black text-lg md:text-xl uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 group"
                  >
                    <Play className="w-5 h-5 md:w-6 md:h-6 fill-white group-hover:scale-110 transition-transform" />
                    Start Game
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {(status === GameStatus.DEALING || status === GameStatus.PLAYING || status === GameStatus.ROUND_END) && (
          <div className={`game-container game-layout bg-[#0f172a] font-sans ${isCompactLandscape ? 'compact-landscape' : ''}`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="grid grid-cols-12 h-full w-full">
                {Array.from({ length: 144 }).map((_, i) => (
                  <div key={i} className="border-[0.5px] border-white/20"></div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <AnimatePresence>
              {message && (
                <motion.div 
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -100, opacity: 0 }}
                  className="absolute top-24 left-1/2 -translate-x-1/2 z-[100]"
                >
                  <div className={`px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-xl border ${
                    message.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' :
                    message.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200' :
                    'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                  }`}>
                    {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : 
                     message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
                     <Info className="w-5 h-5" />}
                    <span className="text-sm font-bold">{message.text}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── TOP BAR (flex-none) ── */}
            <div className={topBarClass}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
                  <h2 className="text-white font-black tracking-tighter text-lg leading-none">LEAST COUNT</h2>
                  <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
                  <span className="text-white/60 text-xs font-bold uppercase tracking-widest text-[10px]">Room: {roomCode}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`timer-display flex items-center gap-2 px-4 py-2 rounded-xl border ${timeLeft <= 5 ? 'bg-red-500/20 border-red-500/50 animate-pulse' : 'bg-white/5 border-white/10'}`}>
                  <TimerIcon className={`w-4 h-4 ${timeLeft <= 5 ? 'text-red-400' : 'text-white/60'}`} />
                  <span className={`font-mono font-black text-lg ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>{timeLeft}s</span>
                </div>
                
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="mute-btn p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 transition-all"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <button 
                  onClick={() => setStatus(GameStatus.LOBBY)}
                  className="exit-btn flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all font-bold text-xs uppercase tracking-wider backdrop-blur-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Exit</span>
                </button>
              </div>
            </div>

      {/* ── TABLE AREA (flex-1) ── */}
      <div className="table-area">
        <div className={`${tableBoundsClass} border-white/5 bg-gradient-to-b from-indigo-900/10 to-indigo-950/20 table-glow overflow-visible`}>
          
          {/* Players Distribution */}
          {players.map((p, i) => {
            let pos = "";
            const total = players.length;
            
            if (total === 2) {
              if (p.id === 0) pos = isCompactLandscape ? "bottom-[-36px] left-1/2 -translate-x-1/2" : "bottom-[-52px] left-1/2 -translate-x-1/2";
              else pos = isCompactLandscape ? "top-[-36px] left-1/2 -translate-x-1/2" : "top-[-52px] left-1/2 -translate-x-1/2";
            } else if (total === 3) {
              if (p.id === 0) pos = isCompactLandscape ? "bottom-[-36px] left-1/2 -translate-x-1/2" : "bottom-[-52px] left-1/2 -translate-x-1/2";
              else if (p.id === 1) pos = isCompactLandscape ? "top-[18%] right-[-42px]" : "top-[20%] right-[-60px]";
              else pos = isCompactLandscape ? "top-[18%] left-[-42px]" : "top-[20%] left-[-60px]";
            } else if (total === 4) {
              if (p.id === 0) pos = isCompactLandscape ? "bottom-[-36px] left-1/2 -translate-x-1/2" : "bottom-[-52px] left-1/2 -translate-x-1/2";
              else if (p.id === 1) pos = isCompactLandscape ? "top-1/2 right-[-42px] -translate-y-1/2" : "top-1/2 right-[-60px] -translate-y-1/2";
              else if (p.id === 2) pos = isCompactLandscape ? "top-[-36px] left-1/2 -translate-x-1/2" : "top-[-52px] left-1/2 -translate-x-1/2";
              else pos = isCompactLandscape ? "top-1/2 left-[-42px] -translate-y-1/2" : "top-1/2 left-[-60px] -translate-y-1/2";
            } else {
              if (p.id === 0) pos = isCompactLandscape ? "bottom-[-36px] left-1/2 -translate-x-1/2" : "bottom-[-52px] left-1/2 -translate-x-1/2";
              else if (p.id === 1) pos = isCompactLandscape ? "bottom-[15%] right-[-42px]" : "bottom-[15%] right-[-60px]";
              else if (p.id === 2) pos = isCompactLandscape ? "top-[15%] right-[-42px]" : "top-[15%] right-[-60px]";
              else if (p.id === 3) pos = isCompactLandscape ? "top-[-36px] left-1/2 -translate-x-1/2" : "top-[-52px] left-1/2 -translate-x-1/2";
              else if (p.id === 4) pos = isCompactLandscape ? "top-[15%] left-[-42px]" : "top-[15%] left-[-60px]";
              else if (p.id === 5) pos = isCompactLandscape ? "bottom-[15%] left-[-42px]" : "bottom-[15%] left-[-60px]";
            }

            return (
              <PlayerAvatar 
                key={p.id} 
                player={p} 
                position={pos} 
                isWinner={roundWinner?.id === p.id}
                isLeader={leaderId === p.id}
                isActive={currentPlayerIndex === p.id}
                isCompact={isCompactLandscape}
              />
            );
          })}

          {/* Compact Turn Notification */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-[800] px-3 pt-[env(safe-area-inset-top)]">
            <AnimatePresence>
              {status === GameStatus.PLAYING && currentPlayerIndex === 0 && !isRoundEnding && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  className={`flex items-center gap-3 rounded-full border border-indigo-400/40 bg-indigo-600/65 backdrop-blur-xl shadow-[0_0_28px_rgba(79,70,229,0.35)] px-4 py-2 ${isCompactLandscape ? 'max-w-[88vw]' : 'max-w-[420px]'}`}
                >
                  <div className={`h-2 w-2 rounded-full bg-emerald-300 ${isCompactLandscape ? '' : 'animate-pulse'}`} />
                  <span className={`font-black uppercase tracking-[0.22em] text-white ${isCompactLandscape ? 'text-[10px]' : 'text-xs md:text-sm'}`}>
                    Your Turn
                  </span>
                  <div className="hidden sm:block h-1.5 flex-1 min-w-12 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full w-1/3 bg-white/80"
                      animate={{ x: ['-120%', '320%'] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[200]">
            <div className={centerGapClass}>
              
              {/* Joker Area */}
              {joker && (
                <div className="relative group flex flex-col items-center">
                  <div className={`${isCompactLandscape ? 'w-12 h-[4.5rem] p-1' : 'w-14 h-20 md:w-20 md:h-28 p-1 md:p-2'} bg-white rounded-xl border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] flex flex-col items-center justify-between transform -rotate-6`}>
                    <div className="self-start text-xs md:text-base font-bold leading-none text-amber-600">J</div>
                    <div className="text-xl md:text-3xl">🃏</div>
                    <div className="self-end text-xs md:text-base font-bold leading-none rotate-180 text-amber-600">J</div>
                  </div>
                  <span className={`${isCompactLandscape ? 'text-[7px]' : 'text-[8px] md:text-[10px]'} font-bold text-white/40 uppercase tracking-widest whitespace-nowrap`}>Joker (0)</span>
                </div>
              )}

              {/* Deck */}
              <div 
                onClick={() => currentPlayerIndex === 0 && turnPhase === TurnPhase.DRAWING && drawCard('deck')}
                className={`relative flex flex-col items-center ${isCompactLandscape ? 'gap-1.5' : 'gap-2'} cursor-pointer pointer-events-auto ${turnPhase === TurnPhase.DRAWING && currentPlayerIndex === 0 ? 'ring-4 ring-indigo-500 ring-offset-4 ring-offset-transparent rounded-xl animate-pulse' : ''}`}
              >
                <div className={`${isCompactLandscape ? 'w-12 h-[4.5rem]' : 'w-14 h-20 md:w-20 md:h-28'} bg-indigo-700 rounded-xl border-2 border-indigo-400/50 shadow-2xl flex items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform`}>
                  <div className="w-full h-full border-2 md:border-4 border-white/10 rounded-lg flex items-center justify-center">
                    <RotateCcw className={`${isCompactLandscape ? 'w-4 h-4' : 'w-5 h-5 md:w-7 md:h-7'} text-white/40`} />
                  </div>
                </div>
                <div className={`${isCompactLandscape ? '-top-1 -left-1 w-12 h-[4.5rem]' : '-top-1 -left-1 w-14 h-20 md:w-20 md:h-28'} absolute bg-indigo-800 rounded-xl border-2 border-indigo-400/30 -z-10`}></div>
                <div className={`${isCompactLandscape ? '-top-2 -left-2 w-12 h-[4.5rem]' : '-top-2 -left-2 w-14 h-20 md:w-20 md:h-28'} absolute bg-indigo-900 rounded-xl border-2 border-indigo-400/20 -z-20`}></div>
                <span className={`${isCompactLandscape ? 'text-[7px]' : 'text-[8px] md:text-[10px]'} font-bold text-white/40 uppercase tracking-widest`}>Deck ({deck.length})</span>
              </div>

              {/* Play Area (Center) */}
              <div 
                ref={playAreaRef}
                className={`play-area relative ${isCompactLandscape ? 'w-14 h-20 md:w-24 md:h-32' : 'w-[5rem] h-24 md:w-32 md:h-44'} rounded-2xl border-2 border-dashed flex items-center justify-center play-area-glow transition-all duration-300 ${isOverPlayArea ? 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.4)] highlight' : 'border-white/20'} ${isDragging ? 'pointer-events-auto' : 'pointer-events-none'}`}
              >
                <AnimatePresence mode="popLayout">
                  {playAreaCards.map((card, idx) => (
                    <motion.div
                      key={card.id}
                      layoutId={card.id}
                      initial={{ scale: 0.8, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0, rotate: (idx - (playAreaCards.length - 1) / 2) * 10 }}
                      className={`absolute ${isCompactLandscape ? 'w-[2.75rem] h-16 p-1' : 'w-12 h-[4.5rem] md:w-20 md:h-28 p-1 md:p-2'} bg-white rounded-xl shadow-2xl flex flex-col items-center justify-between border-2 border-gray-200 overflow-hidden`}
                      style={{ 
                        color: card.color === 'red' ? '#ef4444' : '#1f2937',
                        zIndex: 500 + idx
                      }}
                    >
                      <div className={`${isCompactLandscape ? 'text-[8px]' : 'text-[7px] md:text-sm'} self-start font-bold leading-none`}>{card.rank === 'Joker' ? 'J' : card.rank}</div>
                      <div className="text-xl md:text-3xl">{card.rank === 'Joker' ? '🃏' : getSuitIcon(card.suit)}</div>
                      <div className={`${isCompactLandscape ? 'text-[8px]' : 'text-[7px] md:text-sm'} self-end font-bold leading-none rotate-180`}>{card.rank === 'Joker' ? 'J' : card.rank}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <span className={`${isCompactLandscape ? 'text-[7px] mt-0.5' : 'text-[7px] md:text-[9px] mt-1'} absolute top-full left-1/2 -translate-x-1/2 font-bold text-white/40 uppercase tracking-widest whitespace-nowrap`}>Play Area</span>
              </div>

              {/* Discard Pile */}
              <div 
                className={`relative flex flex-col items-center ${isCompactLandscape ? 'gap-1.5 w-[2.75rem] h-16' : 'gap-2 w-12 h-[4.5rem] md:w-24 md:h-36'} rounded-2xl border-2 border-white/5 flex items-center justify-center pointer-events-auto`}
                onClick={() => currentPlayerIndex === 0 && turnPhase === TurnPhase.DRAWING && drawCard('discard')}
              >
                <AnimatePresence mode="popLayout">
                  {discardPile.slice(-3).map((card, idx) => (
                    <motion.div
                      key={card.id}
                      layoutId={card.id}
                      initial={{ scale: 0.8, opacity: 0, rotate: -15 }}
                      animate={{ 
                        scale: 1.05, 
                        opacity: 1, 
                        rotate: (idx - 1) * 8 + 5,
                        x: idx * 2,
                        y: idx * 2
                      }}
                      className={`absolute ${isCompactLandscape ? 'w-[2.75rem] h-16 p-1' : 'w-12 h-[4.5rem] md:w-20 md:h-28 p-1 md:p-2'} bg-white rounded-xl shadow-2xl flex flex-col items-center justify-between border-2 overflow-hidden ${turnPhase === TurnPhase.DRAWING && currentPlayerIndex === 0 ? 'border-indigo-500 cursor-pointer' : 'border-gray-200'}`}
                      style={{ 
                        color: card.color === 'red' ? '#ef4444' : '#1f2937',
                        zIndex: idx
                      }}
                    >
                      <div className={`${isCompactLandscape ? 'text-[8px]' : 'text-[7px] md:text-sm'} self-start font-bold leading-none`}>{card.rank}</div>
                      <div className={isCompactLandscape ? 'text-base' : 'text-lg md:text-2xl'}>{getSuitIcon(card.suit)}</div>
                      <div className={`${isCompactLandscape ? 'text-[8px]' : 'text-[7px] md:text-sm'} self-end font-bold leading-none rotate-180`}>{card.rank}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <span className={`${isCompactLandscape ? 'text-[7px] mt-0.5' : 'text-[7px] md:text-[9px] mt-1'} absolute top-full left-1/2 -translate-x-1/2 font-bold text-white/40 uppercase tracking-widest`}>Discard</span>
              </div>

            </div>
          </div>
        </div>
      </div>
      {/* ── END TABLE AREA ── */}

      {/* Scoreboard — fixed so transforms don't offset it */}
      <div className={scoreBoardClass}>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div 
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setIsScoreboardOpen(!isScoreboardOpen)}
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              {isScoreboardOpen && <span className="text-xs font-bold uppercase tracking-wider text-white/80">Standings</span>}
            </div>
            {isScoreboardOpen ? <ChevronLeft className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />}
          </div>
          
          {isScoreboardOpen && (
            <div className="p-3 pt-0 max-h-64 overflow-y-auto scoreboard-scroll">
              <div className="space-y-2">
                {[...players].sort((a, b) => a.score - b.score).map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-white/20 w-3">{i + 1}</span>
                      <img src={p.avatar} className="w-6 h-6 rounded-full border border-white/10" alt="" />
                      <span className={`text-xs ${p.id === 0 ? 'text-indigo-400 font-bold' : 'text-white/70'}`}>{p.name}</span>
                    </div>
                    <span className="text-xs font-mono text-white/40">{p.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM PANEL (flex-none): 3-zone action bar + hand ── */}
      <div className={bottomPanelPaddingClass}>

        {/* Floating "Play Cards" pill — hovers above the hand, never overlaps buttons */}
        <div className="fixed bottom-6 left-6 z-[1200]">
          <AnimatePresence>
            {selectedCardIds.length > 0 && currentPlayerIndex === 0 && turnPhase === TurnPhase.SELECTING && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5, x: -50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.5, x: -50 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                onClick={() => playCards()}
                className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.5)] rounded-2xl text-white font-black text-base uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-95 group"
              >
                <Play className="w-5 h-5 fill-white" />
                Play Card
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* 3-Zone Action Bar */}
        <div className={actionBarClass}>
          {/* LEFT — utilities */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScoreboardOpen(!isScoreboardOpen)}
              title="Scoreboard"
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/50 hover:text-white/80 font-bold text-[10px] uppercase tracking-wider transition-all active:scale-90"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Score
            </button>
          </div>

          {/* CENTER — draw hint (only shown when it's your turn to draw) */}
          <div className="flex-1 flex items-center justify-center">
            <AnimatePresence>
              {turnPhase === TurnPhase.DRAWING && currentPlayerIndex === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-xl"
                >
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-300 font-black text-[10px] uppercase tracking-widest">Draw from deck or discard</span>
                </motion.div>
              )}
              {turnPhase === TurnPhase.SELECTING && currentPlayerIndex === 0 && selectedCardIds.length === 0 && (
                <motion.span
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-white/20 text-[10px] font-bold uppercase tracking-widest"
                >
                  {players[0]?.hand.length > 0 ? 'Tap a card to select · Drag to play area' : ''}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT — primary actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={callLeastCount}
              disabled={currentPlayerIndex !== 0 || turnPhase !== TurnPhase.SELECTING || isRoundEnding}
              title="Call Least Count"
              className={`least-count-btn flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed ${
                currentPlayerIndex === 0 && turnPhase === TurnPhase.SELECTING && playerHandScore <= initialCardCount
                  ? 'active bg-indigo-600 text-white shadow-[0_0_18px_rgba(79,70,229,0.5)]'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              Least Count
            </button>

            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              title="Chat"
              className="relative p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/50 hover:text-white/80 transition-all active:scale-90"
            >
              <User className="w-4 h-4" />
              {messages.length > 0 && !isChatOpen && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-[#0f172a]" />
              )}
            </button>
          </div>
        </div>

        {/* Player Hand */}
        <div className="player-hand w-full max-w-5xl flex flex-col items-center overflow-visible -mt-8 relative z-10">
          <div className="card-fan">
            {players[0]?.hand.map((card, i) => (
              <Card
                key={card.id}
                card={card}
                index={i}
                total={players[0].hand.length}
                isSelected={selectedCardIds.includes(card.id)}
                onClick={() => handleCardSelect(card.id)}
                onDoubleClick={() => handleCardDoubleClick(card.id)}
                isPlayable={currentPlayerIndex === 0 && turnPhase === TurnPhase.SELECTING && !isRoundEnding}
                onDragStart={() => handleDragStart(card.id)}
                onDrag={handleDrag}
                onDragEnd={(e, info) => handleDragEnd(card.id, info)}
                draggingCardId={draggingCardId}
                isDragging={isDragging}
                isCompact={isCompactLandscape}
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isChatOpen && (
          <ChatPanel 
            messages={messages} 
            onSendMessage={sendMessage} 
            onClose={() => setIsChatOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Round End Overlay */}
      <AnimatePresence>
        {status === GameStatus.ROUND_END && (
          <div className="winner-overlay">
            <div className="winner-modal">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-amber-400">
                    <Crown className="w-16 h-16 fill-amber-400" />
                  </div>
                  <img 
                    src={roundWinner?.avatar} 
                    className="w-32 h-32 rounded-full border-4 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)]" 
                    alt="" 
                  />
                </div>
                
                <div>
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
                    {roundWinner?.name} Wins!
                  </h2>
                  <p className="text-white/40 mt-2">Round completed successfully</p>
                </div>

                <div className="w-full grid grid-cols-2 gap-4 mt-4">
                  <button 
                    onClick={handleStartGame}
                    className="py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-black text-sm uppercase tracking-widest transition-all"
                  >
                    Play Again
                  </button>
                  <button 
                    onClick={handleExit}
                    className="py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/60 font-black text-sm uppercase tracking-widest transition-all"
                  >
                    Exit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Dealing Animation */}
      <AnimatePresence>
        {status === GameStatus.DEALING && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[300] flex items-center justify-center bg-[#0f172a]"
          >
            <div className="flex flex-col items-center gap-8">
              <div className="relative w-24 h-36">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      x: [0, (i - 2) * 100, 0],
                      y: [0, -200, 0],
                      rotate: [0, 360, 0],
                      opacity: [1, 0.5, 1]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      delay: i * 0.1 
                    }}
                    className="absolute inset-0 bg-indigo-600 rounded-xl border-2 border-indigo-400/50 shadow-2xl"
                  />
                ))}
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-widest animate-pulse">Shuffling & Dealing...</h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )}
</div>
</div>
);
}

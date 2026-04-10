<div align="center">
  <img width="1200" height="475" alt="Least Count Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  
  <h1>🃏 Least Count (Yaniv) Online</h1>
  
  <p>A premium, interactive digital implementation of the classic <strong>Least Count</strong> card game. Experience smooth animations, strategic bot opponents, and a sleek modern UI.</p>

  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white" alt="Vite 6" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind 4" />
    <img src="https://img.shields.io/badge/Framer_Motion-12.0-FF0055?logo=framer&logoColor=white" alt="Framer Motion" />
  </p>
</div>

---

## 🌟 Features

- **Fluid Gameplay**: Powered by Framer Motion for high-performance card animations and smooth transitions.
- **Smart Bot Opponents**: Challenge yourself against intelligent AI players with unique avatars and strategies.
- **Dynamic Card Mechanics**: Supports card grouping (same rank) and sequences (3+ cards of the same suit).
- **Interactive UI**: Drag-and-drop card play, double-click auto-select, and responsive landscape mode for mobile devices.
- **Real-time Scoring**: Automatic point calculation, penalty systems, and a live scoreboard.
- **Modern Aesthetics**: Sleek dark mode design with glassmorphism, vibrant gradients, and lush particles (canvas-confetti).

## 🎮 How to Play

1. **Objective**: Have the lowest total card value in your hand when someone calls "Least Count".
2. **Card Values**:
   - **Aces**: 1 point
   - **2-10**: Face value
   - **J, Q, K**: 10 points
   - **Jokers**: 0 points
   - **Game Joker**: One card is randomly selected as the "Joker" for the round; all cards of that rank become 0 points.
3. **Your Turn**: 
   - Select and play cards of the same rank or a sequence of 3+ cards of the same suit.
   - If your played card matches the top of the discard pile, you don't need to draw.
   - Otherwise, draw a card from the deck or the discard pile.
4. **Winning**: When your hand score is low (usually ≤ 7), you can call "Least Count". If you have the lowest score, you win the round! If someone else has a lower score, you receive a penalty.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/least-count.git
   cd least-count
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## 🛠️ Tech Stack

- **Framework**: [React 19](https://reactjs.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion 12](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Visual Effects**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)

---

<div align="center">
  <p>Built with ❤️ for card game enthusiasts.</p>
</div>

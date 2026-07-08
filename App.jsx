import { useState } from 'react';
import MemoryMatch from './src/games/MemoryMatch';

function App() {
  const [currentGame, setCurrentGame] = useState(null);

  const games = [
    { name: 'Memory Match', description: 'Test your memory by matching pairs of cards' },
    { name: 'Reaction Test', description: 'Coming soon...' }
  ];

  if (!currentGame) {
    // Menu View
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        backgroundColor: '#0f172a',
        minHeight: '100vh',
        color: '#ffffff'
      }}>
        <h1 style={{ color: '#ffffff', fontSize: '48px', marginBottom: '40px' }}>
          Mini Game Hub
        </h1>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {games.map((game, index) => (
            <div 
              key={index}
              onClick={() => game.name === 'Memory Match' && setCurrentGame('memory')}
              style={{ 
                backgroundColor: '#1e293b', 
                padding: '20px', 
                borderRadius: '12px',
                color: '#ffffff',
                width: '280px',
                cursor: game.name === 'Memory Match' ? 'pointer' : 'default',
                opacity: game.name === 'Memory Match' ? 1 : 0.6,
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => game.name === 'Memory Match' && (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseOut={(e) => game.name === 'Memory Match' && (e.currentTarget.style.transform = 'scale(1)')}
            >
              <h2 style={{ color: '#ffffff', marginTop: '0' }}>{game.name}</h2>
              <p style={{ color: '#e2e8f0' }}>{game.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Game View
  return (
    <div>
      <button 
        onClick={() => setCurrentGame(null)}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '10px 20px',
          backgroundColor: '#1e293b',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        ← Back to Hub
      </button>
      
      {currentGame === 'memory' && <MemoryMatch />}
    </div>
  );
}

export default App;
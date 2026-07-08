import { useState, useEffect, useRef } from 'react'

const levelConfigs = {
 1: { emojis: ['🐶','🐱','🐭','🐹'], cols: 4, timeLimit: 35 },
 2: { emojis: ['🐶','🐱','🐭','🐹','🐰','🦊'], cols: 4, timeLimit: 50 },
 3: { emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼'], cols: 4, timeLimit: 65 }
}

function shuffle(array) {
  const arr = [...array,...array]
  return arr.sort(() => Math.random() - 0.5)
}

export default function MemoryMatch() {
  const [level, setLevel] = useState(1)
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [moves, setMoves] = useState(0)
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [highScores, setHighScores] = useState({})

  const audioCtx = useRef(null)
  const config = levelConfigs[level]
  const timeLeft = config.timeLimit - time
  const timePercent = (timeLeft / config.timeLimit) * 100

  // Auto-clear old scores with minutes format on first load
  useEffect(() => {
    const saved = localStorage.getItem('memoryMatchScores')
    if (saved) {
      const parsed = JSON.parse(saved)
      // Clear if any score has time >= 60, meaning it's old minute format
      const hasOldFormat = Object.values(parsed).some(s => s.time >= 60)
      if (hasOldFormat) {
        localStorage.removeItem('memoryMatchScores')
        setHighScores({})
      } else {
        setHighScores(parsed)
      }
    }
  }, [])

  const saveHighScore = (lvl, newTime, newMoves) => {
    const current = highScores[lvl]
    if (!current || newTime < current.time || (newTime === current.time && newMoves < current.moves)) {
      const updated = {...highScores, [lvl]: { time: newTime, moves: newMoves } }
      setHighScores(updated)
      localStorage.setItem('memoryMatchScores', JSON.stringify(updated))
    }
  }

  const playSound = (type) => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    const ctx = audioCtx.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'flip') {
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    } else if (type === 'match') {
      osc.frequency.setValueAtTime(600, ctx.currentTime)
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    } else if (type === 'wrong') {
      osc.frequency.setValueAtTime(300, ctx.currentTime)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    } else if (type === 'win') {
      [523, 659, 784].forEach((freq, i) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.connect(g)
        g.connect(ctx.destination)
        o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15)
        g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.2)
        o.start(ctx.currentTime + i * 0.15)
        o.stop(ctx.currentTime + i * 0.15 + 0.2)
      })
      return
    } else if (type === 'lose') {
      osc.frequency.setValueAtTime(200, ctx.currentTime)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    }

    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  }

  useEffect(() => {
    let interval
    if (isRunning &&!paused &&!gameOver) {
      interval = setInterval(() => {
        setTime(t => {
          const newTime = t + 1
          if (newTime >= config.timeLimit) {
            setIsRunning(false)
            setGameOver(true)
            playSound('lose')
          }
          return newTime
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, paused, gameOver, config.timeLimit])

  useEffect(() => {
    setCards(shuffle(config.emojis))
    setFlipped([])
    setMatched([])
    setMoves(0)
    setTime(0)
    setIsRunning(false)
    setPaused(false)
    setGameOver(false)
  }, [level, config.emojis])

  const handleClick = (index) => {
    if (paused || gameOver) return
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return
    if (!isRunning) setIsRunning(true)

    playSound('flip')
    const newFlipped = [...flipped, index]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(m => m + 1)
      const [first, second] = newFlipped
      if (cards[first] === cards[second]) {
        playSound('match')
        setMatched(m => [...m, first, second])
        setFlipped([])
      } else {
        playSound('wrong')
        setTimeout(() => setFlipped([]), 800)
      }
    }
  }

  useEffect(() => {
    if (matched.length > 0 && matched.length === cards.length) {
      setIsRunning(false)
      playSound('win')
      saveHighScore(level, time, moves)
    }
  }, [matched, cards.length, level, time, moves])

  const nextLevel = () => {
    if (level < 3) setLevel(level + 1)
  }

  const resetGame = () => {
    setLevel(1)
  }

  const retryLevel = () => {
    setLevel(level)
  }

  const togglePause = () => {
    if (!gameOver) setPaused(p =>!p)
  }

  const best = highScores[level]
  const isWon = matched.length === cards.length

  return (
    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#0f172a', minHeight: '100vh' }}>
      <h2 style={{ color: '#ffffff', fontSize: '32px', marginBottom: '8px' }}>
        Memory Match - Level {level}
      </h2>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        color: '#ffffff',
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '10px',
        flexWrap: 'wrap'
      }}>
        <p style={{ margin: 0 }}>Moves: {moves}</p>
        <p style={{ margin: 0, color: timeLeft < 10? '#ef4444' : '#ffffff' }}>
          Time: {timeLeft}s
        </p>
        {best && <p style={{ margin: 0, color: '#facc15' }}>Best: {best.time}s / {best.moves} moves</p>}
      </div>

      {/* Time Progress Bar */}
      <div style={{
        width: '300px',
        height: '8px',
        backgroundColor: '#334155',
        borderRadius: '4px',
        margin: '0 auto 15px auto',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${timePercent}%`,
          height: '100%',
          backgroundColor: timeLeft < 10? '#ef4444' : '#4a90e2',
          transition: 'width 1s linear, background-color 0.3s'
        }} />
      </div>

      <button
        onClick={togglePause}
        disabled={!isRunning &&!paused}
        style={{
          padding: '6px 16px',
          marginBottom: '15px',
          backgroundColor: paused? '#facc15' : '#4a90e2',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '600',
          opacity: gameOver? 0.5 : 1
        }}
      >
        {paused? 'Resume' : 'Pause'}
      </button>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${config.cols}, 80px)`,
        gap: '10px',
        justifyContent: 'center',
        marginTop: '10px',
        opacity: paused || gameOver? 0.3 : 1,
        pointerEvents: paused || gameOver? 'none' : 'auto',
        transition: 'opacity 0.3s'
      }}>
        {cards.map((emoji, index) => {
          const isFlipped = flipped.includes(index) || matched.includes(index)
          return (
            <div
              key={index}
              onClick={() => handleClick(index)}
              style={{
                width: '80px',
                height: '80px',
                perspective: '1000px'
              }}
            >
              <div style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.5s',
                transform: isFlipped? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}>
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  backgroundColor: '#4a90e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  borderRadius: '10px',
                  border: '2px solid #333',
                  cursor: 'pointer'
                }}>
              ?
                </div>
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  borderRadius: '10px',
                  border: '2px solid #333',
                  transform: 'rotateY(180deg)'
                }}>
                  {emoji}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {(isWon || gameOver) && (
        <div style={{ marginTop: '20px', color: '#ffffff' }}>
          {isWon? (
            <>
              <h3>You won Level {level} in {moves} moves and {time}s!</h3>
              {level < 3? (
                <button
                  onClick={nextLevel}
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    marginRight: '10px',
                    backgroundColor: '#4a90e2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Next Level
                </button>
              ) : (
                <p style={{ fontSize: '24px' }}>🎉 You completed all levels! 🎉</p>
              )}
            </>
          ) : (
            <>
              <h3 style={{ color: '#ef4444' }}>Time's Up!</h3>
              <button
                onClick={retryLevel}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  marginRight: '10px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Retry Level
              </button>
            </>
          )}
          <button
            onClick={resetGame}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#1e293b',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Restart
          </button>
        </div>
      )}
    </div>
  )
}
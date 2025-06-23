// src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import tvFrame from "./assets/tv.frame.png";
import pressSound from "./sounds/accordian.mp3";

const colors = ["red", "green", "blue", "yellow"];



const pitchMap = {
  red: 1.000, // F
  green: 1.260, // A
  blue: 1.498, // C
  yellow: 1.682 // D
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioBuffer = null;

fetch(pressSound)
  .then((res) => res.arrayBuffer())
  .then((data) => audioCtx.decodeAudioData(data))
  .then((decoded) => {
    audioBuffer = decoded;
  });

function App() {
  const [clickedColor, setClickedColor] = useState(null);
  const [booting, setBooting] = useState(true);
  const [biosComplete, setBiosComplete] = useState(false);
  const [muted, setMuted] = useState(false);
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [activeColor, setActiveColor] = useState(null);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState("easy");
  const [highScore, setHighScore] = useState(
    parseInt(localStorage.getItem("highScore")) || 0
  );

  useEffect(() => {
    const timeout = setTimeout(() => setBooting(false), 1500);
    return () => clearTimeout(timeout);
  }, []);

  const playTone = (pitch = 1.0) => {
    if (!audioBuffer || muted) return;
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = pitch;
    source.connect(audioCtx.destination);
    source.start(0);
  };

  const startGame = () => {
    setSequence([]);
    setUserInput([]);
    setScore(0);
    addNextColor([]);
  };

  const addNextColor = (prevSeq = sequence) => {
    const nextColor = colors[Math.floor(Math.random() * 4)];
    const newSequence = [...prevSeq, nextColor];
    setSequence(newSequence);
    setUserInput([]);
    playSequence(newSequence);
  };

  const playSequence = (seq) => {
    setIsPlayerTurn(false);
    const speed = difficulty === "easy" ? 1000 : difficulty === "hard" ? 700 : 500;

    seq.forEach((color, index) => {
      setTimeout(() => {
        setActiveColor(color);
        playTone(pitchMap[color]);
        setTimeout(() => setActiveColor(null), 400);
      }, speed * index);
    });
    setTimeout(() => setIsPlayerTurn(true), speed * seq.length);
  };

  const handleColorClick = (color) => {
    if (!isPlayerTurn) return;

    // Trigger the click animation
    setClickedColor(color);
    setTimeout(() => setClickedColor(null), 250); // Reset after animation

    playTone(pitchMap[color]);
    const newUserInput = [...userInput, color];
    setUserInput(newUserInput);

    const currentIndex = newUserInput.length - 1;
    if (newUserInput[currentIndex] !== sequence[currentIndex]) {
      alert("Wrong! Game over.");
      setIsPlayerTurn(false);
      return;
    }

    if (newUserInput.length === sequence.length) {
      setScore(score + 1);
      setTimeout(() => {
        addNextColor(sequence);
      }, 1000);
    }
  };

  const handleKeyDown = useCallback(
    (e) => {
      const keyMap = {
        w: "red",
        ArrowUp: "red",
        a: "green",
        ArrowLeft: "green",
        s: "blue",
        ArrowDown: "blue",
        d: "yellow",
        ArrowRight: "yellow",
      };

      if (keyMap[e.key]) {
        handleColorClick(keyMap[e.key]);
      } else if (e.code === "Space") {
        startGame();
      }
    },
    [handleColorClick, startGame]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (booting) return <div className="boot-screen" />;

  if (!biosComplete) {
    return (
      <div className="bios-screen" onClick={() => setBiosComplete(true)}>
        <pre>
{`GoldStar BIOS v1.03
RAM CHECK.......... OK
TV SIGNAL.......... LOCKED
AUDIO.............. ACTIVE

PRESS ANY KEY OR CLICK TO START`}
        </pre>
      </div>
    );
  }

  return (
    <div className="retro-app">
      <div className="vhs-timestamp">04:27PM  SEP 17 1993</div>

      <button className="mute-toggle" onClick={() => setMuted(!muted)}>
        🔊 {muted ? "OFF" : "ON"}
      </button>

      <div className="difficulty-controls">
        <label>Difficulty:</label>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="hard">Hard</option>
          <option value="hardcore">Hardcore</option>
        </select>
      </div>

      <h1 className="retro-title">SIMON SAYS</h1>
      <h3 className="retro-score">SCORE: {score} | HIGH SCORE: {highScore}</h3>

      <div className="tv-row">
        {colors.map((color) => (
          <div className="tv-wrapper" key={color}>
            <button
              className="tv-container"
              onClick={() => handleColorClick(color)}
              type="button"
            >
              <div
                className={`tv-screen ${color} ${
                  activeColor === color ? "active" : "idle"
                }${clickedColor === color ? "clicked" : ""}`}
              />
              <img src={tvFrame} alt="TV frame" className="tv-image" />
              <div className="tv-overlay" />
            </button>
          </div>
        ))}
      </div>

      <button className="btn btn-dark mt-4 retro-button" onClick={startGame}>
        START GAME
      </button>

      <div className="crt-scanlines" />
    </div>
  );
}

export default App;
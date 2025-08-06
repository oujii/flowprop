import React, { useState, useEffect } from 'react';

// --- Konfiguration ---
// Ändra texten här för att bestämma vad som ska skrivas
const FORCED_TEXT = "LÖSENORDET ÄR MIDNATTSSOL";
// ---------------------

// Komponent för en enskild tangent
const Key = ({ value, onClick, className = '' }) => (
  <button
    onClick={() => onClick(value)}
    className={`key h-12 rounded-lg bg-white text-gray-800 font-semibold shadow-md transition-transform duration-75 flex-grow active:scale-95 active:bg-gray-200 ${className}`}
  >
    {value}
  </button>
);

// Komponent för tangent-popupen
const KeyPopup = ({ char, position }) => {
  if (!char) return null;

  const style = {
    left: `${position.x}px`,
    top: `${position.y}px`,
  };

  return (
    <div style={style} className="absolute pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full">
      <div className="relative bg-white text-gray-800 p-3 px-6 rounded-lg shadow-lg text-4xl font-medium">
        {char}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white"></div>
      </div>
    </div>
  );
};


export default function App() {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [popup, setPopup] = useState({ char: null, position: { x: 0, y: 0 } });

  // Hanterar återställning efter att meddelandet visats
  useEffect(() => {
    if (isFinished) {
      const timer = setTimeout(() => {
        setDisplayText('');
        setCurrentIndex(0);
        setIsFinished(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isFinished]);

  // Funktion för att visa pop-upen
  const showKeyPopup = (e) => {
    if (currentIndex >= FORCED_TEXT.length) return;

    const keyElement = e.currentTarget;
    const rect = keyElement.getBoundingClientRect();
    
    setPopup({
      char: FORCED_TEXT[currentIndex],
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top,
      },
    });

    // Göm pop-upen efter en kort stund
    setTimeout(() => setPopup({ char: null, position: { x: 0, y: 0 } }), 400);
  };

  // Hanterar tangenttryckningar
  const handleKeyPress = (e) => {
    if (currentIndex < FORCED_TEXT.length) {
      showKeyPopup(e);
      setDisplayText((prev) => prev + FORCED_TEXT[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleBackspace = () => {
    if (currentIndex > 0) {
      setDisplayText((prev) => prev.slice(0, -1));
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleEnter = () => {
    if (currentIndex === FORCED_TEXT.length) {
      setIsFinished(true);
    }
  };

  const keyRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Å'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ö', 'Ä'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  return (
    <div className="bg-white flex flex-col h-screen font-sans">
      <KeyPopup char={popup.char} position={popup.position} />

      {/* "Skärmen" där texten visas */}
      <div className="flex-grow p-4 text-gray-800 text-2xl flex items-end">
        <p className="w-full break-words">
          {displayText}
          <span className="inline-block w-0.5 h-7 bg-blue-500 animate-pulse ml-1"></span>
        </p>
      </div>

      {/* Villkorlig rendering för meddelande eller tangentbord */}
      {isFinished ? (
        <div className="bg-green-100 border-t-4 border-green-500 text-green-700 px-4 py-5 text-center" role="alert">
          <p className="font-bold">Meddelande skickat!</p>
          <p className="text-sm">Återställer om 3 sekunder...</p>
        </div>
      ) : (
        <div className="bg-gray-200 p-2 pb-6 space-y-1.5">
          {keyRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center space-x-1.5">
              {row.map(key => <Key key={key} value={key} onClick={handleKeyPress} />)}
            </div>
          ))}
          <div className="flex justify-center space-x-1.5">
             <Key value="⌫" onClick={handleBackspace} className="flex-grow-[1.5]" />
             <Key value="MELLANSLAG" onClick={handleKeyPress} className="flex-grow-[4]" />
             <Key value="ENTER" onClick={handleEnter} className="flex-grow-[2]" />
          </div>
        </div>
      )}
    </div>
  );
}
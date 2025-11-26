
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { RodComponent } from './components/RodComponent';
import { createInitialState, canMoveDisk, checkWinCondition } from './utils/gameLogic';
import { GameState, RodId, Move } from './types';
import { solveTowerOfHanoi } from './services/openAiService';

// OpenAI models with reasoning_effort support (toggle high/minimal)
const AI_MODELS = [
  { id: 'gpt-5-nano', name: 'GPT-5 Nano' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini' },
  { id: 'gpt-5.1', name: 'GPT-5.1' },
];

const DIFFICULTIES = [
  { label: 'Easy (4)', value: 4 },
  { label: 'Medium (7)', value: 7 },
  { label: 'Hard (10)', value: 10 },
];

const SPEEDS = [
  { label: '1x', value: 800 },
  { label: '5x', value: 100 },
  { label: '10x', value: 80 },
  { label: '20x', value: 40 },
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialState(4));
  const [timer, setTimer] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  
  // AI Configuration
  const [selectedModel, setSelectedModel] = useState<string>(AI_MODELS[0].id);
  // Thinking disabled by default
  const [useReasoning, setUseReasoning] = useState<boolean>(false);
  const [isSolving, setIsSolving] = useState(false);
  const [solutionQueue, setSolutionQueue] = useState<Move[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(400); // Default 2x
  const [solveStats, setSolveStats] = useState<{
    totalTokens: number;
    reasoningTokens: number;
    inferenceTimeMs: number;
    modelName: string;
    movesGenerated: number;
    moves: Move[];
    moveCount: number;
    expectedMoves: number;
    isCorrect: boolean;
  } | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [infoTab, setInfoTab] = useState<'guide' | 'resources'>('guide');
  const [thinkingTime, setThinkingTime] = useState(0);

  // Rod Labels
  const rodLabels: Record<RodId, string> = {
    A: 'START',
    B: '',
    C: 'FINAL'
  };

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (hasStarted && !gameState.isComplete && !gameState.startTime) {
       // Simple increment timer
       interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [hasStarted, gameState.isComplete]);

  // Thinking time tracker
  useEffect(() => {
    let interval: any;
    if (isThinking) {
      setThinkingTime(0);
      interval = setInterval(() => {
        setThinkingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isThinking]);

  // Auto-Play Loop
  useEffect(() => {
    let playInterval: any;

    // Stop immediately if puzzle is complete
    if (isSolving && gameState.isComplete) {
      setIsSolving(false);
      setSolutionQueue([]);
      return;
    }

    if (isSolving && solutionQueue.length > 0) {
      playInterval = setInterval(() => {
        setSolutionQueue(prevQueue => {
          if (prevQueue.length === 0) {
            setIsSolving(false);
            return prevQueue;
          }

          const nextMove = prevQueue[0];
          executeMove(nextMove.from, nextMove.to);
          return prevQueue.slice(1);
        });
      }, playbackSpeed); // Use dynamic speed
    } else if (isSolving && solutionQueue.length === 0) {
       setIsSolving(false);
       // Check if puzzle was actually solved after animation completes
       setTimeout(() => {
         if (!gameState.isComplete) {
           setHasFailed(true);
         }
       }, 100);
    }

    return () => clearInterval(playInterval);
  }, [isSolving, solutionQueue.length, playbackSpeed, gameState.isComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset Game
  const resetGame = (disks: number = gameState.diskCount) => {
    setGameState(createInitialState(disks));
    setTimer(0);
    setHasStarted(false);
    setIsSolving(false);
    setSolutionQueue([]);
    setIsThinking(false);
    setSolveStats(null);
    setHasFailed(false);
    setAiResponse(null);
  };

  // Execute a move programmatically or manually
  const executeMove = (fromId: RodId, toId: RodId) => {
    setGameState(prev => {
      const sourceRod = prev.rods[fromId];
      const targetRod = prev.rods[toId];

      if (canMoveDisk(sourceRod, targetRod)) {
        const newRods = { ...prev.rods };
        // Create new array references to trigger updates
        newRods[fromId] = [...prev.rods[fromId]];
        newRods[toId] = [...prev.rods[toId]];

        const diskToMove = newRods[fromId].pop()!;
        newRods[toId].push(diskToMove);

        const isWin = checkWinCondition(newRods, prev.diskCount);
        return {
          ...prev,
          rods: newRods,
          moveCount: prev.moveCount + 1,
          isComplete: isWin,
          selectedRodId: null,
        };
      }
      return prev;
    });
  };

  // Handle Rod Click (User Interaction)
  const handleRodClick = (rodId: RodId) => {
    if (gameState.isComplete || isSolving || isThinking) return;
    
    if (!hasStarted) setHasStarted(true);

    const { selectedRodId, rods } = gameState;

    if (selectedRodId === null) {
      if (rods[rodId].length > 0) {
        setGameState(prev => ({ ...prev, selectedRodId: rodId }));
      }
      return;
    }

    if (selectedRodId === rodId) {
      setGameState(prev => ({ ...prev, selectedRodId: null }));
      return;
    }

    executeMove(selectedRodId, rodId);
  };

  const handleAutoSolve = async () => {
    // Prevent multiple simultaneous API calls
    if (gameState.isComplete || isSolving || isThinking) return;

    // Set thinking immediately to disable button and prevent multiple calls
    setIsThinking(true);

    const confirmReset = hasStarted && gameState.moveCount > 0
      ? window.confirm("Auto-solving requires restarting the board. Continue?")
      : true;

    if (!confirmReset) {
      setIsThinking(false);
      return;
    }

    try {
      // Reset board logic inside here to be safe
      const freshState = createInitialState(gameState.diskCount);
      setGameState(freshState);
      setTimer(0);
      setHasStarted(true);

      // Pass diskCount, useReasoning, and model ID to the service
      const response = await solveTowerOfHanoi(gameState.diskCount, useReasoning, selectedModel);
      setSolutionQueue(response.moves);
      setSolveStats({
        totalTokens: response.usage.totalTokens,
        reasoningTokens: response.usage.reasoningTokens,
        inferenceTimeMs: response.usage.inferenceTimeMs,
        modelName: response.modelName,
        movesGenerated: response.moves.length,
        moves: response.moves,
        moveCount: response.moveCount,
        expectedMoves: response.expectedMoves,
        isCorrect: response.isCorrect
      });
      setAiResponse(response.rawResponse);
      setPrompt(response.prompt);
      setIsSolving(true);
    } catch (e) {
      console.error(e);
      // Show FAILED UI instead of alert
      const expectedMoves = Math.pow(2, gameState.diskCount) - 1;
      setSolveStats({
        totalTokens: 0,
        reasoningTokens: 0,
        inferenceTimeMs: 0,
        modelName: selectedModel + ' (error)',
        movesGenerated: 0,
        moves: [],
        moveCount: 0,
        expectedMoves: expectedMoves,
        isCorrect: false
      });
      setHasFailed(true);
    } finally {
      setIsThinking(false);
    }
  };

  const supportsThinking = (model: string) => {
    // All OpenRouter free models support reasoning/thinking
    return true;
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center py-8 px-2 sm:py-12 sm:px-4 selection:bg-yellow-200">
      
      {/* Compact Header for Mobile */}
      <header className="w-full max-w-3xl flex flex-row justify-between items-center mb-2 gap-2 border-b-4 border-black pb-2 sm:mb-6 sm:pb-6">
        <div className="text-left flex items-center gap-1">
          <h1 className="font-pixel text-sm sm:text-lg md:text-2xl leading-none sm:leading-tight tracking-tighter" style={{ textShadow: '2px 2px 0px #ddd' }}>
            The Illusion of Thinking
          </h1>
          <button
            onClick={() => setShowInfoPanel(true)}
            className="hover:opacity-70 transition-opacity flex-shrink-0"
            title="Learn more about this research"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>
        </div>

        <div className="flex-shrink-0 flex items-stretch gap-0 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-pixel rounded-lg overflow-hidden">
          <div className="flex flex-col items-center justify-center px-2 py-1 sm:px-4 sm:py-2 border-r-2 border-black bg-yellow-100">
            <span className="text-[8px] sm:text-[10px] uppercase mb-1 leading-none">Moves</span>
            <span className="text-xs sm:text-base leading-none">{gameState.moveCount}</span>
          </div>
          <div className="flex flex-col items-center justify-center px-2 py-1 sm:px-4 sm:py-2 bg-blue-100">
            <span className="text-[8px] sm:text-[10px] uppercase mb-1 leading-none">Time</span>
            <span className="text-[10px] sm:text-base leading-none">{formatTime(timer)}</span>
          </div>
        </div>
      </header>

      {/* Controls Section */}
      <div className="w-full max-w-3xl mb-4">
        <div className="bg-white p-3 border-2 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3 rounded-xl">
            
            {/* Row 1: Settings - Consolidated into one row */}
            <div className="grid grid-cols-[1fr_1.5fr_auto] gap-2 items-end">
                
                {/* Difficulty */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] sm:text-xs font-bold uppercase sm:tracking-wide truncate">DIFFICULTY</label>
                  <select 
                    value={gameState.diskCount}
                    onChange={(e) => resetGame(Number(e.target.value))}
                    disabled={isSolving || isThinking}
                    className="w-full h-8 sm:h-10 border-2 border-black bg-white text-xs sm:text-sm font-bold px-1 focus:outline-none focus:bg-gray-50 disabled:opacity-50 rounded-lg"
                  >
                    {DIFFICULTIES.map(diff => (
                      <option key={diff.value} value={diff.value}>{diff.label}</option>
                    ))}
                  </select>
                </div>

                {/* AI Model */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] sm:text-xs font-bold uppercase sm:tracking-wide truncate">AI MODEL</label>
                  <select 
                    value={selectedModel}
                    onChange={handleModelChange}
                    disabled={isSolving || isThinking}
                    className="w-full h-8 sm:h-10 border-2 border-black bg-white text-xs sm:text-sm font-bold px-1 focus:outline-none focus:bg-gray-50 disabled:opacity-50 rounded-lg"
                  >
                    {AI_MODELS.map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </div>
                
                 {/* Reasoning Config */}
                <div className="flex flex-col gap-1 items-center">
                    <span className={`text-[10px] sm:text-xs font-bold uppercase sm:tracking-wide truncate ${!supportsThinking(selectedModel) ? 'opacity-50' : ''}`}>
                        THINKING
                    </span>
                    <label className={`
                        relative inline-flex items-center cursor-pointer
                        h-8 sm:h-10 w-14 sm:w-20
                        border-2 border-black rounded-lg transition-colors duration-200 ease-in-out
                        ${!supportsThinking(selectedModel) ? 'opacity-50 cursor-not-allowed bg-gray-200' : ''}
                        ${useReasoning && supportsThinking(selectedModel) ? 'bg-green-400' : 'bg-gray-200'}
                    `}>
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={useReasoning}
                            onChange={(e) => setUseReasoning(e.target.checked)}
                            disabled={!supportsThinking(selectedModel) || isSolving || isThinking}
                        />
                        <span className={`
                            absolute left-1 top-1 bottom-1 aspect-square
                            bg-white border-2 border-black rounded-md shadow-sm transition-all duration-200
                            ${useReasoning && supportsThinking(selectedModel) ? 'translate-x-6 sm:translate-x-10' : ''}
                        `}></span>
                    </label>
                </div>
            </div>

            {/* Row 2: Actions */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-2 border-t-2 border-dashed border-gray-300">
               <button 
                 onClick={handleAutoSolve}
                 disabled={isSolving || isThinking}
                 className={`
                    h-10 sm:h-12 flex items-center justify-center gap-2
                    border-2 border-black text-[10px] sm:text-xs font-pixel uppercase
                    transition-all active:translate-y-1 active:shadow-none rounded-lg
                    ${isSolving ? 'bg-blue-200 cursor-wait' : 'bg-blue-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-600'}
                    disabled:opacity-70 disabled:cursor-not-allowed
                 `}
               >
                 {isThinking ? 'SOLVING...' : isSolving ? 'PLAYING...' : 'AUTO SOLVE'}
               </button>

               <button 
                 onClick={() => resetGame()}
                 className="
                    h-10 sm:h-12 flex items-center justify-center gap-2
                    bg-red-500 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                    text-[10px] sm:text-xs font-pixel uppercase
                    hover:bg-red-600 transition-all active:translate-y-1 active:shadow-none rounded-lg
                 "
               >
                 RESET
               </button>
            </div>
        </div>
      </div>

      {/* AI Response Window - Chat Interface */}
      <div className="w-full max-w-3xl mb-4">
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl overflow-hidden">
          <div className="bg-gray-100 border-b-2 border-black px-3 py-2">
            <h3 className="text-xs sm:text-sm font-bold uppercase">AI Conversation</h3>
          </div>
          <div className="p-4 max-h-40 overflow-y-auto bg-white space-y-3">
            {isThinking ? (
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-sm text-gray-600">{useReasoning ? 'Thinking' : 'Solving'}... {thinkingTime}s</span>
              </div>
            ) : prompt && aiResponse ? (
              <>
                {/* User Message */}
                <div className="flex flex-col justify-start items-start gap-1">
                  <span className="text-xs text-gray-500 font-semibold">PROMPT</span>
                  <div className="w-full bg-gray-50 text-gray-900 rounded-lg px-3 py-2 border border-gray-200">
                    <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{prompt}</p>
                  </div>
                </div>
                {/* Assistant Message */}
                <div className="flex flex-col justify-start items-start gap-1">
                  <span className="text-xs text-gray-500 font-semibold">{solveStats?.modelName || 'AI'}</span>
                  <div className="w-full bg-gray-50 text-gray-900 rounded-lg px-3 py-2 border border-gray-200">
                    <pre className="text-xs sm:text-sm font-mono whitespace-pre-wrap break-words">{aiResponse}</pre>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs sm:text-sm text-gray-600 italic">
                Click "AUTO SOLVE" to see the conversation here...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative w-full max-w-3xl border-4 border-black p-4 sm:p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
        
        {/* Speed Control Overlay (Top Right) */}
        {isSolving && (
             <div className="absolute top-2 right-2 z-20 flex gap-1">
                 <div className="bg-white border-2 border-black px-2 py-1 flex items-center gap-2 text-xs sm:text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg">
                    <span>SPEED</span>
                    <select 
                        value={playbackSpeed} 
                        onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                        className="bg-transparent focus:outline-none cursor-pointer"
                    >
                        {SPEEDS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                 </div>
             </div>
        )}

        {/* Rods */}
        <div className="flex justify-between items-end gap-2 sm:gap-8 h-64 sm:h-80">
          {(['A', 'B', 'C'] as RodId[]).map((rodId) => (
            <RodComponent 
              key={rodId}
              id={rodId}
              disks={gameState.rods[rodId]}
              totalDisks={gameState.diskCount}
              isSelected={gameState.selectedRodId === rodId}
              isValidTarget={
                gameState.selectedRodId !== null && 
                gameState.selectedRodId !== rodId &&
                canMoveDisk(gameState.rods[gameState.selectedRodId], gameState.rods[rodId])
              }
              label={rodLabels[rodId]}
              onClick={handleRodClick}
            />
          ))}
        </div>

        {/* Results Overlay */}
        {(gameState.isComplete || hasFailed) && solveStats && (
          <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center animate-in fade-in duration-300 rounded-xl p-4">
            {gameState.isComplete ? (
              <CheckCircle size={48} className="text-green-500 mb-3" />
            ) : (
              <XCircle size={48} className="text-red-500 mb-3" />
            )}
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center">
              {gameState.isComplete ? 'SUCCESS!' : 'FAILED!'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              {solveStats.modelName}
            </p>

            {/* Stats Grid */}
            <div className="bg-gray-50 border-2 border-black rounded-lg p-4 font-mono text-sm sm:text-base w-full max-w-sm">
              <div className="flex justify-between mb-2">
                <span className="font-bold">Moves:</span>
                <span className={solveStats.isCorrect ? 'text-green-600' : 'text-red-600'}>
                  {solveStats.moveCount} / {solveStats.expectedMoves}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-bold">Reasoning Tokens:</span>
                <span>{solveStats.reasoningTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-bold">Total Tokens:</span>
                <span>{solveStats.totalTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Time:</span>
                <span>{(solveStats.inferenceTimeMs / 1000).toFixed(2)}s</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Panel Modal */}
      {showInfoPanel && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowInfoPanel(false)}
        >
          <div
            className="bg-white border-4 border-black max-w-2xl w-full max-h-[90vh] rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b-2 border-black bg-white rounded-t-lg flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold">Learn More</h2>
              <button
                onClick={() => setShowInfoPanel(false)}
                className="text-2xl hover:opacity-70 transition-opacity leading-none"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b-2 border-black flex-shrink-0">
              <button
                onClick={() => setInfoTab('guide')}
                className={`flex-1 py-2 px-4 text-sm font-bold transition-colors ${
                  infoTab === 'guide' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Guide
              </button>
              <button
                onClick={() => setInfoTab('resources')}
                className={`flex-1 py-2 px-4 text-sm font-bold transition-colors ${
                  infoTab === 'resources' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Resources
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              {/* Guide Tab */}
              {infoTab === 'guide' && (
                <div className="space-y-4 text-sm">
                  <h3 className="text-lg font-bold">How to Use This Demo</h3>
                  <p>Test if AI "thinking" actually helps solve puzzles.</p>

                  <hr className="border-black" />

                  <div>
                    <h4 className="font-bold">Experiment 1: Easy Puzzle</h4>
                    <p className="text-gray-600">Test GPT-5 Nano on Easy (4 disks) with Thinking ON vs OFF.</p>
                  </div>

                  <hr className="border-black" />

                  <div>
                    <h4 className="font-bold">Experiment 2: Scale Up Parameters</h4>
                    <p className="text-gray-600">Test GPT-5 Nano, Mini, and 5.1 on Medium (7 disks) with Thinking OFF. Does a bigger model perform better?</p>
                  </div>

                  <hr className="border-black" />

                  <div>
                    <h4 className="font-bold">Experiment 3: The Limit of AI</h4>
                    <p className="text-gray-600">Test GPT-5.1 on Hard (10 disks) with Thinking ON vs OFF. Both will fail - showing the fundamental limit of AI reasoning.</p>
                  </div>

                  <hr className="border-black" />

                  <p className="text-gray-600 italic">After experimenting, check the Resources tab to learn what researchers discovered!</p>
                </div>
              )}

              {/* Resources Tab */}
              {infoTab === 'resources' && (
                <div className="space-y-6">
                  {/* Research Paper Link */}
                  <a
                    href="https://machinelearning.apple.com/research/illusion-of-thinking"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 border-2 border-black hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <h3 className="font-bold text-sm sm:text-base mb-1">Apple Research Paper</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Read the original research on how reasoning models handle computational tasks.</p>
                  </a>

                  {/* Paper Walkthrough */}
                  <div>
                    <h3 className="font-bold text-sm sm:text-base">Paper Walkthrough</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">A detailed walkthrough of the research paper and its key findings.</p>
                    <iframe
                      src="https://www.youtube.com/embed/_JguClkQ4Ds"
                      className="w-full aspect-video border-2 border-black rounded-lg"
                      allowFullScreen
                      title="Paper Walkthrough"
                    />
                  </div>

                  {/* Mathematical Deep Dive */}
                  <div>
                    <h3 className="font-bold text-sm sm:text-base">Mathematical Deep Dive</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">A technical breakdown of the paper's methodology, metrics, and statistical findings.</p>
                    <iframe
                      src="https://www.youtube.com/embed/_JguClkQ4Ds"
                      className="w-full aspect-video border-2 border-black rounded-lg"
                      allowFullScreen
                      title="Mathematical Deep Dive"
                    />
                  </div>

                  {/* Simple Intuitive Explanation */}
                  <div>
                    <h3 className="font-bold text-sm sm:text-base">Simple Intuitive Explanation</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">An accessible overview for those who want to understand the key insights without the math.</p>
                    <iframe
                      src="https://www.youtube.com/embed/H3YvlRBEx1I"
                      className="w-full aspect-video border-2 border-black rounded-lg"
                      allowFullScreen
                      title="Simple Intuitive Explanation"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

// src/components/ui/ManualTennisScoring.tsx
import React, { useState } from 'react';
import { useManualTennisStore, ManualTennisPlayer } from '../../stores/useManualTennisStore';

interface ManualTennisScoringProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualTennisScoring: React.FC<ManualTennisScoringProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentMatch,
    isMatchActive,
    createNewMatch,
    updatePlayerInfo,
    startMatch,
    endMatch,
    resetMatch,
    addPoint,
    removePoint,
    addGame,
    removeGame,
    setServe,
    setGameScore,
    setPointScore,
    setSetScore,
    addTiebreakPoint,
    removeTiebreakPoint,
    autoBindTennisComponents,
  } = useManualTennisStore();

  // UI state for creating new match
  const [showNewMatchForm, setShowNewMatchForm] = useState(false);
  const [newMatchForm, setNewMatchForm] = useState({
    player1: { name: '', country: '', seed: undefined as number | undefined },
    player2: { name: '', country: '', seed: undefined as number | undefined },
    format: 'best-of-3' as 'best-of-3' | 'best-of-5',
  });

  const [editMode, setEditMode] = useState(false);

  if (!isOpen) return null;

  const handleCreateMatch = () => {
    if (!newMatchForm.player1.name || !newMatchForm.player2.name) {
      alert('Please enter both player names');
      return;
    }

    createNewMatch(
      newMatchForm.player1,
      newMatchForm.player2,
      newMatchForm.format
    );
    
    setShowNewMatchForm(false);
    setNewMatchForm({
      player1: { name: '', country: '', seed: undefined },
      player2: { name: '', country: '', seed: undefined },
      format: 'best-of-3',
    });
  };

  const formatPointScore = (points: string) => {
    if (points === 'D') return 'Deuce';
    if (points === 'A') return 'Ad';
    return points;
  };

  const getSetsHistory = () => {
    if (!currentMatch) return [];
    const sets = [];
    for (let i = 1; i <= Math.max(currentMatch.currentSet - 1, 0); i++) {
      const setData = currentMatch.sets[`set${i}`];
      if (setData) {
        sets.push({ setNumber: i, ...setData });
      }
    }
    return sets;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Manual Tennis Scoring
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {!currentMatch || showNewMatchForm ? (
            /* New Match Form */
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create New Match</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Player 1 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Player 1</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newMatchForm.player1.name}
                      onChange={(e) => setNewMatchForm({
                        ...newMatchForm,
                        player1: { ...newMatchForm.player1, name: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter player name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={newMatchForm.player1.country || ''}
                      onChange={(e) => setNewMatchForm({
                        ...newMatchForm,
                        player1: { ...newMatchForm.player1, country: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., USA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Seed
                    </label>
                    <input
                      type="number"
                      value={newMatchForm.player1.seed || ''}
                      onChange={(e) => setNewMatchForm({
                        ...newMatchForm,
                        player1: { ...newMatchForm.player1, seed: e.target.value ? parseInt(e.target.value) : undefined }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., 1"
                    />
                  </div>
                </div>

                {/* Player 2 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Player 2</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newMatchForm.player2.name}
                      onChange={(e) => setNewMatchForm({
                        ...newMatchForm,
                        player2: { ...newMatchForm.player2, name: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter player name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={newMatchForm.player2.country || ''}
                      onChange={(e) => setNewMatchForm({
                        ...newMatchForm,
                        player2: { ...newMatchForm.player2, country: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., ESP"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Seed
                    </label>
                    <input
                      type="number"
                      value={newMatchForm.player2.seed || ''}
                      onChange={(e) => setNewMatchForm({
                        ...newMatchForm,
                        player2: { ...newMatchForm.player2, seed: e.target.value ? parseInt(e.target.value) : undefined }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., 2"
                    />
                  </div>
                </div>
              </div>

              {/* Match Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Match Format
                </label>
                <select
                  value={newMatchForm.format}
                  onChange={(e) => setNewMatchForm({
                    ...newMatchForm,
                    format: e.target.value as 'best-of-3' | 'best-of-5'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="best-of-3">Best of 3 Sets</option>
                  <option value="best-of-5">Best of 5 Sets</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleCreateMatch}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Create Match
                </button>
                {currentMatch && (
                  <button
                    onClick={() => setShowNewMatchForm(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Match Scoring Interface */
            <div className="space-y-6">
              {/* Match Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {currentMatch.player1.name} vs {currentMatch.player2.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentMatch.matchFormat.replace('-', ' ').toUpperCase()} • Set {currentMatch.currentSet}
                    {currentMatch.isTiebreak && ' • Tiebreak'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {editMode ? 'Exit Edit' : 'Edit Scores'}
                  </button>
                  <button
                    onClick={() => setShowNewMatchForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    New Match
                  </button>
                </div>
              </div>

              {/* Current Score Display */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="grid grid-cols-4 gap-4 text-center">
                  {/* Headers */}
                  <div className="font-medium text-gray-700 dark:text-gray-300">Player</div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">Sets</div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">Games</div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    {currentMatch.isTiebreak ? 'Tiebreak' : 'Points'}
                  </div>

                  {/* Player 1 */}
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {currentMatch.player1.name}
                      {currentMatch.servingPlayer === 1 && (
                        <span className="ml-2 text-green-600 dark:text-green-400">🎾</span>
                      )}
                    </div>
                    {currentMatch.player1.country && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {currentMatch.player1.country}
                        {currentMatch.player1.seed && ` (${currentMatch.player1.seed})`}
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentMatch.score.player1Sets}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentMatch.score.player1Games}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentMatch.isTiebreak
                      ? currentMatch.tiebreakScore?.player1 || 0
                      : formatPointScore(currentMatch.score.player1Points)
                    }
                  </div>

                  {/* Player 2 */}
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {currentMatch.player2.name}
                      {currentMatch.servingPlayer === 2 && (
                        <span className="ml-2 text-green-600 dark:text-green-400">🎾</span>
                      )}
                    </div>
                    {currentMatch.player2.country && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {currentMatch.player2.country}
                        {currentMatch.player2.seed && ` (${currentMatch.player2.seed})`}
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentMatch.score.player2Sets}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentMatch.score.player2Games}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentMatch.isTiebreak
                      ? currentMatch.tiebreakScore?.player2 || 0
                      : formatPointScore(currentMatch.score.player2Points)
                    }
                  </div>
                </div>
              </div>

              {/* Sets History */}
              {getSetsHistory().length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Sets History</h4>
                  <div className="grid grid-cols-auto gap-4">
                    {getSetsHistory().map((set) => (
                      <div key={set.setNumber} className="text-center">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Set {set.setNumber}
                        </div>
                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                          {set.player1} - {set.player2}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Control Buttons */}
              <div className="space-y-4">
                {/* Match Controls */}
                <div className="flex space-x-4">
                  {!isMatchActive ? (
                    <button
                      onClick={startMatch}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                    >
                      Start Match
                    </button>
                  ) : (
                    <button
                      onClick={endMatch}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                    >
                      End Match
                    </button>
                  )}
                  
                  {/* Multi-Scoreboard Info */}
                  {isMatchActive && (
                    <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Multi-Scoreboard Display</span>
                        </div>
                        <button
                          onClick={() => autoBindTennisComponents()}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                          title="Auto-bind all tennis components on current scoreboard to this manual match"
                        >
                          Connect Components
                        </button>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        This match data is available to tennis components. Click "Connect Components" to automatically bind all tennis components on your current scoreboard to this manual match.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={resetMatch}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Reset Match
                  </button>
                </div>

                {/* Serve Controls */}
                <div className="flex space-x-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 py-2">Serving:</span>
                  <button
                    onClick={() => setServe(1)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentMatch.servingPlayer === 1
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    {currentMatch.player1.name}
                  </button>
                  <button
                    onClick={() => setServe(2)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentMatch.servingPlayer === 2
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    {currentMatch.player2.name}
                  </button>
                </div>

                {isMatchActive && (
                  <>
                    {/* Point Controls */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-700 dark:text-gray-300">
                          {currentMatch.player1.name}
                        </h5>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => currentMatch.isTiebreak ? addTiebreakPoint(1) : addPoint(1)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                          >
                            + Point
                          </button>
                          <button
                            onClick={() => currentMatch.isTiebreak ? removeTiebreakPoint(1) : removePoint(1)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                          >
                            - Point
                          </button>
                          {!currentMatch.isTiebreak && (
                            <>
                              <button
                                onClick={() => addGame(1)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                              >
                                + Game
                              </button>
                              <button
                                onClick={() => removeGame(1)}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                              >
                                - Game
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-700 dark:text-gray-300">
                          {currentMatch.player2.name}
                        </h5>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => currentMatch.isTiebreak ? addTiebreakPoint(2) : addPoint(2)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                          >
                            + Point
                          </button>
                          <button
                            onClick={() => currentMatch.isTiebreak ? removeTiebreakPoint(2) : removePoint(2)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                          >
                            - Point
                          </button>
                          {!currentMatch.isTiebreak && (
                            <>
                              <button
                                onClick={() => addGame(2)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                              >
                                + Game
                              </button>
                              <button
                                onClick={() => removeGame(2)}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                              >
                                - Game
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Edit Mode - Direct Score Input */}
                    {editMode && (
                      <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Direct Score Editing</h5>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Sets (P1, P2)
                            </label>
                            <div className="flex space-x-2">
                              <input
                                type="number"
                                min="0"
                                value={currentMatch.score.player1Sets}
                                onChange={(e) => setSetScore(parseInt(e.target.value) || 0, currentMatch.score.player2Sets)}
                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                              />
                              <input
                                type="number"
                                min="0"
                                value={currentMatch.score.player2Sets}
                                onChange={(e) => setSetScore(currentMatch.score.player1Sets, parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Games (P1, P2)
                            </label>
                            <div className="flex space-x-2">
                              <input
                                type="number"
                                min="0"
                                value={currentMatch.score.player1Games}
                                onChange={(e) => setGameScore(parseInt(e.target.value) || 0, currentMatch.score.player2Games)}
                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                              />
                              <input
                                type="number"
                                min="0"
                                value={currentMatch.score.player2Games}
                                onChange={(e) => setGameScore(currentMatch.score.player1Games, parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                          </div>
                          {!currentMatch.isTiebreak && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Points (P1, P2)
                              </label>
                              <div className="flex space-x-2">
                                <select
                                  value={currentMatch.score.player1Points}
                                  onChange={(e) => setPointScore(e.target.value, currentMatch.score.player2Points)}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                >
                                  <option value="0">0</option>
                                  <option value="15">15</option>
                                  <option value="30">30</option>
                                  <option value="40">40</option>
                                  <option value="D">Deuce</option>
                                  <option value="A">Advantage</option>
                                </select>
                                <select
                                  value={currentMatch.score.player2Points}
                                  onChange={(e) => setPointScore(currentMatch.score.player1Points, e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                >
                                  <option value="0">0</option>
                                  <option value="15">15</option>
                                  <option value="30">30</option>
                                  <option value="40">40</option>
                                  <option value="D">Deuce</option>
                                  <option value="A">Advantage</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Match Status */}
              <div className="text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  currentMatch.matchStatus === 'completed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : currentMatch.matchStatus === 'in_progress'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {currentMatch.matchStatus.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
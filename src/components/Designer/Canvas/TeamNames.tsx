import React from 'react';
import { TennisLiveData } from '../../../types/scoreboard';

interface TeamNamesProps {
  tennisMatch: TennisLiveData | null;
  teamSelection?: number; // 0 for both teams, 1 for team 1 only, 2 for team 2 only
  separator?: string; // separator between team names when showing both
  fallbackText?: string;
}

export const TeamNames: React.FC<TeamNamesProps> = ({
  tennisMatch,
  teamSelection = 0, // Default to showing both teams
  separator = " vs ",
  fallbackText = "Team 1 vs Team 2",
}) => {
  const getTeamNames = (): string => {
    if (!tennisMatch) {
      return fallbackText;
    }

    // Debug: Log what data we're receiving (disabled for production)
    // console.log('TeamNames: Received tennisMatch:', tennisMatch);
    // console.log('TeamNames: team1Name:', tennisMatch.team1Name, 'player1.name:', tennisMatch.player1?.name);
    // console.log('TeamNames: team2Name:', tennisMatch.team2Name, 'player2.name:', tennisMatch.player2?.name);

    // If a specific team is requested, return just that team's name
    if (teamSelection === 1) {
      return tennisMatch.team1Name || tennisMatch.player1?.name || "Team 1";
    } else if (teamSelection === 2) {
      return tennisMatch.team2Name || tennisMatch.player2?.name || "Team 2";
    }

    // If teamSelection is 0 or not set, return both team names with separator
    const team1Name = tennisMatch.team1Name || tennisMatch.player1?.name || "Team 1";
    const team2Name = tennisMatch.team2Name || tennisMatch.player2?.name || "Team 2";
    return `${team1Name}${separator}${team2Name}`;
  };

  return <>{getTeamNames()}</>;
};

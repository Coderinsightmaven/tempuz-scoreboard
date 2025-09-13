import React from 'react';
import { ComponentType } from '../../../types/scoreboard';
import { TennisLiveData } from '../../../types/scoreboard';
import { TeamNames } from './TeamNames';
import { AdaptiveTeamDisplay } from './AdaptiveTeamDisplay';

interface TennisPlayerNameDisplayProps {
  tennisMatch: TennisLiveData | null;
  componentType: ComponentType;
  componentData: any;
  fallbackText?: string;
}

export const TennisPlayerNameDisplay: React.FC<TennisPlayerNameDisplayProps> = ({
  tennisMatch,
  componentType,
  componentData,
  fallbackText,
}) => {
  const getDisplayValue = (): React.ReactNode => {
    if (!tennisMatch) {
      return fallbackText || getDefaultText();
    }

    switch (componentType) {
      case ComponentType.TENNIS_PLAYER_NAME:
        return componentData.playerNumber === 2
          ? tennisMatch.player2?.name || 'Player 2'
          : tennisMatch.player1?.name || 'Player 1';

      case ComponentType.TENNIS_DOUBLES_PLAYER_NAME:
        // For doubles, use the TeamNames component to display team names from side notes
        const teamNumber = (componentData.playerNumber === 1 || componentData.playerNumber === 2) ? 1 : 2;
        return (
          <TeamNames
            tennisMatch={tennisMatch}
            teamSelection={teamNumber}
            fallbackText={fallbackText || getDefaultText()}
          />
        );

      case ComponentType.TENNIS_TEAM_NAMES:
        // For team names, use the TeamNames component with team selection
        return (
          <TeamNames
            tennisMatch={tennisMatch}
            teamSelection={componentData.teamSelection || 0}
            fallbackText={fallbackText || getDefaultText()}
          />
        );

      case ComponentType.TENNIS_ADAPTIVE_TEAM_DISPLAY:
        // For adaptive team display, use the AdaptiveTeamDisplay component
        return (
          <AdaptiveTeamDisplay
            tennisMatch={tennisMatch}
            teamSelection={componentData.teamSelection || 0}
            fallbackText={fallbackText || getDefaultText()}
          />
        );

      default:
        return fallbackText || getDefaultText();
    }
  };

  const getDefaultText = (): string => {
    switch (componentType) {
      case ComponentType.TENNIS_PLAYER_NAME:
        return `Player ${componentData.playerNumber || 1}`;
      case ComponentType.TENNIS_DOUBLES_PLAYER_NAME:
        const playerNum = componentData.playerNumber || 1;
        if (playerNum === 1 || playerNum === 2) return 'Smith / Johnson';
        if (playerNum === 3 || playerNum === 4) return 'Williams / Brown';
        return 'Smith / Johnson';
      case ComponentType.TENNIS_TEAM_NAMES:
        const teamSelection = componentData.teamSelection || 0;
        if (teamSelection === 1) return 'Team 1';
        if (teamSelection === 2) return 'Team 2';
        return 'Team 1 vs Team 2';
      case ComponentType.TENNIS_ADAPTIVE_TEAM_DISPLAY:
        const adaptiveTeamSelection = componentData.teamSelection || 0;
        if (adaptiveTeamSelection === 1) return 'Team 1';
        if (adaptiveTeamSelection === 2) return 'Team 2';
        return 'Team 1 vs Team 2';
      default:
        return 'Tennis Player';
    }
  };

  return <>{getDisplayValue()}</>;
};

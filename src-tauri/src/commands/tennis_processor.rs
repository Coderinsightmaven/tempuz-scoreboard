// src-tauri/src/commands/tennis_processor.rs
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::command;

// Data structures for tennis match processing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawTennisData {
    pub id: Option<String>,
    pub match_id: Option<String>,
    pub player1: Option<RawPlayerData>,
    pub player2: Option<RawPlayerData>,
    pub team1: Option<RawPlayerData>,
    pub team2: Option<RawPlayerData>,
    pub score: Option<RawScoreData>,
    pub sets: Option<HashMap<String, RawSetData>>,
    pub serving_player: Option<i32>,
    pub servingPlayer: Option<i32>,
    pub current_set: Option<i32>,
    pub currentSet: Option<i32>,
    pub is_tiebreak: Option<bool>,
    pub isTiebreak: Option<bool>,
    pub match_status: Option<String>,
    pub matchStatus: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawPlayerData {
    pub name: Option<String>,
    pub country: Option<String>,
    pub seed: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawScoreData {
    pub player1_sets: Option<i32>,
    pub player1Sets: Option<i32>,
    pub player2_sets: Option<i32>,
    pub player2Sets: Option<i32>,
    pub player1_games: Option<i32>,
    pub player1Games: Option<i32>,
    pub player2_games: Option<i32>,
    pub player2Games: Option<i32>,
    pub player1_points: Option<String>,
    pub player1Points: Option<String>,
    pub player2_points: Option<String>,
    pub player2Points: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawSetData {
    pub player1: Option<i32>,
    pub player2: Option<i32>,
}

// Processed data structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessedTennisMatch {
    pub match_id: String,
    pub player1: ProcessedPlayerData,
    pub player2: ProcessedPlayerData,
    pub score: ProcessedScoreData,
    pub sets: HashMap<String, ProcessedSetData>,
    pub serving_player: i32,
    pub current_set: i32,
    pub is_tiebreak: bool,
    pub match_status: String,
    // Legacy properties for compatibility
    pub servingPlayer: i32,
    pub currentSet: i32,
    pub isTiebreak: bool,
    pub matchStatus: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessedPlayerData {
    pub name: String,
    pub country: Option<String>,
    pub seed: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessedScoreData {
    // New property names
    pub player1_sets: i32,
    pub player2_sets: i32,
    pub player1_games: i32,
    pub player2_games: i32,
    pub player1_points: String,
    pub player2_points: String,
    // Legacy property names for compatibility
    pub player1Sets: i32,
    pub player2Sets: i32,
    pub player1Games: i32,
    pub player2Games: i32,
    pub player1Points: String,
    pub player2Points: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessedSetData {
    pub player1: i32,
    pub player2: i32,
}

// Tennis data processor
pub struct TennisDataProcessor;

impl TennisDataProcessor {
    /// Process raw tennis data into a standardized format
    pub fn process_data(raw_data: RawTennisData) -> Result<ProcessedTennisMatch, String> {
        // Extract and validate basic match information
        let match_id = raw_data.match_id
            .or(raw_data.id)
            .unwrap_or_else(|| "unknown".to_string());

        // Process player data
        let player1 = Self::process_player_data(
            raw_data.player1.or(raw_data.team1),
            "Player 1"
        );
        let player2 = Self::process_player_data(
            raw_data.player2.or(raw_data.team2),
            "Player 2"
        );

        // Process score data
        let score = Self::process_score_data(raw_data.score);

        // Process sets data
        let sets = Self::process_sets_data(raw_data.sets.unwrap_or_default());

        // Extract serving and match state information
        let serving_player = Self::normalize_serving_player(
            raw_data.serving_player.or(raw_data.servingPlayer)
        );
        let current_set = raw_data.current_set.or(raw_data.currentSet).unwrap_or(1);
        let is_tiebreak = raw_data.is_tiebreak.or(raw_data.isTiebreak).unwrap_or(false);
        let match_status = raw_data.match_status
            .or(raw_data.matchStatus)
            .unwrap_or_else(|| "in_progress".to_string());

        Ok(ProcessedTennisMatch {
            match_id,
            player1,
            player2,
            score,
            sets,
            serving_player,
            current_set,
            is_tiebreak,
            match_status: match_status.clone(),
            // Legacy properties
            servingPlayer: serving_player,
            currentSet: current_set,
            isTiebreak: is_tiebreak,
            matchStatus: match_status,
        })
    }

    fn process_player_data(raw_player: Option<RawPlayerData>, default_name: &str) -> ProcessedPlayerData {
        match raw_player {
            Some(player) => ProcessedPlayerData {
                name: player.name.unwrap_or_else(|| default_name.to_string()),
                country: player.country,
                seed: player.seed,
            },
            None => ProcessedPlayerData {
                name: default_name.to_string(),
                country: None,
                seed: None,
            }
        }
    }

    fn process_score_data(raw_score: Option<RawScoreData>) -> ProcessedScoreData {
        let default_score = RawScoreData {
            player1_sets: Some(0),
            player1Sets: Some(0),
            player2_sets: Some(0),
            player2Sets: Some(0),
            player1_games: Some(0),
            player1Games: Some(0),
            player2_games: Some(0),
            player2Games: Some(0),
            player1_points: Some("0".to_string()),
            player1Points: Some("0".to_string()),
            player2_points: Some("0".to_string()),
            player2Points: Some("0".to_string()),
        };

        let score = raw_score.unwrap_or(default_score);

        let player1_sets = score.player1_sets.or(score.player1Sets).unwrap_or(0);
        let player2_sets = score.player2_sets.or(score.player2Sets).unwrap_or(0);
        let player1_games = score.player1_games.or(score.player1Games).unwrap_or(0);
        let player2_games = score.player2_games.or(score.player2Games).unwrap_or(0);
        let player1_points = Self::normalize_points(
            score.player1_points.as_ref()
                .or(score.player1Points.as_ref())
                .map(|s| s.as_str())
                .unwrap_or("0")
        );
        let player2_points = Self::normalize_points(
            score.player2_points.as_ref()
                .or(score.player2Points.as_ref())
                .map(|s| s.as_str())
                .unwrap_or("0")
        );

        ProcessedScoreData {
            player1_sets,
            player2_sets,
            player1_games,
            player2_games,
            player1_points: player1_points.clone(),
            player2_points: player2_points.clone(),
            // Legacy properties
            player1Sets: player1_sets,
            player2Sets: player2_sets,
            player1Games: player1_games,
            player2Games: player2_games,
            player1Points: player1_points,
            player2Points: player2_points,
        }
    }

    fn process_sets_data(raw_sets: HashMap<String, RawSetData>) -> HashMap<String, ProcessedSetData> {
        raw_sets.into_iter()
            .map(|(key, set_data)| {
                let processed_set = ProcessedSetData {
                    player1: set_data.player1.unwrap_or(0),
                    player2: set_data.player2.unwrap_or(0),
                };
                (key, processed_set)
            })
            .collect()
    }

    fn normalize_points(points: &str) -> String {
        match points.to_lowercase().as_str() {
            "0" => "0".to_string(),
            "15" => "15".to_string(),
            "30" => "30".to_string(),
            "40" => "40".to_string(),
            "a" | "ad" | "advantage" => "AD".to_string(),
            "love" => "0".to_string(),
            _ => points.to_string(),
        }
    }

    fn normalize_serving_player(serving_player: Option<i32>) -> i32 {
        serving_player.unwrap_or(1).clamp(1, 4)
    }
}

// Batch processing for multiple tennis matches
pub struct BatchTennisProcessor;

impl BatchTennisProcessor {
    pub fn process_batch(raw_data_batch: Vec<RawTennisData>) -> Result<Vec<ProcessedTennisMatch>, String> {
        let mut results = Vec::new();

        for raw_data in raw_data_batch {
            match TennisDataProcessor::process_data(raw_data) {
                Ok(processed) => results.push(processed),
                Err(error) => {
                    eprintln!("Error processing tennis data: {}", error);
                    // Continue processing other items
                }
            }
        }

        Ok(results)
    }
}

// Tauri commands
#[command]
pub async fn process_tennis_data(raw_data: RawTennisData) -> Result<ProcessedTennisMatch, String> {
    println!("🎾 Processing tennis data via Rust backend");
    TennisDataProcessor::process_data(raw_data)
}

#[command]
pub async fn process_tennis_data_batch(raw_data_batch: Vec<RawTennisData>) -> Result<Vec<ProcessedTennisMatch>, String> {
    println!("🎾 Batch processing {} tennis matches via Rust backend", raw_data_batch.len());
    BatchTennisProcessor::process_batch(raw_data_batch)
}

#[command]
pub async fn validate_tennis_data(raw_data: RawTennisData) -> Result<bool, String> {
    // Basic validation - check if required fields are present
    if raw_data.id.is_none() && raw_data.match_id.is_none() {
        return Ok(false);
    }

    // Check if we have at least one player
    if raw_data.player1.is_none() && raw_data.team1.is_none() {
        return Ok(false);
    }

    Ok(true)
}

// src-tauri/src/commands/live_data.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TennisLiveData {
    #[serde(rename = "matchId")]
    pub match_id: String,
    pub player1: PlayerInfo,
    pub player2: PlayerInfo,
    pub score: TennisScore,
    #[serde(rename = "matchStatus")]
    pub match_status: String,
    #[serde(rename = "servingPlayer")]
    pub serving_player: Option<u8>,
    #[serde(rename = "currentSet")]
    pub current_set: u8,
    #[serde(rename = "isTiebreak")]
    pub is_tiebreak: bool,
    #[serde(rename = "tiebreakScore")]
    pub tiebreak_score: Option<TiebreakScore>,
    pub tournament: Option<String>,
    pub round: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerInfo {
    pub name: String,
    pub country: Option<String>,
    pub seed: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TennisScore {
    #[serde(rename = "player1Sets")]
    pub player1_sets: u8,
    #[serde(rename = "player2Sets")]
    pub player2_sets: u8,
    #[serde(rename = "player1Games")]
    pub player1_games: u8,
    #[serde(rename = "player2Games")]
    pub player2_games: u8,
    #[serde(rename = "player1Points")]
    pub player1_points: String,
    #[serde(rename = "player2Points")]
    pub player2_points: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TiebreakScore {
    pub player1: u8,
    pub player2: u8,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

// Mock data for testing
fn create_mock_tennis_data() -> TennisLiveData {
    TennisLiveData {
        match_id: "mock_match_001".to_string(),
        player1: PlayerInfo {
            name: "Novak Djokovic".to_string(),
            country: Some("SRB".to_string()),
            seed: Some(1),
        },
        player2: PlayerInfo {
            name: "Rafael Nadal".to_string(),
            country: Some("ESP".to_string()),
            seed: Some(2),
        },
        score: TennisScore {
            player1_sets: 2,
            player2_sets: 1,
            player1_games: 4,
            player2_games: 3,
            player1_points: "30".to_string(),
            player2_points: "15".to_string(),
        },
        match_status: "in_progress".to_string(),
        serving_player: Some(1),
        current_set: 4,
        is_tiebreak: false,
        tiebreak_score: None,
        tournament: Some("Wimbledon".to_string()),
        round: Some("Final".to_string()),
    }
}

#[tauri::command]
pub async fn fetch_live_data(api_url: String, api_key: String) -> Result<TennisLiveData, String> {
    // For now, return mock data if the URL contains "mock"
    if api_url.contains("mock") {
        return Ok(create_mock_tennis_data());
    }

    // Make HTTP request to the API
    let client = reqwest::Client::new();
    
    let response = client
        .get(&api_url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("Failed to make request: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "API request failed with status: {}",
            response.status()
        ));
    }

    let api_response: ApiResponse<TennisLiveData> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    if !api_response.success {
        return Err(api_response.error.unwrap_or("Unknown API error".to_string()));
    }

    api_response.data.ok_or_else(|| "No data in response".to_string())
}

#[tauri::command]
pub async fn test_api_connection(api_url: String, api_key: String) -> Result<bool, String> {
    // For mock URLs, always return success
    if api_url.contains("mock") {
        return Ok(true);
    }

    let client = reqwest::Client::new();
    
    let response = client
        .get(&api_url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("Connection test failed: {}", e))?;

    Ok(response.status().is_success())
}

#[tauri::command]
pub async fn get_available_matches(api_url: String, api_key: String) -> Result<Vec<MatchInfo>, String> {
    // For mock URLs, return sample matches
    if api_url.contains("mock") {
        return Ok(vec![
            MatchInfo {
                match_id: "mock_match_001".to_string(),
                player1_name: "Novak Djokovic".to_string(),
                player2_name: "Rafael Nadal".to_string(),
                tournament: "Wimbledon".to_string(),
                round: "Final".to_string(),
                status: "in_progress".to_string(),
            },
            MatchInfo {
                match_id: "mock_match_002".to_string(),
                player1_name: "Carlos Alcaraz".to_string(),
                player2_name: "Daniil Medvedev".to_string(),
                tournament: "Wimbledon".to_string(),
                round: "Semi-Final".to_string(),
                status: "completed".to_string(),
            },
        ]);
    }

    let client = reqwest::Client::new();
    let matches_url = format!("{}/matches", api_url.trim_end_matches('/'));
    
    let response = client
        .get(&matches_url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch matches: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to fetch matches with status: {}",
            response.status()
        ));
    }

    let api_response: ApiResponse<Vec<MatchInfo>> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse matches response: {}", e))?;

    if !api_response.success {
        return Err(api_response.error.unwrap_or("Unknown API error".to_string()));
    }

    api_response.data.ok_or_else(|| "No matches data in response".to_string())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchInfo {
    #[serde(rename = "matchId")]
    pub match_id: String,
    #[serde(rename = "player1Name")]
    pub player1_name: String,
    #[serde(rename = "player2Name")]
    pub player2_name: String,
    pub tournament: String,
    pub round: String,
    pub status: String,
}
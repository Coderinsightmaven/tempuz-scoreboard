// src-tauri/src/commands/live_data.rs
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use lazy_static::lazy_static;
use futures_util::StreamExt;
use tokio::sync::mpsc;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use serde_json;

// IonCourt payload types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IonCourtMatchMessage {
    #[serde(rename = "type")]
    pub message_type: String,
    pub data: IonCourtMatchData,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IonCourtMatchData {
    pub id: String,
    #[serde(rename = "matchId")]
    pub match_id: String,
    #[serde(rename = "matchFormat")]
    pub match_format: String,
    #[serde(rename = "matchStatus")]
    pub match_status: String,
    #[serde(rename = "matchType")]
    pub match_type: String,
    pub sides: Vec<IonCourtSide>,
    pub score: IonCourtScore,
    pub clocks: Vec<IonCourtClock>,
    pub court: String,
    #[serde(rename = "isUndo")]
    pub is_undo: bool,
    #[serde(rename = "playerCourtTimeLog")]
    pub player_court_time_log: IonCourtTimeLog,
    #[serde(rename = "substituteTracker")]
    pub substitute_tracker: IonCourtSubstituteTracker,
    #[serde(rename = "isStartPoint")]
    pub is_start_point: bool,
    #[serde(rename = "isEndPoint")]
    pub is_end_point: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IonCourtSide {
    #[serde(rename = "sideNumber")]
    pub side_number: u8,
    pub participant: Option<serde_json::Value>,
    pub players: Vec<IonCourtPlayer>,
    #[serde(rename = "_id")]
    pub _id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IonCourtPlayer {
    #[serde(rename = "playerNumber")]
    pub player_number: u8,
    pub participant: IonCourtParticipant,
    #[serde(rename = "biographicalInformation")]
    pub biographical_information: IonCourtBioInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IonCourtParticipant {
    #[serde(rename = "_id")]
    pub _id: String,
    #[serde(rename = "first_name")]
    pub first_name: String,
    #[serde(rename = "last_name")]
    pub last_name: String,
    #[serde(rename = "biographicalInformation")]
    pub biographical_information: IonCourtBioInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IonCourtBioInfo {
    pub sex: String,
    #[serde(rename = "playingHand")]
    pub playing_hand: String,
    #[serde(rename = "doubleHandedForehand")]
    pub double_handed_forehand: bool,
    #[serde(rename = "doubleHandedBackhand")]
    pub double_handed_backhand: bool,
    pub national: Option<serde_json::Value>,
    pub itf: Option<serde_json::Value>,
    pub atpwta: Option<serde_json::Value>,
    pub utr: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IonCourtScore {
    #[serde(rename = "scoreStringSide1")]
    pub score_string_side1: String,
    #[serde(rename = "scoreStringSide2")]
    pub score_string_side2: String,
    #[serde(rename = "side1PointScore")]
    pub side1_point_score: String,
    #[serde(rename = "side2PointScore")]
    pub side2_point_score: String,
    pub server: IonCourtServer,
    pub sets: Vec<IonCourtSet>,
    #[serde(rename = "_id")]
    pub _id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IonCourtServer {
    #[serde(rename = "sideNumber")]
    pub side_number: u8,
    #[serde(rename = "playerNumber")]
    pub player_number: u8,
    pub player: String,
    #[serde(rename = "returningSide")]
    pub returning_side: String,
    #[serde(rename = "_id")]
    pub _id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IonCourtSet {
    #[serde(rename = "setNumber")]
    pub set_number: u8,
    #[serde(rename = "side1Score")]
    pub side1_score: u8,
    #[serde(rename = "side1TiebreakScore")]
    pub side1_tiebreak_score: Option<u8>,
    #[serde(rename = "side2Score")]
    pub side2_score: u8,
    #[serde(rename = "side2TiebreakScore")]
    pub side2_tiebreak_score: Option<u8>,
    #[serde(rename = "_id")]
    pub _id: String,
    pub games: Vec<serde_json::Value>,
    #[serde(rename = "returnerCourtSides")]
    pub returner_court_sides: Vec<serde_json::Value>,
    #[serde(rename = "serverPickleballOrders")]
    pub server_pickleball_orders: Vec<serde_json::Value>,
    #[serde(rename = "isCompleted")]
    pub is_completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IonCourtClock {
    pub name: String,
    #[serde(rename = "type")]
    pub clock_type: String,
    #[serde(rename = "defaultValue")]
    pub default_value: u32,
    #[serde(rename = "displayValue")]
    pub display_value: String,
    #[serde(rename = "adjustTime")]
    pub adjust_time: u32,
    #[serde(rename = "timePipe")]
    pub time_pipe: String,
    pub value: u32,
    #[serde(rename = "isPaused")]
    pub is_paused: bool,
    #[serde(rename = "timeoutPerSet")]
    pub timeout_per_set: u32,
    #[serde(rename = "timeoutPerMatch")]
    pub timeout_per_match: u32,
    #[serde(rename = "_id")]
    pub _id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IonCourtTimeLog {
    pub side1: Vec<IonCourtPlayerTime>,
    pub side2: Vec<IonCourtPlayerTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IonCourtPlayerTime {
    pub player: IonCourtPlayerTimeInfo,
    #[serde(rename = "playerNumber")]
    pub player_number: u8,
    #[serde(rename = "sideNumber")]
    pub side_number: u8,
    #[serde(rename = "inTime")]
    pub in_time: String,
    #[serde(rename = "outTime")]
    pub out_time: Option<String>,
    #[serde(rename = "substitutedBy")]
    pub substituted_by: Option<serde_json::Value>,
    #[serde(rename = "substitutedAt")]
    pub substituted_at: Option<serde_json::Value>,
    #[serde(rename = "performedBy")]
    pub performed_by: String,
    #[serde(rename = "isReverted")]
    pub is_reverted: bool,
    #[serde(rename = "setNumber")]
    pub set_number: u8,
    #[serde(rename = "inPointNumber")]
    pub in_point_number: u32,
    #[serde(rename = "outSetNumber")]
    pub out_set_number: Option<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IonCourtPlayerTimeInfo {
    #[serde(rename = "biographicalInformation")]
    pub biographical_information: IonCourtBioInfo,
    #[serde(rename = "_id")]
    pub _id: String,
    #[serde(rename = "first_name")]
    pub first_name: String,
    #[serde(rename = "last_name")]
    pub last_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IonCourtSubstituteTracker {
    pub side1: Vec<serde_json::Value>,
    pub side2: Vec<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TennisLiveData {
    #[serde(rename = "matchId")]
    pub match_id: String,
    pub player1: PlayerInfo,
    pub player2: PlayerInfo,
    pub score: TennisScore,
    pub sets: Vec<TennisSet>,
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
pub struct TennisSet {
    #[serde(rename = "player1Games")]
    pub player1_games: u8,
    #[serde(rename = "player2Games")]
    pub player2_games: u8,
    pub completed: bool,
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

// Function to convert IonCourt data to TennisLiveData format
fn convert_ioncourt_to_tennis_data(ioncourt_data: &IonCourtMatchData) -> TennisLiveData {
    // Extract player information
    let mut player1_name = "Player 1".to_string();
    let mut player2_name = "Player 2".to_string();

    // Find players from sides
    for side in &ioncourt_data.sides {
        if side.side_number == 1 && !side.players.is_empty() {
            let player = &side.players[0];
            player1_name = format!("{} {}", player.participant.first_name, player.participant.last_name);
        } else if side.side_number == 2 && !side.players.is_empty() {
            let player = &side.players[0];
            player2_name = format!("{} {}", player.participant.first_name, player.participant.last_name);
        }
    }

    // Calculate serving player (1 or 2 based on side and player number)
    let serving_player = if ioncourt_data.score.server.side_number == 1 && ioncourt_data.score.server.player_number == 1 {
        Some(1)
    } else if ioncourt_data.score.server.side_number == 2 && ioncourt_data.score.server.player_number == 1 {
        Some(2)
    } else {
        Some(1) // Default to player 1
    };

    // Build sets data
    let mut sets = Vec::new();
    for set in &ioncourt_data.score.sets {
        sets.push(TennisSet {
            player1_games: set.side1_score,
            player2_games: set.side2_score,
            completed: set.is_completed,
        });
    }

    // Map match status
    let match_status = match ioncourt_data.match_status.as_str() {
        "IN_PROGRESS" => "in_progress",
        "COMPLETED" => "completed",
        "NOT_STARTED" => "not_started",
        "SUSPENDED" => "suspended",
        _ => "not_started",
    };

    // Calculate current set (find the first incomplete set)
    let current_set = ioncourt_data.score.sets.iter()
        .find(|s| !s.is_completed)
        .map(|s| s.set_number)
        .unwrap_or(1);

    TennisLiveData {
        match_id: ioncourt_data.match_id.clone(),
        player1: PlayerInfo {
            name: player1_name,
            country: None,
            seed: None,
        },
        player2: PlayerInfo {
            name: player2_name,
            country: None,
            seed: None,
        },
        score: TennisScore {
            player1_sets: ioncourt_data.score.sets.iter().filter(|s| s.is_completed).count() as u8,
            player2_sets: ioncourt_data.score.sets.iter().filter(|s| s.is_completed).count() as u8,
            player1_games: ioncourt_data.score.sets.last().map(|s| s.side1_score).unwrap_or(0),
            player2_games: ioncourt_data.score.sets.last().map(|s| s.side2_score).unwrap_or(0),
            player1_points: ioncourt_data.score.side1_point_score.clone(),
            player2_points: ioncourt_data.score.side2_point_score.clone(),
        },
        sets,
        match_status: match_status.to_string(),
        serving_player,
        current_set,
        is_tiebreak: false, // TODO: Implement tiebreak detection
        tiebreak_score: None,
        tournament: None,
        round: None,
    }
}

// Global state for WebSocket connections and data
lazy_static! {
    static ref WEBSOCKET_CONNECTIONS: Mutex<HashMap<String, WebSocketConnection>> = Mutex::new(HashMap::new());
    static ref LIVE_DATA_CACHE: Mutex<HashMap<String, TennisLiveData>> = Mutex::new(HashMap::new());
}

#[derive(Debug)]
struct WebSocketConnection {
    #[allow(dead_code)]
    sender: mpsc::UnboundedSender<String>,
    handle: tokio::task::JoinHandle<()>,
}

impl WebSocketConnection {
    fn new(sender: mpsc::UnboundedSender<String>, handle: tokio::task::JoinHandle<()>) -> Self {
        WebSocketConnection { sender, handle }
    }
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
        sets: vec![
            TennisSet {
                player1_games: 6,
                player2_games: 4,
                completed: true,
            },
            TennisSet {
                player1_games: 5,
                player2_games: 7,
                completed: true,
            },
            TennisSet {
                player1_games: 7,
                player2_games: 5,
                completed: true,
            },
            TennisSet {
                player1_games: 4,
                player2_games: 3,
                completed: false,
            },
        ],
        match_status: "in_progress".to_string(),
        serving_player: Some(1),
        current_set: 4,
        is_tiebreak: false,
        tiebreak_score: None,
        tournament: Some("Wimbledon".to_string()),
        round: Some("Final".to_string()),
    }
}

async fn connect_websocket(ws_url: &str, connection_id: &str) -> Result<(), String> {
    println!("🔌 [WEBSOCKET] Attempting to connect to: {}", ws_url.replace("token=", "token=[HIDDEN]"));
    println!("🔌 [WEBSOCKET] Full URL: {}", ws_url);
    println!("🔌 [WEBSOCKET] Connection ID: {}", connection_id);

    let (ws_stream, _) = connect_async(ws_url)
        .await
        .map_err(|e| {
            println!("❌ [WEBSOCKET] Failed to connect to {}: {}", ws_url.replace("token=", "token=[HIDDEN]"), e);
            format!("Failed to connect to WebSocket: {}", e)
        })?;

    println!("✅ [WEBSOCKET] Successfully connected to: {}", ws_url.replace("token=", "token=[HIDDEN]"));
    println!("✅ [WEBSOCKET] Full connection URL: {}", ws_url);
    println!("✅ [WEBSOCKET] Connection established for ID: {}", connection_id);
    println!("🎉 [WEBSOCKET] IonCourt WebSocket connection is now ACTIVE!");

    let (_write, mut read) = ws_stream.split();

    // Create a channel for sending messages
    let (tx, mut rx) = mpsc::unbounded_channel();

    // Clone connection_id to fix lifetime issue
    let connection_id_clone = connection_id.to_string();

    // Store the connection
    let handle = tokio::spawn(async move {
        loop {
            tokio::select! {
                message = read.next() => {
                    match message {
                        Some(Ok(msg)) => {
                            match msg {
                                Message::Text(text) => {
                                    println!("📨 Received WebSocket message: {}", text);

                                    // Handle heartbeat messages
                                    if text == "{\"type\":\"heartbeat\"}" || text.contains("heartbeat") {
                                        println!("💓 Heartbeat received - WebSocket connection is alive");
                                        continue;
                                    }

                                    // Try to parse as IonCourt message first
                                    if let Ok(ioncourt_message) = serde_json::from_str::<IonCourtMatchMessage>(&text) {
                                        if ioncourt_message.message_type == "MATCH" {
                                            // Convert IonCourt data to TennisLiveData format
                                            let tennis_data = convert_ioncourt_to_tennis_data(&ioncourt_message.data);

                                            println!("🎾 IonCourt MATCH Data Received:");
                                            println!("  Match ID: {}", ioncourt_message.data.match_id);
                                            println!("  Status: {}", ioncourt_message.data.match_status);
                                            println!("  Type: {}", ioncourt_message.data.match_type);
                                            println!("  Player 1: {} {}", ioncourt_message.data.sides[0].players[0].participant.first_name, ioncourt_message.data.sides[0].players[0].participant.last_name);
                                            println!("  Player 2: {} {}", ioncourt_message.data.sides[1].players[0].participant.first_name, ioncourt_message.data.sides[1].players[0].participant.last_name);
                                            println!("  Score: {}-{}", ioncourt_message.data.score.side1_point_score, ioncourt_message.data.score.side2_point_score);
                                            println!("  Server: Side {}, Player {}", ioncourt_message.data.score.server.side_number, ioncourt_message.data.score.server.player_number);

                                            let mut cache = LIVE_DATA_CACHE.lock().unwrap();
                                            cache.insert(connection_id_clone.clone(), tennis_data);
                                            println!("✅ Successfully processed IonCourt match data");
                                        } else {
                                            println!("⚠️ Received IonCourt message with type: {}", ioncourt_message.message_type);
                                        }
                                    } else {
                                        // Try to parse as other JSON message types
                                        if let Ok(json_value) = serde_json::from_str::<serde_json::Value>(&text) {
                                            if let Some(message_type) = json_value.get("type") {
                                                println!("📨 Received message type: {}", message_type);
                                            } else {
                                                println!("📨 Received JSON message without type field");
                                            }
                                        } else {
                                            println!("❌ Failed to parse WebSocket message as JSON");
                                        }
                                    }
                                }
                                Message::Close(close_frame) => {
                                    if let Some(frame) = close_frame {
                                        println!("WebSocket connection closed with code: {:?}, reason: {:?}", frame.code, frame.reason);
                                    } else {
                                        println!("WebSocket connection closed");
                                    }
                                    break;
                                }
                                Message::Ping(_payload) => {
                                    println!("🏓 Ping received from server");
                                }
                                Message::Pong(_payload) => {
                                    println!("🏓 Pong received from server");
                                }
                                Message::Binary(data) => {
                                    println!("📦 Binary message received ({} bytes)", data.len());
                                }
                                _ => {
                                    println!("📨 Unknown message type received");
                                }
                            }
                        }
                        Some(Err(e)) => {
                            println!("WebSocket error: {}", e);
                            break;
                        }
                        None => {
                            println!("WebSocket stream ended");
                            break;
                        }
                    }
                }
                message = rx.recv() => {
                    match message {
                        Some(msg) => {
                            // Handle outgoing messages if needed
                            println!("Sending message: {}", msg);
                        }
                        None => break,
                    }
                }
            }
        }
    });

    let connection = WebSocketConnection::new(tx, handle);
    WEBSOCKET_CONNECTIONS.lock().unwrap().insert(connection_id.to_string(), connection);

    Ok(())
}

#[tauri::command]
pub async fn fetch_live_data(api_url: String) -> Result<TennisLiveData, String> {
    println!("📡 [LIVE_DATA] Fetching live data for URL: {}", api_url.replace("token=", "token=[HIDDEN]"));
    println!("📡 [LIVE_DATA] Full URL: {}", api_url);

    // Check if we have cached data first
    {
        let cache = LIVE_DATA_CACHE.lock().unwrap();
        if let Some(data) = cache.get(&api_url) {
            return Ok(data.clone());
        }
    }

    // For mock URLs, return mock data
    if api_url.contains("mock") {
        return Ok(create_mock_tennis_data());
    }

    // For WebSocket URLs, establish WebSocket connection
    if api_url.starts_with("wss://") || api_url.starts_with("ws://") {
        // Extract connection ID from URL or use the full URL as ID
        let connection_id = api_url.clone();

        println!("🔗 [LIVE_DATA] WebSocket URL detected: {}", api_url.replace("token=", "token=[HIDDEN]"));
        println!("🔗 [LIVE_DATA] Using connection ID: {}", connection_id.replace("token=", "token=[HIDDEN]"));

        // Check if we already have a connection
        if !WEBSOCKET_CONNECTIONS.lock().unwrap().contains_key(&connection_id) {
            println!("🔌 [LIVE_DATA] Establishing new WebSocket connection...");
            connect_websocket(&api_url, &connection_id).await?;
        } else {
            println!("🔌 [LIVE_DATA] WebSocket connection already exists");
        }

        // Wait a bit for data to arrive, then return cached data
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        let cache = LIVE_DATA_CACHE.lock().unwrap();
        if let Some(data) = cache.get(&connection_id) {
            return Ok(data.clone());
        } else {
            // Return mock data as fallback
            return Ok(create_mock_tennis_data());
        }
    }

    // Fallback to HTTP request for other URLs
    let client = reqwest::Client::new();

    let response = client
        .get(&api_url)
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
pub async fn test_api_connection(api_url: String) -> Result<bool, String> {
    // For WebSocket URLs, test WebSocket connection
    if api_url.starts_with("wss://") || api_url.starts_with("ws://") {
        match connect_websocket(&api_url, "test_connection").await {
            Ok(_) => {
                // Clean up the test connection
                if let Some(connection) = WEBSOCKET_CONNECTIONS.lock().unwrap().remove("test_connection") {
                    connection.handle.abort();
                }
                return Ok(true);
            }
            Err(e) => {
                println!("WebSocket connection test failed: {}", e);
                return Ok(false);
            }
        }
    }

    // For non-WebSocket URLs, return false (we only support WebSocket now)
    println!("Connection test failed: Only WebSocket URLs (wss:// or ws://) are supported");
    Ok(false)
}

#[tauri::command]
pub async fn get_available_scoreboards(api_url: String) -> Result<Vec<ScoreboardInfo>, String> {
    // For WebSocket URLs, return the default IonCourt scoreboard
    if api_url.starts_with("wss://") || api_url.starts_with("ws://") {
        return Ok(vec![
            ScoreboardInfo {
                id: "ioncourt-main".to_string(),
                name: "IonCourt Live Scoreboard".to_string(),
            },
        ]);
    }

    // For non-WebSocket URLs, return an error (we only support WebSocket now)
    Err("Only WebSocket URLs are supported. Please use a URL starting with wss:// or ws://".to_string())
}

#[tauri::command]
pub async fn inspect_live_data() -> Result<String, String> {
    let cache = LIVE_DATA_CACHE.lock().unwrap();

    if cache.is_empty() {
        return Ok("No live data in cache".to_string());
    }

    let mut result = String::new();
    result.push_str("🎾 Current Live Data Cache:\n");
    result.push_str("==============================\n\n");

    for (connection_id, data) in cache.iter() {
        result.push_str(&format!("Connection: {}\n", connection_id));
        result.push_str(&format!("Match ID: {}\n", data.match_id));
        result.push_str(&format!("Match Status: {}\n", data.match_status));

        result.push_str(&format!("Player 1: {}\n", data.player1.name));
        result.push_str(&format!("Player 2: {}\n", data.player2.name));

        result.push_str(&format!("Score: {}-{} (Games: {}-{}, Points: {}-{})\n",
            data.score.player1_sets, data.score.player2_sets,
            data.score.player1_games, data.score.player2_games,
            data.score.player1_points, data.score.player2_points));

        result.push_str(&format!("Serving Player: {}\n", data.serving_player.unwrap_or(1)));
        result.push_str(&format!("Current Set: {}\n", data.current_set));
        result.push_str(&format!("Is Tiebreak: {}\n", data.is_tiebreak));

        result.push_str("\n");
    }

    Ok(result)
}

#[tauri::command]
pub fn check_websocket_status() -> Result<String, String> {
    let connections = WEBSOCKET_CONNECTIONS.lock().unwrap();
    let cache = LIVE_DATA_CACHE.lock().unwrap();

    let connection_count = connections.len();
    let data_entries = cache.len();

    let mut result = format!("🔌 WebSocket Status Report:\n");
    result.push_str(&format!("📊 Active connections: {}\n", connection_count));
    result.push_str(&format!("💾 Cached data entries: {}\n", data_entries));

    if connection_count > 0 {
        result.push_str(&format!("✅ WebSocket is CONNECTED and ACTIVE\n"));
        result.push_str(&format!("🎾 Ready to receive IonCourt live data\n"));
    } else {
        result.push_str(&format!("❌ No active WebSocket connections\n"));
        result.push_str(&format!("🔄 Please reconnect to IonCourt\n"));
    }

    println!("🔍 WebSocket status check requested");
    println!("📊 Connections: {}, Data entries: {}", connection_count, data_entries);

    Ok(result)
}

#[tauri::command]
pub async fn test_websocket_connection(ws_url: String) -> Result<String, String> {
    println!("🧪 Testing IonCourt WebSocket connection...");
    println!("🔗 Test URL: {}", ws_url.replace("token=", "token=[HIDDEN]"));
    println!("🔗 Full test URL: {}", ws_url);
    println!("🚀 Starting WebSocket test connection...");

    // Try to establish connection
    match connect_websocket(&ws_url, "test_connection").await {
        Ok(_) => {
            println!("✅ Test connection successful!");
            println!("🎉 IonCourt WebSocket is working correctly");
            println!("📊 You should see heartbeat messages and match data when available");
            Ok("WebSocket test successful! Connection established.".to_string())
        }
        Err(e) => {
            println!("❌ Test connection failed: {}", e);
            println!("🔍 Check your WebSocket URL and network connection");
            Err(format!("WebSocket test failed: {}", e))
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoreboardInfo {
    pub id: String,
    pub name: String,
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
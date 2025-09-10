// src-tauri/src/commands/live_data.rs
use serde::{Deserialize, Serialize};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use tokio_tungstenite::WebSocketStream;
use tokio_tungstenite::MaybeTlsStream;
use tokio::net::TcpStream;
use futures_util::{SinkExt, StreamExt};
use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashMap;

type WebSocketConnection = WebSocketStream<MaybeTlsStream<TcpStream>>;

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

// Global state for WebSocket connections
lazy_static::lazy_static! {
    static ref WEBSOCKET_CONNECTIONS: Arc<Mutex<HashMap<String, WebSocketConnection>>> = Arc::new(Mutex::new(HashMap::new()));
    static ref MESSAGE_LISTENERS: Arc<Mutex<HashMap<String, tokio::task::JoinHandle<()>>>> = Arc::new(Mutex::new(HashMap::new()));
    static ref LATEST_IONCOURT_DATA: Arc<Mutex<Option<serde_json::Value>>> = Arc::new(Mutex::new(None));
    static ref CONNECTION_COURT_FILTERS: Arc<Mutex<HashMap<String, Option<String>>>> = Arc::new(Mutex::new(HashMap::new()));
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

#[tauri::command]
pub async fn connect_websocket(ws_url: String, connection_id: String, court_filter: Option<String>) -> Result<String, String> {
    println!("Attempting to connect to WebSocket: {}", ws_url);

    // Ensure URL starts with wss://
    let ws_url = if ws_url.starts_with("ws://") {
        ws_url.replace("ws://", "wss://")
    } else if !ws_url.starts_with("wss://") {
        format!("wss://{}", ws_url)
    } else {
        ws_url
    };

    // Validate the WebSocket URL by parsing it
    let _url = url::Url::parse(&ws_url)
        .map_err(|e| format!("Invalid WebSocket URL: {}", e))?;

    // Attempt to connect using the URL string directly
    match connect_async(&ws_url).await {
        Ok((ws_stream, _)) => {
            println!("Successfully connected to WebSocket: {}", ws_url);

            // Store the connection
            let mut connections = WEBSOCKET_CONNECTIONS.lock().await;
            connections.insert(connection_id.clone(), ws_stream);

            // Store the court filter for this connection
            let mut court_filters = CONNECTION_COURT_FILTERS.lock().await;
            court_filters.insert(connection_id.clone(), court_filter.clone());

            if let Some(court) = &court_filter {
                println!("🎾 [WEBSOCKET {}] Court filter set to: {}", connection_id, court);
            } else {
                println!("🎾 [WEBSOCKET {}] No court filter set - listening to all matches", connection_id);
            }

            Ok(format!("Connected to WebSocket: {}", ws_url))
        }
        Err(e) => {
            let error_msg = format!("Failed to connect to WebSocket: {}", e);
            println!("{}", error_msg);
            Err(error_msg)
        }
    }
}

#[tauri::command]
pub async fn disconnect_websocket(connection_id: String) -> Result<String, String> {
    println!("Disconnecting WebSocket connection: {}", connection_id);

    let mut connections = WEBSOCKET_CONNECTIONS.lock().await;

    if let Some(mut ws_stream) = connections.remove(&connection_id) {
        // Send close frame and close the connection
        let _ = ws_stream.close(None).await;

        // Clean up court filter
        let mut court_filters = CONNECTION_COURT_FILTERS.lock().await;
        court_filters.remove(&connection_id);

        Ok(format!("Disconnected WebSocket connection: {}", connection_id))
    } else {
        Err(format!("No WebSocket connection found with ID: {}", connection_id))
    }
}

#[tauri::command]
pub async fn start_websocket_listener(connection_id: String) -> Result<String, String> {
    println!("🚀 Starting WebSocket message listener for: {}", connection_id);

    // Check if we already have a listener for this connection
    let mut listeners = MESSAGE_LISTENERS.lock().await;
    if listeners.contains_key(&connection_id) {
        return Ok(format!("Listener already running for WebSocket: {}", connection_id));
    }

    // Check if the connection exists
    let connections = WEBSOCKET_CONNECTIONS.lock().await;
    if !connections.contains_key(&connection_id) {
        return Err(format!("No WebSocket connection found with ID: {}", connection_id));
    }
    drop(connections);

    // Start the listener task
    let connection_id_clone = connection_id.clone();
    let listener_handle = tokio::spawn(async move {
        println!("📡 WebSocket listener started for: {}", connection_id_clone);

        loop {
            let mut connections = WEBSOCKET_CONNECTIONS.lock().await;

            if let Some(ws_stream) = connections.get_mut(&connection_id_clone) {
                // Try to receive a message
                match ws_stream.next().await {
                    Some(message_result) => {
                        match message_result {
                            Ok(message) => {
                                match message {
                                    Message::Text(text) => {
                                        println!("📨 [WEBSOCKET {}] Received TEXT message: {}", connection_id_clone, text);

                                        // Try to parse IonCourt JSON format
                                        if let Ok(parsed_message) = serde_json::from_str::<serde_json::Value>(&text) {
                                            if let Some(message_type) = parsed_message.get("type") {
                                                if message_type == "MATCH" {
                                                    if let Some(match_data) = parsed_message.get("data") {
                                                        // Check court filter for this connection
                                                        let court_filters = CONNECTION_COURT_FILTERS.lock().await;
                                                        let should_process = if let Some(court_filter) = court_filters.get(&connection_id_clone) {
                                                            match court_filter {
                                                                Some(court_name) => {
                                                                    // Check if the match is for the specified court
                                                                    if let Some(match_court) = match_data.get("court") {
                                                                        if let Some(court_str) = match_court.as_str() {
                                                                            court_str == court_name
                                                                        } else {
                                                                            false
                                                                        }
                                                                    } else {
                                                                        false
                                                                    }
                                                                }
                                                                None => true, // No filter set, process all matches
                                                            }
                                                        } else {
                                                            true // No filter configured, process all matches
                                                        };

                                                        if should_process {
                                                            println!("🎾 [WEBSOCKET {}] Processing IonCourt MATCH message", connection_id_clone);

                                                            // Store the latest match data
                                                            let mut latest_data = LATEST_IONCOURT_DATA.lock().await;
                                                            *latest_data = Some(match_data.clone());

                                                            if let Some(court_filter) = court_filters.get(&connection_id_clone) {
                                                                if let Some(court_name) = court_filter {
                                                                    println!("🎾 [WEBSOCKET {}] Match for court '{}' stored", connection_id_clone, court_name);
                                                                } else {
                                                                    println!("🎾 [WEBSOCKET {}] Match data stored (no court filter)", connection_id_clone);
                                                                }
                                                            }
                                                        } else {
                                                            println!("🎾 [WEBSOCKET {}] Ignoring MATCH message - not for filtered court", connection_id_clone);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    Message::Binary(data) => {
                                        println!("📨 [WEBSOCKET {}] Received BINARY message: {} bytes", connection_id_clone, data.len());
                                    }
                                    Message::Ping(payload) => {
                                        println!("🏓 [WEBSOCKET {}] Received PING: {} bytes", connection_id_clone, payload.len());
                                    }
                                    Message::Pong(payload) => {
                                        println!("🏓 [WEBSOCKET {}] Received PONG: {} bytes", connection_id_clone, payload.len());
                                    }
                                    Message::Close(close_frame) => {
                                        if let Some(frame) = close_frame {
                                            println!("🔌 [WEBSOCKET {}] Connection closed: Code={}, Reason={}",
                                                connection_id_clone,
                                                frame.code,
                                                frame.reason
                                            );
                                        } else {
                                            println!("🔌 [WEBSOCKET {}] Connection closed (no close frame)", connection_id_clone);
                                        }
                                        break;
                                    }
                                    Message::Frame(frame) => {
                                        println!("📋 [WEBSOCKET {}] Received FRAME: {:?}", connection_id_clone, frame);
                                    }
                                }
                            }
                            Err(e) => {
                                println!("❌ [WEBSOCKET {}] Error receiving message: {}", connection_id_clone, e);
                                break;
                            }
                        }
                    }
                    None => {
                        println!("🔚 [WEBSOCKET {}] Message stream ended", connection_id_clone);
                        break;
                    }
                }
            } else {
                println!("⚠️ [WEBSOCKET {}] Connection no longer exists, stopping listener", connection_id_clone);
                break;
            }

            drop(connections);
        }

        println!("🛑 WebSocket listener stopped for: {}", connection_id_clone);
    });

    listeners.insert(connection_id.clone(), listener_handle);

    Ok(format!("Started WebSocket message listener for: {}", connection_id))
}

#[tauri::command]
pub async fn get_latest_ioncourt_data() -> Result<Option<serde_json::Value>, String> {
    println!("🎾 Retrieving latest IonCourt match data");
    let latest_data = LATEST_IONCOURT_DATA.lock().await;
    Ok(latest_data.clone())
}

#[tauri::command]
pub async fn stop_websocket_listener(connection_id: String) -> Result<String, String> {
    println!("🛑 Stopping WebSocket message listener for: {}", connection_id);

    let mut listeners = MESSAGE_LISTENERS.lock().await;

    if let Some(handle) = listeners.remove(&connection_id) {
        handle.abort();
        Ok(format!("Stopped WebSocket message listener for: {}", connection_id))
    } else {
        Err(format!("No message listener found for WebSocket: {}", connection_id))
    }
}

#[tauri::command]
pub async fn send_websocket_message(connection_id: String, message: String) -> Result<String, String> {
    println!("Sending message to WebSocket {}: {}", connection_id, message);

    let mut connections = WEBSOCKET_CONNECTIONS.lock().await;

    if let Some(ws_stream) = connections.get_mut(&connection_id) {
        ws_stream.send(Message::Text(message.clone().into())).await
            .map_err(|e| format!("Failed to send message: {}", e))?;

        Ok(format!("Message sent to {}: {}", connection_id, message))
    } else {
        Err(format!("No WebSocket connection found with ID: {}", connection_id))
    }
}

#[tauri::command]
pub async fn test_websocket_connection(ws_url: String) -> Result<bool, String> {
    println!("Testing WebSocket connection to: {}", ws_url);

    // Ensure URL starts with wss://
    let ws_url = if ws_url.starts_with("ws://") {
        ws_url.replace("ws://", "wss://")
    } else if !ws_url.starts_with("wss://") {
        format!("wss://{}", ws_url)
    } else {
        ws_url
    };

    // Validate the WebSocket URL by parsing it
    let _url = url::Url::parse(&ws_url)
        .map_err(|e| format!("Invalid WebSocket URL: {}", e))?;

    // Attempt to connect with a timeout
    match tokio::time::timeout(
        std::time::Duration::from_secs(10),
        connect_async(&ws_url)
    ).await {
        Ok(Ok((mut ws_stream, _))) => {
            println!("WebSocket test successful: {}", ws_url);

            // Send a close frame to cleanly disconnect
            let _ = ws_stream.close(None).await;

            Ok(true)
        }
        Ok(Err(e)) => {
            let error_msg = format!("WebSocket test failed: {}", e);
            println!("{}", error_msg);
            Err(error_msg)
        }
        Err(_) => {
            let error_msg = "WebSocket test timed out after 10 seconds".to_string();
            println!("{}", error_msg);
            Err(error_msg)
        }
    }
}

#[tauri::command]
pub async fn fetch_live_data(api_url: String, _api_key: String) -> Result<TennisLiveData, String> {
    // For now, return mock data if the URL contains "mock"
    if api_url.contains("mock") {
        return Ok(create_mock_tennis_data());
    }

    // TODO: Implement WebSocket-based data fetching
    // This could send a request over WebSocket and wait for response
    Err("WebSocket-based data fetching not yet implemented".to_string())
}

#[tauri::command]
pub async fn get_available_scoreboards(api_url: String, _api_key: String) -> Result<Vec<ScoreboardInfo>, String> {
    // For mock URLs, return sample scoreboards
    if api_url.contains("mock") {
        return Ok(vec![
            ScoreboardInfo {
                id: "test-1".to_string(),
                name: "Test Court 1".to_string(),
            },
            ScoreboardInfo {
                id: "test-2".to_string(),
                name: "Test Court 2".to_string(),
            },
            ScoreboardInfo {
                id: "stadium".to_string(),
                name: "Main Stadium".to_string(),
            },
        ]);
    }

    // TODO: Implement WebSocket-based scoreboard fetching
    Err("WebSocket-based scoreboard fetching not yet implemented".to_string())
}

#[tauri::command]
pub async fn test_api_connection(_api_url: String, _api_key: String) -> Result<bool, String> {
    // For now, always return true for backward compatibility
    // TODO: Implement actual API connection testing
    Ok(true)
}

#[tauri::command]
pub async fn inspect_live_data() -> Result<String, String> {
    let connections = WEBSOCKET_CONNECTIONS.lock().await;
    let connection_count = connections.len();

    Ok(format!("Active WebSocket connections: {}", connection_count))
}

#[tauri::command]
pub async fn check_websocket_status(connection_id: String) -> Result<String, String> {
    let connections = WEBSOCKET_CONNECTIONS.lock().await;

    if connections.contains_key(&connection_id) {
        Ok(format!("WebSocket connection '{}' is active", connection_id))
    } else {
        Ok(format!("WebSocket connection '{}' is not active", connection_id))
    }
}


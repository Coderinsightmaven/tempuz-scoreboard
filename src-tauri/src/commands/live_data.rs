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
    static ref LATEST_DATA_BY_COURT: Arc<Mutex<HashMap<String, serde_json::Value>>> = Arc::new(Mutex::new(HashMap::new()));
    static ref LAST_DATA_UPDATE: Arc<Mutex<std::collections::HashMap<String, std::time::Instant>>> = Arc::new(Mutex::new(std::collections::HashMap::new()));
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
pub async fn connect_websocket(ws_url: String, connection_id: String, _court_filter: Option<String>) -> Result<String, String> {
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

            // Single connection receives all court data
            println!("🎾 [WEBSOCKET {}] Single connection established - will receive data from all courts", connection_id);

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

        // Note: With single connection approach, data by court is preserved
        // No need to clean up court-specific data on disconnect

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
                                                        // Single connection - always process all matches
                                                        println!("🎾 [WEBSOCKET {}] Processing IonCourt MATCH message", connection_id_clone);

                                                        // Extract court name from match data
                                                        if let Some(court_name) = match_data.get("court") {
                                                            if let Some(court_str) = court_name.as_str() {
                                                                // Validate court name is not empty
                                                                if court_str.trim().is_empty() {
                                                                    println!("⚠️ [WEBSOCKET {}] Received empty court name, skipping", connection_id_clone);
                                                                    continue;
                                                                }

                                                                println!("🎾 [WEBSOCKET {}] Storing match data for court '{}'", connection_id_clone, court_str);

                                                                // Store the latest match data by court name
                                                                let mut latest_data_by_court = LATEST_DATA_BY_COURT.lock().await;
                                                                latest_data_by_court.insert(court_str.to_string(), match_data.clone());

                                                                // Track last update time for cleanup
                                                                let mut last_update = LAST_DATA_UPDATE.lock().await;
                                                                last_update.insert(court_str.to_string(), std::time::Instant::now());

                                                                // Periodic cleanup of old data (every 100 messages)
                                                                if latest_data_by_court.len() % 100 == 0 {
                                                                    cleanup_old_data().await;
                                                                }
                                                            }
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
                                        println!("🔄 [WEBSOCKET {}] Attempting to reconnect in 5 seconds...", connection_id_clone);
                                        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

                                        // Attempt reconnection
                                        match attempt_reconnection(&connection_id_clone).await {
                                            Ok(_) => {
                                                println!("✅ [WEBSOCKET {}] Reconnection successful, continuing...", connection_id_clone);
                                                continue;
                                            }
                                            Err(e) => {
                                                println!("❌ [WEBSOCKET {}] Reconnection failed: {}, giving up", connection_id_clone, e);
                                                break;
                                            }
                                        }
                                    }
                                    Message::Frame(frame) => {
                                        println!("📋 [WEBSOCKET {}] Received FRAME: {:?}", connection_id_clone, frame);
                                    }
                                }
                            }
                            Err(e) => {
                                println!("❌ [WEBSOCKET {}] Error receiving message: {}", connection_id_clone, e);

                                // Attempt to reconnect after network errors
                                println!("🔄 [WEBSOCKET {}] Network error detected, attempting to reconnect in 3 seconds...", connection_id_clone);
                                tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

                                match attempt_reconnection(&connection_id_clone).await {
                                    Ok(_) => {
                                        println!("✅ [WEBSOCKET {}] Reconnection successful after network error", connection_id_clone);
                                        continue;
                                    }
                                    Err(reconnect_err) => {
                                        println!("❌ [WEBSOCKET {}] Reconnection failed after network error: {}", connection_id_clone, reconnect_err);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    None => {
                        println!("🔚 [WEBSOCKET {}] Message stream ended", connection_id_clone);

                        // Attempt to reconnect when stream ends
                        println!("🔄 [WEBSOCKET {}] Stream ended, attempting to reconnect in 2 seconds...", connection_id_clone);
                        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

                        match attempt_reconnection(&connection_id_clone).await {
                            Ok(_) => {
                                println!("✅ [WEBSOCKET {}] Reconnection successful after stream ended", connection_id_clone);
                                continue;
                            }
                            Err(reconnect_err) => {
                                println!("❌ [WEBSOCKET {}] Reconnection failed after stream ended: {}", connection_id_clone, reconnect_err);
                                break;
                            }
                        }
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

async fn cleanup_old_data() {
    println!("🧹 Running automatic cleanup of old court data");
    let mut latest_data_by_court = LATEST_DATA_BY_COURT.lock().await;
    let mut last_update = LAST_DATA_UPDATE.lock().await;

    let now = std::time::Instant::now();
    let timeout_duration = std::time::Duration::from_secs(300); // 5 minutes

    let mut courts_to_remove = Vec::new();

    for (court_name, last_update_time) in last_update.iter() {
        if now.duration_since(*last_update_time) > timeout_duration {
            courts_to_remove.push(court_name.clone());
        }
    }

    let removed_count = courts_to_remove.len();

    for court_name in courts_to_remove {
        latest_data_by_court.remove(&court_name);
        last_update.remove(&court_name);
        println!("🧹 Cleaned up old data for court: {}", court_name);
    }

    if removed_count > 0 {
        println!("🧹 Data cleanup completed. Removed {} old court entries (5+ minute timeout)", removed_count);
    } else {
        println!("✅ No old court data to clean up (5-minute timeout)");
    }
}

async fn attempt_reconnection(connection_id: &str) -> Result<(), String> {
    println!("🔄 [WEBSOCKET {}] Attempting reconnection...", connection_id);

    // For now, we'll use the default IonCourt WebSocket URL
    // In a production system, this should be configurable
    let ws_url = "wss://sub.ioncourt.com/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXJ0bmVyX25hbWUiOiJiYXR0bGUtaW4tYmF5IiwiZXhwaXJ5IjoiMjAyNS0xMC0xMFQwMzo1OTo1OS45OTlaIiwidXNlcklkIjoiNWQ4OTVmZThjNzhhNWFhNTk4OThhOGIxIiwidG9rZW5JZCI6IjkxNTY5NjdmOTkzNjY2YTRjMTY0ZGQ0ZTllZWIyYTU0MGNiNGM3YTg5MGNlNmQwMTIzYTRkZjNiMWI3ZjdkOTAiLCJpYXQiOjE3NTc0MzY3ODEsImV4cCI6MTc2MDA2ODc5OX0.KaHcIiOKPnGl0oYwV8Iy0dHxRiUClnlV--jO2sAlwrE";

    // Ensure URL starts with wss://
    let ws_url = if ws_url.starts_with("ws://") {
        ws_url.replace("ws://", "wss://")
    } else if !ws_url.starts_with("wss://") {
        format!("wss://{}", ws_url)
    } else {
        ws_url.to_string()
    };

    // Attempt to connect
    match connect_async(&ws_url).await {
        Ok((ws_stream, _)) => {
            println!("✅ [WEBSOCKET {}] Reconnection successful: {}", connection_id, ws_url);

            // Store the new connection
            let mut connections = WEBSOCKET_CONNECTIONS.lock().await;
            connections.insert(connection_id.to_string(), ws_stream);

            Ok(())
        }
        Err(e) => {
            let error_msg = format!("Failed to reconnect to WebSocket: {}", e);
            println!("❌ [WEBSOCKET {}] {}", connection_id, error_msg);
            Err(error_msg)
        }
    }
}

#[tauri::command]
pub async fn get_latest_ioncourt_data_by_court(court_name: String) -> Result<Option<serde_json::Value>, String> {
    println!("🎾 Retrieving latest IonCourt match data for court: {}", court_name);
    let latest_data_by_court = LATEST_DATA_BY_COURT.lock().await;

    // Debug: Print all available courts
    println!("🎾 Available courts: {:?}", latest_data_by_court.keys().collect::<Vec<_>>());

    let data = latest_data_by_court.get(&court_name).cloned();
    if data.is_some() {
        println!("🎾 Found data for court: {}", court_name);
    } else {
        println!("🎾 No data found for court: {}", court_name);
    }
    Ok(data)
}

#[tauri::command]
pub async fn get_latest_ioncourt_data(_connection_id: String) -> Result<Option<serde_json::Value>, String> {
    // For backward compatibility, try to get data by connection ID first
    // If not found, return the first available court data
    println!("🎾 Retrieving latest IonCourt match data (legacy method)");
    let latest_data_by_court = LATEST_DATA_BY_COURT.lock().await;

    // Return the first available court data
    if let Some((court_name, data)) = latest_data_by_court.iter().next() {
        println!("🎾 Returning data for court: {}", court_name);
        Ok(Some(data.clone()))
    } else {
        println!("🎾 No court data available");
        Ok(None)
    }
}

#[tauri::command]
pub async fn get_active_court_data(active_courts: Vec<String>) -> Result<serde_json::Value, String> {
    println!("🎾 Retrieving active court data only ({} courts requested)", active_courts.len());
    let latest_data_by_court = LATEST_DATA_BY_COURT.lock().await;
    let last_update = LAST_DATA_UPDATE.lock().await;

    let now = std::time::Instant::now();
    let active_timeout = std::time::Duration::from_secs(300); // 5 minutes

    // Convert HashMap to JSON object, but only include active courts that are being displayed
    let mut result = serde_json::Map::new();
    let mut active_count = 0;

    // If active_courts list is provided, only include those courts
    if !active_courts.is_empty() {
        println!("🎯 Filtering for specific courts: {:?}", active_courts);
        for court_name in &active_courts {
            if let Some(data) = latest_data_by_court.get(court_name) {
                // Check if this court has been updated recently
                if let Some(&last_update_time) = last_update.get(court_name) {
                    if now.duration_since(last_update_time) <= active_timeout {
                        result.insert(court_name.clone(), data.clone());
                        active_count += 1;
                    } else {
                        println!("⏰ Skipping stale court '{}' (last update: {:.2?} ago)",
                            court_name,
                            now.duration_since(last_update_time));
                    }
                } else {
                    println!("⚠️  Skipping court '{}' with no update timestamp", court_name);
                }
            } else {
                println!("📭 No data available for requested court '{}'", court_name);
            }
        }
    } else {
        // Fallback to time-based filtering if no specific courts requested
        println!("⚠️  No active courts specified, falling back to time-based filtering");
        for (court_name, data) in latest_data_by_court.iter() {
            if let Some(&last_update_time) = last_update.get(court_name) {
                if now.duration_since(last_update_time) <= active_timeout {
                    result.insert(court_name.clone(), data.clone());
                    active_count += 1;
                } else {
                    println!("⏰ Skipping inactive court '{}' (last update: {:.2?} ago)",
                        court_name,
                        now.duration_since(last_update_time));
                }
            } else {
                println!("⚠️  Skipping court '{}' with no update timestamp", court_name);
            }
        }
    }

    println!("🎾 Returning data for {} active courts out of {} requested courts",
        active_count, active_courts.len().max(latest_data_by_court.len()));

    Ok(serde_json::Value::Object(result))
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

    let latest_data_by_court = LATEST_DATA_BY_COURT.lock().await;
    let court_count = latest_data_by_court.len();
    let court_names: Vec<&String> = latest_data_by_court.keys().collect();

    Ok(format!("Active WebSocket connections: {}, Stored courts: {} ({:?})", connection_count, court_count, court_names))
}

#[tauri::command]
pub async fn cleanup_live_data() -> Result<String, String> {
    println!("🧹 Manual data cleanup requested");
    cleanup_old_data().await;

    let latest_data_by_court = LATEST_DATA_BY_COURT.lock().await;
    let remaining_count = latest_data_by_court.len();

    Ok(format!("Data cleanup completed. {} court entries remaining", remaining_count))
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


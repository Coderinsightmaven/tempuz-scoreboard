// src-tauri/src/commands/scoreboard.rs
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameState {
    pub home_team: Team,
    pub away_team: Team,
    pub home_score: u32,
    pub away_score: u32,
    pub period: u32,
    pub time_remaining: String,
    pub is_game_active: bool,
    pub sport: String,
    pub metadata: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Team {
    pub id: String,
    pub name: String,
    pub abbreviation: Option<String>,
    pub logo_url: Option<String>,
    pub primary_color: Option<String>,
    pub secondary_color: Option<String>,
}

#[derive(Default)]
pub struct ScoreboardState {
    pub game_state: Arc<Mutex<Option<GameState>>>,
}

#[tauri::command]
pub async fn update_game_state(
    state: State<'_, ScoreboardState>,
    app: AppHandle,
    game_state: GameState,
) -> Result<(), String> {
    {
        let mut current_state = state.game_state.lock().map_err(|e| e.to_string())?;
        *current_state = Some(game_state.clone());
    }
    
    // Emit event to all windows
    app.emit("game_state_updated", &game_state)
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn get_game_state(
    state: State<'_, ScoreboardState>,
) -> Result<Option<GameState>, String> {
    let game_state = state.game_state.lock().map_err(|e| e.to_string())?;
    Ok(game_state.clone())
}

#[tauri::command]
pub async fn update_score(
    state: State<'_, ScoreboardState>,
    app: AppHandle,
    team: String, // "home" or "away"
    score: u32,
) -> Result<(), String> {
    {
        let mut current_state = state.game_state.lock().map_err(|e| e.to_string())?;
        if let Some(ref mut game_state) = *current_state {
            match team.as_str() {
                "home" => game_state.home_score = score,
                "away" => game_state.away_score = score,
                _ => return Err("Invalid team specified".to_string()),
            }
            
            // Emit score update event
            app.emit("score_updated", &*game_state)
                .map_err(|e| e.to_string())?;
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn update_time(
    state: State<'_, ScoreboardState>,
    app: AppHandle,
    time_remaining: String,
) -> Result<(), String> {
    {
        let mut current_state = state.game_state.lock().map_err(|e| e.to_string())?;
        if let Some(ref mut game_state) = *current_state {
            game_state.time_remaining = time_remaining;
            
            // Emit time update event
            app.emit("time_updated", &*game_state)
                .map_err(|e| e.to_string())?;
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn update_period(
    state: State<'_, ScoreboardState>,
    app: AppHandle,
    period: u32,
) -> Result<(), String> {
    {
        let mut current_state = state.game_state.lock().map_err(|e| e.to_string())?;
        if let Some(ref mut game_state) = *current_state {
            game_state.period = period;
            
            // Emit period update event
            app.emit("period_updated", &*game_state)
                .map_err(|e| e.to_string())?;
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn toggle_game_active(
    state: State<'_, ScoreboardState>,
    app: AppHandle,
) -> Result<bool, String> {
    let new_state = {
        let mut current_state = state.game_state.lock().map_err(|e| e.to_string())?;
        if let Some(ref mut game_state) = *current_state {
            game_state.is_game_active = !game_state.is_game_active;
            let new_state = game_state.is_game_active;
            
            // Emit game state change event
            app.emit("game_active_toggled", &*game_state)
                .map_err(|e| e.to_string())?;
            
            new_state
        } else {
            return Err("No game state available".to_string());
        }
    };
    
    Ok(new_state)
}

#[tauri::command]
pub async fn reset_game(
    state: State<'_, ScoreboardState>,
    app: AppHandle,
) -> Result<(), String> {
    {
        let mut current_state = state.game_state.lock().map_err(|e| e.to_string())?;
        if let Some(ref mut game_state) = *current_state {
            game_state.home_score = 0;
            game_state.away_score = 0;
            game_state.period = 1;
            game_state.time_remaining = "00:00".to_string();
            game_state.is_game_active = false;
            game_state.metadata.clear();
            
            // Emit reset event
            app.emit("game_reset", &*game_state)
                .map_err(|e| e.to_string())?;
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn update_team_info(
    state: State<'_, ScoreboardState>,
    app: AppHandle,
    team_side: String, // "home" or "away"
    team: Team,
) -> Result<(), String> {
    {
        let mut current_state = state.game_state.lock().map_err(|e| e.to_string())?;
        if let Some(ref mut game_state) = *current_state {
            match team_side.as_str() {
                "home" => game_state.home_team = team,
                "away" => game_state.away_team = team,
                _ => return Err("Invalid team side specified".to_string()),
            }
            
            // Emit team info update event
            app.emit("team_info_updated", &*game_state)
                .map_err(|e| e.to_string())?;
        }
    }
    
    Ok(())
} 
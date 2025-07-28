// src-tauri/src/commands/storage.rs
use tauri::{AppHandle, Manager};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoreboardConfig {
    pub id: String,
    pub name: String,
    pub data: serde_json::Value,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub async fn save_scoreboard(
    app: AppHandle,
    name: String,
    config: serde_json::Value,
) -> Result<String, String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;
    
    // Ensure the scoreboards directory exists
    let scoreboards_dir = app_data_dir.join("scoreboards");
    fs::create_dir_all(&scoreboards_dir).map_err(|e| e.to_string())?;
    
    // Generate unique ID and file path
    let id = uuid::Uuid::new_v4().to_string();
    let filename = format!("{}.json", sanitize_filename(&name));
    let file_path = scoreboards_dir.join(&filename);
    
    let now = chrono::Utc::now().to_rfc3339();
    let scoreboard_config = ScoreboardConfig {
        id: id.clone(),
        name,
        data: config,
        created_at: now.clone(),
        updated_at: now,
    };
    
    let json_data = serde_json::to_string_pretty(&scoreboard_config)
        .map_err(|e| e.to_string())?;
    
    fs::write(&file_path, json_data).map_err(|e| e.to_string())?;
    
    Ok(id)
}

#[tauri::command]
pub async fn load_scoreboard(
    app: AppHandle,
    filename: String,
) -> Result<ScoreboardConfig, String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;
    
    let file_path = app_data_dir.join("scoreboards").join(&filename);
    
    if !file_path.exists() {
        return Err("Scoreboard file not found".to_string());
    }
    
    let json_data = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let config: ScoreboardConfig = serde_json::from_str(&json_data)
        .map_err(|e| e.to_string())?;
    
    Ok(config)
}

#[tauri::command]
pub async fn list_scoreboards(app: AppHandle) -> Result<Vec<ScoreboardConfig>, String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;
    
    let scoreboards_dir = app_data_dir.join("scoreboards");
    
    if !scoreboards_dir.exists() {
        return Ok(vec![]);
    }
    
    let mut scoreboards = Vec::new();
    
    let entries = fs::read_dir(&scoreboards_dir).map_err(|e| e.to_string())?;
    
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        
        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            match fs::read_to_string(&path) {
                Ok(json_data) => {
                    match serde_json::from_str::<ScoreboardConfig>(&json_data) {
                        Ok(config) => scoreboards.push(config),
                        Err(_) => continue, // Skip invalid files
                    }
                }
                Err(_) => continue, // Skip unreadable files
            }
        }
    }
    
    // Sort by updated_at descending (most recent first)
    scoreboards.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    
    Ok(scoreboards)
}

#[tauri::command]
pub async fn delete_scoreboard(
    app: AppHandle,
    filename: String,
) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;
    
    let file_path = app_data_dir.join("scoreboards").join(&filename);
    
    if file_path.exists() {
        fs::remove_file(&file_path).map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn export_scoreboard(
    app: AppHandle,
    filename: String,
    export_path: String,
) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;
    
    let source_path = app_data_dir.join("scoreboards").join(&filename);
    let export_path = PathBuf::from(export_path);
    
    if !source_path.exists() {
        return Err("Scoreboard file not found".to_string());
    }
    
    fs::copy(&source_path, &export_path).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn import_scoreboard(
    app: AppHandle,
    import_path: String,
) -> Result<ScoreboardConfig, String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;
    
    let import_path = PathBuf::from(import_path);
    
    if !import_path.exists() {
        return Err("Import file not found".to_string());
    }
    
    let json_data = fs::read_to_string(&import_path).map_err(|e| e.to_string())?;
    let mut config: ScoreboardConfig = serde_json::from_str(&json_data)
        .map_err(|e| e.to_string())?;
    
    // Generate new ID and update timestamps
    config.id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    config.updated_at = now;
    
    // Save to app data directory
    let scoreboards_dir = app_data_dir.join("scoreboards");
    fs::create_dir_all(&scoreboards_dir).map_err(|e| e.to_string())?;
    
    let filename = format!("{}.json", sanitize_filename(&config.name));
    let file_path = scoreboards_dir.join(&filename);
    
    let json_data = serde_json::to_string_pretty(&config)
        .map_err(|e| e.to_string())?;
    
    fs::write(&file_path, json_data).map_err(|e| e.to_string())?;
    
    Ok(config)
}

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            _ => c,
        })
        .collect()
} 
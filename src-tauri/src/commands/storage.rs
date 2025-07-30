// src-tauri/src/commands/storage.rs
use tauri::{AppHandle, Manager};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoreboardConfig {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub filename: String,
    pub data: serde_json::Value,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub async fn save_scoreboard(
    app: AppHandle,
    name: String,
    data: serde_json::Value,
) -> Result<String, String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;
    
    let scoreboards_dir = app_data_dir.join("scoreboards");
    
    // Create directory if it doesn't exist
    if !scoreboards_dir.exists() {
        fs::create_dir_all(&scoreboards_dir).map_err(|e| e.to_string())?;
    }
    
    let filename = format!("{}.json", sanitize_filename(&name));
    let file_path = scoreboards_dir.join(&filename);
    
    let config = ScoreboardConfig {
        id: uuid::Uuid::new_v4().to_string(),
        name: name.clone(),
        filename: filename.clone(), // Store the actual filename used
        data,
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    };
    
    let json_data = serde_json::to_string_pretty(&config)
        .map_err(|e| e.to_string())?;
    
    fs::write(&file_path, json_data).map_err(|e| e.to_string())?;
    
    Ok(filename)
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
        
        // Only process .json files
        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            // Verify the file actually exists and is readable
            if !path.exists() {
                println!("Warning: Skipping non-existent file: {:?}", path);
                continue;
            }
            
            match fs::read_to_string(&path) {
                Ok(json_data) => {
                    match serde_json::from_str::<ScoreboardConfig>(&json_data) {
                        Ok(mut config) => {
                            // Handle legacy configs that might not have filename field
                            if config.filename.is_empty() {
                                if let Some(filename) = path.file_name().and_then(|s| s.to_str()) {
                                    config.filename = filename.to_string();
                                } else {
                                    println!("Warning: Could not determine filename for config");
                                    continue;
                                }
                            }
                            
                            // Double-check that the referenced file actually exists
                            let config_file_path = scoreboards_dir.join(&config.filename);
                            if config_file_path.exists() {
                                scoreboards.push(config);
                            } else {
                                println!("Warning: Config references non-existent file: {}", config.filename);
                            }
                        },
                        Err(e) => {
                            println!("Warning: Skipping invalid JSON file {:?}: {}", path, e);
                            continue;
                        }
                    }
                }
                Err(e) => {
                    println!("Warning: Could not read file {:?}: {}", path, e);
                    continue;
                }
            }
        }
    }
    
    println!("Returning {} valid scoreboards", scoreboards.len());
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
    
    if !file_path.exists() {
        return Err("Scoreboard file not found".to_string());
    }
    
    fs::remove_file(&file_path).map_err(|e| e.to_string())?;
    
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
            'a'..='z' | 'A'..='Z' | '0'..='9' | '-' | '_' => c,
            _ => '_',
        })
        .collect()
} 
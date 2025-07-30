// src-tauri/src/commands/monitor.rs
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder, AppHandle, State};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorInfo {
    pub id: u32,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub is_primary: bool,
    pub scale_factor: f64,
}

#[derive(Default)]
pub struct ScoreboardInstanceStore {
    pub instances: Arc<Mutex<HashMap<String, serde_json::Value>>>,
}

#[tauri::command]
pub async fn get_available_monitors(app: AppHandle) -> Result<Vec<MonitorInfo>, String> {
    let monitors = app.available_monitors()
        .map_err(|e| e.to_string())?;
    
    let monitor_info: Vec<MonitorInfo> = monitors
        .into_iter()
        .enumerate()
        .map(|(id, monitor)| MonitorInfo {
            id: id as u32,
            name: monitor.name().map_or_else(|| "Unknown Monitor".to_string(), |n| n.clone()),
            width: monitor.size().width,
            height: monitor.size().height,
            x: monitor.position().x,
            y: monitor.position().y,
            is_primary: false, // Note: Tauri doesn't provide primary monitor info directly
            scale_factor: monitor.scale_factor(),
        })
        .collect();
    
    Ok(monitor_info)
}

#[tauri::command]
pub async fn create_scoreboard_window(
    app: AppHandle,
    store: State<'_, ScoreboardInstanceStore>,
    window_id: String,
    _monitor_id: u32,
    width: u32,
    height: u32,
    x: i32,
    y: i32,
    offset_x: i32,
    offset_y: i32,
    scoreboard_data: Option<serde_json::Value>,
) -> Result<(), String> {
    // Calculate final position with offset
    let final_x = x + offset_x;
    let final_y = y + offset_y;

    // Store the scoreboard data for this window
    if let Some(data) = scoreboard_data {
        let mut instances = store.instances.lock().map_err(|e| e.to_string())?;
        instances.insert(window_id.clone(), data);
    }

    let _window = WebviewWindowBuilder::new(
        &app,
        window_id,
        WebviewUrl::App("scoreboard.html".into()),
    )
    .title("Scoreboard Display")
    .inner_size(width as f64, height as f64)
    .position(final_x as f64, final_y as f64)
    .resizable(true)
    .decorations(false)
    .always_on_top(true)
    .visible(true)
    .build()
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn close_scoreboard_window(app: AppHandle, window_id: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&window_id) {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn close_all_scoreboard_windows(app: AppHandle) -> Result<(), String> {
    // Get all windows and close those that start with "scoreboard_"
    let windows = app.webview_windows();
    for (label, window) in windows {
        if label.starts_with("scoreboard_") {
            window.close().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn update_scoreboard_window_position(
    app: AppHandle,
    window_id: String,
    x: i32,
    y: i32,
    offset_x: i32,
    offset_y: i32,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&window_id) {
        let final_x = x + offset_x;
        let final_y = y + offset_y;
        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { 
            x: final_x, 
            y: final_y 
        }))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn update_scoreboard_window_size(
    app: AppHandle,
    window_id: String,
    width: u32,
    height: u32,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&window_id) {
        window.set_size(tauri::Size::Physical(tauri::PhysicalSize { width, height }))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn toggle_scoreboard_fullscreen(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("scoreboard") {
        let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
        window.set_fullscreen(!is_fullscreen).map_err(|e| e.to_string())?;
    }
    Ok(())
} 

#[tauri::command]
pub async fn list_scoreboard_windows(app: AppHandle) -> Result<Vec<String>, String> {
    let windows = app.webview_windows();
    let scoreboard_windows: Vec<String> = windows
        .keys()
        .filter(|label| label.starts_with("scoreboard_"))
        .cloned()
        .collect();
    Ok(scoreboard_windows)
} 

#[tauri::command]
pub async fn get_scoreboard_instance_data(
    store: State<'_, ScoreboardInstanceStore>,
    window_id: String,
) -> Result<Option<serde_json::Value>, String> {
    let instances = store.instances.lock().map_err(|e| e.to_string())?;
    Ok(instances.get(&window_id).cloned())
} 
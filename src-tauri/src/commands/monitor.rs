// src-tauri/src/commands/monitor.rs
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder, AppHandle};
use serde::{Deserialize, Serialize};

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
    _monitor_id: u32,
    width: u32,
    height: u32,
    x: i32,
    y: i32,
) -> Result<(), String> {
    // Close existing scoreboard window if it exists
    if let Some(window) = app.get_webview_window("scoreboard") {
        window.close().map_err(|e| e.to_string())?;
    }

    let _window = WebviewWindowBuilder::new(
        &app,
        "scoreboard",
        WebviewUrl::App("scoreboard.html".into()),
    )
    .title("Scoreboard Display")
    .inner_size(width as f64, height as f64)
    .position(x as f64, y as f64)
    .resizable(true)
    .decorations(false)
    .always_on_top(true)
    .visible(true)
    .build()
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn close_scoreboard_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("scoreboard") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn update_scoreboard_window_position(
    app: AppHandle,
    x: i32,
    y: i32,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("scoreboard") {
        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn update_scoreboard_window_size(
    app: AppHandle,
    width: u32,
    height: u32,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("scoreboard") {
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
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
    pub work_area_width: u32,
    pub work_area_height: u32,
    pub work_area_x: i32,
    pub work_area_y: i32,
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
        .map(|(id, monitor)| {
            let position = monitor.position();
            let size = monitor.size();
            // On macOS, the primary monitor is usually at (0,0) or the first monitor
            // We'll consider the first monitor OR any monitor at (0,0) as primary
            let is_primary = id == 0 || (position.x == 0 && position.y == 0);
            
            // Calculate work area (excluding menu bar and dock)
            // On macOS, the menu bar is typically 24-28 pixels high (scaled)
            let menu_bar_height = if is_primary { (28.0 * monitor.scale_factor()) as u32 } else { 0 };
            let dock_height = if is_primary { (80.0 * monitor.scale_factor()) as u32 } else { 0 }; // Estimate for dock
            
            let work_area_width = size.width;
            let work_area_height = size.height.saturating_sub(menu_bar_height).saturating_sub(dock_height);
            let work_area_x = position.x;
            let work_area_y = position.y + menu_bar_height as i32;
            
            MonitorInfo {
                id: id as u32,
                name: monitor.name().map_or_else(|| format!("Display {}", id + 1), |n| n.clone()),
                width: size.width,
                height: size.height,
                x: position.x,
                y: position.y,
                is_primary,
                scale_factor: monitor.scale_factor(),
                work_area_width,
                work_area_height,
                work_area_x,
                work_area_y,
            }
        })
        .collect();
    
    Ok(monitor_info)
}

#[tauri::command]
pub async fn create_scoreboard_window(
    app: AppHandle,
    store: State<'_, ScoreboardInstanceStore>,
    window_id: String,
    monitor_id: u32,
    width: u32,
    height: u32,
    _x: i32,
    _y: i32,
    offset_x: i32,
    offset_y: i32,
    scoreboard_data: Option<serde_json::Value>,
) -> Result<(), String> {
    // Get fresh monitor info to determine if we should use fullscreen
    let monitors = app.available_monitors().map_err(|e| e.to_string())?;
    let monitor_list: Vec<_> = monitors.into_iter().collect();
    
    // Debug logging
    println!("Creating scoreboard window:");
    println!("  Requested monitor_id: {}", monitor_id);
    println!("  Available monitors: {}", monitor_list.len());
    for (i, monitor) in monitor_list.iter().enumerate() {
        let monitor_name = monitor.name().map_or("Unknown".to_string(), |n| n.clone());
        println!("    Monitor {}: {} at ({}, {})", i, 
                monitor_name, 
                monitor.position().x, monitor.position().y);
    }
    
    let target_monitor = monitor_list.into_iter().nth(monitor_id as usize);
    
    // Store the scoreboard data for this window
    if let Some(data) = scoreboard_data {
        let mut instances = store.instances.lock().map_err(|e| e.to_string())?;
        instances.insert(window_id.clone(), data);
    }

    // Create window in windowed mode first, then move to target monitor and set fullscreen
    let window = WebviewWindowBuilder::new(
        &app,
        window_id.clone(),
        WebviewUrl::App("scoreboard.html".into()),
    )
    .title("Scoreboard Display")
    .resizable(false) // Disable resizing for fullscreen scoreboard
    .decorations(false) // Remove window decorations
    .always_on_top(true) // Keep on top
    .visible(false) // Start hidden, then show after positioning
    .skip_taskbar(true) // Hide from taskbar/dock
    .fullscreen(false) // Start in windowed mode, then set fullscreen after positioning
    .inner_size(width as f64, height as f64) // Set initial size
    .build()
    .map_err(|e| e.to_string())?;

    // Position the window on the target monitor first
    if let Some(monitor) = target_monitor {
        let monitor_x = monitor.position().x;
        let monitor_y = monitor.position().y;
        let final_x = monitor_x + offset_x;
        let final_y = monitor_y + offset_y;
        
        println!("  Target monitor position: ({}, {})", monitor_x, monitor_y);
        println!("  Offsets: ({}, {})", offset_x, offset_y);
        println!("  Final position: ({}, {})", final_x, final_y);
        
        // Move to target monitor before setting fullscreen
        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { 
            x: final_x, 
            y: final_y 
        })).map_err(|e| e.to_string())?;
        
        // Small delay to ensure positioning takes effect
        std::thread::sleep(std::time::Duration::from_millis(200));
        
        println!("  Window positioned, setting fullscreen...");
    } else {
        println!("  Warning: No target monitor found for ID {}", monitor_id);
    }
    
    // Show the window first in windowed mode on the target monitor
    window.show().map_err(|e| e.to_string())?;
    
    // Additional delay to ensure window is fully positioned and shown
    std::thread::sleep(std::time::Duration::from_millis(300));
    
    // Now set fullscreen - this will make it fullscreen on the monitor where it's positioned
    println!("  Setting fullscreen...");
    window.set_fullscreen(true).map_err(|e| e.to_string())?;
    
    println!("  Scoreboard window created and shown in fullscreen");
    
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
pub async fn toggle_scoreboard_fullscreen(app: AppHandle, window_id: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&window_id) {
        let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
        window.set_fullscreen(!is_fullscreen).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn set_scoreboard_fullscreen(app: AppHandle, window_id: String, fullscreen: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&window_id) {
        window.set_fullscreen(fullscreen).map_err(|e| e.to_string())?;
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

 
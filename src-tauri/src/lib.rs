// src-tauri/src/lib.rs
mod commands;

use commands::*;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .manage(ScoreboardState::default())
        .invoke_handler(tauri::generate_handler![
            // Monitor commands
            get_available_monitors,
            create_scoreboard_window,
            close_scoreboard_window,
            update_scoreboard_window_position,
            update_scoreboard_window_size,
            toggle_scoreboard_fullscreen,
            // Storage commands
            save_scoreboard,
            load_scoreboard,
            list_scoreboards,
            delete_scoreboard,
            export_scoreboard,
            import_scoreboard,
            // Scoreboard commands
            update_game_state,
            get_game_state,
            update_score,
            update_time,
            update_period,
            toggle_game_active,
            reset_game,
            update_team_info,
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

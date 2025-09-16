// src-tauri/src/storage.rs
use crate::state::{LiveDataState, ScoreboardState, ImageState, VideoState, CanvasState, AppState};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use std::default::Default;

#[derive(Clone)]
pub struct StateStorage {
    app_data_dir: PathBuf,
}

impl StateStorage {
    pub fn new(app_handle: &AppHandle) -> Result<Self, String> {
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data directory: {}", e))?;

        // Create the directory if it doesn't exist
        if !app_data_dir.exists() {
            fs::create_dir_all(&app_data_dir)
                .map_err(|e| format!("Failed to create app data directory: {}", e))?;
        }

        Ok(Self { app_data_dir })
    }

    // ==================== APP STATE PERSISTENCE ====================

    pub fn save_app_state(&self, state: &AppState) -> Result<(), String> {
        let path = self.app_data_dir.join("app_state.json");
        let json = serde_json::to_string_pretty(state)
            .map_err(|e| format!("Failed to serialize app state: {}", e))?;
        fs::write(path, json)
            .map_err(|e| format!("Failed to write app state: {}", e))?;
        Ok(())
    }

    pub fn load_app_state(&self) -> Result<AppState, String> {
        let path = self.app_data_dir.join("app_state.json");
        if !path.exists() {
            return Ok(AppState::default());
        }

        let json = fs::read_to_string(path)
            .map_err(|e| format!("Failed to read app state: {}", e))?;
        serde_json::from_str(&json)
            .map_err(|e| format!("Failed to deserialize app state: {}", e))
    }

    // ==================== CANVAS STATE PERSISTENCE ====================

    pub fn save_canvas_state(&self, state: &CanvasState) -> Result<(), String> {
        let path = self.app_data_dir.join("canvas_state.json");
        let json = serde_json::to_string_pretty(state)
            .map_err(|e| format!("Failed to serialize canvas state: {}", e))?;
        fs::write(path, json)
            .map_err(|e| format!("Failed to write canvas state: {}", e))?;
        Ok(())
    }

    pub fn load_canvas_state(&self) -> Result<CanvasState, String> {
        let path = self.app_data_dir.join("canvas_state.json");
        if !path.exists() {
            return Ok(CanvasState::default());
        }

        let json = fs::read_to_string(path)
            .map_err(|e| format!("Failed to read canvas state: {}", e))?;
        serde_json::from_str(&json)
            .map_err(|e| format!("Failed to deserialize canvas state: {}", e))
    }

    // ==================== IMAGE STATE PERSISTENCE ====================

    pub fn save_image_state(&self, state: &ImageState) -> Result<(), String> {
        let path = self.app_data_dir.join("image_state.json");
        let json = serde_json::to_string_pretty(state)
            .map_err(|e| format!("Failed to serialize image state: {}", e))?;
        fs::write(path, json)
            .map_err(|e| format!("Failed to write image state: {}", e))?;
        Ok(())
    }

    pub fn load_image_state(&self) -> Result<ImageState, String> {
        let path = self.app_data_dir.join("image_state.json");
        if !path.exists() {
            return Ok(ImageState::default());
        }

        let json = fs::read_to_string(path)
            .map_err(|e| format!("Failed to read image state: {}", e))?;
        serde_json::from_str(&json)
            .map_err(|e| format!("Failed to deserialize image state: {}", e))
    }

    // ==================== VIDEO STATE PERSISTENCE ====================

    pub fn save_video_state(&self, state: &VideoState) -> Result<(), String> {
        let path = self.app_data_dir.join("video_state.json");
        let json = serde_json::to_string_pretty(state)
            .map_err(|e| format!("Failed to serialize video state: {}", e))?;
        fs::write(path, json)
            .map_err(|e| format!("Failed to write video state: {}", e))?;
        Ok(())
    }

    pub fn load_video_state(&self) -> Result<VideoState, String> {
        let path = self.app_data_dir.join("video_state.json");
        if !path.exists() {
            return Ok(VideoState::default());
        }

        let json = fs::read_to_string(path)
            .map_err(|e| format!("Failed to read video state: {}", e))?;
        serde_json::from_str(&json)
            .map_err(|e| format!("Failed to deserialize video state: {}", e))
    }

    // ==================== LIVE DATA STATE PERSISTENCE ====================

    pub fn save_live_data_state(&self, state: &LiveDataState) -> Result<(), String> {
        let path = self.app_data_dir.join("live_data_state.json");
        let json = serde_json::to_string_pretty(state)
            .map_err(|e| format!("Failed to serialize live data state: {}", e))?;
        fs::write(path, json)
            .map_err(|e| format!("Failed to write live data state: {}", e))?;
        Ok(())
    }

    pub fn load_live_data_state(&self) -> Result<LiveDataState, String> {
        let path = self.app_data_dir.join("live_data_state.json");
        if !path.exists() {
            return Ok(LiveDataState::default());
        }

        let json = fs::read_to_string(path)
            .map_err(|e| format!("Failed to read live data state: {}", e))?;
        serde_json::from_str(&json)
            .map_err(|e| format!("Failed to deserialize live data state: {}", e))
    }

    // ==================== SCOREBOARD STATE PERSISTENCE ====================

    pub fn save_scoreboard_state(&self, state: &ScoreboardState) -> Result<(), String> {
        let path = self.app_data_dir.join("scoreboard_state.json");
        let json = serde_json::to_string_pretty(state)
            .map_err(|e| format!("Failed to serialize scoreboard state: {}", e))?;
        fs::write(path, json)
            .map_err(|e| format!("Failed to write scoreboard state: {}", e))?;
        Ok(())
    }

    pub fn load_scoreboard_state(&self) -> Result<ScoreboardState, String> {
        let path = self.app_data_dir.join("scoreboard_state.json");
        if !path.exists() {
            return Ok(ScoreboardState::default());
        }

        let json = fs::read_to_string(path)
            .map_err(|e| format!("Failed to read scoreboard state: {}", e))?;
        serde_json::from_str(&json)
            .map_err(|e| format!("Failed to deserialize scoreboard state: {}", e))
    }

    // ==================== AUTO-SAVE FUNCTIONALITY ====================

    pub fn save_all_states(
        &self,
        app_state: &AppState,
        canvas_state: &CanvasState,
        image_state: &ImageState,
        video_state: &VideoState,
        live_data_state: &LiveDataState,
        scoreboard_state: &ScoreboardState,
    ) -> Result<(), String> {
        self.save_app_state(app_state)?;
        self.save_canvas_state(canvas_state)?;
        self.save_image_state(image_state)?;
        self.save_video_state(video_state)?;
        self.save_live_data_state(live_data_state)?;
        self.save_scoreboard_state(scoreboard_state)?;
        Ok(())
    }

    pub fn load_all_states(&self) -> Result<(
        AppState,
        CanvasState,
        ImageState,
        VideoState,
        LiveDataState,
        ScoreboardState,
    ), String> {
        Ok((
            self.load_app_state()?,
            self.load_canvas_state()?,
            self.load_image_state()?,
            self.load_video_state()?,
            self.load_live_data_state()?,
            self.load_scoreboard_state()?,
        ))
    }

    // ==================== STATE BACKUP ====================

    pub fn create_backup(&self, backup_name: &str) -> Result<(), String> {
        let backup_dir = self.app_data_dir.join("backups");
        if !backup_dir.exists() {
            fs::create_dir_all(&backup_dir)
                .map_err(|e| format!("Failed to create backup directory: {}", e))?;
        }

        let backup_path = backup_dir.join(format!("{}.zip", backup_name));

        // For now, just copy the state files to a backup directory
        // In a real implementation, you'd want to create a proper ZIP archive
        let backup_state_dir = backup_dir.join(backup_name);
        if !backup_state_dir.exists() {
            fs::create_dir_all(&backup_state_dir)
                .map_err(|e| format!("Failed to create backup state directory: {}", e))?;
        }

        let state_files = ["app_state.json", "canvas_state.json", "image_state.json",
                          "video_state.json", "live_data_state.json", "scoreboard_state.json"];

        for file_name in &state_files {
            let src = self.app_data_dir.join(file_name);
            let dst = backup_state_dir.join(file_name);
            if src.exists() {
                fs::copy(src, dst)
                    .map_err(|e| format!("Failed to copy {} to backup: {}", file_name, e))?;
            }
        }

        Ok(())
    }

    pub fn restore_backup(&self, backup_name: &str) -> Result<(), String> {
        let backup_dir = self.app_data_dir.join("backups");
        let backup_state_dir = backup_dir.join(backup_name);

        if !backup_state_dir.exists() {
            return Err(format!("Backup '{}' does not exist", backup_name));
        }

        let state_files = ["app_state.json", "canvas_state.json", "image_state.json",
                          "video_state.json", "live_data_state.json", "scoreboard_state.json"];

        for file_name in &state_files {
            let src = backup_state_dir.join(file_name);
            let dst = self.app_data_dir.join(file_name);
            if src.exists() {
                fs::copy(src, dst)
                    .map_err(|e| format!("Failed to restore {} from backup: {}", file_name, e))?;
            }
        }

        Ok(())
    }

    pub fn list_backups(&self) -> Result<Vec<String>, String> {
        let backup_dir = self.app_data_dir.join("backups");
        if !backup_dir.exists() {
            return Ok(Vec::new());
        }

        let entries = fs::read_dir(backup_dir)
            .map_err(|e| format!("Failed to read backup directory: {}", e))?;

        let mut backups = Vec::new();
        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            if let Some(file_name) = entry.file_name().to_str() {
                backups.push(file_name.to_string());
            }
        }

        Ok(backups)
    }

    pub fn clear_old_backups(&self, keep_last_n: usize) -> Result<(), String> {
        let mut backups = self.list_backups()?;
        backups.sort();

        if backups.len() <= keep_last_n {
            return Ok(());
        }

        let to_delete = backups.len() - keep_last_n;
        for i in 0..to_delete {
            let backup_name = &backups[i];
            let backup_path = self.app_data_dir.join("backups").join(backup_name);
            if backup_path.is_dir() {
                fs::remove_dir_all(backup_path)
                    .map_err(|e| format!("Failed to remove old backup '{}': {}", backup_name, e))?;
            }
        }

        Ok(())
    }
}

// ==================== MANAGED STATE WRAPPERS ====================

pub struct ManagedStateStorage(pub StateStorage);

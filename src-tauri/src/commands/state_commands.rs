// src-tauri/src/commands/state_commands.rs
use crate::state::*;
use crate::state_sync::*;
use tauri::{command, State};

// ==================== APP STATE COMMANDS ====================

#[command]
pub async fn get_app_state(state: State<'_, ManagedAppState>) -> Result<AppState, String> {
    let app_state = state.0.lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;
    Ok(app_state.clone())
}

#[command]
pub async fn update_app_theme(
    theme: Theme,
    state: State<'_, ManagedAppState>,
    state_sync: State<'_, ManagedStateSync>
) -> Result<(), String> {
    let mut app_state = state.0.lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;
    app_state.theme = theme;

    // Notify subscribers of the state change
    let sync_manager = state_sync.0.lock()
        .map_err(|e| format!("Failed to lock state sync: {}", e))?;
    sync_manager.notify_app_state_change(&*app_state)?;

    Ok(())
}

#[command]
pub async fn toggle_sidebar(
    state: State<'_, ManagedAppState>,
    state_sync: State<'_, ManagedStateSync>
) -> Result<(), String> {
    let mut app_state = state.0.lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;
    app_state.sidebar_open = !app_state.sidebar_open;

    // Notify subscribers of the state change
    let sync_manager = state_sync.0.lock()
        .map_err(|e| format!("Failed to lock state sync: {}", e))?;
    sync_manager.notify_app_state_change(&*app_state)?;

    Ok(())
}

#[command]
pub async fn set_sidebar_open(
    open: bool,
    state: State<'_, ManagedAppState>
) -> Result<(), String> {
    let mut app_state = state.0.lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;
    app_state.sidebar_open = open;
    Ok(())
}

#[command]
pub async fn toggle_property_panel(state: State<'_, ManagedAppState>) -> Result<(), String> {
    let mut app_state = state.0.lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;
    app_state.property_panel_open = !app_state.property_panel_open;
    Ok(())
}

#[command]
pub async fn set_property_panel_open(
    open: bool,
    state: State<'_, ManagedAppState>
) -> Result<(), String> {
    let mut app_state = state.0.lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;
    app_state.property_panel_open = open;
    Ok(())
}

#[command]
pub async fn toggle_toolbar_compact(state: State<'_, ManagedAppState>) -> Result<(), String> {
    let mut app_state = state.0.lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;
    app_state.toolbar_compact = !app_state.toolbar_compact;
    Ok(())
}

#[command]
pub async fn set_monitors(
    monitors: Vec<MonitorInfo>,
    state: State<'_, ManagedAppState>,
    state_sync: State<'_, ManagedStateSync>
) -> Result<(), String> {
    let mut app_state = state.0.lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;
    app_state.monitors = monitors;
    app_state.is_loading_monitors = false;

    // Notify subscribers of the state change
    let sync_manager = state_sync.0.lock()
        .map_err(|e| format!("Failed to lock state sync: {}", e))?;
    sync_manager.notify_app_state_change(&*app_state)?;

    Ok(())
}

#[command]
pub async fn select_monitor(
    monitor_id: Option<String>,
    state: State<'_, ManagedAppState>,
    state_sync: State<'_, ManagedStateSync>
) -> Result<(), String> {
    let mut app_state = state.0.lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;

    app_state.selected_monitor = if let Some(id_str) = monitor_id {
        if let Ok(id) = id_str.parse::<u32>() {
            app_state.monitors.iter().find(|m| m.id == id).cloned()
        } else {
            None
        }
    } else {
        None
    };

    // Notify subscribers of the state change
    let sync_manager = state_sync.0.lock()
        .map_err(|e| format!("Failed to lock state sync: {}", e))?;
    sync_manager.notify_app_state_change(&*app_state)?;

    Ok(())
}

#[command]
pub async fn add_scoreboard_instance(
    instance: ScoreboardInstance,
    state: State<'_, ManagedAppState>
) -> Result<(), String> {
    let mut app_state = state.0.lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;
    app_state.scoreboard_instances.push(instance);
    Ok(())
}

#[command]
pub async fn remove_scoreboard_instance(
    instance_id: String,
    state: State<'_, ManagedAppState>
) -> Result<(), String> {
    let mut app_state = state.0.lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;
    app_state.scoreboard_instances.retain(|i| i.id != instance_id);
    Ok(())
}

#[command]
pub async fn update_scoreboard_instance_position(
    instance_id: String,
    offset_x: i32,
    offset_y: i32,
    state: State<'_, ManagedAppState>
) -> Result<(), String> {
    let mut app_state = state.0.lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;

    if let Some(instance) = app_state.scoreboard_instances.iter_mut().find(|i| i.id == instance_id) {
        instance.position.offset_x = offset_x;
        instance.position.offset_y = offset_y;
    }
    Ok(())
}

#[command]
pub async fn update_scoreboard_instance_size(
    instance_id: String,
    width: u32,
    height: u32,
    state: State<'_, ManagedAppState>
) -> Result<(), String> {
    let mut app_state = state.0.lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;

    if let Some(instance) = app_state.scoreboard_instances.iter_mut().find(|i| i.id == instance_id) {
        instance.size.width = width;
        instance.size.height = height;
    }
    Ok(())
}

#[command]
pub async fn set_app_error(
    error: Option<String>,
    state: State<'_, ManagedAppState>
) -> Result<(), String> {
    let mut app_state = state.0.lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;
    app_state.last_error = error;
    Ok(())
}

#[command]
pub async fn update_app_settings(
    settings: AppSettings,
    state: State<'_, ManagedAppState>
) -> Result<(), String> {
    let mut app_state = state.0.lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;
    app_state.settings = settings;
    Ok(())
}

// ==================== CANVAS STATE COMMANDS ====================

#[command]
pub async fn get_canvas_state(state: State<'_, ManagedCanvasState>) -> Result<CanvasState, String> {
    let canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    Ok(canvas_state.clone())
}

#[command]
pub async fn set_canvas_size(
    width: u32,
    height: u32,
    state: State<'_, ManagedCanvasState>
) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.canvas_size = Size { width, height };
    Ok(())
}

#[command]
pub async fn set_canvas_zoom(
    zoom: f64,
    state: State<'_, ManagedCanvasState>
) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.zoom = zoom.max(0.1).min(5.0);
    Ok(())
}

#[command]
pub async fn set_canvas_pan(
    x: f64,
    y: f64,
    state: State<'_, ManagedCanvasState>
) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.pan = Position2D { x, y };
    Ok(())
}

#[command]
pub async fn toggle_canvas_grid(state: State<'_, ManagedCanvasState>) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.grid.show_grid = !canvas_state.grid.show_grid;
    Ok(())
}

#[command]
pub async fn set_canvas_grid_size(
    size: u32,
    state: State<'_, ManagedCanvasState>
) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.grid.size = size;
    Ok(())
}

#[command]
pub async fn toggle_canvas_snap_to_grid(state: State<'_, ManagedCanvasState>) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.grid.snap_to_grid = !canvas_state.grid.snap_to_grid;
    Ok(())
}

#[command]
pub async fn toggle_alignment_snapping(state: State<'_, ManagedCanvasState>) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.alignment_snapping = !canvas_state.alignment_snapping;
    if !canvas_state.alignment_snapping {
        canvas_state.alignment_guides.clear();
    }
    Ok(())
}

#[command]
pub async fn select_canvas_components(
    component_ids: Vec<String>,
    state: State<'_, ManagedCanvasState>
) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.selected_components = component_ids;
    Ok(())
}

#[command]
pub async fn clear_canvas_selection(state: State<'_, ManagedCanvasState>) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.selected_components.clear();
    Ok(())
}

#[command]
pub async fn set_canvas_hovered_component(
    component_id: Option<String>,
    state: State<'_, ManagedCanvasState>
) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.hovered_component = component_id;
    Ok(())
}

#[command]
pub async fn start_canvas_drag(
    offset_x: f64,
    offset_y: f64,
    state: State<'_, ManagedCanvasState>
) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.is_dragging = true;
    canvas_state.drag_offset = Position2D { x: offset_x, y: offset_y };
    Ok(())
}

#[command]
pub async fn end_canvas_drag(state: State<'_, ManagedCanvasState>) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.is_dragging = false;
    canvas_state.drag_offset = Position2D { x: 0.0, y: 0.0 };
    Ok(())
}

#[command]
pub async fn start_canvas_resize(
    component_id: String,
    handle: ResizeHandle,
    state: State<'_, ManagedCanvasState>
) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.is_resizing = true;
    canvas_state.resize_handle = Some(handle);
    canvas_state.resized_component_id = Some(component_id);
    Ok(())
}

#[command]
pub async fn end_canvas_resize(state: State<'_, ManagedCanvasState>) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.is_resizing = false;
    canvas_state.resize_handle = None;
    canvas_state.resized_component_id = None;
    Ok(())
}

#[command]
pub async fn set_canvas_viewport_bounds(
    bounds: DOMRect,
    state: State<'_, ManagedCanvasState>
) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.viewport_bounds = Some(bounds);
    Ok(())
}

#[command]
pub async fn zoom_canvas_in(state: State<'_, ManagedCanvasState>) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.zoom = (canvas_state.zoom * 1.2).min(5.0);
    Ok(())
}

#[command]
pub async fn zoom_canvas_out(state: State<'_, ManagedCanvasState>) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.zoom = (canvas_state.zoom / 1.2).max(0.1);
    Ok(())
}

#[command]
pub async fn zoom_canvas_to_fit(
    canvas_width: f64,
    canvas_height: f64,
    viewport_width: f64,
    viewport_height: f64,
    state: State<'_, ManagedCanvasState>
) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;

    let scale_x = viewport_width / canvas_width;
    let scale_y = viewport_height / canvas_height;
    let scale = (scale_x.min(scale_y) * 0.9).max(0.1).min(5.0);

    canvas_state.zoom = scale;
    canvas_state.pan = Position2D {
        x: (viewport_width - canvas_width * scale) / 2.0,
        y: (viewport_height - canvas_height * scale) / 2.0,
    };
    Ok(())
}

#[command]
pub async fn reset_canvas_view(state: State<'_, ManagedCanvasState>) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.zoom = 1.0;
    canvas_state.pan = Position2D { x: 0.0, y: 0.0 };
    Ok(())
}

#[command]
pub async fn set_canvas_alignment_guides(
    guides: Vec<AlignmentGuide>,
    state: State<'_, ManagedCanvasState>
) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.alignment_guides = guides;
    Ok(())
}

#[command]
pub async fn clear_canvas_alignment_guides(state: State<'_, ManagedCanvasState>) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.alignment_guides.clear();
    Ok(())
}

#[command]
pub async fn set_canvas_clipboard(
    components: Vec<serde_json::Value>,
    state: State<'_, ManagedCanvasState>
) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.clipboard = components;
    Ok(())
}

#[command]
pub async fn clear_canvas_clipboard(state: State<'_, ManagedCanvasState>) -> Result<(), String> {
    let mut canvas_state = state.0.lock()
        .map_err(|e| format!("Failed to lock canvas state: {}", e))?;
    canvas_state.clipboard.clear();
    Ok(())
}

// ==================== IMAGE STATE COMMANDS ====================

#[command]
pub async fn get_image_state(state: State<'_, ManagedImageState>) -> Result<ImageState, String> {
    let image_state = state.0.lock()
        .map_err(|e| format!("Failed to lock image state: {}", e))?;
    Ok(image_state.clone())
}

#[command]
pub async fn set_image_loading(
    loading: bool,
    state: State<'_, ManagedImageState>
) -> Result<(), String> {
    let mut image_state = state.0.lock()
        .map_err(|e| format!("Failed to lock image state: {}", e))?;
    image_state.is_loading = loading;
    Ok(())
}

#[command]
pub async fn add_image(
    image: StoredImage,
    state: State<'_, ManagedImageState>
) -> Result<(), String> {
    let mut image_state = state.0.lock()
        .map_err(|e| format!("Failed to lock image state: {}", e))?;
    image_state.images.push(image);
    image_state.is_loading = false;
    Ok(())
}

#[command]
pub async fn remove_image(
    image_id: String,
    state: State<'_, ManagedImageState>
) -> Result<(), String> {
    let mut image_state = state.0.lock()
        .map_err(|e| format!("Failed to lock image state: {}", e))?;
    image_state.images.retain(|i| i.id != image_id);
    Ok(())
}

#[command]
pub async fn set_image_error(
    error: Option<String>,
    state: State<'_, ManagedImageState>
) -> Result<(), String> {
    let mut image_state = state.0.lock()
        .map_err(|e| format!("Failed to lock image state: {}", e))?;
    image_state.last_error = error;
    Ok(())
}

// ==================== VIDEO STATE COMMANDS ====================

#[command]
pub async fn get_video_state(state: State<'_, ManagedVideoState>) -> Result<VideoState, String> {
    let video_state = state.0.lock()
        .map_err(|e| format!("Failed to lock video state: {}", e))?;
    Ok(video_state.clone())
}

#[command]
pub async fn set_video_loading(
    loading: bool,
    state: State<'_, ManagedVideoState>
) -> Result<(), String> {
    let mut video_state = state.0.lock()
        .map_err(|e| format!("Failed to lock video state: {}", e))?;
    video_state.is_loading = loading;
    Ok(())
}

#[command]
pub async fn add_video(
    video: StoredVideo,
    state: State<'_, ManagedVideoState>
) -> Result<(), String> {
    let mut video_state = state.0.lock()
        .map_err(|e| format!("Failed to lock video state: {}", e))?;
    video_state.videos.push(video);
    video_state.is_loading = false;
    Ok(())
}

#[command]
pub async fn remove_video(
    video_id: String,
    state: State<'_, ManagedVideoState>
) -> Result<(), String> {
    let mut video_state = state.0.lock()
        .map_err(|e| format!("Failed to lock video state: {}", e))?;
    video_state.videos.retain(|v| v.id != video_id);
    Ok(())
}

#[command]
pub async fn set_video_error(
    error: Option<String>,
    state: State<'_, ManagedVideoState>
) -> Result<(), String> {
    let mut video_state = state.0.lock()
        .map_err(|e| format!("Failed to lock video state: {}", e))?;
    video_state.last_error = error;
    Ok(())
}

// ==================== LIVE DATA STATE COMMANDS ====================

#[command]
pub async fn get_live_data_state(state: State<'_, ManagedLiveDataState>) -> Result<LiveDataState, String> {
    let live_data_state = state.0.lock()
        .map_err(|e| format!("Failed to lock live data state: {}", e))?;
    Ok(live_data_state.clone())
}

#[command]
pub async fn add_live_data_connection(
    connection: LiveDataConnection,
    state: State<'_, ManagedLiveDataState>
) -> Result<(), String> {
    let mut live_data_state = state.0.lock()
        .map_err(|e| format!("Failed to lock live data state: {}", e))?;
    live_data_state.connections.push(connection);
    Ok(())
}

#[command]
pub async fn update_live_data_connection(
    connection_id: String,
    updates: LiveDataConnection,
    state: State<'_, ManagedLiveDataState>
) -> Result<(), String> {
    let mut live_data_state = state.0.lock()
        .map_err(|e| format!("Failed to lock live data state: {}", e))?;

    if let Some(conn) = live_data_state.connections.iter_mut().find(|c| c.id == connection_id) {
        *conn = updates;
    }
    Ok(())
}

#[command]
pub async fn remove_live_data_connection(
    connection_id: String,
    state: State<'_, ManagedLiveDataState>
) -> Result<(), String> {
    let mut live_data_state = state.0.lock()
        .map_err(|e| format!("Failed to lock live data state: {}", e))?;
    live_data_state.connections.retain(|c| c.id != connection_id);
    Ok(())
}

#[command]
pub async fn update_live_data(
    connection_id: String,
    data: TennisLiveData,
    state: State<'_, ManagedLiveDataState>
) -> Result<(), String> {
    let mut live_data_state = state.0.lock()
        .map_err(|e| format!("Failed to lock live data state: {}", e))?;
    live_data_state.active_data.insert(connection_id, data);
    Ok(())
}

#[command]
pub async fn add_live_data_component_binding(
    binding: LiveDataComponentBinding,
    state: State<'_, ManagedLiveDataState>
) -> Result<(), String> {
    let mut live_data_state = state.0.lock()
        .map_err(|e| format!("Failed to lock live data state: {}", e))?;
    live_data_state.component_bindings.push(binding);
    Ok(())
}

#[command]
pub async fn remove_live_data_component_binding(
    component_id: String,
    state: State<'_, ManagedLiveDataState>
) -> Result<(), String> {
    let mut live_data_state = state.0.lock()
        .map_err(|e| format!("Failed to lock live data state: {}", e))?;
    live_data_state.component_bindings.retain(|b| b.component_id != component_id);
    Ok(())
}

#[command]
pub async fn set_live_data_polling(
    polling: bool,
    state: State<'_, ManagedLiveDataState>
) -> Result<(), String> {
    let mut live_data_state = state.0.lock()
        .map_err(|e| format!("Failed to lock live data state: {}", e))?;
    live_data_state.is_polling = polling;
    Ok(())
}

#[command]
pub async fn set_live_data_error(
    error: Option<String>,
    state: State<'_, ManagedLiveDataState>
) -> Result<(), String> {
    let mut live_data_state = state.0.lock()
        .map_err(|e| format!("Failed to lock live data state: {}", e))?;
    live_data_state.last_error = error;
    Ok(())
}

#[command]
pub async fn set_tennis_api_connected(
    connected: bool,
    state: State<'_, ManagedLiveDataState>
) -> Result<(), String> {
    let mut live_data_state = state.0.lock()
        .map_err(|e| format!("Failed to lock live data state: {}", e))?;
    live_data_state.tennis_api_connected = connected;
    Ok(())
}

#[command]
pub async fn set_tennis_api_scoreboards(
    scoreboards: Vec<ScoreboardInfo>,
    state: State<'_, ManagedLiveDataState>
) -> Result<(), String> {
    let mut live_data_state = state.0.lock()
        .map_err(|e| format!("Failed to lock live data state: {}", e))?;
    live_data_state.tennis_api_scoreboards = scoreboards;
    Ok(())
}

// ==================== SCOREBOARD STATE COMMANDS ====================

#[command]
pub async fn get_scoreboard_state(state: State<'_, ManagedScoreboardState>) -> Result<ScoreboardState, String> {
    let scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;
    Ok(scoreboard_state.clone())
}

#[command]
pub async fn set_scoreboard_config(
    config: ScoreboardConfig,
    state: State<'_, ManagedScoreboardState>
) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;
    scoreboard_state.config = Some(config);
    Ok(())
}

#[command]
pub async fn add_scoreboard_component(
    component: ScoreboardComponent,
    state: State<'_, ManagedScoreboardState>
) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;
    scoreboard_state.components.push(component);
    scoreboard_state.is_dirty = true;
    Ok(())
}

#[command]
pub async fn remove_scoreboard_component(
    component_id: String,
    state: State<'_, ManagedScoreboardState>
) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;
    scoreboard_state.components.retain(|c| c.id != component_id);
    scoreboard_state.is_dirty = true;
    Ok(())
}

#[command]
pub async fn update_scoreboard_component(
    component_id: String,
    updates: ScoreboardComponent,
    state: State<'_, ManagedScoreboardState>
) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;

    if let Some(component) = scoreboard_state.components.iter_mut().find(|c| c.id == component_id) {
        *component = updates;
        scoreboard_state.is_dirty = true;
    }
    Ok(())
}

#[command]
pub async fn update_scoreboard_component_position(
    component_id: String,
    x: f64,
    y: f64,
    state: State<'_, ManagedScoreboardState>
) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;

    if let Some(component) = scoreboard_state.components.iter_mut().find(|c| c.id == component_id) {
        component.position = Position2D { x, y };
        scoreboard_state.is_dirty = true;
    }
    Ok(())
}

#[command]
pub async fn update_scoreboard_component_size(
    component_id: String,
    width: u32,
    height: u32,
    state: State<'_, ManagedScoreboardState>
) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;

    if let Some(component) = scoreboard_state.components.iter_mut().find(|c| c.id == component_id) {
        component.size = Size { width, height };
        scoreboard_state.is_dirty = true;
    }
    Ok(())
}

#[command]
pub async fn update_scoreboard_component_style(
    component_id: String,
    style: ComponentStyle,
    state: State<'_, ManagedScoreboardState>
) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;

    if let Some(component) = scoreboard_state.components.iter_mut().find(|c| c.id == component_id) {
        component.style = style;
        scoreboard_state.is_dirty = true;
    }
    Ok(())
}

#[command]
pub async fn update_scoreboard_component_data(
    component_id: String,
    data: ComponentData,
    state: State<'_, ManagedScoreboardState>
) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;

    if let Some(component) = scoreboard_state.components.iter_mut().find(|c| c.id == component_id) {
        component.data = data;
        scoreboard_state.is_dirty = true;
    }
    Ok(())
}

#[command]
pub async fn bring_scoreboard_component_to_front(
    component_id: String,
    state: State<'_, ManagedScoreboardState>
) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;

    // Find the max z-index before borrowing mutably
    let max_z = scoreboard_state.components.iter().map(|c| c.z_index).max().unwrap_or(0);

    if let Some(component) = scoreboard_state.components.iter_mut().find(|c| c.id == component_id) {
        component.z_index = max_z + 1;
        scoreboard_state.is_dirty = true;
    }
    Ok(())
}

#[command]
pub async fn send_scoreboard_component_to_back(
    component_id: String,
    state: State<'_, ManagedScoreboardState>
) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;

    // Find the min z-index before borrowing mutably
    let min_z = scoreboard_state.components.iter().map(|c| c.z_index).min().unwrap_or(0);

    if let Some(component) = scoreboard_state.components.iter_mut().find(|c| c.id == component_id) {
        component.z_index = min_z - 1;
        scoreboard_state.is_dirty = true;
    }
    Ok(())
}

#[command]
pub async fn lock_scoreboard_component(
    component_id: String,
    locked: bool,
    state: State<'_, ManagedScoreboardState>
) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;

    if let Some(component) = scoreboard_state.components.iter_mut().find(|c| c.id == component_id) {
        component.locked = locked;
        scoreboard_state.is_dirty = true;
    }
    Ok(())
}

#[command]
pub async fn toggle_scoreboard_component_visibility(
    component_id: String,
    state: State<'_, ManagedScoreboardState>
) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;

    if let Some(component) = scoreboard_state.components.iter_mut().find(|c| c.id == component_id) {
        component.visible = !component.visible;
        scoreboard_state.is_dirty = true;
    }
    Ok(())
}

#[command]
pub async fn set_scoreboard_game_state(
    game_state: GameState,
    state: State<'_, ManagedScoreboardState>
) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;
    scoreboard_state.game_state = Some(game_state);
    Ok(())
}

#[command]
pub async fn update_scoreboard_score(
    team: String,
    score: u32,
    state: State<'_, ManagedScoreboardState>
) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;

    if let Some(ref mut game_state) = scoreboard_state.game_state {
        match team.as_str() {
            "home" => game_state.home_score = score,
            "away" => game_state.away_score = score,
            _ => return Err("Invalid team".to_string()),
        }
    }
    Ok(())
}

#[command]
pub async fn update_scoreboard_time(
    time_remaining: String,
    state: State<'_, ManagedScoreboardState>
) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;

    if let Some(ref mut game_state) = scoreboard_state.game_state {
        game_state.time_remaining = time_remaining;
    }
    Ok(())
}

#[command]
pub async fn update_scoreboard_period(
    period: u32,
    state: State<'_, ManagedScoreboardState>
) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;

    if let Some(ref mut game_state) = scoreboard_state.game_state {
        game_state.period = period;
    }
    Ok(())
}

#[command]
pub async fn toggle_scoreboard_game_active(state: State<'_, ManagedScoreboardState>) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;

    if let Some(ref mut game_state) = scoreboard_state.game_state {
        game_state.is_game_active = !game_state.is_game_active;
    }
    Ok(())
}

#[command]
pub async fn reset_scoreboard_game(state: State<'_, ManagedScoreboardState>) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;

    if let Some(ref mut game_state) = scoreboard_state.game_state {
        game_state.home_score = 0;
        game_state.away_score = 0;
        game_state.period = 1;
        game_state.time_remaining = "00:00".to_string();
        game_state.is_game_active = false;
    }
    Ok(())
}

#[command]
pub async fn mark_scoreboard_dirty(
    dirty: bool,
    state: State<'_, ManagedScoreboardState>
) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;
    scoreboard_state.is_dirty = dirty;
    Ok(())
}

#[command]
pub async fn mark_scoreboard_saved(state: State<'_, ManagedScoreboardState>) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;
    scoreboard_state.is_dirty = false;
    scoreboard_state.last_saved = Some(chrono::Utc::now().to_rfc3339());
    Ok(())
}

#[command]
pub async fn clear_scoreboard(state: State<'_, ManagedScoreboardState>) -> Result<(), String> {
    let mut scoreboard_state = state.0.lock()
        .map_err(|e| format!("Failed to lock scoreboard state: {}", e))?;
    *scoreboard_state = ScoreboardState::default();
    Ok(())
}

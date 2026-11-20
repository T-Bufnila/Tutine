mod commands;
mod db;

use commands::AppDb;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&dir)?;
            let conn = db::open(&dir.join("rutine.db"))?;
            app.manage(AppDb(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_routines,
            commands::save_routine,
            commands::delete_routine,
            commands::set_pinned,
            commands::set_active_routine,
            commands::get_today,
            commands::toggle_todo,
            commands::add_custom_todo,
            commands::update_custom_todo,
            commands::delete_custom_todo,
            commands::get_history,
            commands::get_settings,
            commands::set_setting,
            commands::list_sounds,
            commands::add_sound,
            commands::rename_sound,
            commands::delete_sound,
            commands::get_sound_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

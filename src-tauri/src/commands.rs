use crate::db::{self, future, history, models, routines, settings, sounds, tags, todos};
use percent_encoding::percent_decode_str;
use rusqlite::Connection;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

pub struct AppDb(pub Mutex<Connection>);

type CmdResult<T> = Result<T, String>;

fn with_db<T>(state: &State<AppDb>, f: impl FnOnce(&mut Connection) -> db::Res<T>) -> CmdResult<T> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    f(&mut conn).map_err(|e| e.to_string())
}

fn require(value: &str, message: &str) -> CmdResult<()> {
    if value.trim().is_empty() {
        Err(message.into())
    } else {
        Ok(())
    }
}

// --- Updates --------------------------------------------------------------

const RELEASES_URL: &str = "https://github.com/T-Bufnila/Tutine/releases";

#[tauri::command]
pub fn open_release_page(url: String) -> CmdResult<()> {
    if !url.starts_with(RELEASES_URL) {
        return Err("Not a Tutine release link".into());
    }
    crate::spotify_auth::open_in_browser(&url)
}

// --- Routines -------------------------------------------------------------

#[tauri::command]
pub fn list_routines(state: State<AppDb>) -> CmdResult<Vec<models::Routine>> {
    with_db(&state, |c| routines::list(c))
}

#[tauri::command]
pub fn save_routine(state: State<AppDb>, routine: models::Routine) -> CmdResult<i64> {
    require(&routine.name, "Routine name is required")?;
    if let Some(problem) = routines::find_overlap(&routine.items, routine.weeks.clamp(1, 12)) {
        return Err(problem);
    }
    with_db(&state, |c| routines::save(c, routine))
}

#[tauri::command]
pub fn delete_routine(state: State<AppDb>, id: i64) -> CmdResult<()> {
    with_db(&state, |c| routines::delete(c, id))
}

#[tauri::command]
pub fn set_pinned(state: State<AppDb>, id: i64, pinned: bool) -> CmdResult<()> {
    with_db(&state, |c| routines::set_pinned(c, id, pinned))
}

#[tauri::command]
pub fn set_active_routine(state: State<AppDb>, id: Option<i64>) -> CmdResult<()> {
    with_db(&state, |c| routines::set_active(c, id))
}

// --- Tags -----------------------------------------------------------------

const COLOR_TAKEN: &str = "Another tag already uses that colour";

fn clean_tag(color: &str, description: &str) -> CmdResult<()> {
    let valid_color = color.len() == 7 && color.starts_with('#') && color[1..].chars().all(|c| c.is_ascii_hexdigit());
    if !valid_color {
        return Err("Pick a valid colour".into());
    }
    if description.trim().chars().count() > 60 {
        return Err("Tag descriptions are limited to 60 characters".into());
    }
    Ok(())
}

#[tauri::command]
pub fn list_tags(state: State<AppDb>) -> CmdResult<Vec<models::Tag>> {
    with_db(&state, |c| tags::list(c))
}

#[tauri::command]
pub fn add_tag(state: State<AppDb>, color: String, description: String) -> CmdResult<()> {
    clean_tag(&color, &description)?;
    let color = color.to_ascii_lowercase();
    if with_db(&state, |c| tags::add(c, &color, &description))? {
        Ok(())
    } else {
        Err(COLOR_TAKEN.into())
    }
}

#[tauri::command]
pub fn update_tag(state: State<AppDb>, id: i64, color: String, description: String) -> CmdResult<()> {
    clean_tag(&color, &description)?;
    let color = color.to_ascii_lowercase();
    if with_db(&state, |c| tags::update(c, id, &color, &description))? {
        Ok(())
    } else {
        Err(COLOR_TAKEN.into())
    }
}

#[tauri::command]
pub fn delete_tag(state: State<AppDb>, id: i64) -> CmdResult<()> {
    with_db(&state, |c| tags::delete(c, id))
}

// --- Today's todos --------------------------------------------------------

#[tauri::command]
pub fn get_today(state: State<AppDb>) -> CmdResult<models::TodayData> {
    with_db(&state, |c| todos::get_today(c))
}

#[tauri::command]
pub fn toggle_todo(state: State<AppDb>, id: i64, done: bool) -> CmdResult<()> {
    with_db(&state, |c| todos::set_done(c, id, done))
}

#[tauri::command]
pub fn add_custom_todo(state: State<AppDb>, title: String, start_time: String, end_time: String) -> CmdResult<()> {
    require(&title, "Title is required")?;
    with_db(&state, |c| todos::add_custom(c, &title, &start_time, &end_time))
}

#[tauri::command]
pub fn update_custom_todo(
    state: State<AppDb>,
    id: i64,
    title: String,
    start_time: String,
    end_time: String,
) -> CmdResult<()> {
    require(&title, "Title is required")?;
    with_db(&state, |c| todos::update_custom(c, id, &title, &start_time, &end_time))
}

#[tauri::command]
pub fn delete_custom_todo(state: State<AppDb>, id: i64) -> CmdResult<()> {
    with_db(&state, |c| todos::delete_custom(c, id))
}

// --- Future Ref -----------------------------------------------------------

const MAX_NOTE_CHARS: usize = 200;

#[tauri::command]
pub fn get_future_day(state: State<AppDb>, date: String) -> CmdResult<models::FutureDay> {
    let day = future::parse_future_date(&date)?;
    with_db(&state, |c| future::get_day(c, day))
}

#[tauri::command]
pub fn get_future_note_dates(state: State<AppDb>) -> CmdResult<Vec<String>> {
    with_db(&state, |c| future::note_dates(c))
}

#[tauri::command]
pub fn set_future_note(
    state: State<AppDb>,
    date: String,
    title: String,
    start_time: String,
    note: String,
) -> CmdResult<()> {
    future::parse_future_date(&date)?;
    if note.trim().chars().count() > MAX_NOTE_CHARS {
        return Err(format!("Notes are limited to {MAX_NOTE_CHARS} characters"));
    }
    with_db(&state, |c| future::set_note(c, &date, &title, &start_time, &note))
}

// --- History & settings ---------------------------------------------------

#[tauri::command]
pub fn get_history(state: State<AppDb>, days: i64) -> CmdResult<Vec<models::HistoryDay>> {
    with_db(&state, |c| history::list_since(c, days))
}

#[tauri::command]
pub fn get_settings(state: State<AppDb>) -> CmdResult<HashMap<String, String>> {
    with_db(&state, |c| settings::list_user(c))
}

#[tauri::command]
pub fn set_setting(state: State<AppDb>, key: String, value: String) -> CmdResult<()> {
    settings::validate_user(&key, &value)?;
    with_db(&state, |c| settings::update_user(c, &key, &value))
}

// --- Alert sounds ---------------------------------------------------------

fn clean_sound_name(name: &str) -> CmdResult<String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("Give the sound a name".into());
    }
    if name.chars().count() > sounds::MAX_NAME_CHARS {
        return Err(format!(
            "Sound names are limited to {} characters",
            sounds::MAX_NAME_CHARS
        ));
    }
    Ok(name.to_string())
}

#[tauri::command]
pub fn list_sounds(state: State<AppDb>) -> CmdResult<Vec<models::Sound>> {
    with_db(&state, |c| sounds::list(c))
}

/// Receives the MP3 as the raw request body; the name arrives percent-encoded in a header.
#[tauri::command]
pub fn add_sound(state: State<AppDb>, request: tauri::ipc::Request<'_>) -> CmdResult<models::Sound> {
    let tauri::ipc::InvokeBody::Raw(bytes) = request.body() else {
        return Err("Expected the sound file as raw bytes".into());
    };
    let raw_name = request
        .headers()
        .get("x-sound-name")
        .and_then(|v| v.to_str().ok())
        .unwrap_or_default();
    let name = clean_sound_name(&percent_decode_str(raw_name).decode_utf8_lossy())?;

    if bytes.len() > sounds::MAX_BYTES {
        return Err("Sounds can be at most 5 MB".into());
    }
    if !sounds::is_mp3(bytes) {
        return Err("Only MP3 files are supported".into());
    }
    with_db(&state, |c| sounds::add(c, &name, bytes))
}

#[tauri::command]
pub fn rename_sound(state: State<AppDb>, id: i64, name: String) -> CmdResult<()> {
    let name = clean_sound_name(&name)?;
    with_db(&state, |c| sounds::rename(c, id, &name))
}

#[tauri::command]
pub fn delete_sound(state: State<AppDb>, id: i64) -> CmdResult<()> {
    with_db(&state, |c| sounds::delete(c, id))
}

#[tauri::command]
pub fn get_sound_data(state: State<AppDb>, id: i64) -> CmdResult<tauri::ipc::Response> {
    let bytes = with_db(&state, |c| sounds::data(c, id))?;
    Ok(tauri::ipc::Response::new(bytes))
}

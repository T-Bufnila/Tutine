use super::Res;
use rusqlite::{params, Connection, OptionalExtension};
use std::collections::HashMap;

pub const ACTIVE_ROUTINE: &str = "active_routine";
pub const WEEK_START: &str = "week_start";
pub const SOUND_ENABLED: &str = "sound_enabled";
pub const SOUND_ID: &str = "sound_id";
pub const DEFAULT_SOUND_ID: &str = "builtin:chime";

// Internal bookkeeping for today's generated todos; never exposed to the UI.
pub const GEN_DATE: &str = "gen_date";
pub const GEN_ROUTINE: &str = "gen_routine";
pub const GEN_DIRTY: &str = "gen_dirty";

/// Settings the frontend is allowed to change.
pub const USER_KEYS: [&str; 5] = ["notifications", "time_format", WEEK_START, SOUND_ENABLED, SOUND_ID];

pub fn get(conn: &Connection, key: &str) -> Res<String> {
    Ok(conn
        .query_row("SELECT value FROM settings WHERE key = ?1", [key], |r| r.get(0))
        .optional()?
        .unwrap_or_default())
}

pub fn set(conn: &Connection, key: &str, value: &str) -> Res<()> {
    conn.execute(
        "INSERT INTO settings(key, value) VALUES(?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )?;
    Ok(())
}

pub fn sunday_start(conn: &Connection) -> Res<bool> {
    Ok(get(conn, WEEK_START)? == "sun")
}

pub fn mark_today_dirty(conn: &Connection) -> Res<()> {
    set(conn, GEN_DIRTY, "1")
}

pub fn list_user(conn: &Connection) -> Res<HashMap<String, String>> {
    let mut stmt = conn.prepare("SELECT key, value FROM settings")?;
    let rows = stmt.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))?;
    let mut out = HashMap::new();
    for row in rows {
        let (key, value) = row?;
        if USER_KEYS.contains(&key.as_str()) {
            out.insert(key, value);
        }
    }
    Ok(out)
}

pub fn update_user(conn: &Connection, key: &str, value: &str) -> Res<()> {
    set(conn, key, value)?;
    // Week start shifts which week of a multi-week cycle is current.
    if key == WEEK_START {
        mark_today_dirty(conn)?;
    }
    Ok(())
}

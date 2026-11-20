use super::models::Sound;
use super::{settings, Res};
use rusqlite::{params, Connection};

pub const MAX_BYTES: usize = 5 * 1024 * 1024;
pub const MAX_NAME_CHARS: usize = 60;

/// Accepts MP3 files that start with an ID3 tag or an MPEG frame sync.
pub fn is_mp3(bytes: &[u8]) -> bool {
    bytes.len() > 3 && (&bytes[..3] == b"ID3" || (bytes[0] == 0xFF && bytes[1] & 0xE0 == 0xE0))
}

pub fn list(conn: &Connection) -> Res<Vec<Sound>> {
    let mut stmt = conn.prepare("SELECT id, name FROM sounds ORDER BY name COLLATE NOCASE, id")?;
    let rows = stmt.query_map([], |r| Ok(Sound { id: r.get(0)?, name: r.get(1)? }))?;
    rows.collect()
}

pub fn add(conn: &Connection, name: &str, data: &[u8]) -> Res<Sound> {
    conn.execute("INSERT INTO sounds(name, data) VALUES(?1, ?2)", params![name, data])?;
    Ok(Sound { id: conn.last_insert_rowid(), name: name.to_string() })
}

pub fn rename(conn: &Connection, id: i64, name: &str) -> Res<()> {
    conn.execute("UPDATE sounds SET name = ?1 WHERE id = ?2", params![name, id])?;
    Ok(())
}

pub fn data(conn: &Connection, id: i64) -> Res<Vec<u8>> {
    conn.query_row("SELECT data FROM sounds WHERE id = ?1", [id], |r| r.get(0))
}

pub fn delete(conn: &Connection, id: i64) -> Res<()> {
    conn.execute("DELETE FROM sounds WHERE id = ?1", [id])?;
    if settings::get(conn, settings::SOUND_ID)? == format!("custom:{id}") {
        settings::set(conn, settings::SOUND_ID, settings::DEFAULT_SOUND_ID)?;
    }
    Ok(())
}

pub mod history;
pub mod models;
pub mod routines;
pub mod settings;
pub mod sounds;
pub mod tags;
pub mod todos;
mod time;

use rusqlite::Connection;
use std::path::Path;

pub type Res<T> = rusqlite::Result<T>;

const SCHEMA: &str = "
CREATE TABLE IF NOT EXISTS tags (
    id          INTEGER PRIMARY KEY,
    color       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS routines (
    id         INTEGER PRIMARY KEY,
    name       TEXT    NOT NULL,
    weeks      INTEGER NOT NULL DEFAULT 1,
    start_date TEXT    NOT NULL,
    pinned     INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS routine_items (
    id            INTEGER PRIMARY KEY,
    routine_id    INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    week_index    INTEGER NOT NULL DEFAULT 0,
    weekday       INTEGER NOT NULL,
    title         TEXT    NOT NULL,
    start_time    TEXT    NOT NULL,
    end_time      TEXT    NOT NULL,
    break_minutes INTEGER NOT NULL DEFAULT 0,
    tag_id        INTEGER REFERENCES tags(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS todos (
    id            INTEGER PRIMARY KEY,
    date          TEXT    NOT NULL,
    kind          TEXT    NOT NULL,
    title         TEXT    NOT NULL,
    start_time    TEXT    NOT NULL DEFAULT '',
    end_time      TEXT    NOT NULL DEFAULT '',
    break_minutes INTEGER NOT NULL DEFAULT 0,
    tag_id        INTEGER REFERENCES tags(id) ON DELETE SET NULL,
    done          INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_todos_date ON todos(date);
CREATE TABLE IF NOT EXISTS history (
    date      TEXT PRIMARY KEY,
    completed INTEGER NOT NULL,
    total     INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sounds (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    data BLOB NOT NULL
);
";

pub fn open(path: &Path) -> Res<Connection> {
    let conn = Connection::open(path)?;
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;
    conn.execute_batch(SCHEMA)?;
    migrate_tags(&conn)?;
    Ok(conn)
}

fn has_column(conn: &Connection, table: &str, column: &str) -> Res<bool> {
    let mut stmt = conn.prepare(&format!("PRAGMA table_info({table})"))?;
    let names = stmt.query_map([], |r| r.get::<_, String>(1))?;
    for name in names {
        if name? == column {
            return Ok(true);
        }
    }
    Ok(false)
}

/// Databases from before tags became shared: each distinct (colour, name) pair
/// becomes a tag whose description is the old name. The legacy `tag`/`color`
/// columns stay behind unused.
fn migrate_tags(conn: &Connection) -> Res<()> {
    if has_column(conn, "routine_items", "tag_id")? {
        return Ok(());
    }
    let tx = conn.unchecked_transaction()?;
    tx.execute_batch(
        "ALTER TABLE routine_items ADD COLUMN tag_id INTEGER REFERENCES tags(id) ON DELETE SET NULL;
         ALTER TABLE todos ADD COLUMN tag_id INTEGER REFERENCES tags(id) ON DELETE SET NULL;
         INSERT INTO tags(color, description)
             SELECT DISTINCT color, tag FROM routine_items WHERE color != '';
         UPDATE routine_items SET tag_id = (
             SELECT id FROM tags WHERE tags.color = routine_items.color AND tags.description = routine_items.tag
         ) WHERE color != '';",
    )?;
    settings::mark_today_dirty(&tx)?;
    tx.commit()
}

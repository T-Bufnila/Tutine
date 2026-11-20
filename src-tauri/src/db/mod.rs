pub mod history;
pub mod models;
pub mod routines;
pub mod settings;
pub mod sounds;
pub mod todos;
mod time;

use rusqlite::Connection;
use std::path::Path;

pub type Res<T> = rusqlite::Result<T>;

const SCHEMA: &str = "
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
    tag           TEXT    NOT NULL DEFAULT '',
    color         TEXT    NOT NULL DEFAULT '#a855f7'
);
CREATE TABLE IF NOT EXISTS todos (
    id            INTEGER PRIMARY KEY,
    date          TEXT    NOT NULL,
    kind          TEXT    NOT NULL,
    title         TEXT    NOT NULL,
    start_time    TEXT    NOT NULL DEFAULT '',
    end_time      TEXT    NOT NULL DEFAULT '',
    break_minutes INTEGER NOT NULL DEFAULT 0,
    tag           TEXT    NOT NULL DEFAULT '',
    color         TEXT    NOT NULL DEFAULT '',
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
    Ok(conn)
}

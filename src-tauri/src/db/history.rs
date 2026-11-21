use super::models::{HistoryDay, KIND_BREAK};
use super::{time, Res};
use chrono::Duration;
use rusqlite::{params, Connection};

/// Recalculates a day's completed/total counts. Breaks are not counted.
pub fn recompute(conn: &Connection, date: &str) -> Res<()> {
    let (completed, total): (i64, i64) = conn.query_row(
        "SELECT COALESCE(SUM(done), 0), COUNT(*) FROM todos WHERE date = ?1 AND kind != ?2",
        params![date, KIND_BREAK],
        |r| Ok((r.get(0)?, r.get(1)?)),
    )?;
    conn.execute(
        "INSERT INTO history(date, completed, total) VALUES(?1, ?2, ?3)
         ON CONFLICT(date) DO UPDATE SET completed = excluded.completed, total = excluded.total",
        params![date, completed, total],
    )?;
    Ok(())
}

pub fn list_since(conn: &Connection, days: i64) -> Res<Vec<HistoryDay>> {
    let from = time::fmt_date(time::today() - Duration::days(days));
    let mut stmt = conn.prepare("SELECT date, completed, total FROM history WHERE date >= ?1 ORDER BY date")?;
    let rows = stmt.query_map([from], |r| {
        Ok(HistoryDay {
            date: r.get(0)?,
            completed: r.get(1)?,
            total: r.get(2)?,
        })
    })?;
    rows.collect()
}

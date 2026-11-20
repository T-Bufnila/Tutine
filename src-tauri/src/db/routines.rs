use super::models::{ActiveRoutine, Routine, RoutineItem};
use super::{settings, time, Res};
use rusqlite::{params, Connection, OptionalExtension, Row};

const MAX_WEEKS: i64 = 12;

fn map_item(r: &Row) -> Res<RoutineItem> {
    Ok(RoutineItem {
        id: Some(r.get(0)?),
        week_index: r.get(1)?,
        weekday: r.get(2)?,
        title: r.get(3)?,
        start_time: r.get(4)?,
        end_time: r.get(5)?,
        break_minutes: r.get(6)?,
        tag: r.get(7)?,
        color: r.get(8)?,
    })
}

pub fn load_items(conn: &Connection, routine_id: i64) -> Res<Vec<RoutineItem>> {
    let mut stmt = conn.prepare(
        "SELECT id, week_index, weekday, title, start_time, end_time, break_minutes, tag, color
         FROM routine_items WHERE routine_id = ?1
         ORDER BY week_index, weekday, start_time, id",
    )?;
    let rows = stmt.query_map([routine_id], map_item)?;
    rows.collect()
}

pub fn list(conn: &Connection) -> Res<Vec<Routine>> {
    let sunday = settings::sunday_start(conn)?;
    let mut stmt = conn.prepare(
        "SELECT id, name, weeks, start_date, pinned FROM routines
         ORDER BY pinned DESC, name COLLATE NOCASE",
    )?;
    let mut routines = stmt
        .query_map([], |r| {
            let weeks: i64 = r.get(2)?;
            let start_date: String = r.get(3)?;
            Ok(Routine {
                id: Some(r.get(0)?),
                name: r.get(1)?,
                weeks,
                current_week: time::current_week(&start_date, weeks, sunday),
                start_date,
                pinned: r.get::<_, i64>(4)? != 0,
                items: vec![],
            })
        })?
        .collect::<Res<Vec<_>>>()?;

    for routine in routines.iter_mut() {
        if let Some(id) = routine.id {
            routine.items = load_items(conn, id)?;
        }
    }
    Ok(routines)
}

fn is_valid_item(item: &RoutineItem, weeks: i64) -> bool {
    (0..weeks).contains(&item.week_index) && (0..7).contains(&item.weekday)
}

/// Inserts or replaces a routine and all of its items. Returns the routine id.
pub fn save(conn: &mut Connection, routine: Routine) -> Res<i64> {
    let weeks = routine.weeks.clamp(1, MAX_WEEKS);
    let name = routine.name.trim();
    let tx = conn.transaction()?;

    let id = match routine.id {
        Some(id) => {
            tx.execute(
                "UPDATE routines SET name = ?1, weeks = ?2, start_date = ?3 WHERE id = ?4",
                params![name, weeks, routine.start_date, id],
            )?;
            tx.execute("DELETE FROM routine_items WHERE routine_id = ?1", [id])?;
            id
        }
        None => {
            tx.execute(
                "INSERT INTO routines(name, weeks, start_date) VALUES(?1, ?2, ?3)",
                params![name, weeks, routine.start_date],
            )?;
            tx.last_insert_rowid()
        }
    };

    for item in routine.items.iter().filter(|i| is_valid_item(i, weeks)) {
        tx.execute(
            "INSERT INTO routine_items
                (routine_id, week_index, weekday, title, start_time, end_time, break_minutes, tag, color)
             VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                id,
                item.week_index,
                item.weekday,
                item.title.trim(),
                item.start_time,
                item.end_time,
                item.break_minutes.max(0),
                item.tag.trim(),
                item.color
            ],
        )?;
    }
    tx.commit()?;

    let active = settings::get(conn, settings::ACTIVE_ROUTINE)?;
    if active.is_empty() {
        settings::set(conn, settings::ACTIVE_ROUTINE, &id.to_string())?;
    } else if active == id.to_string() {
        settings::mark_today_dirty(conn)?;
    }
    Ok(id)
}

pub fn delete(conn: &Connection, id: i64) -> Res<()> {
    conn.execute("DELETE FROM routines WHERE id = ?1", [id])?;
    if settings::get(conn, settings::ACTIVE_ROUTINE)? == id.to_string() {
        settings::set(conn, settings::ACTIVE_ROUTINE, "")?;
    }
    Ok(())
}

pub fn set_pinned(conn: &Connection, id: i64, pinned: bool) -> Res<()> {
    conn.execute("UPDATE routines SET pinned = ?1 WHERE id = ?2", params![pinned as i64, id])?;
    Ok(())
}

pub fn set_active(conn: &Connection, id: Option<i64>) -> Res<()> {
    let value = id.map(|i| i.to_string()).unwrap_or_default();
    settings::set(conn, settings::ACTIVE_ROUTINE, &value)
}

pub fn active(conn: &Connection) -> Res<Option<ActiveRoutine>> {
    let Ok(id) = settings::get(conn, settings::ACTIVE_ROUTINE)?.parse::<i64>() else {
        return Ok(None);
    };
    conn.query_row(
        "SELECT id, name, weeks, start_date FROM routines WHERE id = ?1",
        [id],
        |r| {
            Ok(ActiveRoutine {
                id: r.get(0)?,
                name: r.get(1)?,
                weeks: r.get(2)?,
                start_date: r.get(3)?,
            })
        },
    )
    .optional()
}

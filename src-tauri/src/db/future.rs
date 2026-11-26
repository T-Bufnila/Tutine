use super::models::{FutureDay, FutureItem};
use super::{routines, settings, time, Res};
use chrono::NaiveDate;
use rusqlite::{params, Connection};
use std::collections::HashMap;

/// Parses a `YYYY-MM-DD` date and requires it to be after today.
pub fn parse_future_date(date: &str) -> Result<NaiveDate, String> {
    let parsed = time::parse_date(date).ok_or("Invalid date")?;
    if parsed <= time::today() {
        return Err("Pick a day in the future".into());
    }
    Ok(parsed)
}

/// The active routine's items for `date`, each with the note left for it (if any).
pub fn get_day(conn: &Connection, date: NaiveDate) -> Res<FutureDay> {
    let key = time::fmt_date(date);
    let active = routines::active(conn)?;

    let mut items = Vec::new();
    if let Some(routine) = &active {
        let week = time::week_on(&routine.start_date, routine.weeks, settings::sunday_start(conn)?, date);
        let weekday = time::weekday_index(date);

        let mut stmt = conn.prepare("SELECT title, start_time, note FROM future_notes WHERE date = ?1")?;
        let notes: HashMap<(String, String), String> = stmt
            .query_map([&key], |r| Ok(((r.get(0)?, r.get(1)?), r.get(2)?)))?
            .collect::<Res<_>>()?;

        items = routines::load_items(conn, routine.id)?
            .into_iter()
            .filter(|i| i.week_index == week && i.weekday == weekday)
            .map(|i| FutureItem {
                note: notes.get(&(i.title.clone(), i.start_time.clone())).cloned(),
                title: i.title,
                start_time: i.start_time,
                end_time: i.end_time,
                break_minutes: i.break_minutes,
                tag_id: i.tag_id,
            })
            .collect();
        items.sort_by(|a, b| a.start_time.cmp(&b.start_time));
    }

    Ok(FutureDay {
        date: key,
        routine_id: active.as_ref().map(|a| a.id),
        routine_name: active.map(|a| a.name),
        items,
    })
}

/// Dates that have at least one note, so the calendar can mark them.
pub fn note_dates(conn: &Connection) -> Res<Vec<String>> {
    let mut stmt = conn.prepare("SELECT DISTINCT date FROM future_notes ORDER BY date")?;
    let rows = stmt.query_map([], |r| r.get(0))?;
    rows.collect()
}

/// Saves the note for a routine todo on `date`; an empty note removes it.
pub fn set_note(conn: &Connection, date: &str, title: &str, start_time: &str, note: &str) -> Res<()> {
    let note = note.trim();
    if note.is_empty() {
        conn.execute(
            "DELETE FROM future_notes WHERE date = ?1 AND title = ?2 AND start_time = ?3",
            params![date, title, start_time],
        )?;
    } else {
        conn.execute(
            "INSERT INTO future_notes(date, title, start_time, note) VALUES(?1, ?2, ?3, ?4)
             ON CONFLICT(date, title, start_time) DO UPDATE SET note = excluded.note",
            params![date, title, start_time, note],
        )?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{models::Routine, models::RoutineItem, todos};
    use chrono::Duration;

    #[test]
    fn notes_attach_to_the_routine_todo_on_that_date() {
        let path = std::env::temp_dir().join(format!("tutine-future-{}.db", std::process::id()));
        let _ = std::fs::remove_file(&path);
        let mut conn = crate::db::open(&path).unwrap();

        let date = time::today() + Duration::days(7);
        let item = |title: &str| RoutineItem {
            id: None,
            week_index: 0,
            weekday: time::weekday_index(date),
            title: title.into(),
            start_time: "09:00".into(),
            end_time: "10:00".into(),
            break_minutes: 0,
            tag_id: None,
        };
        let routine = Routine {
            id: None,
            name: "R".into(),
            weeks: 1,
            start_date: time::fmt_date(time::today()),
            pinned: false,
            current_week: 0,
            items: vec![item("Gym")],
        };
        routines::save(&mut conn, routine).unwrap();

        let key = time::fmt_date(date);
        set_note(&conn, &key, "Gym", "09:00", " legs day ").unwrap();
        let day = get_day(&conn, date).unwrap();
        assert_eq!(day.items.len(), 1);
        assert_eq!(day.items[0].note.as_deref(), Some("legs day"));
        assert_eq!(note_dates(&conn).unwrap(), vec![key.clone()]);

        // Generating today's list purges past notes but keeps future ones.
        todos::get_today(&conn).unwrap();
        assert_eq!(note_dates(&conn).unwrap().len(), 1);

        set_note(&conn, &key, "Gym", "09:00", "").unwrap();
        assert!(get_day(&conn, date).unwrap().items[0].note.is_none());
        let _ = std::fs::remove_file(&path);
    }
}

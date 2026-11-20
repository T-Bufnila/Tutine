use super::models::{ActiveRoutine, TodayData, Todo, KIND_BREAK, KIND_CUSTOM, KIND_ROUTINE};
use super::{history, routines, settings, time, Res};
use rusqlite::{params, Connection, OptionalExtension, Row};
use std::collections::HashSet;

/// Identifies a generated todo across regenerations: (kind, title, start time).
type TodoKey = (String, String, String);

struct NewTodo<'a> {
    date: &'a str,
    kind: &'a str,
    title: &'a str,
    start_time: &'a str,
    end_time: &'a str,
    break_minutes: i64,
    tag: &'a str,
    color: &'a str,
    done: bool,
}

fn insert(conn: &Connection, t: &NewTodo) -> Res<()> {
    conn.execute(
        "INSERT INTO todos(date, kind, title, start_time, end_time, break_minutes, tag, color, done)
         VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            t.date,
            t.kind,
            t.title,
            t.start_time,
            t.end_time,
            t.break_minutes,
            t.tag,
            t.color,
            t.done as i64
        ],
    )?;
    Ok(())
}

fn map_todo(r: &Row) -> Res<Todo> {
    Ok(Todo {
        id: r.get(0)?,
        date: r.get(1)?,
        kind: r.get(2)?,
        title: r.get(3)?,
        start_time: r.get(4)?,
        end_time: r.get(5)?,
        break_minutes: r.get(6)?,
        tag: r.get(7)?,
        color: r.get(8)?,
        done: r.get::<_, i64>(9)? != 0,
    })
}

// ---------------------------------------------------------------------------
// Generating today's todos from the active routine
// ---------------------------------------------------------------------------

fn completed_generated_keys(conn: &Connection, date: &str) -> Res<HashSet<TodoKey>> {
    let mut stmt = conn.prepare(
        "SELECT kind, title, start_time FROM todos WHERE date = ?1 AND kind != ?2 AND done = 1",
    )?;
    let rows = stmt.query_map(params![date, KIND_CUSTOM], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))?;
    rows.collect()
}

fn generate_from_routine(
    conn: &Connection,
    date: &str,
    routine: &ActiveRoutine,
    completed: &HashSet<TodoKey>,
) -> Res<()> {
    let week = time::current_week(&routine.start_date, routine.weeks, settings::sunday_start(conn)?);
    let weekday = time::weekday_index(time::today());

    let mut items: Vec<_> = routines::load_items(conn, routine.id)?
        .into_iter()
        .filter(|i| i.week_index == week && i.weekday == weekday)
        .collect();
    items.sort_by(|a, b| a.start_time.cmp(&b.start_time));

    let was_done = |kind: &str, title: &str, start: &str| {
        completed.contains(&(kind.to_string(), title.to_string(), start.to_string()))
    };

    for item in items {
        insert(
            conn,
            &NewTodo {
                date,
                kind: KIND_ROUTINE,
                title: &item.title,
                start_time: &item.start_time,
                end_time: &item.end_time,
                break_minutes: item.break_minutes,
                tag: &item.tag,
                color: &item.color,
                done: was_done(KIND_ROUTINE, &item.title, &item.start_time),
            },
        )?;

        if item.break_minutes > 0 {
            let break_end = time::add_minutes(&item.end_time, item.break_minutes);
            insert(
                conn,
                &NewTodo {
                    date,
                    kind: KIND_BREAK,
                    title: "Break",
                    start_time: &item.end_time,
                    end_time: &break_end,
                    break_minutes: item.break_minutes,
                    tag: "",
                    color: "",
                    done: was_done(KIND_BREAK, "Break", &item.end_time),
                },
            )?;
        }
    }
    Ok(())
}

/// Removes past days' todos and regenerates today's routine todos when the
/// date, active routine, or routine contents have changed.
fn ensure_today(conn: &Connection) -> Res<()> {
    let date = time::fmt_date(time::today());
    let tx = conn.unchecked_transaction()?;
    tx.execute("DELETE FROM todos WHERE date < ?1", [&date])?;

    let active = routines::active(&tx)?;
    let routine_key = active.as_ref().map(|a| a.id.to_string()).unwrap_or_default();
    let same_target = settings::get(&tx, settings::GEN_DATE)? == date
        && settings::get(&tx, settings::GEN_ROUTINE)? == routine_key;
    let dirty = settings::get(&tx, settings::GEN_DIRTY)? == "1";
    if same_target && !dirty {
        return tx.commit();
    }

    // Editing the same routine keeps whatever was already ticked off.
    let completed = if same_target {
        completed_generated_keys(&tx, &date)?
    } else {
        HashSet::new()
    };
    tx.execute("DELETE FROM todos WHERE date = ?1 AND kind != ?2", params![date, KIND_CUSTOM])?;

    if let Some(routine) = &active {
        generate_from_routine(&tx, &date, routine, &completed)?;
    }

    settings::set(&tx, settings::GEN_DATE, &date)?;
    settings::set(&tx, settings::GEN_ROUTINE, &routine_key)?;
    settings::set(&tx, settings::GEN_DIRTY, "0")?;
    history::recompute(&tx, &date)?;
    tx.commit()
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

pub fn get_today(conn: &Connection) -> Res<TodayData> {
    ensure_today(conn)?;
    let today = time::today();
    let date = time::fmt_date(today);
    let active = routines::active(conn)?;
    let sunday = settings::sunday_start(conn)?;
    let week_index = active
        .as_ref()
        .map(|a| time::current_week(&a.start_date, a.weeks, sunday))
        .unwrap_or(0);

    let mut stmt = conn.prepare(
        "SELECT id, date, kind, title, start_time, end_time, break_minutes, tag, color, done
         FROM todos WHERE date = ?1
         ORDER BY CASE WHEN start_time = '' THEN 1 ELSE 0 END, start_time, id",
    )?;
    let todos = stmt.query_map([&date], map_todo)?.collect::<Res<Vec<_>>>()?;

    Ok(TodayData {
        date,
        weekday: time::weekday_index(today),
        active_routine_id: active.as_ref().map(|a| a.id),
        active_routine_name: active.map(|a| a.name),
        week_index,
        todos,
    })
}

pub fn set_done(conn: &Connection, id: i64, done: bool) -> Res<()> {
    conn.execute("UPDATE todos SET done = ?1 WHERE id = ?2", params![done as i64, id])?;
    let (date, kind, end_time): (String, String, String) = conn.query_row(
        "SELECT date, kind, end_time FROM todos WHERE id = ?1",
        [id],
        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
    )?;

    // Unchecking a routine todo re-locks the break that follows it.
    if !done && kind == KIND_ROUTINE {
        conn.execute(
            "UPDATE todos SET done = 0 WHERE date = ?1 AND kind = ?2 AND start_time = ?3",
            params![date, KIND_BREAK, end_time],
        )?;
    }
    history::recompute(conn, &date)
}

pub fn add_custom(conn: &Connection, title: &str, start_time: &str, end_time: &str) -> Res<()> {
    let date = time::fmt_date(time::today());
    insert(
        conn,
        &NewTodo {
            date: &date,
            kind: KIND_CUSTOM,
            title: title.trim(),
            start_time,
            end_time,
            break_minutes: 0,
            tag: "",
            color: "",
            done: false,
        },
    )?;
    history::recompute(conn, &date)
}

pub fn update_custom(conn: &Connection, id: i64, title: &str, start_time: &str, end_time: &str) -> Res<()> {
    conn.execute(
        "UPDATE todos SET title = ?1, start_time = ?2, end_time = ?3 WHERE id = ?4 AND kind = ?5",
        params![title.trim(), start_time, end_time, id, KIND_CUSTOM],
    )?;
    Ok(())
}

pub fn delete_custom(conn: &Connection, id: i64) -> Res<()> {
    let date: Option<String> = conn
        .query_row(
            "SELECT date FROM todos WHERE id = ?1 AND kind = ?2",
            params![id, KIND_CUSTOM],
            |r| r.get(0),
        )
        .optional()?;
    if let Some(date) = date {
        conn.execute("DELETE FROM todos WHERE id = ?1", [id])?;
        history::recompute(conn, &date)?;
    }
    Ok(())
}

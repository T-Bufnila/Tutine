use super::models::Tag;
use super::Res;
use rusqlite::{params, Connection};

pub fn list(conn: &Connection) -> Res<Vec<Tag>> {
    let mut stmt = conn.prepare("SELECT id, color, description FROM tags ORDER BY id")?;
    let rows = stmt.query_map([], |r| {
        Ok(Tag {
            id: r.get(0)?,
            color: r.get(1)?,
            description: r.get(2)?,
        })
    })?;
    rows.collect()
}

/// Returns false, changing nothing, when another tag already uses the colour.
pub fn add(conn: &Connection, color: &str, description: &str) -> Res<bool> {
    let changed = conn.execute(
        "INSERT INTO tags(color, description)
         SELECT ?1, ?2 WHERE NOT EXISTS (SELECT 1 FROM tags WHERE color = ?1)",
        params![color, description.trim()],
    )?;
    Ok(changed > 0)
}

/// Returns false, changing nothing, when another tag already uses the colour.
pub fn update(conn: &Connection, id: i64, color: &str, description: &str) -> Res<bool> {
    let changed = conn.execute(
        "UPDATE tags SET color = ?1, description = ?2
         WHERE id = ?3 AND NOT EXISTS (SELECT 1 FROM tags WHERE color = ?1 AND id != ?3)",
        params![color, description.trim(), id],
    )?;
    Ok(changed > 0)
}

/// Items and todos that used the tag fall back to "no tag" via ON DELETE SET NULL.
pub fn delete(conn: &Connection, id: i64) -> Res<()> {
    conn.execute("DELETE FROM tags WHERE id = ?1", [id])?;
    Ok(())
}

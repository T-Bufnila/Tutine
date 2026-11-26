use serde::{Deserialize, Serialize};

pub const KIND_ROUTINE: &str = "routine";
pub const KIND_BREAK: &str = "break";
pub const KIND_CUSTOM: &str = "custom";

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RoutineItem {
    #[serde(default)]
    pub id: Option<i64>,
    pub week_index: i64,
    pub weekday: i64,
    pub title: String,
    pub start_time: String,
    pub end_time: String,
    pub break_minutes: i64,
    #[serde(default)]
    pub tag_id: Option<i64>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Routine {
    #[serde(default)]
    pub id: Option<i64>,
    pub name: String,
    pub weeks: i64,
    pub start_date: String,
    #[serde(default)]
    pub pinned: bool,
    #[serde(default)]
    pub current_week: i64,
    #[serde(default)]
    pub items: Vec<RoutineItem>,
}

/// The routine that drives today's generated todos.
pub struct ActiveRoutine {
    pub id: i64,
    pub name: String,
    pub weeks: i64,
    pub start_date: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Todo {
    pub id: i64,
    pub kind: String,
    pub title: String,
    pub start_time: String,
    pub end_time: String,
    pub break_minutes: i64,
    pub tag_id: Option<i64>,
    pub done: bool,
    /// A note left in advance via Future Ref (routine todos only).
    pub note: Option<String>,
}

/// A colour label that routine items can reference; the description is optional.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Tag {
    pub id: i64,
    pub color: String,
    pub description: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TodayData {
    pub date: String,
    pub weekday: i64,
    pub active_routine_id: Option<i64>,
    pub active_routine_name: Option<String>,
    pub todos: Vec<Todo>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryDay {
    pub date: String,
    pub completed: i64,
    pub total: i64,
}

/// Metadata for an uploaded alert sound (the audio itself stays in the database).
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Sound {
    pub id: i64,
    pub name: String,
}

/// A routine item as scheduled on a future date, with any note left for it.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FutureItem {
    pub title: String,
    pub start_time: String,
    pub end_time: String,
    pub break_minutes: i64,
    pub tag_id: Option<i64>,
    pub note: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FutureDay {
    pub date: String,
    pub routine_id: Option<i64>,
    pub routine_name: Option<String>,
    pub items: Vec<FutureItem>,
}

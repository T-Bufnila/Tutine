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
    pub tag: String,
    pub color: String,
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
    pub date: String,
    pub kind: String,
    pub title: String,
    pub start_time: String,
    pub end_time: String,
    pub break_minutes: i64,
    pub tag: String,
    pub color: String,
    pub done: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TodayData {
    pub date: String,
    pub weekday: i64,
    pub active_routine_id: Option<i64>,
    pub active_routine_name: Option<String>,
    pub week_index: i64,
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

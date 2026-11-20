use chrono::{Datelike, Duration, Local, NaiveDate};

pub fn today() -> NaiveDate {
    Local::now().date_naive()
}

pub fn fmt_date(d: NaiveDate) -> String {
    d.format("%Y-%m-%d").to_string()
}

/// Monday = 0 … Sunday = 6.
pub fn weekday_index(d: NaiveDate) -> i64 {
    d.weekday().num_days_from_monday() as i64
}

fn week_floor(d: NaiveDate, sunday_start: bool) -> NaiveDate {
    let offset = if sunday_start {
        d.weekday().num_days_from_sunday()
    } else {
        d.weekday().num_days_from_monday()
    };
    d - Duration::days(offset as i64)
}

/// Zero-based week within a multi-week cycle that started on `start_date`.
pub fn current_week(start_date: &str, weeks: i64, sunday_start: bool) -> i64 {
    let now = today();
    let start = NaiveDate::parse_from_str(start_date, "%Y-%m-%d").unwrap_or(now);
    let elapsed = (week_floor(now, sunday_start) - week_floor(start, sunday_start))
        .num_days()
        .div_euclid(7);
    elapsed.rem_euclid(weeks.max(1))
}

/// Adds minutes to an `HH:MM` string, clamped to the end of the day.
pub fn add_minutes(time: &str, minutes: i64) -> String {
    let mut parts = time.split(':');
    let h: i64 = parts.next().and_then(|x| x.parse().ok()).unwrap_or(0);
    let m: i64 = parts.next().and_then(|x| x.parse().ok()).unwrap_or(0);
    let total = (h * 60 + m + minutes).min(23 * 60 + 59);
    format!("{:02}:{:02}", total / 60, total % 60)
}

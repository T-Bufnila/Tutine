//! Loopback receiver for the Spotify OAuth redirect.
//!
//! The frontend builds the PKCE authorize URL; this opens it in the system
//! browser and waits for Spotify to redirect back to `http://127.0.0.1:<port>`.

use std::io::{ErrorKind, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::thread::sleep;
use std::time::{Duration, Instant};

const AUTH_HOST: &str = "https://accounts.spotify.com/";
const CALLBACK_PATH: &str = "/callback";
const TIMEOUT: Duration = Duration::from_secs(180);
const POLL: Duration = Duration::from_millis(100);

const DONE_PAGE: &str = "<!doctype html><meta charset=\"utf-8\"><title>Tutine</title>\
<body style=\"font-family:sans-serif;text-align:center;padding-top:20vh\">\
<h2>Spotify connected</h2><p>You can close this tab and return to Tutine.</p></body>";

/// Bumped by every new attempt and by `cancel`, which makes older waits give up.
static ATTEMPT: AtomicU64 = AtomicU64::new(0);

pub(crate) fn open_in_browser(url: &str) -> Result<(), String> {
    let mut cmd = if cfg!(target_os = "macos") {
        let mut c = Command::new("open");
        c.arg(url);
        c
    } else if cfg!(target_os = "windows") {
        let mut c = Command::new("rundll32");
        c.args(["url.dll,FileProtocolHandler", url]);
        c
    } else {
        let mut c = Command::new("xdg-open");
        c.arg(url);
        c
    };
    cmd.spawn()
        .map(|_| ())
        .map_err(|e| format!("Could not open the browser: {e}"))
}

fn respond(stream: &mut TcpStream, status: &str, body: &str) {
    let reply = format!(
        "HTTP/1.1 {status}\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
        body.len()
    );
    let _ = stream.write_all(reply.as_bytes());
}

/// Returns the request target (path and query) if this was the redirect.
fn read_callback(stream: &mut TcpStream) -> Option<String> {
    stream.set_nonblocking(false).ok()?;
    stream.set_read_timeout(Some(Duration::from_secs(2))).ok()?;
    let mut buf = [0u8; 4096];
    let n = stream.read(&mut buf).ok()?;
    let request = String::from_utf8_lossy(&buf[..n]);
    let target = request.lines().next()?.split_whitespace().nth(1)?.to_string();
    if target.starts_with(CALLBACK_PATH) {
        respond(stream, "200 OK", DONE_PAGE);
        Some(target)
    } else {
        respond(stream, "404 Not Found", "");
        None
    }
}

fn wait_for_callback(listener: TcpListener, attempt: u64) -> Result<String, String> {
    listener.set_nonblocking(true).map_err(|e| e.to_string())?;
    let deadline = Instant::now() + TIMEOUT;
    while Instant::now() < deadline {
        if ATTEMPT.load(Ordering::SeqCst) != attempt {
            return Err("Spotify sign-in was cancelled".into());
        }
        match listener.accept() {
            Ok((mut stream, _)) => {
                if let Some(target) = read_callback(&mut stream) {
                    return Ok(target);
                }
            }
            Err(e) if e.kind() == ErrorKind::WouldBlock => sleep(POLL),
            Err(e) => return Err(e.to_string()),
        }
    }
    Err("Spotify sign-in timed out".into())
}

/// Opens `url` in the browser and resolves with the redirect's path and query.
#[tauri::command]
pub async fn spotify_authorize(url: String, port: u16) -> Result<String, String> {
    if !url.starts_with(AUTH_HOST) {
        return Err("Unexpected authorization URL".into());
    }
    let attempt = ATTEMPT.fetch_add(1, Ordering::SeqCst) + 1;
    // Bind before opening the browser so the redirect can never be missed.
    let listener = TcpListener::bind(("127.0.0.1", port))
        .map_err(|e| format!("Could not listen on port {port} for the Spotify redirect: {e}"))?;
    open_in_browser(&url)?;
    tauri::async_runtime::spawn_blocking(move || wait_for_callback(listener, attempt))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn spotify_cancel_authorize() {
    ATTEMPT.fetch_add(1, Ordering::SeqCst);
}

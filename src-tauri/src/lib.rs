use tauri::command;

#[command]
fn print_raw_escpos(payload: String, printer_target: String) -> Result<String, String> {
    println!("[Tauri Rust] Sending ESC/POS payload to printer target '{}'", printer_target);
    // In production, write raw bytes to COM port, USB endpoint, or LPT1/Raw socket
    // Example: let mut port = serialport::new(printer_target, 9600).open()?;
    // port.write_all(payload.as_bytes())?;
    Ok(format!("Receipt successfully dispatched (bytes: {})", payload.len()))
}

#[command]
fn kick_cash_drawer() -> Result<String, String> {
    println!("[Tauri Rust] Firing pulse 27,112,0,25,250 to kick drawer");
    // Standard ESC/POS drawer kick sequence: ESC p m t1 t2 (27, 112, 0, 25, 250)
    Ok("Cash drawer pulse sent".into())
}

#[command]
fn get_hardware_status() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "thermalPrinter": "Online (USB-001)",
        "cashDrawer": "Ready",
        "barcodeScanner": "HID Active",
        "offlineDb": "SQLite Active"
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            print_raw_escpos,
            kick_cash_drawer,
            get_hardware_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

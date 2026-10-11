/**
 * Platform detection and hardware abstraction layer.
 * Seamlessly distinguishes between:
 * 1. Web POS (Runs in browser/tablets, uses IndexedDB, browser print)
 * 2. Desktop POS (Runs in Tauri 2 runtime, uses local SQLite, raw ESC/POS hardware printer, serial scanner)
 */

export interface PlatformInfo {
  isTauri: boolean;
  platformType: 'DESKTOP' | 'WEB';
  os: 'windows' | 'macos' | 'linux' | 'browser';
  hasHardwarePrinter: boolean;
  hasHardwareDrawer: boolean;
}

export function isTauriDesktop(): boolean {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
}

export function getPlatformInfo(): PlatformInfo {
  const isDesktop = isTauriDesktop();
  let os: PlatformInfo['os'] = 'browser';

  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) os = 'windows';
    else if (ua.includes('mac')) os = 'macos';
    else if (ua.includes('linux')) os = 'linux';
  }

  return {
    isTauri: isDesktop,
    platformType: isDesktop ? 'DESKTOP' : 'WEB',
    os,
    hasHardwarePrinter: isDesktop,
    hasHardwareDrawer: isDesktop
  };
}

export interface PrinterDevice {
  name: string;
  type: 'USB' | 'NETWORK' | 'SERIAL' | 'BROWSER_DEFAULT';
  target: string;
}

export async function printReceipt(receiptText: string, printer?: PrinterDevice): Promise<boolean> {
  if (isTauriDesktop()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      // Invokes Rust command registered in Tauri 2 src-tauri/src/lib.rs
      await invoke('print_raw_escpos', {
        payload: receiptText,
        printerTarget: printer?.target || 'default'
      });
      return true;
    } catch (err) {
      console.warn('Native printer failed, falling back to browser print:', err);
    }
  }

  // Web POS fallback: Browser print dialog or virtual printer window
  const printWindow = window.open('', '_blank', 'width=350,height=600');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: monospace; font-size: 12px; white-space: pre-wrap; margin: 10px; }
          </style>
        </head>
        <body>${receiptText}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    return true;
  }

  return false;
}

export async function openCashDrawer(): Promise<boolean> {
  if (isTauriDesktop()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('kick_cash_drawer');
      return true;
    } catch (e) {
      console.error('Failed to trigger native cash drawer:', e);
    }
  }
  console.log('[Web Mode] Cash drawer kick triggered (simulated)');
  return true;
}

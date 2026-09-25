import { Injectable } from '@angular/core';

/**
 * Thin wrapper around the browser APIs for getting files in and out of the page.
 * Injectable so specs can substitute it instead of driving real downloads and
 * file pickers.
 */
@Injectable({ providedIn: 'root' })
export class FileTransferService {
  /** Triggers a browser download of `text` under `fileName`. */
  download(text: string, fileName: string, type = 'application/json'): void {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  /** Opens the native file picker and resolves with the chosen file, or `null` if cancelled. */
  pick(accept = 'application/json,.json'): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.addEventListener('change', () => resolve(input.files?.[0] ?? null), { once: true });
      input.addEventListener('cancel', () => resolve(null), { once: true });
      input.click();
    });
  }

  /** Extracts the first file from a drag & drop event, if there is one. */
  fromDropEvent(event: DragEvent): File | null {
    const items = event.dataTransfer?.items;
    if (items?.length) {
      for (const item of Array.from(items)) {
        if (item.kind === 'file') {
          return item.getAsFile();
        }
      }
    }
    return event.dataTransfer?.files?.[0] ?? null;
  }
}

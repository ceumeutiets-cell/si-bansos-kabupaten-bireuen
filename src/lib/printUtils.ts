/**
 * Utility function to handle printing safely across all browsers and sandboxed iframes.
 */
export const triggerPrint = (
  targetSelector: string = '.print-document, .print-area, .hidden.print\\:block',
  docTitle: string = 'Laporan SI-BANSOS Dinas Sosial Kabupaten Bireuen'
) => {
  try {
    // 1. First try opening a clean print pop-up window (best for iframe sandbox compatibility)
    openPrintWindow(targetSelector, docTitle);
  } catch (err) {
    console.warn('Print window blocked or failed, attempting window.print():', err);
    try {
      window.print();
    } catch (winErr) {
      fallbackIframePrint(targetSelector);
    }
  }
};

/**
 * Opens a clean printable popup window containing the formatted report HTML.
 * Triggers native browser print dialog (which enables printing to printer OR saving as PDF).
 */
export const openPrintWindow = (
  targetSelector: string = '.print-document, .print-area, .hidden.print\\:block',
  docTitle: string = 'Laporan SI-BANSOS Dinas Sosial Kabupaten Bireuen'
) => {
  try {
    const printableEl = document.querySelector(targetSelector) || 
                        document.querySelector('.print-document') || 
                        document.querySelector('.hidden.print\\:block') || 
                        document.querySelector('#root');
                        
    if (!printableEl) {
      alert('Tidak ada dokumen yang dapat dicetak.');
      return;
    }

    const printWin = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
    if (!printWin) {
      // If popup blocked, fallback to direct window.print()
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${docTitle}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { background-color: #ffffff !important; color: #0f172a !important; margin: 0 !important; padding: 10px !important; }
              .no-print { display: none !important; }
              table { width: 100% !important; border-collapse: collapse !important; }
              th, td { border: 1px solid #1e293b !important; padding: 6px 8px !important; font-size: 11px !important; color: #0f172a !important; }
              @page { size: A4 landscape; margin: 10mm; }
            }
            body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background-color: #ffffff; color: #0f172a; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #1e293b; padding: 6px 8px; font-size: 11px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .no-print-toolbar {
              background-color: #0f172a;
              color: #ffffff;
              padding: 12px 20px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-radius: 12px;
              margin-bottom: 20px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .btn-print {
              background-color: #10b981;
              color: #ffffff;
              border: none;
              padding: 8px 18px;
              border-radius: 8px;
              font-weight: 700;
              font-size: 13px;
              cursor: pointer;
              transition: background-color 0.2s;
            }
            .btn-print:hover { background-color: #059669; }
            .btn-close {
              background-color: #334155;
              color: #ffffff;
              border: none;
              padding: 8px 18px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 13px;
              cursor: pointer;
            }
            .btn-close:hover { background-color: #475569; }
          </style>
        </head>
        <body>
          <div class="no-print-toolbar no-print">
            <div>
              <strong style="font-size:14px; display:block; color:#34d399;">🖨️ Cetak Dokumen / Simpan PDF Browser</strong>
              <span style="font-size:12px; opacity:0.85;">Pilih printer fisik Anda atau pilih "Simpan sebagai PDF" pada dialog cetak browser</span>
            </div>
            <div style="display:flex; gap:10px;">
              <button class="btn-print" onclick="window.print()">Cetak / Simpan PDF</button>
              <button class="btn-close" onclick="window.close()">Tutup Window</button>
            </div>
          </div>

          <div class="printable-area">
            ${printableEl.innerHTML}
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
  } catch (err) {
    console.error('Error in openPrintWindow:', err);
    window.print();
  }
};

/**
 * Fallback print mechanism using an invisible temporary iframe.
 * Used when window.print() is restricted by iframe sandboxing or security policies.
 */
export const fallbackIframePrint = (targetSelector: string) => {
  try {
    const printableEl = document.querySelector(targetSelector) || 
                        document.querySelector('.print-document') || 
                        document.querySelector('.hidden.print\\:block') || 
                        document.querySelector('#root');
                        
    if (!printableEl) {
      alert('Tidak ada dokumen yang dapat dicetak.');
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(node => node.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Laporan - Dinas Sosial Kabupaten Bireuen</title>
          ${styles}
          <style>
            body {
              background-color: #ffffff !important;
              color: #0f172a !important;
              padding: 20px !important;
              margin: 0 !important;
              font-family: ui-sans-serif, system-ui, -apple-system, sans-serif !important;
            }
            .print\\:hidden, header, sidebar, nav, button {
              display: none !important;
            }
            .hidden.print\\:block, .print\\:block {
              display: block !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            th, td {
              border: 1px solid #1e293b !important;
              padding: 6px 8px !important;
              color: #0f172a !important;
            }
            @page {
              size: auto;
              margin: 10mm;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${printableEl.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 500);

  } catch (error) {
    console.error('Fallback iframe printing error:', error);
  }
};


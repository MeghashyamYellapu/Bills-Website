## Packages
html2canvas | For capturing the receipt DOM element as an image
jspdf | For generating PDF files from the captured image
lucide-react | For beautiful icons (printer, download, share, etc.)
date-fns | For easy date formatting

## Notes
- The receipt preview must use a specific font to match the reference style (e.g., 'Courier Prime' or 'Space Mono' for data, 'Times New Roman' for headers).
- WhatsApp sharing link format: `https://wa.me/{number}?text={message}`
- The backend API provides CRUD operations for saving receipts, but the primary user flow is: Input -> Preview -> Download/Share.

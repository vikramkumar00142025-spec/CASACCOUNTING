/**
 * UPI (Unified Payments Interface) Payment Protocol Utilities
 * Compliant with NPCI UPI 2.0 specifications for Dynamic Merchant & Peer QR Codes.
 */

export interface UPIPaymentParams {
  upiId: string; // Payee VPA / UPI ID (e.g. zenithapex@hdfcbank)
  payeeName: string; // Payee Business / Merchant Name
  amount: number; // Exact payment amount in INR
  transactionRef?: string; // Unique Invoice / Order / Reference Number
  transactionNote?: string; // Purpose / Remarks shown in customer UPI app
  merchantCode?: string; // MCC code (optional, e.g. 5411)
  currency?: string; // Default 'INR'
}

/**
 * Builds standard NPCI-compliant UPI deep-link string:
 * e.g. upi://pay?pa=zenithapex@hdfcbank&pn=Zenith%20Apex&am=4500.00&cu=INR&tr=INV-001&tn=Payment%20for%20INV-001
 */
export function buildUPIUrl({
  upiId,
  payeeName,
  amount,
  transactionRef = '',
  transactionNote = '',
  merchantCode = '',
  currency = 'INR',
}: UPIPaymentParams): string {
  const cleanUpiId = (upiId || '').trim();
  const cleanPayee = (payeeName || '').trim();
  const safeAmount = Math.max(0, Number(amount) || 0).toFixed(2);

  const params = new URLSearchParams();
  params.set('pa', cleanUpiId);
  params.set('pn', cleanPayee);
  params.set('am', safeAmount);
  params.set('cu', currency || 'INR');

  if (transactionRef) {
    // tr is the merchant transaction reference ID
    params.set('tr', transactionRef.trim().replace(/[^a-zA-Z0-9_-]/g, ''));
  }

  if (transactionNote) {
    // tn is the transaction note / description
    params.set('tn', transactionNote.trim().slice(0, 80));
  }

  if (merchantCode) {
    params.set('mc', merchantCode.trim());
  }

  return `upi://pay?${params.toString()}`;
}

/**
 * Validate standard UPI VPA format (e.g. name@bank or 9876543210@paytm)
 */
export function isValidUPIVpa(vpa: string): boolean {
  if (!vpa) return false;
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z0-9]{2,32}$/;
  return upiRegex.test(vpa.trim());
}

/**
 * Formats a clean WhatsApp share message with invoice details and quick UPI link
 */
export function buildWhatsAppPaymentMessage({
  invoiceNumber,
  customerName,
  amountFormatted,
  dueDate,
  companyName,
  upiId,
  upiUrl,
}: {
  invoiceNumber: string;
  customerName: string;
  amountFormatted: string;
  dueDate?: string;
  companyName: string;
  upiId: string;
  upiUrl: string;
}): string {
  return encodeURIComponent(
    `Hello ${customerName || 'Customer'},\n\n` +
    `⚡ *Payment Request for Invoice ${invoiceNumber}*\n` +
    `🏢 *${companyName}*\n\n` +
    `💰 *Payable Amount:* ${amountFormatted}\n` +
    (dueDate ? `📅 *Due Date:* ${dueDate}\n` : '') +
    `💳 *UPI VPA:* \`${upiId}\`\n\n` +
    `👉 *Click here to pay instantly via any UPI app (GPay / PhonePe / Paytm / BHIM):*\n` +
    `${upiUrl}\n\n` +
    `Or scan the dynamic QR code on the invoice.\n` +
    `Thank you for your prompt payment!`
  );
}

/**
 * Downloads a rendered canvas or SVG element as a crisp PNG image
 */
export function downloadQRCodeElement(elementId: string, filename: string): void {
  if (typeof window === 'undefined') return;

  const container = document.getElementById(elementId);
  if (!container) return;

  // If there's an HTML5 canvas inside:
  const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
  if (canvas) {
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    return;
  }

  // If there's an SVG inside:
  const svg = container.querySelector('svg') as SVGSVGElement | null;
  if (svg) {
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const DOMURL = window.URL || window.webkitURL || window;
    const url = DOMURL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 600;
      exportCanvas.height = 600;
      const ctx = exportCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 600, 600);
        ctx.drawImage(img, 30, 30, 540, 540);
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
      }
      DOMURL.revokeObjectURL(url);
    };
    img.src = url;
  }
}

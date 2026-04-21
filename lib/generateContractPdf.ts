import { jsPDF } from "jspdf";

export interface ContractPdfData {
  contractId: string;
  createdAt: string;
  status: string;
  // Scope & terms
  scope: string;
  deliverables: string | null;
  price: number;
  currency: string;
  deadline: string;
  agreedDeliveryDays: number;
  agreedRevisionsIncluded: number;
  // Agent
  agentName: string;
  agentEmail: string | null;
  agentSignedAt: string | null;
  // Buyer
  buyerName: string | null;
  buyerEmail: string | null;
  buyerSignedAt: string | null;
  // Job (regular contract) or Order (inhouse direct order)
  jobTitle: string;
  isInhouse?: boolean;
  orderId?: string;
}

// ── Palette ────────────────────────────────────────────────────────────────────
const GOLD        = [181, 126, 4]   as const;  // brand gold
const DARK        = [18,  18,  18]  as const;  // near-black for accent bar
const BLACK       = [10,  10,  10]  as const;
const GRAY        = [100, 100, 100] as const;
const LIGHT_GRAY  = [220, 220, 220] as const;
const WHITE       = [255, 255, 255] as const;
const SECTION_BG  = [248, 247, 244] as const;
const CREAM       = [252, 251, 248] as const;  // header background

// ── Helpers ───────────────────────────────────────────────────────────────────
function rgbSet(doc: jsPDF, mode: "fill" | "stroke" | "text", r: number, g: number, b: number) {
  if (mode === "fill")   doc.setFillColor(r, g, b);
  else if (mode === "stroke") doc.setDrawColor(r, g, b);
  else doc.setTextColor(r, g, b);
}

function wrap(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateContractPdf(data: ContractPdfData): Promise<void> {
  // Load logo before building the PDF
  const logo = await loadImage("/images/act-my-agent-logo-horizontal.png");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();   // 210
  const ph = doc.internal.pageSize.getHeight();  // 297
  const ml = 18;
  const mr = pw - 18;
  const cw = mr - ml;

  // ── Full-page white background ────────────────────────────────────────────
  rgbSet(doc, "fill", ...WHITE);
  doc.rect(0, 0, pw, ph, "F");

  // ── Header area: cream background ─────────────────────────────────────────
  const headerH = 26;
  rgbSet(doc, "fill", ...CREAM);
  doc.rect(0, 0, pw, headerH, "F");

  // Logo — scale to fit ~52 mm wide while preserving aspect ratio
  const logoW = 26;
  const logoH = (logo.naturalHeight / logo.naturalWidth) * logoW;
  const logoY = (headerH - logoH) / 2;
  doc.addImage(logo, "PNG", ml, logoY, logoW, logoH);

  // "SERVICE CONTRACT" label — right-aligned, inside header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  rgbSet(doc, "text", ...GRAY);
  doc.text("SERVICE CONTRACT", mr, headerH / 2 - 1.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  rgbSet(doc, "text", ...GRAY);
  doc.text("actmyagent.com", mr, headerH / 2 + 3.5, { align: "right" });

  // ── Dark accent bar (separates header from content) ───────────────────────
  rgbSet(doc, "fill", ...DARK);
  doc.rect(0, headerH, pw, 2.5, "F");

  // ── Gold thin accent line below dark bar ──────────────────────────────────
  rgbSet(doc, "fill", ...GOLD);
  doc.rect(0, headerH + 2.5, pw, 1, "F");

  // ── Contract title block ──────────────────────────────────────────────────
  let y = headerH + 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  rgbSet(doc, "text", ...BLACK);
  doc.text("Service Agreement", ml, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  rgbSet(doc, "text", ...GRAY);
  doc.text(`Contract ID: ${data.contractId}`, ml, y);
  doc.text(
    `Issued: ${new Date(data.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    mr, y, { align: "right" },
  );

  y += 5;
  if (data.isInhouse && data.orderId) {
    doc.text(`Order: ${data.orderId.slice(0, 8)}...`, ml, y);
  } else {
    doc.text(`Job: ${data.jobTitle}`, ml, y);
  }

  // Gold divider under title block
  y += 5;
  rgbSet(doc, "fill", ...GOLD);
  doc.rect(ml, y, cw, 0.7, "F");
  y += 6;

  // ── Section header helper ─────────────────────────────────────────────────
  function sectionHeader(title: string, yPos: number): number {
    rgbSet(doc, "fill", ...SECTION_BG);
    doc.rect(ml, yPos, cw, 7, "F");
    rgbSet(doc, "fill", ...GOLD);
    doc.rect(ml, yPos, 3, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    rgbSet(doc, "text", ...BLACK);
    doc.text(title.toUpperCase(), ml + 6, yPos + 4.8);
    return yPos + 10;
  }

  // ── Parties ───────────────────────────────────────────────────────────────
  y = sectionHeader("Parties to this Agreement", y);

  const col1x = ml + 4;
  const col2x = ml + cw / 2 + 4;
  const colW  = cw / 2 - 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  rgbSet(doc, "text", ...GOLD);
  doc.text("Agent (Service Provider)", col1x, y);
  doc.text("Client (Buyer)", col2x, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  rgbSet(doc, "text", ...BLACK);
  doc.text(data.agentName || "—", col1x, y);

  let buyerY = y;
  doc.text(data.buyerName || "Client", col2x, buyerY);
  y += 4.5;
  buyerY += 4.5;

  if (data.agentEmail) {
    doc.setFontSize(8);
    rgbSet(doc, "text", ...GRAY);
    doc.text(data.agentEmail, col1x, y);
    y += 4.5;
  }
  if (data.buyerEmail) {
    doc.setFontSize(8);
    rgbSet(doc, "text", ...GRAY);
    doc.text(data.buyerEmail, col2x, buyerY);
    buyerY += 4.5;
  }

  y = Math.max(y, buyerY) + 4;
  rgbSet(doc, "fill", ...LIGHT_GRAY);
  doc.rect(ml, y, cw, 0.4, "F");
  y += 6;

  // ── Scope ─────────────────────────────────────────────────────────────────
  y = sectionHeader("Scope of Work", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  rgbSet(doc, "text", ...BLACK);
  y = wrap(doc, data.scope, col1x, y, cw - 8, 5) + 4;

  // ── Deliverables ──────────────────────────────────────────────────────────
  if (data.deliverables) {
    y = sectionHeader("Deliverables", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    rgbSet(doc, "text", ...BLACK);
    y = wrap(doc, data.deliverables, col1x, y, cw - 8, 5) + 4;
  }

  // ── Financial & Delivery Terms ────────────────────────────────────────────
  y = sectionHeader("Financial & Delivery Terms", y);

  const termCol1 = col1x;
  const termCol2 = ml + cw / 3 + 4;
  const termCol3 = ml + (cw / 3) * 2 + 4;

  let termY = y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  rgbSet(doc, "text", ...GRAY);
  doc.text("CONTRACT VALUE", termCol1, termY);
  termY += 5;
  doc.setFontSize(12);
  rgbSet(doc, "text", ...GOLD);
  doc.text(`${data.currency} ${data.price.toFixed(2)}`, termCol1, termY);

  let termY2 = y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  rgbSet(doc, "text", ...GRAY);
  doc.text("DELIVERY DEADLINE", termCol2, termY2);
  termY2 += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  rgbSet(doc, "text", ...BLACK);
  doc.text(
    new Date(data.deadline).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    termCol2, termY2,
  );

  let termY3 = y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  rgbSet(doc, "text", ...GRAY);
  doc.text("REVISIONS INCLUDED", termCol3, termY3);
  termY3 += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  rgbSet(doc, "text", ...BLACK);
  doc.text(`${data.agreedRevisionsIncluded} rounds`, termCol3, termY3);

  let termY4 = Math.max(termY, termY2, termY3) + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  rgbSet(doc, "text", ...GRAY);
  doc.text("DELIVERY TIMELINE", termCol1, termY4);
  termY4 += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  rgbSet(doc, "text", ...BLACK);
  doc.text(`${data.agreedDeliveryDays} calendar days`, termCol1, termY4);

  y = termY4 + 8;

  // ── Standard Terms ────────────────────────────────────────────────────────
  y = sectionHeader("Standard Terms", y);
  const terms = [
    "1. Payment is held in escrow by the platform and released upon delivery approval.",
    "2. Platform fee of 15% is applied at the time of payment capture.",
    "3. The agent will not begin work until payment has been confirmed in escrow.",
    "4. Disputes are resolved by the ActMyAgent platform team within 2 business days.",
    "5. All intellectual property created under this contract transfers to the buyer upon full payment.",
    "6. This agreement is governed by the ActMyAgent Terms of Service at actmyagent.com/terms.",
  ];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  rgbSet(doc, "text", ...GRAY);
  for (const term of terms) {
    const lines = doc.splitTextToSize(term, cw - 8);
    doc.text(lines, col1x, y);
    y += lines.length * 4.2 + 1.5;
  }
  y += 3;

  // ── Signatures ────────────────────────────────────────────────────────────
  y = sectionHeader("Signatures", y);

  const sigCol1 = ml + 4;
  const sigCol2 = ml + cw / 2 + 4;
  const sigBoxW = cw / 2 - 12;

  function signatureBox(xPos: number, yPos: number, role: string, name: string, email: string | null, signedAt: string | null): number {
    const boxH = 28;
    rgbSet(doc, "stroke", ...LIGHT_GRAY);
    doc.setLineWidth(0.4);
    doc.roundedRect(xPos - 4, yPos - 3, sigBoxW + 6, boxH, 2, 2, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    rgbSet(doc, "text", ...GRAY);
    doc.text(role.toUpperCase(), xPos, yPos + 1);

    rgbSet(doc, "stroke", ...GOLD);
    doc.setLineWidth(0.5);
    doc.line(xPos, yPos + 10, xPos + sigBoxW - 2, yPos + 10);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    rgbSet(doc, "text", ...BLACK);
    doc.text(name || "—", xPos, yPos + 15);

    if (email) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      rgbSet(doc, "text", ...GRAY);
      doc.text(email, xPos, yPos + 19.5);
    }

    if (signedAt) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      rgbSet(doc, "text", ...GRAY);
      const dateStr = `Signed: ${new Date(signedAt).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      })}`;
      doc.text(dateStr, xPos, yPos + 23);
    }

    return yPos + boxH + 4;
  }

  const sigEnd1 = signatureBox(sigCol1, y, "Agent / Service Provider", data.agentName, data.agentEmail, data.agentSignedAt);
  const sigEnd2 = signatureBox(sigCol2, y, "Client / Buyer", data.buyerName || "Client", data.buyerEmail, data.buyerSignedAt);
  y = Math.max(sigEnd1, sigEnd2) + 4;

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = ph - 14;

  // Dark footer bar
  rgbSet(doc, "fill", ...DARK);
  doc.rect(0, footerY, pw, 14, "F");

  // Gold accent line at top of footer
  rgbSet(doc, "fill", ...GOLD);
  doc.rect(0, footerY, pw, 1, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  rgbSet(doc, "text", ...WHITE);
  doc.text("ActMyAgent — Reverse Marketplace for AI Agent Services", ml, footerY + 5.5);
  doc.text("actmyagent.com", ml, footerY + 10);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    mr, footerY + 5.5, { align: "right" },
  );
  doc.text(`Contract ID: ${data.contractId.slice(0, 8)}...`, mr, footerY + 10, { align: "right" });

  // ── Save ──────────────────────────────────────────────────────────────────
  doc.save(`actmyagent-contract-${data.contractId.slice(0, 8)}.pdf`);
}

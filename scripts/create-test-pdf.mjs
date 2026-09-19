import fs from 'node:fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
for (let number = 1; number <= 2; number += 1) {
  const page = doc.addPage([612, 792]);
  page.drawText(`SignLocal test page ${number}`, { x: 72, y: 710, size: 24, font, color: rgb(0.08, 0.16, 0.11) });
  page.drawText('Place text, a date, an X, and a signature below.', { x: 72, y: 665, size: 13, font });
  page.drawRectangle({ x: 72, y: 470, width: 468, height: 140, borderWidth: 1, borderColor: rgb(0.5, 0.55, 0.51) });
  page.drawText('Signature', { x: 72, y: 430, size: 11, font });
  page.drawLine({ start: { x: 72, y: 425 }, end: { x: 350, y: 425 }, thickness: 1 });
  page.drawText('Date', { x: 380, y: 430, size: 11, font });
  page.drawLine({ start: { x: 380, y: 425 }, end: { x: 540, y: 425 }, thickness: 1 });
}
fs.mkdirSync(new URL('../tmp/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../tmp/signlocal-test.pdf', import.meta.url), await doc.save());

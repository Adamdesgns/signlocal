import { useEffect, useMemo, useRef, useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const MAX_BYTES = 25 * 1024 * 1024;
const uid = () => crypto.randomUUID();
const isoDate = () => new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111814';
  }, []);

  const point = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return [(event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height];
  };

  const start = (event) => {
    drawing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const [x, y] = point(event);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (event) => {
    if (!drawing.current) return;
    const [x, y] = point(event);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return <div className="signature-box">
    <canvas ref={canvasRef} width="720" height="180" onPointerDown={start} onPointerMove={move} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} aria-label="Signature drawing pad" />
    <button className="text-button" type="button" onClick={clear}>Clear signature</button>
  </div>;
}

function UploadScreen({ onFile }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const accept = (file) => {
    if (file) onFile(file);
  };

  return <main className="landing">
    <nav className="nav"><div className="brand"><span className="brand-mark">S</span><span>SignLocal</span></div><span className="byline">by Adam Designs</span></nav>
    <section className="hero">
      <div className="privacy-pill"><span className="pulse" /> Your PDF never leaves your device</div>
      <h1>Sign a PDF.<br /><em>Keep it private.</em></h1>
      <p className="lede">Add text, dates, checkmarks, and your handwritten signature. No account. No upload. No Adobe subscription.</p>
      <div className={`dropzone ${dragging ? 'dragging' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files[0]); }} onClick={() => inputRef.current.click()}>
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={(e) => accept(e.target.files[0])} hidden />
        <div className="upload-icon">↥</div>
        <strong>Choose a PDF</strong>
        <span>or drop it here · up to 25 MB</span>
      </div>
      <div className="trust-grid">
        <div><b>100% local</b><span>Editing happens in your browser</span></div>
        <div><b>No tracking</b><span>No analytics, accounts, or cookies</span></div>
        <div><b>Free to use</b><span>Download the finished PDF instantly</span></div>
      </div>
    </section>
    <footer>Built by Adam Designs · Private by design</footer>
  </main>;
}

export default function App() {
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [pdfBytes, setPdfBytes] = useState(null);
  const [pdfView, setPdfView] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState({ width: 612, height: 792 });
  const [renderScale, setRenderScale] = useState(1);
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [pending, setPending] = useState(null);
  const [textValue, setTextValue] = useState('');
  const [dateValue, setDateValue] = useState(isoDate());
  const [fontSize, setFontSize] = useState(14);
  const [signature, setSignature] = useState('');
  const [message, setMessage] = useState('');
  const [downloading, setDownloading] = useState(false);
  const dragRef = useRef(null);

  const pageItems = useMemo(() => items.filter((item) => item.page === pageNumber), [items, pageNumber]);

  const loadFile = async (file) => {
    setMessage('');
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return setMessage('Choose a PDF file.');
    if (file.size > MAX_BYTES) return setMessage('That PDF is larger than 25 MB.');
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const view = await pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)) }).promise;
      setFileName(file.name);
      setPdfBytes(bytes);
      setPdfView(view);
      setPageNumber(1);
      setItems([]);
      setMessage('');
    } catch {
      setMessage('This PDF could not be opened. Password-protected PDFs are not supported yet.');
    }
  };

  useEffect(() => {
    if (!pdfView) return;
    let cancelled = false;
    (async () => {
      const page = await pdfView.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const available = Math.min(900, (viewerRef.current?.clientWidth || 900) - 32);
      const scale = Math.max(0.5, available / base.width);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = viewport.width * ratio;
      canvas.height = viewport.height * ratio;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      const context = canvas.getContext('2d');
      context.setTransform(1, 0, 0, 1, 0, 0);
      await page.render({ canvasContext: context, viewport, transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0] }).promise;
      if (!cancelled) {
        setPageSize({ width: base.width, height: base.height });
        setRenderScale(scale);
      }
    })();
    return () => { cancelled = true; };
  }, [pdfView, pageNumber]);

  useEffect(() => {
    const move = (event) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = (event.clientX - drag.clientX) / renderScale;
      const dy = (event.clientY - drag.clientY) / renderScale;
      setItems((current) => current.map((item) => item.id === drag.id ? {
        ...item,
        x: Math.max(0, Math.min(pageSize.width - item.width, drag.x + dx)),
        y: Math.max(0, Math.min(pageSize.height - item.height, drag.y - dy)),
      } : item));
    };
    const up = () => { dragRef.current = null; };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [renderScale, pageSize]);

  const beginPlace = (type) => {
    if (type === 'text' && !textValue.trim()) return setMessage('Type the text you want to place first.');
    if (type === 'signature' && !signature) return setMessage('Draw your signature first.');
    setPending(type);
    setMessage(`Click the PDF where you want to place the ${type}.`);
  };

  const place = (event) => {
    if (!pending) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / renderScale;
    const top = (event.clientY - rect.top) / renderScale;
    let item;
    if (pending === 'signature') item = { id: uid(), type: 'signature', page: pageNumber, x, y: pageSize.height - top - 42, width: 170, height: 42, data: signature };
    else if (pending === 'check') item = { id: uid(), type: 'check', page: pageNumber, x, y: pageSize.height - top - 18, width: 18, height: 18, text: 'X', fontSize: 16 };
    else {
      const value = pending === 'date' ? dateValue : textValue.trim();
      const width = Math.max(55, value.length * fontSize * 0.58);
      item = { id: uid(), type: pending, page: pageNumber, x, y: pageSize.height - top - fontSize, width, height: fontSize + 5, text: value, fontSize };
    }
    setItems((current) => [...current, item]);
    setSelectedId(item.id);
    setPending(null);
    setMessage('Placed. Drag it to fine-tune the position.');
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setItems((current) => current.filter((item) => item.id !== selectedId));
    setSelectedId(null);
  };

  const undo = () => setItems((current) => current.slice(0, -1));

  const download = async () => {
    if (!pdfBytes || !items.length) return setMessage('Add at least one item before downloading.');
    setDownloading(true);
    setMessage('Building your PDF locally…');
    try {
      const doc = await PDFDocument.load(pdfBytes);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const bold = await doc.embedFont(StandardFonts.HelveticaBold);
      const imageCache = new Map();
      for (const item of items) {
        const page = doc.getPage(item.page - 1);
        if (item.type === 'signature') {
          let image = imageCache.get(item.data);
          if (!image) { image = await doc.embedPng(item.data); imageCache.set(item.data, image); }
          page.drawImage(image, { x: item.x, y: item.y, width: item.width, height: item.height });
        } else {
          page.drawText(item.text, { x: item.x, y: item.y, size: item.fontSize, font: item.type === 'check' ? bold : font, color: rgb(0.03, 0.04, 0.035) });
        }
      }
      const finished = await doc.save();
      const blob = new Blob([finished], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName.replace(/\.pdf$/i, '')}-signed.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      setMessage('Downloaded. Your original PDF was not changed.');
    } catch {
      setMessage('The PDF could not be exported. Try a different PDF.');
    } finally { setDownloading(false); }
  };

  if (!pdfView) return <><UploadScreen onFile={loadFile} />{message && <div className="toast error">{message}</div>}</>;

  return <div className="app-shell">
    <header className="app-header">
      <div className="brand"><span className="brand-mark">S</span><span>SignLocal</span></div>
      <div className="file-chip" title={fileName}>{fileName}</div>
      <div className="header-actions">
        <button className="ghost" onClick={() => { setPdfView(null); setPdfBytes(null); setItems([]); }}>New PDF</button>
        <button className="download" onClick={download} disabled={downloading}>{downloading ? 'Building…' : 'Download PDF'}</button>
      </div>
    </header>
    <div className="workspace">
      <aside className="tool-panel">
        <div className="privacy-note"><span>●</span><div><b>Local editing</b><small>This file is never uploaded.</small></div></div>
        <section><h2>Add text</h2><input value={textValue} onChange={(e) => setTextValue(e.target.value)} placeholder="Name, address, note…" /><div className="compact-row"><label>Size <input type="number" min="8" max="36" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} /></label><button onClick={() => beginPlace('text')}>Place text</button></div></section>
        <section><h2>Add date</h2><input value={dateValue} onChange={(e) => setDateValue(e.target.value)} /><button className="wide" onClick={() => beginPlace('date')}>Place date</button></section>
        <section><h2>Sign</h2><SignaturePad onChange={setSignature} /><button className="wide primary" onClick={() => beginPlace('signature')}>Place signature</button></section>
        <section><h2>Mark a box</h2><button className="wide" onClick={() => beginPlace('check')}>Place X mark</button></section>
        <section className="edit-actions"><button onClick={undo} disabled={!items.length}>Undo last</button><button onClick={removeSelected} disabled={!selectedId}>Delete selected</button></section>
      </aside>
      <main className={`viewer ${pending ? 'placing' : ''}`} ref={viewerRef}>
        <div className="page-controls"><button disabled={pageNumber === 1} onClick={() => setPageNumber((n) => n - 1)}>←</button><span>Page <b>{pageNumber}</b> of {pdfView.numPages}</span><button disabled={pageNumber === pdfView.numPages} onClick={() => setPageNumber((n) => n + 1)}>→</button></div>
        <div className="paper" style={{ width: pageSize.width * renderScale, height: pageSize.height * renderScale }} onPointerDown={place}>
          <canvas ref={canvasRef} />
          {pageItems.map((item) => <div key={item.id} className={`placed-item ${item.type} ${selectedId === item.id ? 'selected' : ''}`} style={{ left: item.x * renderScale, top: (pageSize.height - item.y - item.height) * renderScale, width: item.width * renderScale, height: item.height * renderScale, fontSize: item.fontSize ? item.fontSize * renderScale : undefined }} onPointerDown={(event) => { event.stopPropagation(); setSelectedId(item.id); dragRef.current = { id: item.id, clientX: event.clientX, clientY: event.clientY, x: item.x, y: item.y }; }}>
            {item.type === 'signature' ? <img src={item.data} alt="Placed signature" /> : item.text}
          </div>)}
        </div>
        <div className={`status-line ${pending ? 'active' : ''}`}>{message || `${items.length} item${items.length === 1 ? '' : 's'} added`}</div>
      </main>
    </div>
  </div>;
}

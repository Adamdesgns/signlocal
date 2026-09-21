import { useRef, useState } from 'react';

// Hidden file input behind a button. The value is cleared after each pick so
// choosing the same file twice still fires, and a cancelled picker does nothing.
export function PickerButton({ accept, capture, multiple, onFiles, className, children }) {
  const inputRef = useRef(null);
  return <>
    <input ref={inputRef} type="file" accept={accept} capture={capture} multiple={multiple} hidden onChange={(e) => {
      const files = [...e.target.files];
      e.target.value = '';
      if (files.length) onFiles(files);
    }} />
    <button type="button" className={className} onClick={() => inputRef.current.click()}>{children}</button>
  </>;
}

export const PHOTO_TYPES = 'image/jpeg,image/png,image/webp';

export default function DocumentIntake({ onPdf, onPhotos }) {
  const [dragging, setDragging] = useState(false);

  const drop = (event) => {
    event.preventDefault();
    setDragging(false);
    const files = [...event.dataTransfer.files];
    if (!files.length) return;
    const isPdf = (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (isPdf(files[0])) onPdf(files[0]);
    else onPhotos(files);
  };

  return <main className="landing">
    <nav className="nav"><div className="brand"><span className="brand-mark">S</span><span>SignLocal</span></div><span className="byline">by Adam Designs</span></nav>
    <section className="hero">
      <div className="privacy-pill"><span className="pulse" /> Your document never leaves your device</div>
      <h1>Sign a PDF.<br /><em>Keep it private.</em></h1>
      <p className="lede">Open a PDF or snap a photo of a paper document. Add text, dates, checkmarks, and your handwritten signature. No account. No upload. No Adobe subscription.</p>
      <div className={`dropzone ${dragging ? 'dragging' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}>
        <div className="intake-actions">
          <PickerButton className="intake-button main" accept="application/pdf,.pdf" onFiles={(files) => onPdf(files[0])}><span className="upload-icon">↥</span><strong>Open PDF</strong></PickerButton>
          <PickerButton className="intake-button" accept={PHOTO_TYPES} multiple onFiles={onPhotos}><span className="upload-icon">▦</span><strong>Choose photos</strong></PickerButton>
          <PickerButton className="intake-button" accept="image/*" capture="environment" onFiles={onPhotos}><span className="upload-icon">◉</span><strong>Take photo</strong></PickerButton>
        </div>
        <span>or drop a PDF or photos here · PDFs up to 25 MB</span>
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

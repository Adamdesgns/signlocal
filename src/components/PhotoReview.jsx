import { PickerButton, PHOTO_TYPES } from './DocumentIntake.jsx';

export default function PhotoReview({ pages, busy, onAdd, onMove, onRotate, onRemove, onCancel, onDone }) {
  return <div className="app-shell">
    <header className="app-header">
      <div className="brand"><span className="brand-mark">S</span><span>SignLocal</span></div>
      <div className="file-chip">{pages.length} page{pages.length === 1 ? '' : 's'}</div>
      <div className="header-actions">
        <button className="ghost" onClick={onCancel} disabled={busy}>Start over</button>
        <button className="download" onClick={onDone} disabled={busy}>{busy ? 'Building…' : 'Make PDF'}</button>
      </div>
    </header>
    <main className="review">
      <div className="privacy-note"><span>●</span><div><b>Check your pages</b><small>Put them in order and turn any that are sideways. Photos stay on this device.</small></div></div>
      <ol className="review-grid">
        {pages.map((page, index) => <li key={page.id} className="review-card">
          <div className="review-thumb"><img src={page.url} alt={`Page ${index + 1}`} style={{ transform: `rotate(${page.rotation}deg)` }} /></div>
          <div className="review-label">Page {index + 1}</div>
          <div className="review-controls">
            <button onClick={() => onMove(page.id, -1)} disabled={busy || index === 0} aria-label={`Move page ${index + 1} earlier`}>←</button>
            <button onClick={() => onMove(page.id, 1)} disabled={busy || index === pages.length - 1} aria-label={`Move page ${index + 1} later`}>→</button>
            <button onClick={() => onRotate(page.id, -90)} disabled={busy} aria-label={`Rotate page ${index + 1} left`}>↺</button>
            <button onClick={() => onRotate(page.id, 90)} disabled={busy} aria-label={`Rotate page ${index + 1} right`}>↻</button>
            <button className="danger" onClick={() => onRemove(page.id)} disabled={busy} aria-label={`Delete page ${index + 1}`}>✕</button>
          </div>
        </li>)}
      </ol>
      <div className="review-add">
        <PickerButton accept="image/*" capture="environment" onFiles={onAdd}>Take another photo</PickerButton>
        <PickerButton accept={PHOTO_TYPES} multiple onFiles={onAdd}>Add from photos</PickerButton>
      </div>
    </main>
  </div>;
}

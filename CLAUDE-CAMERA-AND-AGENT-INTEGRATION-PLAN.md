# SignLocal camera capture and agent integration build plan

## Assignment for Claude

Extend the existing SignLocal repository without changing its core promise: documents and signatures stay on the user's device. Build the camera/photo workflow first, make the site installable second, and add agent integrations only after the public workflow is complete and tested.

Repository: `C:\Users\steam\OneDrive\Documents\ChatGPT\adamdesgns LLC\public-pdf-signer`

Live product: <https://signlocal-adam-designs.netlify.app>

Current stack: React 19, Vite, PDF.js for rendering, and `pdf-lib` for editing/export. The deployed app is a static website with no backend, account, upload endpoint, database, analytics, or cookies.

## Product outcome

A person must be able to:

1. Open SignLocal on a phone.
2. Choose an existing PDF, choose one or more document photos, or tap **Scan with camera**.
3. Photograph each page of a paper document.
4. Review, reorder, rotate, crop, or delete the captured pages.
5. Convert those pages into a PDF entirely in the browser.
6. Add text, dates, checkmarks, and a hand-drawn signature with the existing editor.
7. Download the finished PDF without the source document or signature leaving the device.

If the document is already a PDF, the user opens it directly. The camera path is for paper documents or screenshots/photos of documents; a phone cannot literally photograph a digital PDF file.

## Non-negotiable product rules

- Keep all document, photo, and signature processing in the browser.
- Do not add document uploads, cloud storage, accounts, analytics, trackers, cookies, remote OCR, or a database.
- Do not save a signature between sessions by default.
- Do not let Codex, Claude, or any automated tool place, invent, reuse, or submit a legal signature.
- Require the person to review the document, draw or approve the signature, place it, and press the final download button.
- Do not claim a document has been legally executed, witnessed, notarized, delivered, or accepted.
- Preserve the existing free MIT-licensed product and existing PDF workflow.
- Do not push, deploy, or publish without Adam's explicit approval.

## Build order

### Phase 1: universal camera and photo intake

This phase delivers the useful feature. It must work from the public URL without installing an extension.

Replace the current single PDF picker with three clear actions:

- **Open PDF**
- **Choose photos**
- **Scan with camera**

Implementation requirements:

- Keep PDF acceptance unchanged.
- Add a gallery picker accepting JPEG, PNG, and WebP.
- Add a camera picker using `accept="image/*"` and `capture="environment"` for the rear camera where the browser supports it.
- Let users add pages one at a time or select multiple existing photos.
- Treat each selected image as one document page.
- Read image dimensions and orientation locally. Correct normal EXIF rotation before showing the page.
- Give every page a review card with thumbnail, rotate left/right, crop, delete, and drag/reorder controls.
- Offer page size choices: **Fit image**, **US Letter**, and **A4**. Default to US Letter for Adam's current US audience.
- Add a simple grayscale/document-enhance toggle. Keep the original image bytes available in memory so the user can undo the enhancement before export.
- Compress oversized camera images locally with Canvas before PDF embedding. Use a quality setting that keeps normal text readable and show the estimated finished size.
- Reject unsupported formats with a plain message. In the first release, gallery HEIC may show a message asking the user to take a camera photo or export as JPEG; do not quietly corrupt it.
- Convert reviewed pages into a new `PDFDocument` with `pdf-lib`, then pass the resulting bytes into the existing editor through the same state path used by an uploaded PDF.
- Use a generated filename such as `scanned-document.pdf`, then keep the existing `-signed.pdf` download behavior.
- Revoke object URLs and release large Canvas/ImageBitmap objects when pages are deleted or the editor closes.

Suggested internal modules:

- `src/components/DocumentIntake.jsx`
- `src/components/PhotoReview.jsx`
- `src/lib/imagePipeline.js`
- `src/lib/imagesToPdf.js`

Refactor only enough of `src/App.jsx` to share one `openPdfBytes(bytes, filename)` entry point between uploaded PDFs and generated PDFs. Avoid a full visual rewrite.

### Phase 2: phone ergonomics and installable PWA

After Phase 1 passes, make SignLocal installable as a Progressive Web App. A PWA is a website that can be added to a phone's home screen and opened like an app.

- Add `manifest.webmanifest` with SignLocal name, theme colors, icons, `display: standalone`, and the production start URL.
- Add a small service worker that caches only the versioned app shell needed to load the editor. Do not cache user PDFs, photos, generated PDFs, signature images, Blob URLs, or form state.
- Add an **Install SignLocal** prompt only when the browser exposes the install event. Keep the normal website fully usable without installation.
- Preserve the current restrictive Content Security Policy. Update it only for files the PWA actually needs.
- Make controls comfortable at 320, 390, and 430 CSS-pixel widths.
- Keep camera/photo review responsive in portrait orientation and usable with touch.
- Add visible focus states, keyboard operation for page controls, useful labels, and status announcements.

Do not make offline capability a launch claim until an installed build has been tested after the network is disabled.

### Phase 3: Codex and Claude integrations

These integrations are launchers and guided workflows around SignLocal. The public app remains the signing surface.

#### Codex plugin

Create a repo-contained plugin under `integrations/codex/signlocal/` using the current Codex plugin schema and validator. It should include:

- `.codex-plugin/plugin.json`
- a `skills/signlocal/SKILL.md` skill
- README installation instructions for a local/personal marketplace

The skill should activate when a user asks to sign, initial, date, mark, or turn document photos into a PDF. It should:

1. Explain that SignLocal works on-device.
2. Link to the public SignLocal app.
3. Tell the user to use **Open PDF**, **Choose photos**, or **Scan with camera**.
4. Leave all document selection and signing actions to the user.
5. Never claim the document was signed merely because the app opened.

Use Codex's official plugin scaffold and validation flow. Do not invent manifest fields.

#### Claude integration

Create the equivalent Claude Code skill/plugin under `integrations/claude/signlocal/`, but first inspect the currently installed Claude plugin specification on this PC and use its real manifest and validation commands. Do not copy the Codex manifest and rename it.

The Claude integration should have the same safety and user-control behavior as the Codex integration. If a custom Claude marketplace/distribution route is not publicly supported, ship a clearly labeled local Claude Code skill with accurate manual installation instructions instead of claiming it is a universal Claude extension.

#### Optional local companion, separate milestone

Do not add an MCP server merely to open the website. Consider a local MCP companion later only if it provides a concrete benefit such as preparing an image bundle or opening a specific local document in a local SignLocal session. Any companion must bind to `127.0.0.1`, use short-lived random session tokens, avoid logging filenames/document contents/signatures, and still require the browser UI for signature approval and download.

## Explicitly out of scope for the first release

- Automatic signature placement
- Stored signature libraries
- Cloud sync or document history
- Emailing, faxing, or submitting the signed file
- Remote OCR
- Notarization or identity verification
- Collaborative/multi-party signing
- A Chrome/Edge browser extension
- Perspective correction that cannot be implemented reliably without bloating or weakening the privacy-first app

OCR and four-corner perspective correction can be evaluated later as fully local features after the basic camera flow works. They are not required to let someone photograph, sign, and download a document.

## Validation required before handback

Claude must test the actual behavior, not only the source code.

### Automated checks

- Production build passes.
- Dependency audit has no known high or critical vulnerability.
- Unit tests cover EXIF orientation, page ordering, rotation, supported/unsupported input, image-to-PDF page dimensions, and cleanup of temporary object URLs.
- Existing PDF signing behavior still passes.

### Browser checks

- Existing two-page PDF opens, accepts a signature, and downloads correctly.
- One portrait camera photo converts to a readable one-page PDF and signs correctly.
- Three photos can be reordered, rotated, converted, signed on different pages, and downloaded.
- A large phone photo is compressed without making normal printed text unreadable.
- Canceling the camera or file picker does not erase the current document.
- Unsupported HEIC gets an accurate recovery message where the browser cannot decode it.
- No request containing PDF bytes, image bytes, signature data, or edited document data appears in the browser network log.
- 320 x 568, 390 x 844, desktop, keyboard-only, and touch interactions are checked.
- Installed PWA shell loads offline only if Phase 2's offline behavior is claimed.

### Privacy inspection

- Inspect the production bundle and network traffic for analytics, remote image/OCR calls, document uploads, and accidental private test data.
- Use synthetic test documents and signatures only. Never commit Adam's SS-4, EIN application, home address, SSN, or real signature.
- Confirm service-worker caches contain app assets only.

## Handback format

Claude should return:

- the branch and commit SHA
- every file changed
- automated test/build results
- browser/device evidence for each required flow
- privacy/network evidence
- what remains unverified
- separate status for local code, GitHub push, deployment, plugin installation, and public availability

Nothing counts as live until the deployed URL is checked. A local plugin folder does not mean other Codex or Claude users can install it from a public marketplace.

## Definition of done

The work is complete when a new visitor can use a phone camera to make a multi-page PDF, review it, sign it, and download it without any document data leaving the device; the original PDF path still works; the installed PWA behaves accurately; and the Codex/Claude integrations truthfully guide users into that human-controlled flow.

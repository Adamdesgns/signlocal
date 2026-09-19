# SignLocal

SignLocal is a free, privacy-first PDF signer from Adam Designs. It runs entirely
in the browser: PDFs, typed text, dates, marks, and signatures never upload to a
server.

**Live:** https://signlocal-adam-designs.netlify.app

## Features

- Open any unencrypted PDF up to 25 MB
- Add and reposition text, dates, X marks, and a drawn signature
- Edit multiple pages
- Download a new signed copy while preserving the original
- No account, analytics, cookies, database, or backend

## Local development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
```

The static output is written to `dist/`. `netlify.toml` applies a restrictive
Content Security Policy and other privacy headers.

## Privacy

All PDF processing uses `pdf-lib` and PDF.js inside the user's browser. The live
site serves only static application files. It has no upload endpoint.

## License

MIT

import React, { useEffect, useRef, useState } from "react";
// Install first:  npm i pdfjs-dist
// This import works on modern bundlers like Vite, Next.js, CRA (v5+) with file-loader support
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.js?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

// -- Utility: debounce for resize observer --
function debounce(fn, delay = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

export default function PdfJsViewer({
  fileUrl = "https://d26ziiio1s8scf.cloudfront.net/NOTES/ENGLISH/PHYSICS/COMPRESSED/CHAPTER-10%20Wave%20Optics.pdf", // change to your PDF URL or pass in as prop
  initialScale = 1.25,
  minScale = 1.0,
  maxScale = 3,
  className = "",
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(initialScale);
  const [isRendering, setIsRendering] = useState(false);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const loadingTask = pdfjsLib.getDocument({ url: fileUrl });
        const doc = await loadingTask.promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setPageNumber(1);
      } catch (err) {
        console.error("Failed to load PDF:", err);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  // Render current page
  const renderPage = async (pageNum = pageNumber, nextScale = scale) => {
    if (!pdfDoc || !canvasRef.current) return;
    setIsRendering(true);
    try {
      const page = await pdfDoc.getPage(pageNum);

      // Fit width to container if available
      const containerWidth = containerRef.current?.clientWidth || 800;
      const viewport = page.getViewport({ scale: nextScale });
      const fitScale = (containerWidth - 16) / viewport.width; // 8px padding each side
      const finalScale = Math.max(minScale, Math.min(maxScale, nextScale * fitScale));

      const v = page.getViewport({ scale: finalScale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.height = v.height;
      canvas.width = v.width;

      const renderTask = page.render({ canvasContext: ctx, viewport: v });
      await renderTask.promise;
    } catch (err) {
      console.error("Failed to render page:", err);
    } finally {
      setIsRendering(false);
    }
  };

  // Re-render when page/scale changes
  useEffect(() => {
    renderPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, pageNumber, scale]);

  // Re-render on container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(
      debounce(() => renderPage(pageNumber, scale), 150)
    );
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [pageNumber, scale]);

  const goPrev = () => setPageNumber((p) => Math.max(1, p - 1));
  const goNext = () => setPageNumber((p) => Math.min(numPages, p + 1));
  const zoomIn = () => setScale((s) => Math.min(maxScale, +(s + 0.1).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(minScale, +(s - 0.1).toFixed(2)));
  const onPageInput = (e) => {
    const n = parseInt(e.target.value, 10);
    if (!Number.isNaN(n)) setPageNumber(Math.min(Math.max(1, n), numPages));
  };

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-4xl mx-auto p-2 ${className}`}
    >
      {/* Controls */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <button onClick={goPrev} disabled={pageNumber <= 1} className="px-3 py-1 rounded-2xl shadow disabled:opacity-50">Prev</button>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={numPages || 1}
              value={pageNumber}
              onChange={onPageInput}
              className="w-16 px-2 py-1 border rounded-2xl"
            />
            <span>/ {numPages || 0}</span>
          </div>
          <button onClick={goNext} disabled={pageNumber >= numPages} className="px-3 py-1 rounded-2xl shadow disabled:opacity-50">Next</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={zoomOut} className="px-3 py-1 rounded-2xl shadow">−</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="px-3 py-1 rounded-2xl shadow">+</button>
        </div>
      </div>

      {/* Canvas */}
      <div className="rounded-2xl overflow-hidden border shadow bg-white">
        <canvas ref={canvasRef} className="block mx-auto" />
      </div>

      {isRendering && (
        <div className="text-sm opacity-70 mt-2">Rendering…</div>
      )}

      {/* Example usage note */}
      <p className="text-xs mt-3 opacity-70">
        Tip: put a PDF at <code>/public/sample.pdf</code> or pass <code>fileUrl</code>.
      </p>
    </div>
  );
}

// Example quick usage in your app:
// import PdfJsViewer from "./PdfJsViewer";
// export default function App() {
//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <h1 className="text-2xl font-semibold mb-4">PDF.js in React</h1>
//       <PdfJsViewer fileUrl="/sample.pdf" />
//     </div>
//   );
// }

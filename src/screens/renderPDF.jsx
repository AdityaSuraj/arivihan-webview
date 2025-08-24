import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const RemotePDFViewer = () => {
  const defaultUrl = "https://d26ziiio1s8scf.cloudfront.net/NOTES/ENGLISH/PHYSICS/COMPRESSED/CHAPTER-10%20Wave%20Optics.pdf";
  const queryParams = new URLSearchParams(window.location.search);
  const fileUrl = queryParams.get("pdfUrl") || defaultUrl;

  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfFile, setPdfFile] = useState(fileUrl);

  React.useEffect(() => {
    // Only use fetch for file:// URLs (Android WebView/local)
    if (fileUrl && fileUrl.startsWith("file://")) {
      setLoading(true);
      setError(null);
      fetch(fileUrl)
        .then(response => {
          if (!response.ok) throw new Error("Failed to fetch local file");
          console.log(response.blob());
          return response.blob();
        })
        .then(blob => {
          setPdfFile(blob);
          setLoading(false);
        })
        .catch(err => {
          setError("Failed to load local PDF file.");
          setLoading(false);
        });
    } else if (fileUrl && (fileUrl.startsWith("http://") || fileUrl.startsWith("https://"))) {
      // Use backend proxy to bypass CORS for remote PDFs
      // Backend endpoint should fetch the PDF and add CORS headers
      setPdfFile(encodeURIComponent(fileUrl));
      setLoading(false);
      setError(null);
    } else {
      setPdfFile(fileUrl);
      setLoading(false);
      setError(null);
    }
  }, [fileUrl]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (err) => {
    let message = "Failed to load PDF.";
    if (
      err &&
      typeof err.message === "string" &&
      (err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError") ||
        err.message.includes("CORS"))
    ) {
      message +=
        " This is a CORS restriction: the server hosting the PDF does not allow JavaScript-based viewers to fetch the file. " +
        "Browsers allow you to open/download the PDF directly, but React PDF viewers require CORS headers. " +
        "There is NO frontend-only workaround. " +
        "To resolve: (1) Host the PDF on a server with CORS enabled, (2) Download and serve the PDF from your own CORS-enabled server, or (3) Set up a backend proxy to fetch the PDF and add CORS headers. " +
        "Sample Node.js/Express proxy:\n\n" +
        "app.get('/pdf-proxy', async (req, res) => {\n" +
        "  const url = req.query.url;\n" +
        "  const response = await fetch(url);\n" +
        "  res.set('Access-Control-Allow-Origin', '*');\n" +
        "  response.body.pipe(res);\n" +
        "});\n\n" +
        "// If the PDF opens in the browser but not in the viewer, it is 100% a CORS issue and must be fixed on the server or with a backend proxy.";
    }
    setError(message);
    setLoading(false);
  };

  return (
    <div>
      {loading && <div>Loading PDF...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      <Document
        file={pdfFile}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading=""
        error=""
        noData="No PDF file specified"
      >
        {numPages &&
          Array.from(new Array(numPages), (_, i) => (
            <Page
              key={`page_${i + 1}`}
              pageNumber={i + 1}
              width={600}
            />
          ))}
      </Document>
    </div>
  );
};

export default RemotePDFViewer;

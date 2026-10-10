import { Upload, FileText, CheckCircle2 } from "lucide-react";
import api from "../services/api"
import toast from "react-hot-toast";

export default function Sidebar({
  selectedFile,
  setSelectedFile,
  setUploaded,
  status,
  setStatus,
  setChunks,
  processing,
  setProcessing,
  documents,
  setDocuments
}) {
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a PDF or TXT file.");
      return;
    }

    const extension = selectedFile.name.split(".").pop().toLowerCase();

    if (!["pdf", "txt"].includes(extension)) {
      toast.error("Only PDF and TXT files are supported.");
      return;
    }

    setProcessing(true);
    setStatus("Processing document...");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await api.post("/uploads", formData);

      const newDocument = {
        id: res.data.document_id,
        filename: selectedFile.name,
        chunks: res.data.chunks,
        fileType: extension.toUpperCase()
      };

      setDocuments((prev) => [...prev, newDocument]);
      setUploaded(true);
      setChunks(res.data.chunks);
      setStatus("Ready to chat");
      setSelectedFile(null);

      toast.success(`${newDocument.filename} uploaded successfully.`);
    } catch (error) {
      console.error(error);
      setStatus("Upload failed");
      toast.error(error.response?.data?.detail || "Document upload failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-full rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3 mt-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          <Upload size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-slate-800">Upload Documents</h2>
          <p className="text-xs text-slate-500">Add PDF or TXT files</p>
        </div>
      </div>

      <label htmlFor="document-upload" className="mt-5 block cursor-pointer rounded-lg border border-dashed border-slate-300 p-5 text-center transition hover:border-teal-500 hover:bg-teal-50/50">
        <Upload size={26} className="mx-auto text-teal-600" />
        <p className="mt-2 text-sm font-medium text-slate-800">Choose a document</p>
        <p className="mt-1 text-xs text-slate-500">PDF or TXT files</p>
        <p className="mt-2 truncate text-xs text-teal-700">{selectedFile ? selectedFile.name : "No file selected"}</p>
      </label>

      <input id="document-upload" type="file" accept=".pdf,.txt,application/pdf,text/plain" className="hidden" disabled={processing} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />

      <button type="button" onClick={handleUpload} disabled={!selectedFile || processing} className="mt-5 mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-500">
        {processing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
        {processing ? "Processing..." : "Upload Document"}
      </button>

      <div className="mt-5 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <span className="text-sm font-medium text-slate-700">Status</span>
        <span className="text-right text-xs text-slate-500">{status}</span>
      </div>

      <div className="mt-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <FileText size={17} className="text-teal-600" />
            Uploaded Documents
          </h3>
          <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">{documents.length}</span>
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto">
          {documents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center">
              <FileText size={25} className="mx-auto text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No documents uploaded</p>
            </div>
          ) : (
            documents.map((document) => (
              <div key={document.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
                <FileText size={22} className="shrink-0 text-teal-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700" title={document.filename}>{document.filename}</p>
                  <p className="mt-1 text-xs text-slate-500">{document.fileType || document.filename.split(".").pop().toUpperCase()} · {document.chunks} chunks</p>
                </div>
                <CheckCircle2 size={16} className="shrink-0 text-teal-600" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

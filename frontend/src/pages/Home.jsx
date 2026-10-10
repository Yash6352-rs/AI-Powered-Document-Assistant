import { useState } from "react";
import Header from "../components/Header";
import ChatWindow from "../components/ChatWindow";
import Sidebar from "../components/SideBar";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploaded, setUploaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("No documents uploaded");
  const [chunks, setChunks] = useState(0);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-teal-50/40 p-3 sm:p-5">
      <div className="mx-auto max-w-7xl">
        <Header />

        <main className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <aside className="min-w-0 lg:col-span-3">
            <Sidebar
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              uploaded={uploaded}
              setUploaded={setUploaded}
              status={status}
              setStatus={setStatus}
              chunks={chunks}
              setChunks={setChunks}
              processing={processing}
              setProcessing={setProcessing}
              documents={documents}
              setDocuments={setDocuments}
            />
          </aside>

          <section className="min-w-0 lg:col-span-9">
            <ChatWindow
              messages={messages}
              loading={loading}
              setMessages={setMessages}
              uploaded={uploaded}
              setLoading={setLoading}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

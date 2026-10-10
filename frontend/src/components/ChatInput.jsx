import { useState } from "react";
import api from "../services/api";
import { Send } from "lucide-react";

export default function ChatInput({ uploaded, messages, setMessages, loading, setLoading }) {
  const [question, setQuestion] = useState("");

  const sendMessage = async () => {
    if (!question.trim() || loading || !uploaded) return;

    const userQuestion = question.trim();
    const chatHistory = messages.map((message) => ({
      role: message.type === "user" ? "user" : "assistant",
      content: message.text || ""
    }));

    setMessages((prev) => [
      ...prev,
      { type: "user", text: userQuestion },
      { type: "bot", text: "", sources: [] }
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await api.post("/chat", {
        question: userQuestion,
        document_id: "global",
        chat_history: chatHistory
      });

      const data = response.data;

      if (data.success === false) {
        throw new Error(data.detail || data.answer || "Request failed");
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          text: data.answer || "No answer was returned.",
          sources: data.sources || []
        };
        return updated;
      });
    } catch (error) {
      console.error("Chat request failed:", error);

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          text: error.message || "Something went wrong. Please try again.",
          sources: []
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex items-end gap-2 sm:gap-3">
      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={uploaded ? "Ask about your documents..." : "Upload a document to start chatting..."}
        rows={1}
        disabled={!uploaded || loading}
        className="min-h-12 max-h-32 flex-1 resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 sm:px-4"
      />

      <button
        type="button"
        onClick={sendMessage}
        disabled={!uploaded || loading || !question.trim()}
        className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-500"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Send size={17} />
        )}
        <span className="hidden sm:inline">{loading ? "Thinking..." : "Send"}</span>
      </button>
    </div>
  );
}

import { MessageCircle, Trash2, Bot } from "lucide-react";
import Message from "./Message";
import ChatInput from "./ChatInput";

export default function ChatWindow({ messages, loading, setMessages, uploaded, setLoading }) {
  return (
    <div className="flex h-162.5 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white sm:h-187.5">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <MessageCircle size={28} className="shrink-0 text-teal-600" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">AI Assistant</h2>
            <p className="text-xs text-slate-500 sm:text-sm">Ask questions about your documents</p>
          </div>
        </div>

        <button type="button" onClick={() => setMessages([])} disabled={loading || messages.length === 0} className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm">
          <Trash2 size={16} />
          <span>Clear Chat</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
              <Bot size={34} className="text-teal-600" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-800">Start a Conversation</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Ask questions about your uploaded PDF and TXT documents.</p>
            {!uploaded && <p className="mt-4 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-xs text-teal-700">Upload a document to start chatting.</p>}
          </div>
        ) : (
          messages.map((msg, index) => (
            <Message key={index} message={msg} loading={loading} isLast={index === messages.length - 1} />
          ))
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4">
        <ChatInput uploaded={uploaded} messages={messages} setMessages={setMessages} loading={loading} setLoading={setLoading} />
      </div>
    </div>
  );
}
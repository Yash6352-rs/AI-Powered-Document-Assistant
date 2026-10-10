import { Bot, User, FileText } from "lucide-react";

export default function Message({ message, loading, isLast }) {
  const isUser = message.type === "user";
  const showThinking = !isUser && isLast && loading && !message.text;
  const sources = Array.isArray(message.sources) ? message.sources : [];
  const groupedSources = {};

  sources.forEach((source) => {
    const filename = source.filename || "Unknown document";

    if (!groupedSources[filename]) {
      groupedSources[filename] = [];
    }

    const citation = {
      page: source.page,
      chunk: source.chunk
    };

    const alreadyExists = groupedSources[filename].some(
      (item) => item.page === citation.page && item.chunk === citation.chunk
    );

    if (!alreadyExists) {
      groupedSources[filename].push(citation);
    }
  });

  return (
    <div className={`mb-5 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[95%] items-start gap-2 sm:max-w-[85%] sm:gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isUser ? "bg-teal-600 text-white" : "bg-teal-50 text-teal-700"}`}>
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className={`rounded-xl px-3 py-3 sm:px-4 ${isUser ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-800"}`}>
            {showThinking ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                <span>Thinking...</span>
              </div>
            ) : (
              <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6">{message.text}</p>
            )}

            {!isUser && sources.length > 0 && (
              <div className="mt-4 border-t border-slate-200 pt-3">
                <div className="mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-teal-600" />
                  <span className="text-sm font-semibold text-slate-700">Sources ({sources.length})</span>
                </div>

                <div className="space-y-2">
                  {Object.entries(groupedSources).map(([filename, citations]) => (
                    <div key={filename} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex min-w-0 items-center gap-2">
                        <FileText size={15} className="shrink-0 text-teal-600" />
                        <p className="truncate text-xs font-semibold text-slate-700" title={filename}>{filename}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {citations.map((source, index) => (
                          <span key={`${filename}-${source.page}-${source.chunk}-${index}`} className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">
                            {source.page != null && (
                              <>
                                Page {source.page}
                                <span className="mx-1 text-slate-300">•</span>
                              </>
                            )}
                            Chunk {source.chunk ?? "Unknown"}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

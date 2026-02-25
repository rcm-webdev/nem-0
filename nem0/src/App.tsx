import { useState, useEffect, useRef } from "react";
import { Menu, X, Brain, Send } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  date: Date;
  summary: string;
  messages: Message[];
}

interface MemoryItem {
  id: string;
  memory: string;
  created_at: string;
}

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000";
const USER_ID = "demo-seller-1";

const promptChips = [
  "I sell products and need help with margins",
  "My slowest moving items are costing me money",
  "I want to understand my cash flow better",
];

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    fetchMemories();
  }, []);

  const getKeywordResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("margin")) {
      return "Based on what I know about your inventory, items with margins below 30% are worth reviewing first. Which category concerns you most — pricing, cost of goods, or both?";
    }

    if (lowerMessage.includes("slow") || lowerMessage.includes("inventory")) {
      return "Slow-moving inventory is usually a pricing or visibility problem. Have you tried bundling slow items with your fastest movers? I can help you think through which combinations make sense.";
    }

    if (lowerMessage.includes("cash flow")) {
      return "Cash flow gaps often show up 30-45 days before sellers notice them. Walk me through your typical monthly sales cycle — when does revenue come in vs. when do expenses hit?";
    }

    return "Tell me more about that — the more context you give me, the more specific I can be with my recommendations.";
  };

  const fetchMemories = async () => {
    setIsLoadingMemories(true);
    try {
      const res = await fetch(`${FASTAPI_URL}/memories/${USER_ID}`);
      if (!res.ok) return;
      const data = await res.json();
      setMemories(
        (data.memories ?? []).map(
          (m: { id: string; memory: string; created_at: string }) => ({
            id: m.id,
            memory: m.memory,
            created_at: m.created_at,
          }),
        ),
      );
    } catch {
      // silently fail — panel shows stale data
    } finally {
      setIsLoadingMemories(false);
    }
  };

  const startNewSession = () => {
    if (messages.length === 0) return;

    const firstUserMsg = messages.find((m) => m.role === "user");
    const summary = firstUserMsg
      ? firstUserMsg.content.slice(0, 60) +
        (firstUserMsg.content.length > 60 ? "..." : "")
      : "Untitled conversation";

    setSessions((prev) => [
      {
        id: Date.now().toString(),
        date: new Date(),
        summary,
        messages: [...messages],
      },
      ...prev,
    ]);
    setMessages([]);
    setActiveSessionId(null);
    setInputValue("");
  };

  const restoreSession = (session: ChatSession) => {
    if (messages.length > 0 && activeSessionId === null) {
      startNewSession(); // auto-save current live chat before switching
    }
    setMessages(session.messages);
    setActiveSessionId(session.id);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch(`${FASTAPI_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: USER_ID,
          message: inputValue,
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();

      setTimeout(() => {
        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "agent",
          content:
            data.response || data.message || getKeywordResponse(inputValue),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, agentMessage]);
        setIsTyping(false);
        fetchMemories();
      }, 500);
    } catch (error) {
      setTimeout(() => {
        const fallbackResponse = getKeywordResponse(inputValue);
        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "agent",
          content: fallbackResponse,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, agentMessage]);
        setIsTyping(false);
      }, 800);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Left Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-[300px] bg-[#F7F7F7] border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-[#006AFF] rounded-full pulse-dot" />
            <h1 className="text-xl font-bold text-gray-900">NEM-0</h1>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={startNewSession}
            disabled={messages.length === 0}
            className="w-full py-2 px-4 bg-[#006AFF] hover:bg-[#0056CC] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            + New Chat
          </button>
        </div>

        {/* Two-panel scroll area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* PAST SESSIONS panel */}
          <div
            className="flex flex-col overflow-hidden px-4 pt-2"
            style={{ maxHeight: "50%" }}
          >
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1 flex-shrink-0">
              Past Sessions
            </h2>
            <div className="overflow-y-auto space-y-2 flex-1">
              {sessions.length === 0 ? (
                <p className="text-xs text-gray-400 px-1">
                  No past sessions yet.
                </p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => restoreSession(session)}
                    className={`p-3 rounded-lg cursor-pointer transition-shadow ${
                      activeSessionId === session.id
                        ? "bg-blue-50 border border-[#006AFF]"
                        : "bg-white shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {formatDate(session.date)}
                    </div>
                    <div className="text-sm text-gray-900 leading-snug">
                      {session.summary}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {session.messages.length} messages
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MEMORIES LEARNED panel */}
          <div className="flex-1 flex flex-col overflow-hidden px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 mb-2 flex-shrink-0">
              <Brain size={14} className="text-gray-500" />
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Memories Learned
              </h2>
              {isLoadingMemories && (
                <span className="ml-auto text-[10px] text-[#006AFF] font-medium">
                  Updating...
                </span>
              )}
            </div>
            <div className="overflow-y-auto space-y-2 flex-1">
              {memories.length === 0 ? (
                <p className="text-xs text-gray-400 px-1">
                  No memories yet. Chat to build context.
                </p>
              ) : (
                memories.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-2 bg-white rounded-lg shadow-sm"
                  >
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {mem.memory}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 italic text-center">
            Memory powered by mem0 — this agent learns as you talk.
          </p>
        </div>
      </aside>

      {/* Main Chat Panel */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-gray-900 ml-12 lg:ml-0">
            Nem-0
          </h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
            <span className="text-sm text-gray-600">
              Remembering your business
            </span>
          </div>
        </header>

        {/* Chat Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-6 lg:px-8 py-6"
        >
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto mt-20">
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Nem-0</h2>
                <p className="text-lg text-gray-600 mb-4">
                  Your business advisor that never forgets.
                </p>
                <p className="text-base text-gray-700 mb-8 leading-relaxed">
                  Tell me about your business — what you sell, where you sell
                  it, and what's been on your mind. The more we talk, the more
                  useful I become.
                </p>
                <div className="space-y-3">
                  {promptChips.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handlePromptClick(prompt)}
                      className="w-full px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-left border border-gray-200"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[80%] ${
                      message.role === "user"
                        ? "bg-[#006AFF] text-white rounded-[20px] px-5 py-3"
                        : "bg-white shadow-md rounded-2xl px-6 py-4"
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-2 ${
                        message.role === "user"
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start animate-fadeIn">
                  <div className="bg-white shadow-md rounded-2xl px-6 py-4">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-[#006AFF] rounded-full typing-dot-1" />
                      <div className="w-2 h-2 bg-[#006AFF] rounded-full typing-dot-2" />
                      <div className="w-2 h-2 bg-[#006AFF] rounded-full typing-dot-3" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 py-4">
            <p className="text-xs text-gray-500 text-center mb-3">
              Your advisor remembers previous conversations.
            </p>
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask anything about your business..."
                  className="w-full px-5 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#006AFF] focus:border-transparent text-[15px]"
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="flex-shrink-0 w-12 h-12 bg-[#006AFF] hover:bg-[#0056CC] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;

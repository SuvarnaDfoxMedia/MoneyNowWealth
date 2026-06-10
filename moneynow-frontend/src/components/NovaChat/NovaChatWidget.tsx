"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { askNova, ChatMessage } from "@/services/chatbotService";
import { useProfileStore } from "@/stores/profileStore";

const NovaChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const profile = useProfileStore((state) => state.profile);

  // Clear chat history when user logs in or logs out
  useEffect(() => {
    setChatHistory([]);
  }, [profile?.id]); // Watch the ID so it doesn't clear unnecessarily on other profile updates

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: message };
    setChatHistory((prev) => [...prev, userMsg]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await askNova(message, chatHistory);
      const assistantMsg: ChatMessage = { role: "assistant", content: response.answer };
      setChatHistory((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = { 
        role: "assistant", 
        content: "Sorry, I'm having trouble connecting right now. Please try again later." 
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple Markdown-like formatter
  const formatContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      // Bold text
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
      
      // Basic list detection
      if (line.match(/^\d+\.\s/)) {
        return <div key={i} className="pl-2 mb-1" dangerouslySetInnerHTML={{ __html: processed }} />;
      }
      
      return (
        <p key={i} className={line.trim() === "" ? "h-2" : "mb-1"} dangerouslySetInnerHTML={{ __html: processed }} />
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-inter">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[90vw] md:w-[420px] h-[70vh] md:h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-8 fade-in duration-500">
          {/* Header */}
          <div className="bg-[#043F79] p-5 flex justify-between items-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-pink-500/20 pointer-events-none" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/10">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-poppins font-bold text-base leading-tight">Nova</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                  <p className="text-[10px] opacity-90 uppercase tracking-widest font-semibold">AI Wealth Assistant</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-full transition-all hover:rotate-90 duration-300 relative z-10"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#F8FAFC] custom-chatbot-scrollbar"
          >
            {chatHistory.length === 0 && (
              <div className="text-center py-12 space-y-5">
                <div className="relative inline-block">
                  <div className="bg-blue-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto text-[#043F79] transform rotate-3 shadow-inner">
                    <Bot size={40} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white shadow-sm" />
                </div>
                <div className="space-y-2">
                  <p className="font-poppins font-bold text-gray-800 text-xl">Hi, I'm Nova!</p>
                  <p className="text-xs text-gray-500 px-12 leading-relaxed">
                    How can I assist you with your investment strategy or subscription today?
                  </p>
                </div>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-2.5 pt-4 px-8">
                  {["What are your plans?", "Explain Mutual Funds", "Contact Advisor"].map((text) => (
                    <button
                      key={text}
                      onClick={() => {
                        setMessage(text);
                        // Trigger send? Or just populate
                      }}
                      className="text-xs font-semibold text-[#043F79] bg-white border border-gray-100 py-3 rounded-2xl hover:bg-blue-50 transition-all shadow-sm active:scale-95"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatHistory.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`}
              >
                <div className={`max-w-[90%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                  msg.role === "user" 
                    ? "bg-[#043F79] text-white rounded-br-none shadow-blue-900/10" 
                    : "bg-white text-gray-700 border border-gray-100 rounded-bl-none font-medium"
                }`}>
                  {msg.role === "assistant" ? formatContent(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 px-5 rounded-2xl rounded-bl-none shadow-sm border border-gray-100">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-[#043F79]/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-[#043F79]/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-[#043F79]/30 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form 
            onSubmit={handleSend}
            className="p-5 bg-white border-t border-gray-100 flex gap-3 items-center"
          >
            <div className="flex-1 bg-gray-100/80 rounded-2xl px-5 py-3 flex items-center focus-within:ring-2 focus-within:ring-[#043F79]/10 focus-within:bg-white focus-within:shadow-inner transition-all">
              <input 
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message Nova..."
                className="w-full bg-transparent border-none text-sm focus:outline-none text-gray-700 placeholder:text-gray-400"
              />
            </div>
            <button 
              type="submit"
              disabled={!message.trim() || isLoading}
              className="bg-[#043F79] text-white p-3 rounded-2xl disabled:opacity-20 disabled:grayscale transition-all hover:bg-[#032f5a] hover:shadow-lg active:scale-95 shadow-blue-900/20"
            >
              <Send size={20} />
            </button>
          </form>
          
          <style jsx>{`
            .custom-chatbot-scrollbar::-webkit-scrollbar {
              width: 5px;
            }
            .custom-chatbot-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-chatbot-scrollbar::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 10px;
            }
          `}</style>
        </div>
      )}

      {/* Toggle Button - Only show when closed */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 group bg-[#043F79] text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-pink-500/10 to-transparent" />
          <MessageSquare size={28} className="group-hover:animate-pulse" />
          <span className="absolute top-4 right-4 w-3 h-3 bg-pink-500 border-2 border-[#043F79] rounded-full animate-ping" />
        </button>
      )}
    </div>
  );
};

export default NovaChatWidget;

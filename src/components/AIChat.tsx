import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppState, Language } from '../types';
import { Sparkles, X, Send, Bot, User } from 'lucide-react';

interface Props {
  state: AppState;
  language: Language;
  t: (key: string) => string;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AIChat: React.FC<Props> = ({ state, language, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: t('aiIntro') }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
      const apiKey = process.env.API_KEY;
      
      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'model', text: "API Key not configured in .env file (process.env.API_KEY)." }]);
        setIsLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      // Prepare Context Data
      const contextData = {
        products: state.products.map(p => ({
            name: p.modelAdi,
            stock: p.stok,
            price: p.satisFiyat,
            brand: p.marka
        })),
        customers: state.customers.map(c => ({
            name: c.company,
            balance: c.balanceUsd,
            city: c.city
        })),
        recentTransactions: state.transactions.slice(0, 10),
        totalDebt: state.customers.reduce((acc, c) => acc + (c.balanceUsd > 0 ? c.balanceUsd : 0), 0),
        totalCredit: state.customers.reduce((acc, c) => acc + (c.balanceUsd < 0 ? Math.abs(c.balanceUsd) : 0), 0)
      };

      const systemPrompt = `
        You are an intelligent ERP Assistant for a Textile Wholesale company.
        You have access to the following JSON summary of the company data: ${JSON.stringify(contextData)}.
        
        Rules:
        1. Answer the user's question based strictly on this data.
        2. If you need to perform calculations (e.g., total stock value), do it based on the data provided.
        3. Be professional, concise, and helpful.
        4. Answer in the requested language: ${language === 'TR' ? 'Turkish' : 'Russian'}.
        5. If the user asks to write an email (e.g., payment reminder), draft a polite email text.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
        },
      });

      const responseText = response.text || "Sorry, I couldn't generate a response.";
      
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Error connecting to AI service. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-105 transition-transform z-50 animate-pulse hover:animate-none"
        >
          <Sparkles size={28} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden font-sans">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
                <Sparkles size={20} />
                <span className="font-bold">{t('aiAssistant')}</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-violet-100 text-violet-600'}`}>
                        {msg.role === 'user' ? <User size={16}/> : <Bot size={16}/>}
                    </div>
                    <div className={`p-3 rounded-xl text-sm whitespace-pre-wrap shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-200'
                    }`}>
                        {msg.text}
                    </div>
                </div>
              </div>
            ))}
            {isLoading && (
                 <div className="flex justify-start">
                    <div className="flex gap-2 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                             <Bot size={16}/>
                        </div>
                        <div className="bg-white text-slate-500 p-3 rounded-xl rounded-tl-none border border-slate-200 text-sm italic">
                            {t('thinking')}
                        </div>
                    </div>
                 </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-slate-200">
            <div className="flex gap-2 items-center bg-slate-100 rounded-full px-4 py-2 border border-slate-200 focus-within:ring-2 focus-within:ring-violet-500 focus-within:bg-white transition-all">
                <input
                    className="flex-1 bg-transparent outline-none text-sm text-slate-700"
                    placeholder={t('askMe')}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isLoading}
                />
                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="text-violet-600 hover:text-violet-800 disabled:opacity-50 transition-colors"
                >
                    <Send size={18} />
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
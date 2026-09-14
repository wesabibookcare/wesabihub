import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';

export function CustomerCareChat() {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [personas, setPersonas] = useState<any[]>([
    { id: 'compliance', name: 'Compliance Officer', greeting: 'Hello, I am the Compliance Officer. How can I help you with your SafePay or legal verification?' },
    { id: 'logistics', name: 'Logistics Specialist', greeting: 'Hello, I am the Logistics Specialist. Do you have questions about your shipments?' },
    { id: 'billing', name: 'Billing Support', greeting: 'Hello, how can I help you with your payments or payouts?' }
  ]);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [ticketCreated, setTicketCreated] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/chat/personas')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPersonas(data);
        }
      })
      .catch(err => console.error("Error loading customer care personas:", err));
  }, []);

  // ... inside useEffect for bot message
  useEffect(() => {
    if (isOpen && selectedPersona && messages.length === 0) {
      setIsLoading(true);
      setTimeout(() => {
        setMessages([{ sender: 'bot', text: selectedPersona.greeting }]);
        setIsLoading(false);
      }, 2000);
    }
  }, [isOpen, selectedPersona]);

  const sendMessage = async (messageText = input, feedback?: 'yes' | 'no') => {
    if (!selectedPersona) return; // Add check
    if (!messageText.trim() && !feedback) return;

    if (!feedback) {
        setMessages(prev => [...prev, { sender: 'user', text: messageText }]);
        setInput('');
    }

    setIsLoading(true);
    setShowFeedback(false);

    try {
      const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              personaId: selectedPersona.id,
              message: messageText,
              context: { user, path: location.pathname, history: messages },
              feedback
          })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
          const textErr = await response.text();
          throw new Error(textErr || `Server returned non-JSON response (${response.status})`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { sender: 'bot', text: data.text || 'No response received from agent.' }]);
      if (data.ticketCreated) {
          setTicketCreated(true);
      } else {
          setShowFeedback(true);
      }
    } catch (err: any) {
      console.error("[CustomerCareChat] Chat failed:", err);
      let errorText = "Omorfi is currently unavailable. Please try again shortly or contact customer support.";
      const rawMsg = err.message || '';
      if (rawMsg.includes("GEMINI_API_KEY") || rawMsg.includes("api key") || rawMsg.includes("API key")) {
        errorText = "The Omorfi AI assistant is currently offline because the Gemini API key is not configured or invalid in Settings.";
      }
      setMessages(prev => [...prev, { sender: 'bot', text: errorText }]);
    } finally {
      setIsLoading(false);
    }
  };



  if (!isOpen) {
    return (
      <button
        className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-200">
      <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
        <h3 className="font-semibold">Customer Care</h3>
        <button onClick={() => setIsOpen(false)}><X size={20} /></button>
      </div>
      {!selectedPersona ? (
        <div className="p-4">
            <p className="mb-4 text-sm font-bold text-gray-700">Select an agent:</p>
            {personas.map(p => (
                <button
                  key={p.id}
                  className="flex items-center gap-3 w-full p-2.5 mb-2 bg-gray-50 hover:bg-indigo-50 border border-gray-200 rounded-xl transition text-left"
                  onClick={() => setSelectedPersona(p)}
                >
                  {p.profilePictureUrl ? (
                    <img src={p.profilePictureUrl} alt={p.name} className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-gray-900">{p.name}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{p.greeting}</p>
                  </div>
                </button>
            ))}
        </div>
      ) : (
        <div className="flex flex-col h-96">
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-400 italic text-xs">
                {selectedPersona.profilePictureUrl ? (
                  <img src={selectedPersona.profilePictureUrl} alt={selectedPersona.name} className="w-5 h-5 rounded-full object-cover" />
                ) : null}
                <span>{selectedPersona.name} is typing...</span>
              </div>
            )}
            {messages.map((m, i) => (
                <div key={i} className={`flex items-start gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.sender !== 'user' && selectedPersona.profilePictureUrl && (
                    <img src={selectedPersona.profilePictureUrl} alt={selectedPersona.name} className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 border border-gray-200" />
                  )}
                  <div className={`p-2.5 rounded-2xl text-xs max-w-[80%] ${m.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                      {m.text}
                  </div>
                </div>
            ))}
          </div>
          <div className="p-4 border-t flex">
            <input className="flex-1 p-2 border rounded" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} />
            <button className="ml-2 p-2 bg-indigo-600 text-white rounded" onClick={sendMessage}><Send size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

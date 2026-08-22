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
    const data = await response.json();
    setMessages(prev => [...prev, { sender: 'bot', text: data.text }]);
    if (data.ticketCreated) {
        setTicketCreated(true);
    } else {
        setShowFeedback(true);
    }
    setIsLoading(false);
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
            <p className="mb-4">Select an agent:</p>
            {personas.map(p => (
                <button key={p.id} className="block w-full p-2 mb-2 bg-gray-100 hover:bg-gray-200 rounded" onClick={() => setSelectedPersona(p)}>{p.name}</button>
            ))}
        </div>
      ) : (
        <div className="flex flex-col h-96">
          <div className="flex-1 p-4 overflow-y-auto">
            {isLoading && <p className="text-gray-500 italic text-sm">Customer Care is typing...</p>}
            {messages.map((m, i) => (
                <div key={i} className={`mb-2 p-2 rounded ${m.sender === 'user' ? 'bg-indigo-100 self-end' : 'bg-gray-100'}`}>
                    {m.text}
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

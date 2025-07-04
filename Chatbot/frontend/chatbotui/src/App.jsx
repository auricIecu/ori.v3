import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import customLogo from './assets/Logo1.png';
import ConversationHistory from './ConversationHistory';

const App = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatActive, setIsChatActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [systemMessage, setSystemMessage] = useState('You are a useful AI assistant.');
  const [showSystemMessage, setShowSystemMessage] = useState(false);
  const chatContainerRef = useRef(null);


  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    if (!conversationId) {
      setConversationId(Date.now().toString());
    }
  }, [conversationId]);
  
  // Función para cargar los mensajes de una conversación seleccionada del historial
  const loadConversation = async (selectedConversationId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/conversations/${selectedConversationId}/messages`);
      
      if (!response.ok) {
        throw new Error('Error loading conversation');
      }
      
      const messages = await response.json();
      
      // Transformar los mensajes al formato utilizado en el chatHistory
      const formattedMessages = messages.map(msg => ({
        sender: msg.role,
        text: msg.content,
        id: msg.id
      }));
      
      setChatHistory(formattedMessages);
      setConversationId(selectedConversationId);
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();

    if (message.trim() === '') return;

    setLoading(true);
    setChatHistory((prevHistory) => [
      ...prevHistory,
      { sender: 'user', text: message },
    ]);

    try {
      const response = await fetch(`http://localhost:8000/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          role: 'user',
          conversation_id: conversationId, // Send the conversation_id with the message
        }),
      });

      if (!response.ok) {
        throw new Error('Error with API request');
      }

      const data = await response.json();
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { sender: 'ai', text: data.response, id: data.message_id },
      ]);
      setMessage('');
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Función para borrar la conversación actual
  const clearConversation = async () => {
    if (!conversationId) return;
    
    try {
      const response = await fetch(`http://localhost:8000/clear-conversation/?conversation_id=${conversationId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Error clearing conversation');
      }
      
      const data = await response.json();
      setConversationId(data.conversation_id);
      setChatHistory([]);
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  };
  
  // Función para iniciar una nueva conversación sin borrar la actual
  const startNewConversation = () => {
    // Generamos un nuevo ID basado en la marca de tiempo actual
    const newConversationId = Date.now().toString();
    setConversationId(newConversationId);
    setChatHistory([]);
  };

  // Función para enviar feedback sobre una respuesta
  const sendFeedback = async (message, isPositive) => {
    try {
      // Verificar si el mensaje tiene un ID (necesario para mensajes cargados del historial)
      if (!message.id) {
        console.error('No message ID available for feedback');
        return;
      }
      
      const response = await fetch(`http://localhost:8000/feedback/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message_id: message.id,
          is_positive: isPositive,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Error sending feedback');
      }
      
      // Actualizar el estado local para mostrar que se ha enviado feedback
      setChatHistory((prevHistory) => {
        return prevHistory.map(msg => {
          if (msg === message) {
            return {
              ...msg,
              feedback: isPositive ? 'positive' : 'negative',
            };
          }
          return msg;
        });
      });
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  // Función para actualizar el mensaje del sistema
  const updateSystemMessage = async () => {
    try {
      const response = await fetch(`http://localhost:8000/update-system-message/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          system_message: systemMessage,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Error updating system message');
      }
      
      setShowSystemMessage(false);
    } catch (error) {
      console.error('Error updating system message:', error);
    }
  };

  // Función para exportar la conversación
  const exportConversation = () => {
    if (!conversationId) return;
    
    // Crear un enlace para descargar el archivo
    const link = document.createElement('a');
    link.href = `http://localhost:8000/export-conversation/${conversationId}`;
    link.download = `conversation_${conversationId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#00db67] fixed inset-0 flex justify-center items-center p-4">

      <div className="w-full max-w-lg bg-[#00db67] p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <img 
              src={customLogo} 
              alt="Logo" 
              className="h-16 w-auto" 
            />
            {/* Se ha eliminado el título con la palabra orito */}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSystemMessage(!showSystemMessage)}
              className="bg-[#76dd76] text-black py-2 px-4 text-sm rounded-full hover:opacity-80 transition-colors"
            >
              Personalizar AI
            </button>
            <button
              onClick={exportConversation}
              className="bg-[#76dd76] text-black py-2 px-4 text-sm rounded-full hover:opacity-80 transition-colors"
            >
              Exportar
            </button>
            <button
              onClick={startNewConversation}
              className="bg-[#76dd76] text-black py-2 px-4 text-sm rounded-full hover:opacity-80 transition-colors"
            >
              Nueva
            </button>
            <button
              onClick={clearConversation}
              className="bg-[#76dd76] text-black py-2 px-4 text-sm rounded-full hover:opacity-80 transition-colors"
            >
              Borrar
            </button>
          </div>
        </div>
        
        {/* Componente de historial de conversaciones */}
        <ConversationHistory 
          onSelectConversation={loadConversation} 
          currentConversationId={conversationId} 
        />

        {showSystemMessage && (
          <div className="mb-4 p-3 bg-zinc-800">
            <textarea
              value={systemMessage}
              onChange={(e) => setSystemMessage(e.target.value)}
              className="w-full p-3 mb-2 focus:outline-none bg-zinc-950 text-white text-sm rounded-xl"
              rows="3"
              placeholder="Personaliza el comportamiento del chatbot..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSystemMessage(false)}
                className="bg-[#efca2d] text-black py-2 px-4 rounded-full text-sm hover:opacity-80 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={updateSystemMessage}
                className="bg-[#efca2d] text-black py-2 px-4 rounded-full text-sm hover:opacity-80 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        <div
          ref={chatContainerRef}
          className="overflow-y-auto h-96 space-y-4 mb-4 p-4"
        >
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-xs ${msg.sender === 'user' ? 'p-4 bg-[#76dd76] rounded-full' : ''} text-black`}>
                {msg.text}
              </div>
              {msg.sender === 'ai' && (
                <div className="flex mt-1 space-x-2">
                  <button
                    onClick={() => sendFeedback(msg, true)}
                    className={`text-xs p-1 rounded-full ${msg.feedback === 'positive' ? 'bg-green-600' : 'bg-zinc-800'} text-white`}
                    title="Me gusta esta respuesta"
                    disabled={msg.feedback}
                  >
                    👍
                  </button>
                  <button
                    onClick={() => sendFeedback(msg, false)}
                    className={`text-xs p-1 rounded-full ${msg.feedback === 'negative' ? 'bg-red-600' : 'bg-zinc-800'} text-white`}
                    title="No me gusta esta respuesta"
                    disabled={msg.feedback}
                  >
                    👎
                  </button>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-xs p-4 bg-gray-900 text-white animate-pulse rounded-2xl rounded-tl-none">
                Escribiendo...
              </div>
            </div>
          )}
        </div>


        {isChatActive && (
          <form onSubmit={sendMessage} className="flex flex-col sm:flex-row items-center  sm:space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 focus:outline-none bg-[#303030] text-white text-sm sm:text-base rounded-full"
              placeholder="Type your message..."
            />
            <button
              type="submit"
              className="bg-[#76dd76] text-black py-3 px-5 text-sm sm:text-base disabled:opacity-50 rounded-full hover:opacity-80 transition-colors"
              disabled={loading || !message.trim()}
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default App;
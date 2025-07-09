import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import customLogo from './assets/Logo1.png';
import iconoNueva from './assets/Signo mas.png';
import iconoPersonalizar from './assets/Signo ajuste.png';
import iconoExportar from './assets/Signo exportar.png';
import iconoBorrar from './assets/Signo borrar.png';
import iconoHistorial from './assets/Signo historial.png';
import ConversationHistory from './ConversationHistory';

const App = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatActive, setIsChatActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);
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
    <div className="bg-[#00db67] fixed inset-0 flex">
      {/* Barra lateral izquierda */}
      <div className="bg-[#00db67] w-10 sm:w-20 flex flex-col items-center sm:items-start p-2 border-r border-green-500 h-full">
        {/* Logo */}
        <div className="mb-8 flex justify-center w-full">
          <img 
            src={customLogo} 
            alt="Logo" 
            className="h-16 w-auto" 
          />
        </div>

        {/* Estructura flexible que permite empujar el historial al fondo */}
        <div className="flex flex-col h-full w-full">
          {/* Parte superior con botones */}
          <div className="flex flex-col space-y-4 w-full items-center sm:items-stretch">
            {/* Nueva */}
            <button
              onClick={startNewConversation}
              className="bg-transparent border-none text-black py-2 px-2 text-sm hover:opacity-80 transition-colors w-full flex justify-center items-center"
              title="Nueva conversación"
            >
              <img src={iconoNueva} alt="Nueva" className="h-11 w-auto" />
            </button>

            {/* Personalizar AI */}
            <button
              onClick={() => setShowSystemMessage(!showSystemMessage)}
              className="bg-transparent border-none text-black py-2 px-2 text-sm hover:opacity-80 transition-colors w-full flex justify-center items-center"
              title="Personalizar AI"
            >
              <img src={iconoPersonalizar} alt="Personalizar AI" className="h-11 w-auto" />
            </button>

            {/* Exportar */}
            <button
              onClick={exportConversation}
              className="bg-transparent border-none text-black py-2 px-2 text-sm hover:opacity-80 transition-colors w-full flex justify-center items-center"
              title="Exportar"
            >
              <img src={iconoExportar} alt="Exportar" className="h-11 w-auto" />
            </button>

            {/* Borrar */}
            <button
              onClick={clearConversation}
              className="bg-transparent border-none text-black py-2 px-2 text-sm hover:opacity-80 transition-colors w-full flex justify-center items-center"
              title="Borrar"
            >
              <img src={iconoBorrar} alt="Borrar" className="h-11 w-auto" />
            </button>
          </div>
          
          {/* Espacio flexible */}
          <div className="flex-grow"></div>
          
          {/* Historial de conversaciones (al fondo) */}
          <div className="w-full mt-auto">
            <ConversationHistory 
              onSelectConversation={loadConversation} 
              currentConversationId={conversationId} 
            />
          </div>
        </div>
      </div>

      {/* Área principal de chat */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden max-w-3xl mx-auto">

        {showSystemMessage && (
          <div className="mb-4 p-3 bg-zinc-800 rounded-lg">
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
                className="bg-[#76dd76] text-black py-2 px-4 rounded-full text-sm hover:opacity-80 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={updateSystemMessage}
                className="bg-[#76dd76] text-black py-2 px-4 rounded-full text-sm hover:opacity-80 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        <div
          ref={chatContainerRef}
          className="overflow-y-auto flex-grow space-y-4 mb-4 p-2 sm:p-4"
          style={{ height: isFirstInteraction ? 'calc(30vh)' : 'calc(100vh - 140px)' }}
        >
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-xs sm:max-w-sm md:max-w-md ${msg.sender === 'user' ? 'p-4 bg-[#76dd76] rounded-full' : ''} text-black`}>
                {msg.text}
              </div>
              {msg.sender === 'ai' && (
                <div className="flex mt-1 space-x-2">
                  <button
                    onClick={() => sendFeedback(msg, true)}
                    className={`text-lg bg-transparent border-none ${msg.feedback === 'positive' ? 'opacity-100' : 'opacity-60'}`}
                    title="Me gusta esta respuesta"
                    disabled={msg.feedback}
                  >
                    👍
                  </button>
                  <button
                    onClick={() => sendFeedback(msg, false)}
                    className={`text-lg bg-transparent border-none ${msg.feedback === 'negative' ? 'opacity-100' : 'opacity-60'}`}
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
          <div className={`flex flex-col items-center ${isFirstInteraction ? 'h-full' : ''}`} style={isFirstInteraction ? {justifyContent: 'center', transform: 'translateY(-20%)'} : {}}>
            {isFirstInteraction && (
              <h1 className="text-6xl font-bold mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: '#f7c61a' }}>
                Orito
              </h1>
            )}
            <form 
              onSubmit={(e) => {
                if (isFirstInteraction) {
                  setIsFirstInteraction(false);
                }
                sendMessage(e);
              }} 
              className={`flex flex-col sm:flex-row items-center sm:space-x-2 ${isFirstInteraction ? 'w-2/3 mx-auto' : 'sticky bottom-0 w-full'} bg-[#00db67] py-2 ${isFirstInteraction ? '' : 'mt-auto'}`}
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 focus:outline-none bg-[#303030] text-white text-sm sm:text-base rounded-full"
                placeholder="Type your message..."
                autoFocus={isFirstInteraction}
              />
              <button
                type="submit"
                className="bg-[#76dd76] text-black py-3 px-5 mt-2 sm:mt-0 text-sm sm:text-base disabled:opacity-50 rounded-full hover:opacity-80 transition-colors"
                disabled={loading || !message.trim()}
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
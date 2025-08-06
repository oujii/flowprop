import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, MessageSquare, Play, Settings, User, Clock, ArrowLeft, Send, Film, Battery, Signal, Wifi } from 'lucide-react';

// --- Helper Functions & Data ---
const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Mock for saving/loading projects. In a real app, this would use a database or local storage.
const mockProjects = {
  'proj-123': {
    name: 'The Heist',
    contacts: [{ id: 'contact-01', name: 'Frank', avatar: 'F' }],
    conversation: [{ id: generateId(), sender: 'contact', text: 'Meet me at the pier.', delay: 3 }],
    settings: {
      layoutStyle: 'modern',
      writingMode: 'prop',
      timingMode: 'natural',
      initialDelay: 3,
      targetContactId: 'contact-01',
    },
  },
};

const getNowTime = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
const getNowDate = () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

// --- Components ---

/**
 * A component to simulate a fake status bar at the top of the "phone" screen.
 */
function PhoneStatusBar() {
  const [time, setTime] = useState(getNowTime());

  useEffect(() => {
    const timer = setInterval(() => setTime(getNowTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-between items-center px-4 py-2 text-xs bg-black text-white border-b border-gray-800">
      <span className="font-semibold">{time}</span>
      <div className="flex items-center gap-1">
        <Signal size={14} className="text-gray-400" />
        <Wifi size={14} className="text-gray-400" />
        <Battery size={16} />
      </div>
    </div>
  );
}

/**
 * A reusable message bubble component. This is the modular part for different layouts.
 */
function MessageBubble({ sender, text, contacts }) {
  const isMe = sender === 'me';
  const senderName = isMe ? 'You' : contacts.find(c => c.id === sender)?.name || 'Contact';
  const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(' ', '');

  return (
    <div className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
      {!isMe && (
        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-lg self-start flex-shrink-0">
          {senderName.charAt(0)}
        </div>
      )}
      <div className={`max-w-[75%] p-3 rounded-2xl ${isMe ? 'bg-blue-600 rounded-br-lg' : 'bg-gray-700 rounded-bl-lg'}`}>
        <p className="text-sm">{text}</p>
        <span className="block text-[10px] text-gray-300 mt-1 opacity-70 text-right">{timestamp}</span>
      </div>
    </div>
  );
}

/**
 * A custom input component that forces a predefined string to be typed.
 */
function ForcedTypingInput({ textToType, onComplete }) {
  const inputRef = useRef(null);
  const [value, setValue] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e) => {
    // Prevent all default keystrokes
    e.preventDefault();

    if (e.key === 'Backspace') {
      if (index > 0) {
        setIndex(prev => prev - 1);
        setValue(textToType.substring(0, index - 1));
      }
    } else if (e.key === 'Enter') {
      if (index === textToType.length) {
        onComplete(textToType);
        setValue('');
        setIndex(0);
      }
    } else if (e.key.length === 1 && index < textToType.length) {
      // For any standard character, add the next one from the script
      setIndex(prev => prev + 1);
      setValue(textToType.substring(0, index + 1));
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onKeyDown={handleKeyDown}
      placeholder="Type the message..."
      className="flex-grow bg-gray-700 border border-gray-600 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck="false"
      autoComplete="off"
    />
  );
}

// --- Main App Component ---
export default function App() {
  const [view, setView] = useState('home'); // 'home', 'setup', 'live'
  const [projects, setProjects] = useState(mockProjects);
  const [currentProject, setCurrentProject] = useState(null);
  
  const handleStartNewProject = () => {
    // Simulating the start of a new project, setting up default state
    const newProject = {
      id: generateId(),
      name: 'New Project',
      contacts: [{ id: 'me', name: 'My Character', avatar: 'M' }],
      conversation: [],
      settings: {
        layoutStyle: 'modern',
        writingMode: 'prop',
        timingMode: 'natural',
        initialDelay: 3,
        targetContactId: null,
      },
    };
    setCurrentProject(newProject);
    setView('wizard');
  };

  const handleOpenProject = (projectId) => {
    setCurrentProject(projects[projectId]);
    setView('setup');
  };

  const handleSaveProject = () => {
    if (currentProject) {
      setProjects({ ...projects, [currentProject.id]: currentProject });
    }
  };

  const handleGoLive = () => {
    if (currentProject?.conversation.length > 0) {
      setView('live');
    } else {
      alert("Please add some messages to the conversation.");
    }
  };

  const handleExitLive = () => {
    setView('setup');
  };

  const renderView = () => {
    switch (view) {
      case 'wizard':
        return <WizardScreen onComplete={(setupData) => {
          // Placeholder for handling wizard data and moving to setup screen
          setCurrentProject(prev => ({
            ...prev,
            contacts: [...prev.contacts, ...setupData.contacts],
            settings: { ...prev.settings, ...setupData.settings, targetContactId: setupData.contacts[0].id },
          }));
          setView('setup');
        }} onBack={() => setView('home')} />;
      case 'setup':
        return (
          <SetupScreen
            currentProject={currentProject}
            setCurrentProject={setCurrentProject}
            onGoLive={handleGoLive}
            onBack={() => { handleSaveProject(); setView('home'); }}
          />
        );
      case 'live':
        return (
          <LiveScreen
            conversation={currentProject.conversation}
            settings={currentProject.settings}
            onExit={handleExitLive}
            contacts={currentProject.contacts}
          />
        );
      case 'home':
      default:
        return (
          <HomeScreen
            projects={projects}
            onStartNewProject={handleStartNewProject}
            onOpenProject={handleOpenProject}
          />
        );
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-sm h-[80vh] max-h-[700px] bg-black rounded-3xl border-4 border-gray-700 shadow-2xl overflow-hidden flex flex-col">
        {renderView()}
      </div>
    </div>
  );
}

// --- Screens ---

function HomeScreen({ projects, onStartNewProject, onOpenProject }) {
  return (
    <div className="flex flex-col h-full bg-gray-800 p-6 text-center">
      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2 text-cyan-400">
          <Film size={32} /> FlowProp
        </h1>
        <p className="text-sm text-gray-400 mt-2">Create realistic prop phone chats for your films.</p>
      </header>
      <main className="flex-grow flex flex-col gap-4">
        <button
          onClick={onStartNewProject}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} /> Start New Project
        </button>
        <div className="border-t border-gray-700 pt-4 mt-4">
          <h2 className="text-lg font-semibold text-gray-300 mb-3">Recent Projects</h2>
          {Object.keys(projects).length > 0 ? (
            <ul className="space-y-2 text-left">
              {Object.keys(projects).map(key => (
                <li key={key} className="bg-gray-700/50 p-3 rounded-lg flex items-center justify-between">
                  <span className="font-medium">{projects[key].name}</span>
                  <button onClick={() => onOpenProject(key)} className="text-sm text-cyan-400 hover:underline">
                    Open
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No projects saved yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}

function WizardScreen({ onComplete, onBack }) {
  const [step, setStep] = useState(1);
  const [scenario, setScenario] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [newContactName, setNewContactName] = useState('');

  const addContact = (e) => {
    e.preventDefault();
    if (newContactName.trim()) {
      const newContact = { id: generateId(), name: newContactName.trim(), avatar: newContactName.trim().charAt(0).toUpperCase() };
      setContacts([...contacts, newContact]);
      setNewContactName('');
    }
  };

  const deleteContact = (id) => {
    setContacts(contacts.filter(c => c.id !== id));
  };
  
  const handleWizardComplete = () => {
    if (contacts.length === 0) {
      alert("Please add at least one contact.");
      return;
    }
    onComplete({ scenario, contacts, settings: { layoutStyle: 'modern' } });
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 p-4">
      <header className="p-3 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700"><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold">Setup Wizard (Step {step}/2)</h1>
        <div className="w-8"></div>
      </header>
      <main className="flex-grow p-4 overflow-y-auto">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-cyan-400">Choose Scenario:</h2>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => { setScenario('chat_only'); setStep(2); }}
                className={`p-4 rounded-lg border-2 ${scenario === 'chat_only' ? 'border-cyan-500 bg-cyan-600/30' : 'border-gray-600 bg-gray-700/50'}`}
              >
                <h3 className="font-bold">Chat Only</h3>
                <p className="text-xs text-gray-400 mt-1">Start directly in a conversation.</p>
              </button>
              <button
                onClick={() => { setScenario('contacts_list'); setStep(2); }}
                className={`p-4 rounded-lg border-2 ${scenario === 'contacts_list' ? 'border-cyan-500 bg-cyan-600/30' : 'border-gray-600 bg-gray-700/50'}`}
              >
                <h3 className="font-bold">From Contacts</h3>
                <p className="text-xs text-gray-400 mt-1">Initiate a chat from a list of contacts.</p>
              </button>
              <button
                onClick={() => { setScenario('sleep_mode'); setStep(2); }}
                className={`p-4 rounded-lg border-2 ${scenario === 'sleep_mode' ? 'border-cyan-500 bg-cyan-600/30' : 'border-gray-600 bg-gray-700/50'}`}
              >
                <h3 className="font-bold">From Lock Screen</h3>
                <p className="text-xs text-gray-400 mt-1">Wake phone with a message notification.</p>
              </button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-cyan-400">Add Contacts:</h2>
            <form onSubmit={addContact} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="Enter character name..."
                className="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 rounded-lg p-2 transition-colors">
                <Plus size={20} />
              </button>
            </form>
            <div className="space-y-2">
              {contacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg">
                  <span className="font-medium">{contact.name}</span>
                  <button onClick={() => deleteContact(contact.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      {step === 2 && (
        <footer className="p-4 border-t border-gray-700">
          <button onClick={handleWizardComplete} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all">
            <Settings size={20} /> Configure Conversation
          </button>
        </footer>
      )}
    </div>
  );
}

function SetupScreen({ currentProject, setCurrentProject, onGoLive, onBack }) {
  const { contacts, conversation, settings } = currentProject;
  const targetContact = contacts.find(c => c.id === settings.targetContactId);

  const updateMessage = (id, field, value) => {
    const newConversation = conversation.map(msg => msg.id === id ? { ...msg, [field]: value } : msg);
    setCurrentProject({ ...currentProject, conversation: newConversation });
  };

  const addMessage = () => {
    const lastSender = conversation.length > 0 ? conversation[conversation.length - 1].sender : 'me';
    const newSender = lastSender === 'me' ? (targetContact ? targetContact.id : null) : 'me';
    if (newSender) {
        setCurrentProject({
            ...currentProject,
            conversation: [...conversation, { id: generateId(), sender: newSender, text: '', delay: 2 }],
        });
    }
  };
    
  const deleteMessage = (id) => {
    setCurrentProject({ ...currentProject, conversation: conversation.filter(msg => msg.id !== id) });
  };
  
  const updateSettings = (key, value) => {
    setCurrentProject({ ...currentProject, settings: { ...settings, [key]: value } });
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <header className="p-3 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700"><ArrowLeft size={20}/></button>
        <h1 className="text-lg font-bold">Conversation Setup</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-grow p-4 overflow-y-auto space-y-4">
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <h3 className="font-semibold text-cyan-400 mb-3">Settings</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <label htmlFor="targetContact" className="text-gray-300">Chatting with:</label>
              <select
                id="targetContact"
                value={settings.targetContactId}
                onChange={e => updateSettings('targetContactId', e.target.value)}
                className="bg-gray-600 border border-gray-500 rounded-md px-2 py-1"
              >
                {contacts.filter(c => c.id !== 'me').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-300 mb-1 block">Response Timing:</label>
              <div className="flex gap-2">
                <button onClick={() => updateSettings('timingMode', 'natural')} className={`flex-1 text-xs py-2 rounded-md ${settings.timingMode === 'natural' ? 'bg-cyan-600' : 'bg-gray-600'}`}>Natural</button>
                <button onClick={() => updateSettings('timingMode', 'manual')} className={`flex-1 text-xs py-2 rounded-md ${settings.timingMode === 'manual' ? 'bg-cyan-600' : 'bg-gray-600'}`}>Manual</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="initialDelay" className="text-gray-300">Start delay (sec):</label>
              <input
                id="initialDelay"
                type="number"
                min="0"
                value={settings.initialDelay}
                onChange={e => updateSettings('initialDelay', Number(e.target.value))}
                className="bg-gray-600 border border-gray-500 rounded-md px-2 py-1 w-20 text-center"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-700/50 p-3 rounded-lg">
          <h3 className="font-semibold text-cyan-400 mb-3">Conversation Script</h3>
          <div className="space-y-2">
            {conversation.map((msg) => (
              <div key={msg.id} className="bg-gray-600/70 p-2 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={msg.sender}
                    onChange={e => updateMessage(msg.id, 'sender', e.target.value)}
                    className="bg-gray-500 text-xs rounded px-2 py-1"
                  >
                    <option value="me">Me</option>
                    <option value={targetContact?.id}>{targetContact?.name}</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Message text..."
                    value={msg.text}
                    onChange={e => updateMessage(msg.id, 'text', e.target.value)}
                    className="flex-grow bg-gray-700 border border-gray-500 rounded-md px-2 py-1 text-sm"
                  />
                  {settings.timingMode === 'manual' && (
                    <input
                      type="number"
                      min="0"
                      value={msg.delay}
                      onChange={e => updateMessage(msg.id, 'delay', Number(e.target.value))}
                      className="w-16 bg-gray-700 border border-gray-500 rounded-md px-2 py-1 text-sm text-center"
                      title="Delay in seconds"
                    />
                  )}
                  <button onClick={() => deleteMessage(msg.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button onClick={addMessage} className="w-full text-sm py-2 mt-2 bg-cyan-600/50 hover:bg-cyan-600 rounded-lg transition-colors">
              + Add Message
            </button>
          </div>
        </div>
      </main>

      <footer className="p-4 border-t border-gray-700">
        <button
          onClick={onGoLive}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Play size={20} /> Go Live
        </button>
      </footer>
    </div>
  );
}

function LiveScreen({ conversation, settings, onExit, contacts }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
  const timeouts = useRef([]);
  const messagesEndRef = useRef(null);

  const targetContact = contacts.find(c => c.id === settings.targetContactId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  useEffect(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];

    setMessages([]);
    setIsTyping(false);
    setCurrentScriptIndex(0);

    const fullScript = conversation;

    let cumulativeDelay = settings.initialDelay * 1000;

    fullScript.forEach((msg, index) => {
      const isContactMessage = msg.sender !== 'me';

      const messageDelay = settings.timingMode === 'natural'
        ? (msg.text.length * 50) + (Math.random() * 500)
        : msg.delay * 1000;

      if (isContactMessage) {
        const typingTimeout = setTimeout(() => {
          setIsTyping(true);
        }, cumulativeDelay);
        timeouts.current.push(typingTimeout);
        cumulativeDelay += 1000 + Math.random() * 1000; // Simulating typing duration
      }
      
      const messageTimeout = setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { ...msg, timestamp: new Date() }]);
      }, cumulativeDelay);
      timeouts.current.push(messageTimeout);

      cumulativeDelay += messageDelay;
    });

    return () => {
      timeouts.current.forEach(clearTimeout);
    };
  }, [conversation, settings]);

  const handleActorSend = (actorMessage) => {
    const nextMessage = conversation.find((msg, index) => msg.sender === 'me' && index >= currentScriptIndex);
    if (!nextMessage) return; // No more actor messages in the script

    if (actorMessage === nextMessage.text) {
        const newMessage = { ...nextMessage, timestamp: new Date() };
        setMessages(prev => [...prev, newMessage]);
        setCurrentScriptIndex(conversation.indexOf(nextMessage) + 1);
    }
  };

  const nextActorMessage = conversation.find((msg, index) => msg.sender === 'me' && index >= currentScriptIndex);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <PhoneStatusBar />
      <header className="p-3 bg-gray-800/80 backdrop-blur-sm flex items-center gap-3 border-b border-gray-700">
        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xl">
          {targetContact?.avatar}
        </div>
        <div>
          <h2 className="font-semibold">{targetContact?.name}</h2>
          {isTyping && <p className="text-xs text-green-400 animate-pulse">typing...</p>}
        </div>
        <button onClick={onExit} className="ml-auto text-xs bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded-full">Exit</button>
      </header>
      
      <main className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} sender={msg.sender} text={msg.text} contacts={contacts} />
        ))}
        {isTyping && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold self-start flex-shrink-0">
              {targetContact?.avatar}
            </div>
            <div className="bg-gray-700 rounded-2xl rounded-bl-lg p-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-2 bg-gray-800 border-t border-gray-700">
        <form className="flex items-center gap-2">
            {settings.writingMode === 'prop' && nextActorMessage ? (
                <ForcedTypingInput
                    textToType={nextActorMessage.text}
                    onComplete={handleActorSend}
                />
            ) : (
                <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={settings.writingMode !== 'real'}
                />
            )}
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-full p-3 transition-colors">
                <Send size={18} />
            </button>
        </form>
      </footer>
    </div>
  );
}
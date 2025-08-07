import React, { useState, useEffect, useContext, createContext, useCallback, useMemo } from 'react';
import { MessageSquare, Plus, Settings, Play, Edit3, Trash2, Move, Clock, Users } from 'lucide-react';

// Custom Hooks
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key]);

  return [storedValue, setValue];
};

const useForcedTyping = (scriptText, onComplete) => {
  const [displayText, setDisplayText] = useState('');
  const [scriptIndex, setScriptIndex] = useState(0);

  const handleKeyDown = useCallback((e) => {
    e.preventDefault();
    
    if (e.key.match(/^[a-zA-Z0-9\s.,!?;:'"()-]$/)) {
      if (scriptIndex < scriptText.length) {
        const nextChar = scriptText[scriptIndex];
        setDisplayText(prev => prev + nextChar);
        setScriptIndex(prev => prev + 1);
      }
    }
    
    if (e.key === 'Backspace' && displayText.length > 0) {
      setDisplayText(prev => prev.slice(0, -1));
      setScriptIndex(prev => Math.max(0, prev - 1));
    }
    
    if (e.key === 'Enter' && scriptIndex >= scriptText.length) {
      onComplete(displayText);
      setDisplayText('');
      setScriptIndex(0);
    }
  }, [scriptText, scriptIndex, displayText, onComplete]);

  const reset = useCallback(() => {
    setDisplayText('');
    setScriptIndex(0);
  }, []);

  return {
    displayText,
    handleKeyDown,
    isComplete: scriptIndex >= scriptText.length,
    progress: scriptText.length > 0 ? (scriptIndex / scriptText.length) * 100 : 0,
    reset
  };
};

// Context
const ProjectContext = createContext();

const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useLocalStorage('flowprop_projects', []);
  const [currentProject, setCurrentProject] = useState(null);
  const [isLiveMode, setIsLiveMode] = useState(false);

  const createProject = useCallback((projectData) => {
    const newProject = {
      id: Date.now().toString(),
      name: projectData.name,
      type: projectData.type,
      messages: projectData.messages || [],
      participants: projectData.participants || [],
      settings: projectData.settings || {},
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    setProjects(prev => [...prev, newProject]);
    setCurrentProject(newProject);
    return newProject;
  }, [setProjects]);

  const updateProject = useCallback((projectId, updates) => {
    const updatedProject = { ...currentProject, ...updates, lastModified: new Date().toISOString() };
    setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
    setCurrentProject(updatedProject);
  }, [currentProject, setProjects]);

  const deleteProject = useCallback((projectId) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
    }
  }, [currentProject, setProjects]);

  const value = useMemo(() => ({
    projects,
    currentProject,
    setCurrentProject,
    isLiveMode,
    setIsLiveMode,
    createProject,
    updateProject,
    deleteProject
  }), [projects, currentProject, isLiveMode, createProject, updateProject, deleteProject]);

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};

// Components
const Button = ({ variant = 'primary', size = 'md', children, className = '', ...props }) => {
  const baseClasses = 'rounded-xl font-semibold transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const MessageBubble = ({ message, isOwn }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-2xl ${
          isOwn
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-gray-200 text-gray-900 rounded-bl-md'
        } shadow-sm`}
      >
        <div className="text-sm font-medium mb-1">{message.sender}</div>
        <div className="text-base leading-relaxed">{message.text}</div>
        <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

const TypingIndicator = ({ sender }) => {
  return (
    <div className="flex justify-start mb-2">
      <div className="bg-gray-200 px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
        <div className="text-sm font-medium mb-1">{sender}</div>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
    </div>
  );
};

const WelcomeScreen = ({ onCreateProject, onLoadProject, projects }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <MessageSquare className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">FlowProp</h1>
        <p className="text-lg text-gray-600 max-w-md">
          Professional messaging simulator for film productions
        </p>
      </div>
      
      <div className="w-full max-w-md space-y-4">
        <Button
          size="lg"
          className="w-full"
          onClick={onCreateProject}
        >
          <Plus className="w-5 h-5 mr-2" />
          Start New Project
        </Button>
        
        {projects.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Projects</h3>
            <div className="space-y-2">
              {projects.slice(0, 3).map(project => (
                <button
                  key={project.id}
                  onClick={() => onLoadProject(project)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{project.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(project.lastModified).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState({
    name: '',
    type: 'direct',
    participants: [
      { id: '1', name: 'You', color: 'blue' },
      { id: '2', name: 'Contact', color: 'gray' }
    ],
    messages: []
  });

  const handleStepComplete = (stepData) => {
    setProjectData(prev => ({ ...prev, ...stepData }));
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete(projectData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">New Project</h2>
            <span className="text-sm text-gray-500">Step {step} of 3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="font-semibold mb-4">Project Details</h3>
            <input
              type="text"
              placeholder="Project name..."
              value={projectData.name}
              onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-lg"
            />
            <Button
              className="w-full"
              onClick={() => handleStepComplete({ name: projectData.name || 'Untitled Project' })}
              disabled={!projectData.name.trim()}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="font-semibold mb-4">Scenario Type</h3>
            <div className="space-y-3">
              {[
                { id: 'direct', title: 'Direct Chat', desc: 'Jump straight to conversation' },
                { id: 'contacts', title: 'Contact List Start', desc: 'Begin from contacts, then chat' },
                { id: 'lockscreen', title: 'Lock Screen Start', desc: 'Realistic phone wake-up scenario' }
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => handleStepComplete({ type: option.id })}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="font-medium">{option.title}</div>
                  <div className="text-sm text-gray-500">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="font-semibold mb-4">Participants</h3>
            <div className="space-y-3">
              {projectData.participants.map((participant, index) => (
                <div key={participant.id} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full bg-${participant.color}-500`} />
                  <input
                    type="text"
                    value={participant.name}
                    onChange={(e) => {
                      const newParticipants = [...projectData.participants];
                      newParticipants[index].name = e.target.value;
                      setProjectData(prev => ({ ...prev, participants: newParticipants }));
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              ))}
            </div>
            <Button
              className="w-full mt-6"
              onClick={() => onComplete(projectData)}
            >
              Create Project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const ScriptBuilder = ({ project, onUpdateProject }) => {
  const [messages, setMessages] = useState(project.messages || []);
  const [newMessage, setNewMessage] = useState({ sender: project.participants[0]?.name, text: '', delay: 2 });

  const addMessage = () => {
    const message = {
      id: Date.now().toString(),
      sender: newMessage.sender,
      text: newMessage.text,
      delay: newMessage.delay,
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    onUpdateProject(project.id, { messages: updatedMessages });
    setNewMessage({ sender: project.participants[0]?.name, text: '', delay: 2 });
  };

  const deleteMessage = (messageId) => {
    const updatedMessages = messages.filter(m => m.id !== messageId);
    setMessages(updatedMessages);
    onUpdateProject(project.id, { messages: updatedMessages });
  };

  const updateMessage = (messageId, updates) => {
    const updatedMessages = messages.map(m => m.id === messageId ? { ...m, ...updates } : m);
    setMessages(updatedMessages);
    onUpdateProject(project.id, { messages: updatedMessages });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-lg max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Add your first message below.
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div key={message.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <select
                    value={message.sender}
                    onChange={(e) => updateMessage(message.id, { sender: e.target.value })}
                    className="text-sm font-medium bg-transparent border-none focus:outline-none"
                  >
                    {project.participants.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={message.delay}
                      onChange={(e) => updateMessage(message.id, { delay: parseInt(e.target.value) })}
                      className="w-12 text-sm border border-gray-300 rounded px-1"
                      min="0"
                      max="30"
                    />
                    <span className="text-xs text-gray-500">s</span>
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <textarea
                  value={message.text}
                  onChange={(e) => updateMessage(message.id, { text: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg resize-none"
                  rows="2"
                  placeholder="Message text..."
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-lg">
        <h4 className="font-semibold mb-3">Add New Message</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <select
              value={newMessage.sender}
              onChange={(e) => setNewMessage(prev => ({ ...prev, sender: e.target.value }))}
              className="p-2 border border-gray-300 rounded-lg"
            >
              {project.participants.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={newMessage.delay}
                onChange={(e) => setNewMessage(prev => ({ ...prev, delay: parseInt(e.target.value) }))}
                className="w-16 p-2 border border-gray-300 rounded-lg"
                min="0"
                max="30"
              />
              <span className="text-sm text-gray-500">sec delay</span>
            </div>
          </div>
          <textarea
            value={newMessage.text}
            onChange={(e) => setNewMessage(prev => ({ ...prev, text: e.target.value }))}
            placeholder="Type your message..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none text-lg"
            rows="3"
          />
          <Button
            onClick={addMessage}
            disabled={!newMessage.text.trim()}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Message
          </Button>
        </div>
      </div>
    </div>
  );
};

const LiveChatMode = ({ project, onExit }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingSender, setTypingSender] = useState('');
  const [waitingForInput, setWaitingForInput] = useState(false);

  const currentMessage = project.messages[currentMessageIndex];
  const isUserMessage = currentMessage && currentMessage.sender === project.participants[0]?.name;

  const { displayText, handleKeyDown, isComplete, reset } = useForcedTyping(
    currentMessage?.text || '',
    (completedText) => {
      const newMessage = {
        ...currentMessage,
        text: completedText,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, newMessage]);
      setWaitingForInput(false);
      
      setTimeout(() => {
        setCurrentMessageIndex(prev => prev + 1);
      }, 500);
    }
  );

  useEffect(() => {
    if (currentMessageIndex < project.messages.length) {
      const message = project.messages[currentMessageIndex];
      const isUser = message.sender === project.participants[0]?.name;
      
      if (isUser) {
        setWaitingForInput(true);
        reset();
      } else {
        setIsTyping(true);
        setTypingSender(message.sender);
        
        const delay = (message.delay || 2) * 1000;
        setTimeout(() => {
          setIsTyping(false);
          setChatMessages(prev => [...prev, {
            ...message,
            timestamp: new Date().toISOString()
          }]);
          
          setTimeout(() => {
            setCurrentMessageIndex(prev => prev + 1);
          }, 500);
        }, delay);
      }
    }
  }, [currentMessageIndex, project.messages, reset]);

  const handleRestart = () => {
    setCurrentMessageIndex(0);
    setChatMessages([]);
    setIsTyping(false);
    setWaitingForInput(false);
    reset();
  };

  const isComplete_chat = currentMessageIndex >= project.messages.length;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {project.participants[1]?.name?.charAt(0) || 'C'}
            </span>
          </div>
          <div>
            <div className="font-semibold">{project.participants[1]?.name || 'Contact'}</div>
            <div className="text-sm text-green-600">online</div>
          </div>
        </div>
        <button
          onClick={onExit}
          className="text-blue-600 font-semibold"
        >
          Exit
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 pb-20 overflow-y-auto">
        <div className="space-y-4">
          {chatMessages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message}
              isOwn={message.sender === project.participants[0]?.name}
            />
          ))}
          
          {isTyping && <TypingIndicator sender={typingSender} />}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 fixed bottom-0 left-0 right-0">
        {waitingForInput && !isComplete_chat ? (
          <div className="space-y-2">
            <div className="text-sm text-gray-500 text-center">
              Type: "{currentMessage.text}"
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={displayText}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className="flex-1 p-3 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Start typing..."
                autoFocus
              />
              <div className="text-sm text-gray-500">
                {Math.round((displayText.length / currentMessage.text.length) * 100) || 0}%
              </div>
            </div>
          </div>
        ) : isComplete_chat ? (
          <div className="text-center space-y-4">
            <div className="text-lg font-semibold text-green-600">Scene Complete! 🎬</div>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={handleRestart} className="flex-1">
                Restart Scene
              </Button>
              <Button onClick={onExit} className="flex-1">
                Exit Live Mode
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            Waiting for next message...
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectDashboard = ({ project, onUpdateProject, onStartLive, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={onBack} className="text-blue-600 text-sm mb-1">← Back</button>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <div className="text-sm text-gray-500">{project.messages.length} messages</div>
          </div>
          <Button onClick={onStartLive} className="flex items-center space-x-2">
            <Play className="w-4 h-4" />
            <span>Go Live</span>
          </Button>
        </div>

        <ScriptBuilder project={project} onUpdateProject={onUpdateProject} />
      </div>
    </div>
  );
};

// Main App
const App = () => {
  const { projects, currentProject, setCurrentProject, isLiveMode, setIsLiveMode, createProject, updateProject } = useProject();
  const [showWizard, setShowWizard] = useState(false);

  const handleCreateProject = () => {
    setShowWizard(true);
  };

  const handleWizardComplete = (projectData) => {
    const newProject = createProject(projectData);
    setShowWizard(false);
  };

  const handleLoadProject = (project) => {
    setCurrentProject(project);
  };

  const handleStartLive = () => {
    setIsLiveMode(true);
  };

  const handleExitLive = () => {
    setIsLiveMode(false);
  };

  const handleBack = () => {
    setCurrentProject(null);
  };

  if (isLiveMode && currentProject) {
    return <LiveChatMode project={currentProject} onExit={handleExitLive} />;
  }

  if (showWizard) {
    return <ProjectWizard onComplete={handleWizardComplete} />;
  }

  if (currentProject) {
    return (
      <ProjectDashboard
        project={currentProject}
        onUpdateProject={updateProject}
        onStartLive={handleStartLive}
        onBack={handleBack}
      />
    );
  }

  return (
    <WelcomeScreen
      onCreateProject={handleCreateProject}
      onLoadProject={handleLoadProject}
      projects={projects}
    />
  );
};

export default function FlowProp() {
  return (
    <ProjectProvider>
      <div className="min-h-screen">
        <App />
      </div>
    </ProjectProvider>
  );
}
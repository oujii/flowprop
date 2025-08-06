import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, Phone, Video, Info, Settings, Play, Pause, Plus, Trash2, Clock, User, Users, Smartphone, Moon } from 'lucide-react';

const FlowProp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [wizardStep, setWizardStep] = useState('W1');
  const [projectConfig, setProjectConfig] = useState({
    mode: null,
    chatType: 'single',
    participants: [],
    layoutStyle: 'modern',
    delayMode: 'natural',
    customDelay: 2,
    startDelay: 0,
    messages: [],
    background: null,
    lockScreenTime: '9:41',
    lockScreenDate: 'Monday, January 6'
  });
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveMessages, setLiveMessages] = useState([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [forcedText, setForcedText] = useState('');
  const [forcedTextIndex, setForcedTextIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showLockScreen, setShowLockScreen] = useState(false);
  const inputRef = useRef(null);

  // Load projects from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('flowprop-projects');
    if (saved) {
      setProjects(JSON.parse(saved));
    }
  }, []);

  // Save projects to localStorage
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('flowprop-projects', JSON.stringify(projects));
    }
  }, [projects]);

  // Home View
  const HomeView = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Smartphone className="w-12 h-12 text-purple-600 mr-2" />
            <h1 className="text-4xl font-bold text-gray-800">FlowProp</h1>
          </div>
          <p className="text-gray-600">Professional prop messaging for filmmakers</p>
        </div>
        
        <button
          onClick={() => {
            setCurrentView('wizard');
            setWizardStep('W1');
            setProjectConfig({
              mode: null,
              chatType: 'single',
              participants: [],
              layoutStyle: 'modern',
              delayMode: 'natural',
              customDelay: 2,
              startDelay: 0,
              messages: [],
              background: null,
              lockScreenTime: '9:41',
              lockScreenDate: 'Monday, January 6'
            });
          }}
          className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition mb-3 flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Start New Project
        </button>
        
        {projects.length > 0 && (
          <>
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Projects</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {projects.slice(0, 5).map((project, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentProject(project);
                      setCurrentView('main');
                    }}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="font-medium text-gray-800">{project.name}</div>
                    <div className="text-xs text-gray-500">
                      {project.participants.map(p => p.name).join(', ')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Wizard View
  const WizardView = () => {
    const handleW1Selection = (mode) => {
      setProjectConfig({ ...projectConfig, mode });
      setWizardStep('W2');
    };

    const handleAddParticipant = () => {
      const name = prompt('Enter participant name:');
      if (name) {
        setProjectConfig({
          ...projectConfig,
          participants: [...projectConfig.participants, { 
            id: Date.now(), 
            name, 
            isActor: projectConfig.participants.length === 0 
          }]
        });
      }
    };

    const handleFinishWizard = () => {
      const projectName = prompt('Enter project name:') || `Project ${projects.length + 1}`;
      const newProject = {
        ...projectConfig,
        name: projectName,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      setProjects([...projects, newProject]);
      setCurrentProject(newProject);
      setCurrentView('main');
    };

    if (wizardStep === 'W1') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Choose Starting Scenario</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => handleW1Selection('chat-only')}
                className="w-full p-4 bg-gray-50 rounded-lg hover:bg-purple-50 border-2 border-transparent hover:border-purple-300 transition text-left"
              >
                <div className="font-semibold text-gray-800">Chat Only</div>
                <div className="text-sm text-gray-600">Start directly in conversation</div>
              </button>
              
              <button
                onClick={() => handleW1Selection('contacts')}
                className="w-full p-4 bg-gray-50 rounded-lg hover:bg-purple-50 border-2 border-transparent hover:border-purple-300 transition text-left"
              >
                <div className="font-semibold text-gray-800">From Contacts</div>
                <div className="text-sm text-gray-600">Start from contacts list</div>
              </button>
              
              <button
                onClick={() => handleW1Selection('sleep-mode')}
                className="w-full p-4 bg-gray-50 rounded-lg hover:bg-purple-50 border-2 border-transparent hover:border-purple-300 transition text-left"
              >
                <div className="font-semibold text-gray-800">Sleep Mode Start</div>
                <div className="text-sm text-gray-600">Receive notification on lock screen</div>
              </button>
            </div>
            
            <button
              onClick={() => setCurrentView('home')}
              className="mt-6 text-gray-600 hover:text-gray-800 transition"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      );
    }

    if (wizardStep === 'W2') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Configure Project</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chat Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setProjectConfig({ ...projectConfig, chatType: 'single' })}
                    className={`flex-1 p-2 rounded-lg border-2 transition ${
                      projectConfig.chatType === 'single' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <User className="w-4 h-4 inline mr-1" />
                    Single
                  </button>
                  <button
                    onClick={() => setProjectConfig({ ...projectConfig, chatType: 'group' })}
                    className={`flex-1 p-2 rounded-lg border-2 transition ${
                      projectConfig.chatType === 'group' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <Users className="w-4 h-4 inline mr-1" />
                    Group
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participants ({projectConfig.participants.length})
                </label>
                <div className="space-y-2 mb-2">
                  {projectConfig.participants.map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">
                        {p.name} {idx === 0 && <span className="text-purple-600">(Actor)</span>}
                      </span>
                      <button
                        onClick={() => {
                          setProjectConfig({
                            ...projectConfig,
                            participants: projectConfig.participants.filter(part => part.id !== p.id)
                          });
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddParticipant}
                  className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition"
                >
                  + Add Participant
                </button>
              </div>

              {projectConfig.mode === 'sleep-mode' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lock Screen Settings</label>
                  <input
                    type="text"
                    placeholder="Time (e.g., 9:41)"
                    value={projectConfig.lockScreenTime}
                    onChange={(e) => setProjectConfig({ ...projectConfig, lockScreenTime: e.target.value })}
                    className="w-full p-2 border rounded-lg mb-2"
                  />
                  <input
                    type="text"
                    placeholder="Date (e.g., Monday, January 6)"
                    value={projectConfig.lockScreenDate}
                    onChange={(e) => setProjectConfig({ ...projectConfig, lockScreenDate: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setWizardStep('W1')}
                className="flex-1 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={handleFinishWizard}
                disabled={projectConfig.participants.length < 2}
                className="flex-1 p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  // Main View - Script Editor
  const MainView = () => {
    if (!currentProject) return null;

    const handleAddMessage = () => {
      const senderName = prompt('Who sends this message?');
      const sender = currentProject.participants.find(p => p.name === senderName);
      if (!sender) {
        alert('Participant not found');
        return;
      }
      
      const text = prompt('Enter message text:');
      if (text) {
        const newMessage = {
          id: Date.now(),
          senderId: sender.id,
          senderName: sender.name,
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isActor: sender.isActor
        };
        
        const updatedProject = {
          ...currentProject,
          messages: [...(currentProject.messages || []), newMessage]
        };
        
        setCurrentProject(updatedProject);
        setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
      }
    };

    const handleGoLive = () => {
      if (currentProject.mode === 'sleep-mode') {
        setShowLockScreen(true);
        setTimeout(() => {
          setShowLockScreen(false);
          startLiveMode();
        }, currentProject.startDelay * 1000 || 3000);
      } else {
        startLiveMode();
      }
    };

    const startLiveMode = () => {
      setIsLiveMode(true);
      setCurrentView('live');
      setLiveMessages([]);
      setCurrentMessageIndex(0);
      
      // Set up forced text for actor's first message
      const actorMessages = currentProject.messages.filter(m => m.isActor);
      if (actorMessages.length > 0) {
        setForcedText(actorMessages[0].text);
        setForcedTextIndex(0);
        setInputValue('');
      }
    };

    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{currentProject.name}</h2>
                <p className="text-gray-600">
                  {currentProject.participants.map(p => p.name).join(', ')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('home')}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleGoLive}
                  disabled={!currentProject.messages || currentProject.messages.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Go Live
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-700 mb-3">Message Script</h3>
              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {currentProject.messages && currentProject.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.isActor ? 'bg-blue-50 ml-auto max-w-xs' : 'bg-gray-50 mr-auto max-w-xs'
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-1">{msg.senderName}</div>
                    <div className="text-sm">{msg.text}</div>
                    <div className="text-xs text-gray-400 mt-1">{msg.timestamp}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddMessage}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition"
              >
                + Add Message
              </button>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold text-gray-700 mb-3">Timing Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Response Delay</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const updated = { ...currentProject, delayMode: 'natural' };
                        setCurrentProject(updated);
                        setProjects(projects.map(p => p.id === currentProject.id ? updated : p));
                      }}
                      className={`flex-1 p-2 rounded border ${
                        currentProject.delayMode === 'natural' 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      Natural
                    </button>
                    <button
                      onClick={() => {
                        const updated = { ...currentProject, delayMode: 'custom' };
                        setCurrentProject(updated);
                        setProjects(projects.map(p => p.id === currentProject.id ? updated : p));
                      }}
                      className={`flex-1 p-2 rounded border ${
                        currentProject.delayMode === 'custom' 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                </div>
                {currentProject.delayMode === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Delay (seconds)</label>
                    <input
                      type="number"
                      value={currentProject.customDelay}
                      onChange={(e) => {
                        const updated = { ...currentProject, customDelay: parseInt(e.target.value) };
                        setCurrentProject(updated);
                        setProjects(projects.map(p => p.id === currentProject.id ? updated : p));
                      }}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Lock Screen View
  const LockScreenView = () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-sm h-screen bg-gradient-to-b from-gray-900 to-black text-white relative">
        <div className="absolute top-0 left-0 right-0 p-4">
          <div className="flex justify-between text-xs">
            <span>••••• </span>
            <span>100%</span>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-6xl font-light mb-2">{currentProject.lockScreenTime}</div>
          <div className="text-lg opacity-80">{currentProject.lockScreenDate}</div>
          
          <div className="mt-16 bg-white/10 backdrop-blur rounded-2xl p-4 mx-4 w-11/12">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {currentProject.participants[1]?.name[0]}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-semibold">{currentProject.participants[1]?.name}</div>
                <div className="text-sm opacity-80">
                  {currentProject.messages[0]?.text.substring(0, 40)}...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Live Mode View
  const LiveModeView = () => {
    const messagesEndRef = useRef(null);
    
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [liveMessages]);

    const handleKeyDown = (e) => {
      if (!currentProject || !forcedText) return;
      
      e.preventDefault();
      
      if (e.key === 'Backspace') {
        if (forcedTextIndex > 0) {
          setForcedTextIndex(forcedTextIndex - 1);
          setInputValue(forcedText.substring(0, forcedTextIndex - 1));
        }
      } else if (e.key === 'Enter') {
        if (forcedTextIndex >= forcedText.length) {
          // Send the message
          const actorMessages = currentProject.messages.filter(m => m.isActor);
          const currentActorMessage = actorMessages[liveMessages.filter(m => m.isActor).length];
          
          if (currentActorMessage) {
            setLiveMessages([...liveMessages, currentActorMessage]);
            setInputValue('');
            
            // Schedule next non-actor message
            const nextNonActorIndex = currentMessageIndex + 1;
            if (nextNonActorIndex < currentProject.messages.length) {
              const nextMessage = currentProject.messages[nextNonActorIndex];
              if (!nextMessage.isActor) {
                const delay = currentProject.delayMode === 'natural' 
                  ? Math.random() * 2000 + 1000 
                  : currentProject.customDelay * 1000;
                  
                setTimeout(() => {
                  setLiveMessages(prev => [...prev, nextMessage]);
                  setCurrentMessageIndex(nextNonActorIndex);
                  
                  // Set up next actor message
                  const nextActorMessage = currentProject.messages
                    .slice(nextNonActorIndex + 1)
                    .find(m => m.isActor);
                  
                  if (nextActorMessage) {
                    setForcedText(nextActorMessage.text);
                    setForcedTextIndex(0);
                  }
                }, delay);
              }
            }
          }
        }
      } else if (e.key.length === 1 || e.key === ' ') {
        if (forcedTextIndex < forcedText.length) {
          setForcedTextIndex(forcedTextIndex + 1);
          setInputValue(forcedText.substring(0, forcedTextIndex + 1));
        }
      }
    };

    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-full max-w-sm h-screen bg-white flex flex-col">
          {/* Header */}
          <div className="bg-gray-50 p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsLiveMode(false);
                  setCurrentView('main');
                }}
                className="text-blue-500"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {currentProject.chatType === 'group' ? 'G' : currentProject.participants[1]?.name[0]}
                </span>
              </div>
              <div>
                <div className="font-semibold">
                  {currentProject.chatType === 'group' 
                    ? 'Group Chat' 
                    : currentProject.participants[1]?.name}
                </div>
                <div className="text-xs text-gray-500">Active now</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone className="w-5 h-5 text-gray-600" />
              <Video className="w-5 h-5 text-gray-600" />
              <Info className="w-5 h-5 text-gray-600" />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {liveMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.isActor ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    msg.isActor 
                      ? 'bg-blue-500 text-white rounded-br-sm' 
                      : 'bg-gray-200 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  {currentProject.chatType === 'group' && !msg.isActor && (
                    <div className="text-xs opacity-70 mb-1">{msg.senderName}</div>
                  )}
                  <div>{msg.text}</div>
                  <div className={`text-xs mt-1 ${msg.isActor ? 'text-blue-100' : 'text-gray-500'}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 bg-gray-50">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onKeyDown={handleKeyDown}
                onChange={() => {}} // Controlled by forced text
                placeholder="Type a message"
                className="flex-1 p-3 bg-white rounded-full border border-gray-300 focus:outline-none focus:border-blue-500"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              <button className="p-3 bg-blue-500 text-white rounded-full">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render current view
  const renderView = () => {
    if (showLockScreen) return <LockScreenView />;
    
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'wizard':
        return <WizardView />;
      case 'main':
        return <MainView />;
      case 'live':
        return <LiveModeView />;
      default:
        return <HomeView />;
    }
  };

  return renderView();
};

export default FlowProp;
import React, { useState, useEffect, useContext, createContext, useCallback, useMemo, useRef } from 'react';
import { MessageSquare, Plus, Settings, Play, Edit3, Trash2, Clock, Users, Search, Edit, ChevronUp, ChevronDown, Camera, Upload, ArrowLeft, X, Check, MoreVertical, ArrowUp, Film, Phone, Video } from 'lucide-react';

// --- CONTEXT & PROVIDER ---
// Manages all application state, including projects, scenes, and live mode simulation.
const AppContext = createContext();

const AppProvider = ({ children }) => {
    const [projects, setProjects] = useLocalStorage('flowprop_projects_v3', []);
    const [currentProjectId, setCurrentProjectId] = useLocalStorage('flowprop_currentProjectId_v3', null);
    const [currentSceneId, setCurrentSceneId] = useState(null);
    const [appState, setAppState] = useState('welcome'); // welcome, project_overview, scene_editor, live

    const currentProject = useMemo(() => projects.find(p => p.id === currentProjectId), [projects, currentProjectId]);
    const currentScene = useMemo(() => currentProject?.scenes?.find(s => s.id === currentSceneId), [currentProject, currentSceneId]);

    const createProject = (projectName) => {
        const newProject = {
            id: Date.now().toString(),
            name: projectName,
            scenes: [],
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
        };
        setProjects(prev => [...prev, newProject]);
        setCurrentProjectId(newProject.id);
        setAppState('project_overview');
    };

    const updateProject = useCallback((projectId, updates) => {
        setProjects(prev => prev.map(p =>
            p.id === projectId ? { ...p, ...updates, lastModified: new Date().toISOString() } : p
        ));
    }, [setProjects]);
    
    const addSceneToProject = useCallback((projectId, sceneData) => {
        const newScene = {
            id: Date.now().toString(),
            ...sceneData,
            config: {
                scenarioType: 'direct',
                participants: [
                    { id: 'you', name: 'You', avatar: 'blue', isFixed: true },
                    { id: 'contact1', name: 'Contact 1', avatar: 'gray' }
                ],
                messages: [],
                messageHistory: {},
                lockScreen: { background: null },
            }
        };
        updateProject(projectId, { scenes: [...(currentProject?.scenes || []), newScene] });
        return newScene;
    }, [updateProject, currentProject]);

    const updateScene = useCallback((sceneId, updates) => {
        if (!currentProject || !currentProject.scenes) return;
        const updatedScenes = currentProject.scenes.map(s => 
            s.id === sceneId ? { ...s, config: { ...s.config, ...updates } } : s
        );
        updateProject(currentProject.id, { scenes: updatedScenes });
    }, [currentProject, updateProject]);

    const deleteProject = useCallback((projectId) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (currentProjectId === projectId) {
            setCurrentProjectId(null);
            setAppState('welcome');
        }
    }, [projects, currentProjectId, setProjects, setCurrentProjectId]);

    const startLiveMode = () => {
        if (!currentScene) return;
        setAppState('live');
    };

    const exitLiveMode = () => {
        setAppState('scene_editor');
    };

    const value = useMemo(() => ({
        projects, currentProject, setCurrentProjectId,
        appState, setAppState,
        currentScene, currentSceneId, setCurrentSceneId,
        createProject, updateProject, deleteProject,
        addSceneToProject, updateScene,
        startLiveMode, exitLiveMode,
    }), [
        projects, currentProject, appState, currentScene, currentSceneId,
        setCurrentProjectId, setAppState, setCurrentSceneId,
        createProject, updateProject, deleteProject, addSceneToProject, updateScene, startLiveMode, exitLiveMode
    ]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const useApp = () => useContext(AppContext);

// --- CUSTOM HOOKS ---
function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) { console.error(error); return initialValue; }
    });
    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) { console.error(error); }
    }, [key, storedValue]);
    return [storedValue, setValue];
}

const useForcedTyping = (scriptText, onComplete) => {
    const [displayText, setDisplayText] = useState('');
    const [scriptIndex, setScriptIndex] = useState(0);

    const handleKeyDown = useCallback((e) => {
        e.preventDefault();
        
        if (e.key === 'Backspace') {
            if (scriptIndex > 0) {
                setDisplayText(prev => prev.slice(0, -1));
                setScriptIndex(prev => prev - 1);
            }
        } else if (e.key === 'Enter') {
            if (scriptIndex >= scriptText.length) {
                onComplete(displayText);
            }
        } else if (e.key.length === 1) { // Any standard character
            if (scriptIndex < scriptText.length) {
                const nextChar = scriptText[scriptIndex];
                setDisplayText(prev => prev + nextChar);
                setScriptIndex(prev => prev + 1);
            }
        }
    }, [scriptText, scriptIndex, displayText, onComplete]);

    const isComplete = scriptIndex >= scriptText.length;

    return { displayText, handleKeyDown, isComplete };
};


// --- UI COMPONENTS ---
const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, ...props }) => {
    const baseStyle = 'flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100'
    };
    return <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>{Icon && <Icon className="w-5 h-5 mr-2" />}{children}</button>;
};

const Modal = ({ children, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
};

const DelaySelector = ({ label, value, onChange, disabled }) => {
    const isNatural = value === 'natural';
    const numericValue = isNatural ? 0 : parseInt(value, 10);

    const handleChange = (change) => {
        if (disabled) return;
        const newValue = Math.max(0, numericValue + change);
        onChange(newValue);
    };

    const toggleNatural = () => {
        if (disabled) return;
        onChange(isNatural ? 1 : 'natural');
    };

    return (
        <div className={`flex items-center justify-between ${disabled ? 'opacity-50' : ''}`}>
            <span className="text-sm text-gray-600">{label}</span>
            <div className="flex items-center space-x-2">
                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                    <button onClick={() => handleChange(-1)} disabled={disabled || isNatural} className="p-1.5 hover:bg-gray-100 disabled:opacity-50"><ChevronDown size={16} /></button>
                    <span className="px-3 text-sm font-mono">{isNatural ? 'Auto' : `${numericValue}s`}</span>
                    <button onClick={() => handleChange(1)} disabled={disabled || isNatural} className="p-1.5 hover:bg-gray-100 disabled:opacity-50"><ChevronUp size={16} /></button>
                </div>
                <button
                    onClick={toggleNatural}
                    disabled={disabled}
                    className={`text-xs px-2 py-1 rounded ${isNatural ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700 border border-gray-300'}`}
                >
                    Natural
                </button>
            </div>
        </div>
    );
};

// --- SCREEN COMPONENTS ---

const WelcomeScreen = () => {
    const { projects, setAppState, setCurrentProjectId, createProject, deleteProject } = useApp();
    const [isCreating, setIsCreating] = useState(false);
    const [projectName, setProjectName] = useState('');

    const handleCreate = () => {
        if (!projectName.trim()) return;
        createProject(projectName);
        setProjectName('');
        setIsCreating(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 safe-padding">
            <div className="text-center mb-10">
                <MessageSquare className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-gray-800">FlowProp</h1>
                <p className="text-lg text-gray-500 mt-2">Professional messaging for film.</p>
            </div>
            <div className="w-full max-w-sm space-y-4">
                <Button onClick={() => setIsCreating(true)} icon={Plus} className="w-full py-3 text-lg">New Project</Button>
                {projects.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md p-4">
                        <h3 className="font-semibold text-gray-700 mb-3 px-2">Recent Projects</h3>
                        <div className="space-y-1 max-h-80 overflow-y-auto">
                            {projects.sort((a,b) => new Date(b.lastModified) - new Date(a.lastModified)).map(p => (
                                <div key={p.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-gray-100">
                                    <button onClick={() => { setCurrentProjectId(p.id); setAppState('project_overview'); }} className="text-left flex-grow">
                                        <div className="font-medium text-gray-800">{p.name}</div>
                                        <div className="text-sm text-gray-500">{p.scenes?.length || 0} scene(s) &bull; {new Date(p.lastModified).toLocaleDateString()}</div>
                                    </button>
                                    <button onClick={() => deleteProject(p.id)} className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <Modal isOpen={isCreating} onClose={() => setIsCreating(false)}>
                <h3 className="text-xl font-bold mb-4">New Project</h3>
                <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Project Name" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 mb-4" autoFocus />
                <div className="flex justify-end space-x-2">
                    <Button variant="secondary" onClick={() => setIsCreating(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={!projectName.trim()}>Create</Button>
                </div>
            </Modal>
        </div>
    );
};

const ProjectOverviewScreen = () => {
    const { currentProject, setAppState, setCurrentSceneId, addSceneToProject } = useApp();
    const [isAddingScene, setIsAddingScene] = useState(false);
    const [sceneName, setSceneName] = useState('');
    const [sceneType, setSceneType] = useState('message');

    if (!currentProject) {
        return <div className="p-4">Loading project...</div>;
    }

    const handleAddScene = () => {
        if (!sceneName.trim()) return;
        const newScene = addSceneToProject(currentProject.id, { name: sceneName, type: sceneType });
        setSceneName('');
        setSceneType('message');
        setIsAddingScene(false);
        setCurrentSceneId(newScene.id);
        setAppState('scene_editor');
    };

    const sceneIcons = { message: MessageSquare, call: Phone, video: Video };

    return (
        <div className="min-h-screen bg-gray-50 p-4 safe-padding">
            <header className="flex items-center justify-between mb-8">
                <button onClick={() => setAppState('welcome')} className="p-2 rounded-full hover:bg-gray-200"><ArrowLeft size={20} /></button>
                <h1 className="text-2xl font-bold text-gray-800">{currentProject.name}</h1>
                <div className="w-8"></div>
            </header>
            <div className="space-y-3">
                {currentProject.scenes && currentProject.scenes.map(scene => {
                    const Icon = sceneIcons[scene.type] || Film;
                    return (
                        <button key={scene.id} onClick={() => { setCurrentSceneId(scene.id); setAppState('scene_editor'); }} className="w-full bg-white p-4 rounded-lg shadow-sm border flex items-center space-x-4 text-left hover:border-blue-500 transition-colors">
                            <Icon className="w-6 h-6 text-gray-500" />
                            <div>
                                <p className="font-semibold text-gray-800">{scene.name}</p>
                                <p className="text-sm text-gray-500 capitalize">{scene.type}</p>
                            </div>
                        </button>
                    );
                })}
                <Button onClick={() => setIsAddingScene(true)} variant="secondary" icon={Plus} className="w-full">Add Scene</Button>
            </div>
            <Modal isOpen={isAddingScene} onClose={() => setIsAddingScene(false)}>
                <h3 className="text-xl font-bold mb-4">Add New Scene</h3>
                <input type="text" value={sceneName} onChange={e => setSceneName(e.target.value)} placeholder="Scene Name (e.g., 'Opening')" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 mb-4" autoFocus />
                <div className="grid grid-cols-3 gap-2 mb-6">
                    {[{id: 'message', name: 'Message', icon: MessageSquare}, {id: 'call', name: 'Call', icon: Phone}, {id: 'video', name: 'Video Call', icon: Video}].map(item => (
                        <button key={item.id} onClick={() => setSceneType(item.id)} className={`p-3 border rounded-lg flex flex-col items-center justify-center space-y-2 transition-all ${sceneType === item.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
                            <item.icon className="w-6 h-6" />
                            <span className="text-sm font-medium">{item.name}</span>
                        </button>
                    ))}
                </div>
                <div className="flex justify-end space-x-2">
                    <Button variant="secondary" onClick={() => setIsAddingScene(false)}>Cancel</Button>
                    <Button onClick={handleAddScene} disabled={!sceneName.trim()}>Add Scene</Button>
                </div>
            </Modal>
        </div>
    );
};

const SceneEditorScreen = () => {
    const { currentProject, currentScene, setAppState, startLiveMode, updateScene } = useApp();
    const [activeTab, setActiveTab] = useState('script');

    if (!currentScene) return <div className="p-4">Loading scene...</div>;

    const tabs = [
        { id: 'script', label: 'Script', icon: Edit3 },
        { id: 'participants', label: 'Participants', icon: Users },
    ];
    if (currentScene.config.scenarioType === 'contacts') tabs.push({ id: 'history', label: 'History', icon: Clock });
    if (currentScene.config.scenarioType === 'lockscreen') tabs.push({ id: 'lockscreen', label: 'Lock Screen', icon: Camera });

    return (
        <div className="flex flex-col h-screen bg-gray-100 safe-padding">
            <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center min-w-0">
                    <button onClick={() => setAppState('project_overview')} className="p-2 rounded-full hover:bg-gray-100 mr-2 flex-shrink-0"><ArrowLeft size={20} /></button>
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold text-gray-800 truncate">{currentScene.name}</h1>
                        <p className="text-xs text-gray-500">{currentProject.name}</p>
                    </div>
                </div>
                <Button onClick={startLiveMode} icon={Play}>Go Live</Button>
            </header>
            
            <div className="p-4 bg-white border-b">
                <select value={currentScene.config.scenarioType} onChange={e => updateScene(currentScene.id, { scenarioType: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md text-sm">
                    <option value="direct">Direct Chat Start</option>
                    <option value="contacts">Messages List Start</option>
                    <option value="lockscreen">Lock Screen Start</option>
                </select>
            </div>

            <nav className="bg-white border-b border-gray-200"><div className="flex space-x-1 px-2">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center space-x-2 px-3 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        <tab.icon size={16} /><span>{tab.label}</span>
                    </button>
                ))}
            </div></nav>

            <main className="flex-1 overflow-y-auto">
                {activeTab === 'script' && <ScriptEditor key={currentScene.id} />}
                {activeTab === 'participants' && <ParticipantsEditor key={currentScene.id} />}
                {activeTab === 'history' && <MessageHistoryEditor key={currentScene.id} />}
                {activeTab === 'lockscreen' && <LockScreenEditor key={currentScene.id} />}
            </main>
        </div>
    );
};

const ScriptEditor = () => {
    const { currentScene, updateScene } = useApp();
    const [messages, setMessages] = useState(currentScene.config.messages || []);

    const updateLocalMessage = (index, updates) => {
        const newMessages = [...messages];
        newMessages[index] = { ...newMessages[index], ...updates };
        setMessages(newMessages);
    };
    const addMessage = () => setMessages([...messages, { 
        id: Date.now().toString(), 
        participantId: 'you', 
        text: '',
        startDelay: 1,
        typingDelay: 'natural'
    }]);
    const removeMessage = (index) => setMessages(messages.filter((_, i) => i !== index));
    
    useEffect(() => { updateScene(currentScene.id, { messages }); }, [messages, currentScene.id, updateScene]);

    return (
        <div className="p-4 space-y-4">
            {messages.map((msg, index) => {
                const participant = currentScene.config.participants.find(p => p.id === msg.participantId);
                const isActorMessage = msg.participantId === 'you';
                return (
                    <div key={msg.id} className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-start space-x-3">
                            <select value={msg.participantId} onChange={(e) => updateLocalMessage(index, { participantId: e.target.value })} className="p-2 border rounded-md text-sm">
                                {currentScene.config.participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <textarea value={msg.text} onChange={(e) => updateLocalMessage(index, { text: e.target.value })} placeholder={`Message from ${participant?.name}...`} className="flex-1 p-2 border rounded-md text-sm resize-y min-h-[60px]" />
                            <button onClick={() => removeMessage(index)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                        </div>
                        {!isActorMessage && (
                            <div className="mt-3 pt-3 border-t space-y-3">
                                <DelaySelector
                                    label="Start Delay"
                                    value={msg.startDelay}
                                    onChange={(val) => updateLocalMessage(index, { startDelay: val })}
                                />
                                <DelaySelector
                                    label="Typing Speed"
                                    value={msg.typingDelay}
                                    onChange={(val) => updateLocalMessage(index, { typingDelay: val })}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
            <Button onClick={addMessage} variant="secondary" icon={Plus} className="w-full">Add Message</Button>
        </div>
    );
};

const ParticipantsEditor = () => {
    const { currentScene, updateScene } = useApp();
    const [participants, setParticipants] = useState(currentScene.config.participants || []);

    const updateLocalParticipant = (id, updates) => {
        const newParticipants = participants.map(p => p.id === id ? { ...p, ...updates } : p);
        setParticipants(newParticipants);
    };
    const addParticipant = () => setParticipants([...participants, { id: `contact${Date.now()}`, name: `Contact ${participants.length}`, avatar: 'gray' }]);
    const removeParticipant = (id) => {
        if (participants.length <= 2) return;
        setParticipants(participants.filter(p => p.id !== id));
    };
    
    useEffect(() => { updateScene(currentScene.id, { participants }); }, [participants, currentScene.id, updateScene]);

    return (
        <div className="p-4 space-y-4">
            {participants.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm border flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full ${p.avatar === 'blue' ? 'bg-blue-500' : 'bg-gray-400'} flex-shrink-0`}></div>
                    <input type="text" value={p.name} onChange={(e) => updateLocalParticipant(p.id, { name: e.target.value })} disabled={p.isFixed} className="flex-1 p-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed" />
                    {!p.isFixed && <button onClick={() => removeParticipant(p.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>}
                </div>
            ))}
            <Button onClick={addParticipant} variant="secondary" icon={Plus} className="w-full">Add Contact</Button>
        </div>
    );
};

const MessageHistoryEditor = () => {
    const { currentScene, updateScene } = useApp();
    const [history, setHistory] = useState(currentScene.config.messageHistory || {});
    const contacts = currentScene.config.participants.filter(p => !p.isFixed);

    const updateLocalHistory = (contactId, updates) => {
        const newHistory = { ...history, [contactId]: { ...history[contactId], ...updates } };
        setHistory(newHistory);
    };
    
    useEffect(() => { updateScene(currentScene.id, { messageHistory: history }); }, [history, currentScene.id, updateScene]);

    return (
        <div className="p-4 space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <p>Setup the last message that appears in the main message list for each contact.</p>
            </div>
            {contacts.map(contact => (
                <div key={contact.id} className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="font-semibold text-gray-800 mb-3">{contact.name}</h3>
                    <div className="space-y-3">
                        <input type="text" value={history[contact.id]?.lastMessage || ''} onChange={(e) => updateLocalHistory(contact.id, { lastMessage: e.target.value })} placeholder="Last message text..." className="w-full p-2 border rounded-md" />
                        <input type="text" value={history[contact.id]?.timestamp || ''} onChange={(e) => updateLocalHistory(contact.id, { timestamp: e.target.value })} placeholder="Time (e.g., 9:41 AM, Yesterday)" className="w-full p-2 border rounded-md" />
                    </div>
                </div>
            ))}
        </div>
    );
};

const LockScreenEditor = () => {
    const { currentScene, updateScene } = useApp();
    const [lockScreen, setLockScreen] = useState(currentScene.config.lockScreen || { background: null });
    const fileInputRef = useRef(null);

    const handleBgUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setLockScreen(prev => ({ ...prev, background: event.target.result }));
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => { updateScene(currentScene.id, { lockScreen }); }, [lockScreen, currentScene.id, updateScene]);

    return (
        <div className="p-4 space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-800 mb-2">Lock Screen Background</h3>
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden relative">
                    {lockScreen.background ? <img src={lockScreen.background} alt="Lock screen background" className="w-full h-full object-cover" /> : <div className="text-center text-gray-500"><Camera size={40} /><p>No background</p></div>}
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleBgUpload} className="hidden" />
                <Button onClick={() => fileInputRef.current.click()} variant="secondary" icon={Upload} className="w-full mt-3">Upload Image</Button>
            </div>
        </div>
    );
};

// --- LIVE MODE ---
const LiveContainer = () => {
    const { currentScene, exitLiveMode } = useApp();
    const [liveState, setLiveState] = useState(currentScene.config.scenarioType); // 'direct', 'contacts', 'lockscreen'
    const [activeContactId, setActiveContactId] = useState(null);

    const renderLiveState = () => {
        switch (liveState) {
            case 'lockscreen': return <LiveLockScreen onUnlock={() => setLiveState(currentScene.config.scenarioType === 'lockscreen' ? 'chat' : 'contacts')} />;
            case 'contacts': return <LiveMessagesList onSelectContact={(contactId) => { setActiveContactId(contactId); setLiveState('chat'); }} />;
            case 'direct':
            default: return <LiveChat activeContactId={activeContactId} onExitList={() => setLiveState('contacts')} />;
        }
    };

    return (
        <div className="h-screen w-screen bg-black font-sans antialiased">
            <div className="absolute top-4 right-4 z-50"><button onClick={exitLiveMode} className="p-1.5 bg-white/20 text-white rounded-full backdrop-blur-sm"><X size={20} /></button></div>
            <div className="h-full w-full">{renderLiveState()}</div>
        </div>
    );
};

const LiveLockScreen = ({ onUnlock }) => {
    const { currentScene } = useApp();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const clockInterval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(clockInterval);
    }, []);

    return (
        <div onClick={onUnlock} className="h-full w-full bg-cover bg-center flex flex-col items-center justify-center text-white p-8 cursor-pointer" style={{ backgroundImage: currentScene.config.lockScreen.background ? `url(${currentScene.config.lockScreen.background})` : 'linear-gradient(to bottom, #4a5568, #2d3748)' }}>
            <div className="text-center">
                <p className="text-8xl font-thin">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-2xl mt-2">{time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
        </div>
    );
};

const LiveMessagesList = ({ onSelectContact }) => {
    const { currentScene } = useApp();
    const contactsWithHistory = currentScene.config.participants.filter(p => !p.isFixed && currentScene.config.messageHistory[p.id]?.lastMessage);
    
    return (
        <div className="bg-white h-full flex flex-col">
            <header className="bg-gray-50/90 backdrop-blur-sm border-b p-4 safe-padding-top">
                <div className="flex justify-between items-center mt-4">
                    <h1 className="text-3xl font-bold">Messages</h1>
                    <button className="text-blue-500"><Edit size={24} /></button>
                </div>
                <div className="mt-4 relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="search" placeholder="Search" className="w-full bg-gray-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none" />
                </div>
            </header>
            <main className="flex-1 overflow-y-auto">
                {contactsWithHistory.map(contact => {
                    const history = currentScene.config.messageHistory[contact.id];
                    return (
                        <div key={contact.id} onClick={() => onSelectContact(contact.id)} className="flex items-center space-x-4 p-3 border-b cursor-pointer">
                            <div className="w-14 h-14 rounded-full bg-gray-400 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-gray-800">{contact.name}</p>
                                    <p className="text-sm text-gray-400">{history.timestamp}</p>
                                </div>
                                <p className="text-sm text-gray-500 truncate">{history.lastMessage}</p>
                            </div>
                        </div>
                    );
                })}
            </main>
        </div>
    );
};

const ForcedTypingInput = ({ scriptText, onSend }) => {
    const { displayText, handleKeyDown, isComplete } = useForcedTyping(scriptText, onSend);
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    return (
        <div className="bg-gray-100 border-t p-2 safe-padding-bottom">
            <div className="bg-white border border-gray-300 rounded-2xl p-1 flex items-center space-x-2">
                <input ref={inputRef} type="text" value={displayText} onKeyDown={handleKeyDown} className="flex-1 bg-transparent px-2 focus:outline-none" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" />
                <button onClick={() => isComplete && onSend(displayText)} disabled={!isComplete} className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center disabled:bg-gray-300 transition-colors">
                    <ArrowUp size={20} />
                </button>
            </div>
        </div>
    );
};

const LiveChat = ({ activeContactId, onExitList }) => {
    const { currentScene } = useApp();
    const [displayedMessages, setDisplayedMessages] = useState([]);
    const [scriptIndex, setScriptIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    const activeMessage = currentScene.config.messages[scriptIndex];
    const isActorTurn = activeMessage?.participantId === 'you';

    const contact = currentScene.config.participants.find(p => p.id === activeContactId) || currentScene.config.participants.find(p => !p.isFixed);
    
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [displayedMessages, isTyping]);

    const processNextMessage = useCallback(() => {
        if (scriptIndex >= currentScene.config.messages.length || isActorTurn) return;
        
        const message = currentScene.config.messages[scriptIndex];
        const startDelayMs = (message.startDelay === 'natural' ? (message.text.length / 15) * 1000 : message.startDelay * 1000) || 1000;
        
        const typingSpeedMs = (() => {
            if (message.typingDelay === 'natural') return Math.max(30, 120 - message.text.length);
            return message.typingDelay * 50 || 50;
        })();

        setTimeout(() => {
            setIsTyping(true);
            // This timeout simulates the total time it would take to type
            const totalTypingTime = message.text.length * typingSpeedMs;
            setTimeout(() => {
                setIsTyping(false);
                setDisplayedMessages(prev => [...prev, { ...message, timestamp: new Date() }]);
                setScriptIndex(prev => prev + 1);
            }, totalTypingTime);
        }, startDelayMs);

    }, [scriptIndex, currentScene.config.messages, isActorTurn]);

    useEffect(() => { processNextMessage(); }, [scriptIndex, processNextMessage]);

    const handleActorSend = (text) => {
        const message = { ...activeMessage, text, timestamp: new Date() };
        setDisplayedMessages(prev => [...prev, message]);
        setScriptIndex(prev => prev + 1);
    };

    return (
        <div className="bg-white h-full flex flex-col">
            <header className="bg-gray-50/90 backdrop-blur-sm border-b p-2 pt-10 flex items-center justify-center text-center relative safe-padding-top">
                {currentScene.config.scenarioType === 'contacts' && <button onClick={onExitList} className="absolute left-2 top-1/2 -translate-y-1/2 pt-8 text-blue-500 flex items-center"><ChevronDown className="rotate-90" size={24}/> Messages</button>}
                <div><p className="font-semibold">{contact?.name}</p><p className="text-xs text-gray-500">online</p></div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {displayedMessages.map((msg, index) => {
                    const isOwn = msg.participantId === 'you';
                    return (
                        <div key={index} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            {!isOwn && <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0"></div>}
                            <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isOwn ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>{msg.text}</div>
                        </div>
                    );
                })}
                {isTyping && <div className="flex items-end gap-2 justify-start"><div className="w-8 h-8 rounded-full bg-gray-300"></div><div className="px-4 py-2 rounded-2xl bg-gray-200"><div className="flex space-x-1"><div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div><div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div><div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.4s]"></div></div></div></div>}
                <div ref={chatEndRef} />
            </main>
            {isActorTurn && <ForcedTypingInput scriptText={activeMessage.text} onSend={handleActorSend} />}
        </div>
    );
};

// --- MAIN APP COMPONENT ---
export default function App() {
    return (
        <AppProvider>
            <Main />
        </AppProvider>
    );
}

function Main() {
    const { appState } = useApp();

    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .safe-padding, .safe-padding-top { padding-top: env(safe-area-inset-top); }
            .safe-padding, .safe-padding-bottom { padding-bottom: env(safe-area-inset-bottom); }
            .safe-padding { padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }
    , []);

    switch (appState) {
        case 'welcome': return <WelcomeScreen />;
        case 'project_overview': return <ProjectOverviewScreen />;
        case 'scene_editor': return <SceneEditorScreen />;
        case 'live': return <LiveContainer />;
        default: return <WelcomeScreen />;
    }
}
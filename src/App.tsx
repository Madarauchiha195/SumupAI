import React, { useState, useEffect, useRef } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { 
  Sun, Moon, Upload, Send, Image, Video, Loader2, Menu, Search, 
  LogOut, Settings, HelpCircle, PlusCircle, ChevronRight, ChevronLeft,
  Crown, MessageSquare, User
} from 'lucide-react';
import { clsx } from 'clsx';
import { BackgroundLines } from './components/BackgroundLines';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
  id: string;
  type: 'text' | 'image' | 'video';
  content: string;
  loading?: boolean;
  options?: {
    format: string;
    summaryType: string;
    theme: string;
    audioVoice: string;
    language: string;
    audience: string; // Add this line
  };
};

type Chat = {
  id: string;
  title: string;
  preview: string;
  date: string;
};

type User = {
  id: string;
  username: string;
  email: string;
  profilePic?: string;
  createdAt: Date;
};

// First, update the initial dummy chats with more content
const initialDummyChats: Chat[] = [
  {
    id: 'demo-1',
    title: 'AI Portrait Artist',
    preview: 'Create a stunning portrait in the style of Van Gogh with vibrant colors...',
    date: '2:30 PM'
  },
  {
    id: 'demo-2',
    title: '3D Product Design',
    preview: 'Generate a photorealistic 3D model of a futuristic smartphone...',
    date: '3:45 PM'
  },
  {
    id: 'demo-3',
    title: 'Sci-fi Landscape',
    preview: 'Design an immersive cityscape with flying cars and neon lights...',
    date: '4:15 PM'
  },
  {
    id: 'demo-4',
    title: 'Character Creation',
    preview: 'Create a fantasy character with detailed armor and magical effects...',
    date: '5:00 PM'
  }
];

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : true; // Default to true for dark mode
  });
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => {
    return JSON.parse(localStorage.getItem('messages') || '[]');
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState<Chat[]>(initialDummyChats);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dummyChats, setDummyChats] = useState<Chat[]>(initialDummyChats);

  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [outputFormat, setOutputFormat] = useState('text');
  const [summaryType, setSummaryType] = useState('brief');
  const [theme, setTheme] = useState('story');
  const [audioVoice, setAudioVoice] = useState('male');
  const [language, setLanguage] = useState('english');
  const [audience, setAudience] = useState('adult'); // Default to adult

  // Add a new ref for the input form
  const inputFormRef = useRef<HTMLFormElement>(null);

  // Add new state for uploaded file
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [isNewUser, setIsNewUser] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const filtered = dummyChats.filter(chat => 
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.preview.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredChats(filtered);
  }, [searchQuery, dummyChats]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node) && 
          isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    if (messages.length > 0 && latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(dummyChats));
  }, [dummyChats]);

  // Add this useEffect after your other effects
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check for Ctrl + N
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault(); // Prevent default browser behavior
        handleNewChat();
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  // Add this useEffect after your other effects
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isInputExpanded && 
          inputFormRef.current && 
          !inputFormRef.current.contains(event.target as Node)) {
        setIsInputExpanded(false);
      }
    }

    if (isInputExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isInputExpanded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Include selected options in the message
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'text',
      content: input,
      options: {
        format: outputFormat,
        summaryType,
        theme,
        audioVoice,
        language,
        audience // Add this line
      }
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    
    const newChat: Chat = {
      id: Date.now().toString(),
      title: input.slice(0, 30) + (input.length > 30 ? '...' : ''), 
      preview: input,
      date: new Date().toLocaleTimeString()
    };
    
    setDummyChats(prev => [newChat, ...prev]);
    setActiveChat(newChat.id);
    localStorage.setItem(`chat_${newChat.id}`, JSON.stringify(updatedMessages));
    setInput('');
    
    setIsGenerating(true);
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: Math.random() > 0.5 ? 'image' : 'video',
        content: 'https://images.unsplash.com/photo-1682687220742-aba19b51f9a8',
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsGenerating(false);
    }, 2000);

    setIsInputExpanded(false); // Collapse input form after submit
  };

  const handleGoogleSuccess = (credentialResponse: any) => {
    console.log('Google login success:', credentialResponse);
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setMessages([]);
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setIsSidebarOpen(false);
    setIsInputExpanded(false); // Reset input form state
  };

  const handleSidebarHover = () => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
    }
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent chat selection when clicking delete
    
    // Remove chat from state
    setDummyChats(prev => prev.filter(chat => chat.id !== chatId));
    
    // Remove chat messages from localStorage
    localStorage.removeItem(`chat_${chatId}`);
    
    // If the deleted chat was active, clear current messages and active chat
    if (activeChat === chatId) {
      setActiveChat(null);
      setMessages([]);
    }
    
    // Update filtered chats
    setFilteredChats(prev => prev.filter(chat => chat.id !== chatId));
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
    const selectedChat = dummyChats.find(chat => chat.id === chatId);
    if (selectedChat) {
      // Assuming you want to load the chat messages
      const chatMessages = JSON.parse(localStorage.getItem(`chat_${chatId}`) || '[]');
      setMessages(chatMessages);
      setIsSidebarOpen(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setInput(`Processing ${file.name}...`);
    setIsInputExpanded(true);
  };

  // Add function to remove uploaded file
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <GoogleOAuthProvider clientId="191171141553-aqq445nqbd941ulaf49cqtp1ru5oe43a.apps.googleusercontent.com">
      <div className={clsx(
        'min-h-screen transition-colors duration-200 relative overflow-hidden', // Added overflow-hidden
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900' // Changed from bg-gray-50
      )}>
        <BackgroundLines darkMode={darkMode} />
        
        {/* Sidebar Trigger Area */}
        <div
          className="fixed left-0 top-0 h-full w-2 z-40" // Changed from z-20
          onMouseEnter={handleSidebarHover}
        />

        {/* Sidebar */}
        <div 
          ref={sidebarRef}
          className={clsx(
            'fixed left-0 top-0 h-full w-64 md:w-80 transition-transform duration-300 z-50', // Changed from z-30
            darkMode 
              ? 'bg-gray-800/90 backdrop-blur-sm' 
              : 'bg-white/90 backdrop-blur-sm', 
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'shadow-xl'
          )}
        >
          <div className="p-4 space-y-6 h-full flex flex-col">
            <div className="flex justify-end">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className={clsx(
                  'p-2 rounded-full',
                  darkMode 
                    ? 'hover:bg-gray-700' 
                    : 'hover:bg-gray-200 hover:text-black'
                )}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>

            <button
              onClick={handleNewChat}
              className={clsx(
                'w-full p-3 rounded-lg flex items-center gap-2',
                darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              )}
            >
              <PlusCircle className="w-5 h-5" />
              <span>New Chat</span>
            </button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={clsx(
                  'w-full pl-10 pr-4 py-2 rounded-lg outline-none',
                  darkMode ? 'bg-gray-700 focus:bg-gray-600' : 'bg-gray-100 focus:bg-gray-200'
                )}
              />
            </div>

            <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400/20 hover:scrollbar-thumb-gray-400/40 space-y-2">
              {filteredChats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat.id)}
                  className={clsx(
                    'p-3 rounded-lg cursor-pointer relative group',
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
                    activeChat === chat.id && (darkMode ? 'bg-gray-700' : 'bg-gray-100')
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-medium">{chat.title}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className={clsx(
                        'p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
                        darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 truncate">{chat.preview}</p>
                  <span className="text-xs text-gray-400">{chat.date}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                className={clsx(
                  'w-full p-2 rounded-lg flex items-center gap-2',
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                )}
              >
                <Crown className="w-5 h-5" />
                <span>Upgrade to Pro</span>
              </button>
              <button
                className={clsx(
                  'w-full p-2 rounded-lg flex items-center gap-2',
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                )}
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
              <button
                className={clsx(
                  'w-full p-2 rounded-lg flex items-center gap-2',
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                )}
              >
                <HelpCircle className="w-5 h-5" />
                <span>Help Center</span>
              </button>
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className={clsx(
                    'w-full p-2 rounded-lg flex items-center gap-2',
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  )}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Header */}
        <header className={clsx(
          'fixed top-0 w-full p-4 z-30',
          darkMode ? 'text-white' : 'text-gray-900'
        )}>
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={clsx(
                  "lg:hidden p-2 rounded-full",
                  darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-200/50'
                )}
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-lg sm:text-2xl font-bold">SumUpAI</h1>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-4">
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className={clsx(
                      'px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors',
                      darkMode 
                        ? 'bg-gray-800/80 hover:bg-gray-700/80' 
                        : 'bg-white/80 hover:bg-gray-50/80'
                    )}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors bg-blue-500/90 hover:bg-blue-600/90 text-white"
                  >
                    Get Started
                  </button>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={clsx(
                      'p-1.5 sm:p-2 rounded-full',
                      darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-200/50'
                    )}
                  >
                    {darkMode ? <Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </button>
                </>
              ) : (
                <>
                  <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <User className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={clsx(
                      'p-2 rounded-full',
                      darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                    )}
                  >
                    {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main 
          ref={messagesContainerRef}
          className={clsx(
            'relative z-0',
            messages.length === 0 && !isInputExpanded // Hide welcome message when input is expanded
              ? 'h-screen flex items-center justify-center'
              : 'max-w-6xl mx-auto px-4 mt-24 mb-32 h-[calc(100vh-14rem)] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400/20 hover:scrollbar-thumb-gray-400/40'
          )}
        >
          {messages.length === 0 && !isInputExpanded ? ( // Only show welcome when no messages and input not expanded
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6 max-w-3xl px-4 -mt-20"
            >
              <h1 className={clsx(
                "text-5xl font-bold", // Changed back to original size
                darkMode ? "text-white" : "text-gray-900"
              )}>
                Bring Your <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Imagination</span> to Life with AI!
              </h1>
              <p className={clsx(
                "text-xl max-w-xl mx-auto", // Changed back to original size
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                Transform any text, passage, Word document, or PDF into stunning images and videos effortlessly.
              </p>
              <p className={clsx(
                "text-lg max-w-lg mx-auto", // Changed back to original size
                darkMode ? "text-gray-400" : "text-gray-600"
              )}>
                Discover the power of AI-driven creativity at your fingertips.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4 pb-8"> {/* Added bottom padding and reduced spacing */}
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  ref={index === messages.length - 1 ? latestMessageRef : null}
                  className={clsx(
                    'flex flex-col gap-3 p-3 rounded-lg max-w-2xl mx-auto transition-all duration-500',
                    darkMode 
                      ? 'bg-gray-800/90 backdrop-blur-sm' 
                      : 'bg-gray-50 backdrop-blur-sm shadow-md', // Changed from bg-white/90
                    message.loading && 'animate-pulse'
                  )}
                >
                  {message.type === 'text' ? (
                    <p className="text-base">{message.content}</p> // Keeping the reduced size
                  ) : (
                    <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-200">
                      <img
                        src={message.content}
                        alt="AI Generated"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Input Form */}
        <form
          ref={inputFormRef}
          onSubmit={handleSubmit}
          className={clsx(
            'fixed bottom-0 left-0 right-0 transition-all duration-500 ease-in-out z-40',
            isInputExpanded ? 'pointer-events-none' : 'p-4' // Make form container transparent to clicks when expanded
          )}
        >
          <div className={clsx(
            'mx-auto transition-all duration-500 ease-in-out pointer-events-auto', // Re-enable pointer events on the inner container
            isInputExpanded 
              ? `max-w-4xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-[24px] shadow-xl` // Changed from bg-white
              : 'max-w-2xl',
            !isInputExpanded && 'bg-transparent'
          )}>
            {isInputExpanded && (
              <div className="space-y-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Input Format</label>
                    <div className="flex flex-wrap gap-2">
                      {['Text', 'PDF', 'Word', 'URL'].map(format => (
                        <button
                          key={format}
                          type="button"
                          onClick={() => setOutputFormat(format.toLowerCase())}
                          className={clsx(
                            'px-3 py-1 rounded-full text-sm',
                            outputFormat === format.toLowerCase()
                              ? 'bg-blue-500 text-white'
                              : darkMode 
                                ? 'bg-gray-700 hover:bg-gray-600' 
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700' // Added text color
                          )}
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Summary Type</label>
                    <div className="flex flex-wrap gap-2">
                      {['Brief', 'Detailed', 'Deep Dive'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSummaryType(type.toLowerCase())}
                          className={clsx(
                            'px-3 py-1 rounded-full text-sm',
                            summaryType === type.toLowerCase()
                              ? 'bg-blue-500 text-white'
                              : darkMode 
                                ? 'bg-gray-700 hover:bg-gray-600' 
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700' // Added text color
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Theme</label>
                    <div className="flex flex-wrap gap-2">
                      {['Story', 'Podcast', 'Education', 'Entertainment'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTheme(t.toLowerCase())}
                          className={clsx(
                            'px-3 py-1 rounded-full text-sm',
                            theme === t.toLowerCase()
                              ? 'bg-blue-500 text-white'
                              : darkMode 
                                ? 'bg-gray-700 hover:bg-gray-600' 
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700' // Added text color
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Voice & Language</label>
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={audioVoice}
                        onChange={(e) => setAudioVoice(e.target.value)}
                        className={clsx(
                          'px-3 pr-8 py-1 rounded-full text-sm appearance-none', // Added pr-8 and appearance-none
                          darkMode 
                            ? 'bg-gray-700' 
                            : 'bg-gray-200 text-gray-700' // Added text color
                        )}
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em'
                        }}
                      >
                        <option value="male">Male Voice</option>
                        <option value="female">Female Voice</option>
                      </select>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className={clsx(
                          'px-3 pr-8 py-1 rounded-full text-sm appearance-none', // Added pr-8 and appearance-none
                          darkMode 
                            ? 'bg-gray-700' 
                            : 'bg-gray-200 text-gray-700' // Added text color
                        )}
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em'
                        }}
                      >
                        <option value="english">English</option>
                        <option value="spanish">Hindi</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Audience</label>
                    <div className="flex flex-wrap gap-2">
                      {['Children', 'Teenager', 'Adult', 'Senior'].map(aud => (
                        <button
                          key={aud}
                          type="button"
                          onClick={() => setAudience(aud.toLowerCase())}
                          className={clsx(
                            'px-3 py-1 rounded-full text-sm',
                            audience === aud.toLowerCase()
                              ? 'bg-blue-500 text-white'
                              : darkMode 
                                ? 'bg-gray-700 hover:bg-gray-600' 
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          )}
                        >
                          {aud}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  'p-3 rounded-full',
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                )}
              >
                <Upload className="w-6 h-6" />
              </button>
              
              <div className="flex-1 flex flex-col gap-2">
                {uploadedFile && (
                  <div className={clsx(
                    'flex items-center gap-2 p-2 rounded-lg',
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  )}>
                    <span className="text-sm truncate flex-1">{uploadedFile.name}</span>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 rounded-full hover:bg-gray-600/50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setIsInputExpanded(true)}
                  placeholder={uploadedFile ? "Add additional instructions..." : "Describe what you want to create..."}
                  className={clsx(
                    'w-full p-3 outline-none transition-all duration-500 ease-in-out',
                    darkMode 
                      ? 'bg-transparent border-gray-600 focus:bg-gray-700/50' 
                      : 'bg-transparent border-gray-200 focus:bg-gray-50/50',
                    isInputExpanded 
                      ? 'rounded-2xl border' 
                      : 'rounded-full border'
                  )}
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating || (!input.trim() && !uploadedFile)}
                className={clsx(
                  'p-3 rounded-full transition-colors',
                  darkMode ? 
                    'bg-blue-600 hover:bg-blue-700' : 
                    'bg-blue-500 hover:bg-blue-600',
                  'text-white',
                  (isGenerating || (!input.trim() && !uploadedFile)) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isGenerating ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Send className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Auth Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={clsx(
                'p-8 rounded-2xl max-w-md w-full mx-4 shadow-xl',
                darkMode ? 'bg-gray-800' : 'bg-white'
              )}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Welcome to SumUpAI</h2>
                <p className={clsx(
                  "text-sm",
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>
                  Join our community and start creating amazing AI-powered content
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={clsx(
                    "block text-sm font-medium mb-1",
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter your email"
                    className={clsx(
                      "w-full p-3 rounded-lg outline-none transition-colors",
                      darkMode 
                        ? "bg-gray-700 focus:bg-gray-600 text-white" 
                        : "bg-gray-100 focus:bg-gray-50 text-gray-900"
                    )}
                  />
                  {email && (
                    <p className="mt-1 text-xs text-gray-500">
                      Your username will be: @{email.split('@')[0]}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className={clsx(
                      "w-full border-t",
                      darkMode ? "border-gray-700" : "border-gray-200"
                    )} />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className={clsx(
                      "px-2",
                      darkMode ? "bg-gray-800 text-gray-400" : "bg-white text-gray-500"
                    )}>
                      Or continue with
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!email.trim()) {
                      setError('Please enter your email first');
                      return;
                    }
                    // Handle Google sign in with email
                  }}
                  className={clsx(
                    "w-full p-3 rounded-lg flex items-center justify-center gap-2 transition-colors",
                    darkMode 
                      ? "bg-gray-700 hover:bg-gray-600" 
                      : "bg-gray-100 hover:bg-gray-200"
                  )}
                >
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                  <span>Continue with Google</span>
                </button>

                <p className={clsx(
                  "text-xs text-center",
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>

              <button
                onClick={() => setShowAuthModal(false)}
                className={clsx(
                  "mt-6 w-full p-2 rounded-lg text-sm transition-colors",
                  darkMode 
                    ? "text-gray-400 hover:bg-gray-700" 
                    : "text-gray-500 hover:bg-gray-100"
                )}
              >
                Maybe later
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
import React, { useState, useEffect, useRef } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode, JwtPayload } from 'jwt-decode';

interface ExtendedJwtPayload extends JwtPayload {
  email: string;
  picture?: string;
  sub: string;
}
import { 
  Sun, Moon, Upload, Send, Image, Video, Loader2, Menu, Search, 
  LogOut, Settings, HelpCircle, PlusCircle, ChevronRight, ChevronLeft,
  Crown, MessageSquare, User, ChevronDown, FileText, Music, Fingerprint,
  ArrowRight // Add this
} from 'lucide-react';
import { clsx } from 'clsx';
import { BackgroundLines } from './components/BackgroundLines';
import { motion, AnimatePresence } from 'framer-motion';
import { ConvertIcon } from './components/ConvertIcon';

// Add this type definition
type ConverterContent = {
  id: ConverterType;
  icon: any;
  title: string;
  tagline: string;
  description: string;
  placeholder: string;
  cost: number;
};

// Add this constant
const CONVERTER_CONTENT: ConverterContent[] = [
  {
    id: 'text-to-image',
    icon: Image,
    title: 'Text to Image',
    tagline: 'Welcome to the world of visual storytelling!',
    description: 'Turn your text into vibrant, AI-crafted images that bring your imagination to life.',
    placeholder: 'Describe the image you want to create...',
    cost: 10
  },
  {
    id: 'text-to-video',
    icon: Video,
    title: 'Text to Video',
    tagline: 'Experience your words in motion!',
    description: 'Transform simple text into captivating, dynamic videos with ease.',
    placeholder: 'Describe the video you want to create...',
    cost: 20
  },
  {
    id: 'text-to-audio',
    icon: Music,
    title: 'Text to Audio',
    tagline: 'Hear your ideas come alive!',
    description: 'Convert your text into soothing audio or expressive narrations instantly.',
    placeholder: 'Write the text you want to convert to audio...',
    cost: 15
  },
  {
    id: 'text-to-sign',
    icon: Fingerprint,
    title: 'Text to Sign Language',
    tagline: 'Bridging gaps through innovation!',
    description: 'Translate your text into seamless sign language for inclusive communication.',
    placeholder: 'Enter the text you want to translate to sign language...',
    cost: 25
  }
];

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

type ConverterType = 'text-to-image' | 'text-to-video' | 'text-to-audio' | 'text-to-sign';

// Add this type near your other interfaces
type ProfileTooltipProps = {
  username: string;
  credits: number;
  darkMode: boolean;
};

// Update the ProfileTooltip component and its container
const ProfileTooltip: React.FC<ProfileTooltipProps> = ({ username, credits, darkMode }) => (
  <motion.div
    initial={{ opacity: 0, y: 5, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 5, scale: 0.95 }}
    className={clsx(
      'absolute mt-2 p-3 rounded-lg shadow-lg backdrop-blur-sm',
      'w-40 border transform-gpu',
      '-left-14', // Center align by offsetting left
      darkMode 
        ? 'bg-gray-800/90 border-gray-700' 
        : 'bg-white/90 border-gray-200'
    )}
  >
    <div className="space-y-2">
      <p className="font-medium text-base">{username}</p>
      <p className={clsx(
        'text-sm',
        darkMode ? 'text-gray-400' : 'text-gray-600'
      )}>
        credits {credits}
      </p>
    </div>
  </motion.div>
);

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

  const [showConverter, setShowConverter] = useState(false);
  const [activeConverter, setActiveConverter] = useState<ConverterType | null>(null);
  const converterRef = useRef<HTMLDivElement>(null);

  // Add this state near your other states
  const [showProfileDialog, setShowProfileDialog] = useState(false);

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

  // Add this useEffect near your other effects
  useEffect(() => {
    // Check for stored auth token
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      try {
        const decoded = jwtDecode<ExtendedJwtPayload>(storedToken);
        // Check if token is not expired
        if (decoded.exp && decoded.exp * 1000 > Date.now()) {
          setUser({
            id: decoded.sub,
            email: decoded.email,
            username: decoded.email.split('@')[0],
            profilePic: decoded.picture,
            createdAt: new Date()
          });
          setIsAuthenticated(true);
        } else {
          // Token expired, remove it
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error('Error parsing stored token:', error);
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (converterRef.current && !converterRef.current.contains(event.target as Node)) {
        setShowConverter(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add this useEffect near your other effects
  useEffect(() => {
    // Reset to home interface on first load
    handleNewChat();
  }, []); // Empty dependency array means this runs once on mount

  // Update the handleSubmit function to handle different converter types
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!input.trim()) return;

  // Get current converter cost if active
  const currentConverter = CONVERTER_CONTENT.find(c => c.id === activeConverter);
  const cost = currentConverter?.cost || 0;

  // Include selected options in the message
  const newMessage: Message = {
    id: Date.now().toString(),
    type: activeConverter ? activeConverter.split('-')[2] as 'text' | 'image' | 'video' : 'text',
    content: input,
    options: {
      format: outputFormat,
      summaryType,
      theme,
      audioVoice,
      language,
      audience
    }
  };

  const updatedMessages = [...messages, newMessage];
  setMessages(updatedMessages);
  
  const newChat: Chat = {
    id: Date.now().toString(),
    title: currentConverter ? `${currentConverter.title}: ${input.slice(0, 20)}...` : input.slice(0, 30) + (input.length > 30 ? '...' : ''),
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
      type: currentConverter ? currentConverter.id.split('-')[2] as 'image' | 'video' : 'text',
      content: 'https://images.unsplash.com/photo-1682687220742-aba19b51f9a8',
    };
    setMessages(prev => [...prev, aiResponse]);
    setIsGenerating(false);
  }, 2000);

  setIsInputExpanded(false);
};

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credentials received');
      }
  
      const decoded = jwtDecode<ExtendedJwtPayload>(credentialResponse.credential);
      
      if (!decoded.email) {
        throw new Error('No email found in token');
      }
  
      // Set authenticated user state
      setUser({
        id: decoded.sub,
        email: decoded.email,
        username: decoded.email.split('@')[0],
        profilePic: decoded.picture,
        createdAt: new Date()
      });
  
      setIsAuthenticated(true);
      setShowAuthModal(false);
      setError('');
  
      // Optional: Store auth token in localStorage
      localStorage.setItem('authToken', credentialResponse.credential);
  
    } catch (error) {
      console.error('Google login error:', error);
      setError('Failed to process Google login. Please try again.');
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setMessages([]);
  };

  // Update the handleNewChat function
const handleNewChat = () => {
  setMessages([]);
  setInput('');
  setIsSidebarOpen(false);
  setIsInputExpanded(false);
  setActiveConverter(null); // Reset active converter
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
    <GoogleOAuthProvider clientId="191171141553-mnc7esgj8d0d2nbs9qt4qut06vp0cgnm.apps.googleusercontent.com">
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
                      'p-2.5 rounded-full transition-colors', // Increased padding from p-2 to p-2.5
                      darkMode 
                        ? 'hover:bg-gray-800/80' 
                        : 'hover:bg-gray-200/80'
                    )}
                  >
                    {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />} {/* Increased from w-5 h-5 to w-6 h-6 */}
                  </button>
                </>
              ) : (
                <>
                  {/* Update the converter button content */}
                  <div className="relative" ref={converterRef}>
                    {/* Mobile version (circular icon only) */}
                    <button
                      onClick={() => setShowConverter(!showConverter)}
                      className={clsx(
                        'md:hidden w-10 h-10 rounded-full transition-all duration-300 relative group',
                        'overflow-hidden'
                      )}
                    >
                      <div className="absolute inset-0 rounded-full">
                        <div className={clsx(
                          "absolute inset-[0.5px] rounded-full",
                          "transition-all duration-300",
                          showConverter 
                            ? "bg-gradient-to-r from-blue-500 to-purple-500" 
                            : "bg-gradient-to-r from-blue-500 to-purple-500 after:absolute after:inset-[1px] after:rounded-full",
                          darkMode 
                            ? "after:bg-gray-900" 
                            : "after:bg-white"
                        )} />
                      </div>
                      <div className="relative z-10 flex items-center justify-center h-full">
                        <ConvertIcon className="w-5 h-5" />
                      </div>
                    </button>

                    {/* Desktop version (full button with text) */}
                    <button
                      onClick={() => setShowConverter(!showConverter)}
                      className={clsx(
                        'hidden md:flex px-4 py-2 rounded-full transition-all duration-300 relative group',
                        'overflow-hidden'
                      )}
                    >
                      <div className="absolute inset-0 rounded-full">
                        <div className={clsx(
                          "absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500",
                          "after:absolute after:inset-[1px] after:rounded-full",
                          darkMode ? "after:bg-gray-900" : "after:bg-white",
                          "group-hover:after:opacity-0",
                          "transition-all duration-300"
                        )} />
                      </div>
                      <div className={clsx(
                        'relative z-10 flex items-center gap-2 px-3 py-1.5',
                        'rounded-full transition-colors duration-300',
                        'group-hover:text-white'
                      )}>
                        <span className="text-base font-medium">Convert</span>
                        <ConvertIcon className="w-5 h-5 ml-1" />
                        <ChevronDown className={clsx(
                          "w-4 h-4 transition-transform duration-300",
                          showConverter ? "rotate-180" : "rotate-0"
                        )} />
                      </div>
                    </button>

                    {/* Dropdown menu - adjust width for mobile */}
                    {showConverter && (
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className={clsx(
                            'absolute right-0 mt-2 overflow-hidden shadow-lg rounded-xl',
                            'w-40 md:w-48', // Smaller width on mobile
                            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200',
                            'backdrop-blur-lg'
                          )}
                        >
                          <div className="py-1 md:py-2">
                            {[
                              { id: 'text-to-image', icon: Image, label: 'Text to Image' },
                              { id: 'text-to-video', icon: Video, label: 'Text to Video' },
                              { id: 'text-to-audio', icon: Music, label: 'Text to Audio' },
                              { id: 'text-to-sign', icon: Fingerprint, label: 'Text to Sign' },
                            ].map((item) => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setActiveConverter(item.id as ConverterType);
                                  setShowConverter(false);
                                  setMessages([]); // Clear messages when switching to converter
                                  setInput(''); // Clear input
                                }}
                                className={clsx(
                                  'w-full px-3 md:px-4 py-1.5 md:py-2 text-left flex items-center gap-2 md:gap-3 transition-colors',
                                  darkMode 
                                    ? 'hover:bg-gray-700/50 text-gray-200' 
                                    : 'hover:bg-gray-100/50 text-gray-700',
                                  activeConverter === item.id && 'bg-blue-500/10 text-blue-500'
                                )}
                              >
                                <item.icon className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="text-sm font-medium">{item.label}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>
                
                  <div className="relative group">
                    <button 
                      onClick={() => setShowProfileDialog(true)} // Add this onClick handler
                      className={clsx(
                        'p-2.5 rounded-full transition-colors',
                        darkMode 
                          ? 'hover:bg-gray-700' 
                          : 'hover:bg-gray-200/80'
                      )}
                    >
                      <User className="w-7 h-7" />
                    </button>

                    {/* Replace the tooltip with dialog */}
                    {showProfileDialog && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div 
                          className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
                          onClick={() => setShowProfileDialog(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={clsx(
                            'relative w-full max-w-md mx-4 p-6 rounded-xl shadow-xl',
                            darkMode ? 'bg-gray-800' : 'bg-white'
                          )}
                        >
                          {/* Dialog Content */}
                          <div className="space-y-6">
                            <div className="text-center">
                              <h2 className="text-2xl font-bold mb-2">Profile</h2>
                              <p className={clsx(
                                'text-sm',
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              )}>
                                Manage your account and credits
                              </p>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="text-sm text-gray-500">Username</label>
                                <p className="text-lg font-medium">{user?.email.split('@')[0] || 'User'}</p>
                              </div>
                              <div>
                                <label className="text-sm text-gray-500">Email</label>
                                <p className="text-lg font-medium">{user?.email}</p>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <label className="text-sm text-gray-500">Credits</label>
                                  <div className="flex items-center gap-2">
                                    <p className="text-lg font-medium">100</p>
                                    <span className="flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                  </div>
                                </div>
                                <button
                                  className={clsx(
                                    'flex items-center gap-2 px-4 py-2 rounded-full',
                                    'text-sm font-medium transition-colors',
                                    darkMode 
                                      ? 'bg-gray-700 hover:bg-gray-600' 
                                      : 'bg-gray-100 hover:bg-gray-200'
                                  )}
                                >
                                  <Crown className="w-4 h-4" />
                                  Upgrade to Pro
                                </button>
                              </div>
                            </div>

                            {/* Credit History */}
                            <div>
                              <h3 className="text-lg font-medium mb-3">Credit History</h3>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {/* Add your credit history items here */}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={clsx(
                      'p-2.5 rounded-full transition-colors', // Increased padding from p-2 to p-2.5
                      darkMode 
                        ? 'hover:bg-gray-800/80' 
                        : 'hover:bg-gray-200/80'
                    )}
                  >
                    {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />} {/* Increased from w-5 h-5 to w-6 h-6 */}
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
            messages.length === 0 && !isInputExpanded
              ? 'h-screen flex items-center justify-center'
              : 'max-w-6xl mx-auto px-4 mt-24 mb-32 h-[calc(100vh-14rem)]'
          )}
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            {messages.length === 0 && !isInputExpanded && !activeConverter ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-8 max-w-4xl mx-auto"
              >
                <h1 className="text-5xl font-bold mb-6 leading-tight">
                  Bring Your{' '}
                  <span className="inline-block animate-gradient bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Imagination
                  </span>{' '}
                  to Life with{' '}
                  <span className="inline-block animate-gradient bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                    AI
                  </span>!
                </h1>
                <p className={clsx(
                  "text-xl font-medium leading-relaxed max-w-2xl mx-auto", // Added max-w-2xl for smaller width
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Transform any{' '}
                  <span className="text-blue-500">text</span>,{' '}
                  <span className="text-purple-500">passage</span>,{' '}
                  <span className="text-pink-500">Word document</span>, or{' '}
                  <span className="text-blue-500">PDF</span>{' '}
                  into stunning images and videos effortlessly.
                </p>
                <p className={clsx(
                  "text-lg max-w-xl mx-auto", // Added max-w-xl for even smaller width
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>
                  Discover the power of{' '}
                  <span className="font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    AI-driven creativity
                  </span>{' '}
                  at your fingertips.
                </p>
              </motion.div>
            ) : activeConverter ? (
              // Show converter welcome message when converter is active
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-8 max-w-3xl mx-auto mb-12" // Increased space-y-6 to space-y-8
              >
                {CONVERTER_CONTENT.map((content) => (
                  content.id === activeConverter && (
                    <React.Fragment key={content.id}>
                      <div className="flex items-center justify-center gap-3 mb-6"> {/* Increased from mb-4 */}
                        <content.icon className="w-10 h-10" />
                        <h1 className={clsx(
                          "text-4xl font-bold leading-relaxed", // Added leading-relaxed
                          darkMode ? "text-white" : "text-gray-900"
                        )}>
                          Text to{' '}
                          <span className="inline-block animate-gradient bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            {content.id === 'text-to-image' && 'Image'}
                            {content.id === 'text-to-video' && 'Video'}
                            {content.id === 'text-to-audio' && 'Audio'}
                            {content.id === 'text-to-sign' && 'Sign Language'}
                          </span>
                        </h1>
                      </div>
                      <h2 className="text-2xl font-semibold mb-6 leading-relaxed"> {/* Added leading-relaxed and increased mb-4 to mb-6 */}
                        {content.id === 'text-to-image' && (
                          <>Welcome to the world of <span className="text-blue-500">visual storytelling</span>!</>
                        )}
                        {content.id === 'text-to-video' && (
                          <>Experience your words in <span className="text-purple-500">motion</span>!</>
                        )}
                        {content.id === 'text-to-audio' && (
                          <>Hear your <span className="text-pink-500">ideas</span> come alive!</>
                        )}
                        {content.id === 'text-to-sign' && (
                          <>Bridging gaps through <span className="text-blue-500">innovation</span>!</>
                        )}
                      </h2>
                      <p className={clsx(
                        "text-xl max-w-xl mx-auto leading-loose", // Changed from leading-relaxed to leading-loose
                        darkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        {content.id === 'text-to-image' && (
                          <>Transform your text into <span className="text-blue-500">vibrant</span>, <span className="text-purple-500">AI-crafted</span> images that bring your <span className="text-pink-500">imagination</span> to life.</>
                        )}
                        {content.id === 'text-to-video' && (
                          <>Transform simple text into <span className="text-blue-500">captivating</span>, <span className="text-purple-500">dynamic</span> videos with <span className="text-pink-500">ease</span>.</>
                        )}
                        {content.id === 'text-to-audio' && (
                          <>Convert your text into <span className="text-blue-500">soothing</span> audio or <span className="text-purple-500">expressive</span> narrations <span className="text-pink-500">instantly</span>.</>
                        )}
                        {content.id === 'text-to-sign' && (
                          <>Translate your text into <span className="text-blue-500">seamless</span> sign language for <span className="text-purple-500">inclusive</span> <span className="text-pink-500">communication</span>.</>
                        )}
                      </p>
                    </React.Fragment>
                  )
                ))}
              </motion.div>
            ) : (
              // Show normal chat messages when no converter is active
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    ref={messages[messages.length - 1].id === message.id ? latestMessageRef : null}
                    className={clsx(
                      'flex flex-col gap-2',
                      message.loading && 'animate-pulse'
                    )}
                  >
                    {message.type === 'text' && (
                      <div className={clsx(
                        'p-4 rounded-xl max-w-prose',
                        darkMode ? 'bg-gray-800/50' : 'bg-white/50',
                        'backdrop-blur-sm'
                      )}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    )}
                    {message.type === 'image' && (
                      <div className={clsx(
                        'rounded-xl overflow-hidden max-w-lg',
                        'backdrop-blur-sm'
                      )}>
                        <img 
                          src={message.content} 
                          alt="Generated" 
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                    {message.type === 'video' && (
                      <div className={clsx(
                        'rounded-xl overflow-hidden max-w-lg',
                        'backdrop-blur-sm'
                      )}>
                        <video 
                          src={message.content}
                          controls
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                    {message.type === 'audio' && (
                      <div className={clsx(
                        'rounded-xl overflow-hidden max-w-lg',
                        'backdrop-blur-sm p-4',
                        darkMode ? 'bg-gray-800/50' : 'bg-white/50'
                      )}>
                        <audio 
                          src={message.content}
                          controls
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
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
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
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
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          )}
                        >
                          {t}
                        </button>
                      ))}
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
                ) : activeConverter ? (
                  <div className="flex items-center gap-2 px-3">
                    <span className="text-sm">Generate</span>
                    <span className="text-xs opacity-75">({CONVERTER_CONTENT.find(c => c.id === activeConverter)?.cost} credits)</span>
                  </div>
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
                <div className="w-full flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap
                    theme={darkMode ? 'filled_black' : 'outline'}
                    shape="pill"
                    size="large"
                    text="continue_with"
                    width="100%"
                  />
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
                      Or continue with email
                    </span>
                  </div>
                </div>

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
                  <button
                    onClick={() => {
                      if (!email.trim()) {
                        setError('Please enter your email');
                        return;
                      }
                      // Handle email sign in
                    }}
                    className="mt-2 w-full p-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Continue with Email
                  </button>
                </div>

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
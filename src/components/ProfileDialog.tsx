import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Crown } from 'lucide-react';

type CreditHistory = {
  id: string;
  type: 'text-to-image' | 'text-to-video' | 'text-to-audio' | 'text-to-sign';
  points: number;
  date: string;
};

type ProfileDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  user: {
    username: string;
    email: string;
    credits: number;
  };
  creditHistory: CreditHistory[];
};

const CREDIT_COSTS = {
  'text-to-image': 10,
  'text-to-video': 20,
  'text-to-audio': 15,
  'text-to-sign': 25,
};

export const ProfileDialog = ({ isOpen, onClose, darkMode, user, creditHistory }: ProfileDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose} 
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
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1">Profile</h2>
          <p className={clsx(
            'text-sm',
            darkMode ? 'text-gray-400' : 'text-gray-600'
          )}>
            Manage your account and credits
          </p>
        </div>

        {/* User Info */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-gray-500">Username</label>
            <p className="text-lg font-medium">{user.username}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <p className="text-lg font-medium">{user.email}</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm text-gray-500">Credits</label>
              <div className="flex items-center gap-2">
                <p className="text-lg font-medium">{user.credits}</p>
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
          <div className={clsx(
            'space-y-2 max-h-60 overflow-y-auto pr-2',
            'scrollbar-thin scrollbar-track-transparent',
            darkMode 
              ? 'scrollbar-thumb-gray-600' 
              : 'scrollbar-thumb-gray-300'
          )}>
            {creditHistory.map((item) => (
              <div
                key={item.id}
                className={clsx(
                  'flex items-center justify-between p-3 rounded-lg',
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                )}
              >
                <div>
                  <p className="font-medium">{item.type.split('-').join(' ').toUpperCase()}</p>
                  <p className={clsx(
                    'text-sm',
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  )}>
                    {item.date}
                  </p>
                </div>
                <p className="text-red-500">-{item.points}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
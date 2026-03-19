import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'Loading...' }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
      <p className="text-gray-400">{message}</p>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-dark-300 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 mx-auto animate-pulse">
          <span className="text-2xl font-bold font-display">HK</span>
        </div>
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-2" />
        <p className="text-gray-400">Loading MLBB Hub...</p>
      </div>
    </div>
  );
}

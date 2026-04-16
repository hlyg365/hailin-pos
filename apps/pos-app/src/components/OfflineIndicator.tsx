import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflineIndicator() {
  return (
    <div className="offline-indicator">
      <WifiOff className="w-4 h-4" />
      <span>离线模式</span>
    </div>
  );
}

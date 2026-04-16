import { Clock } from 'lucide-react';

export default function ClearanceModeIndicator() {
  return (
    <div className="clearance-indicator">
      <Clock className="w-4 h-4" />
      <span>晚8点清货 · 全场8折</span>
    </div>
  );
}

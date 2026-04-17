import { useState, useEffect } from 'react';

export default function ClearanceModeIndicator() {
  const [isClearanceMode, setIsClearanceMode] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const checkClearanceMode = () => {
      const now = new Date();
      const hour = now.getHours();
      const mode = hour >= 20 && hour < 23;
      
      if (mode && !isClearanceMode) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
      
      setIsClearanceMode(mode);
    };

    checkClearanceMode();
    const interval = setInterval(checkClearanceMode, 60000);
    return () => clearInterval(interval);
  }, [isClearanceMode]);

  if (!isClearanceMode) return null;

  return (
    <>
      {showNotification && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-pulse">
          🔥 晚8点清货模式已开启，全场8折！
        </div>
      )}
    </>
  );
}

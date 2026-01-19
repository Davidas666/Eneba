import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Home from './pages/Home';
import Cart from './pages/Cart';
import AuthCallback from './pages/AuthCallback';
import { CartModalProvider, useCartModal } from './context/CartModalContext';
import AddToCartModal from './components/AddToCartModal/AddToCartModal';

function AppContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const { isOpen, itemCount, hideCartModal } = useCartModal();

  useEffect(() => {
    // Check if returning from OAuth callback with token
    const checkOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const currentPath = window.location.pathname;
      
      console.log('🔍 Checking OAuth:', { 
        token: token ? token.substring(0, 20) + '...' : 'none', 
        path: currentPath,
        fullUrl: window.location.href 
      });
      
      if (token) {
        console.log(' Processing OAuth callback with token...');
        
        // Save token immediately
        localStorage.setItem('token', token);
        console.log('💾 Token saved to localStorage');
        
        try {
          // Set cookie with token first
          document.cookie = `jwt=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
          
          // Fetch user data using the cookie
          console.log(' Fetching user data from /users/profile...');
          const response = await fetch('/api/v1/users/profile', {
            method: 'GET',
            credentials: 'include',
          });

          console.log('Response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log(' User data received:', data);
            
            // Save to localStorage
            localStorage.setItem('user', JSON.stringify(data.data));
            localStorage.setItem('isLoggedIn', 'true');
            
            // Verify save
            console.log(' All data saved. Verifying...');
            console.log('  - token:', localStorage.getItem('token') ? 'EXISTS' : 'MISSING');
            console.log('  - user:', localStorage.getItem('user') ? 'EXISTS' : 'MISSING');
            console.log('  - isLoggedIn:', localStorage.getItem('isLoggedIn'));
            
            console.log(' Redirecting to home and reloading...');
            
            // Navigate to home and reload
            window.location.replace('/');
          } else {
            console.error('Failed to fetch user data, status:', response.status);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            localStorage.removeItem('token');
            window.location.replace('/');
          }
        } catch (error) {
          console.error('Failed to fetch user after OAuth:', error);
          localStorage.removeItem('token');
          window.location.replace('/');
        }
      }
    };

    checkOAuthCallback();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <Router>
      <Header onSearch={handleSearch} />
      <Routes>
        <Route path="/" element={<Home searchQuery={searchQuery} />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/auth/success" element={<AuthCallback />} />
      </Routes>
      <AddToCartModal 
        isOpen={isOpen}
        onClose={hideCartModal}
        onContinueShopping={hideCartModal}
        onViewCart={() => {
          hideCartModal();
          window.location.href = '/cart';
        }}
        itemCount={itemCount}
      />
    </Router>
  );
}

function App() {
  return (
    <CartModalProvider>
      <AppContent />
    </CartModalProvider>
  );
}

export default App;

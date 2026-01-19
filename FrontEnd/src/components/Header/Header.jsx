import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import LanguageCurrencySelector from './LanguageCurrencySelector';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import FavoritesDropdown from './FavoritesDropdown';
import Icon from '../common/Icon';
import EnebaLogo from '../../assets/EnebaLogo.svg';
import UserIcon from '../../assets/svg_5.svg';
import UserProfileIcon from '../../assets/enebian_69660c9bcbf1b (1).svg';
import { logoutUser } from '../../services/api';
const Header = ({ onSearch }) => {
const navigate = useNavigate();
const searchBarRef = useRef(null);
const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
const [isLoggedIn, setIsLoggedIn] = useState(() => {
  // Initialize state from localStorage
  const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
  console.log(' Header initializing, isLoggedIn:', loggedIn);
  return loggedIn;
});
const [user, setUser] = useState(() => {
  const userData = localStorage.getItem('user');
  if (userData) {
    console.log(' Header initializing, user data found:', JSON.parse(userData));
    return JSON.parse(userData);
  }
  console.log(' Header initializing, no user data');
  return null;
});

const handleLoginSuccess = (userData) => {
  console.log('handleLoginSuccess called with:', userData);
  setIsLoggedIn(true);
  setUser(userData);
};

const handleLogout = async () => {
  console.log('Logging out...');
  await logoutUser();
  setIsLoggedIn(false);
  setUser(null);
  window.location.reload();
};

const handleLogoClick = () => {
    navigate('/');
    if (onSearch) {
      onSearch('');
    }
    if (searchBarRef.current) {
      searchBarRef.current.clearSearch();
    }
  };

const handleCartClick = () => {
    navigate('/cart');
  };

return (
<>
    <header className="bg-primary-purple text-white z-[1000]">
    <div className="flex items-center justify-between px-8 py-4 max-w-300 mx-auto gap-6">
        <div className="flex items-center shrink-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
            <img src={EnebaLogo} alt="Eneba logo" className="h-14 w-auto" />
        </div>
        </div>

        <div className="flex-1 max-w-225 flex items-center gap-3">
        <SearchBar ref={searchBarRef} onSearch={onSearch} />
        <LanguageCurrencySelector />
        </div>
        <div className="flex items-center gap-3 shrink-0">

        <div className="relative">
        <button 
            onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
            className="bg-transparent border-0 text-white cursor-pointer p-2 rounded-md flex items-center justify-center transition-all duration-200 hover:text-[rgba(250,214,24,1)] hover:-translate-y-0.5"
        >
            <Icon name="heart" size={22} />
        </button>
        <FavoritesDropdown
            isOpen={isFavoritesOpen}
            onClose={() => setIsFavoritesOpen(false)}
            isLoggedIn={isLoggedIn}
            onLoginClick={() => setIsLoginModalOpen(true)}
        />
        </div>
        
        <button 
            onClick={handleCartClick}
            className="bg-transparent border-0 text-white cursor-pointer p-2 rounded-md flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:text-[rgba(250,214,24,1)]"
        >
            <Icon name="cart" size={22} />
        </button>
        
        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout}
              className="bg-transparent border-1 border-white text-white cursor-pointer p-0 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white/10 hover:-translate-y-0.5 w-8 h-8"
              title="Log Out"
            >
              <img src={UserProfileIcon} alt="User Profile" className="w-full h-full rounded-full object-cover" />
            </button>
          </div>
        ) : (
            <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="border-none text-white cursor-pointer px-3 py-2 rounded-md text-sm transition-all duration-200 hover:text-[rgba(250,214,24,1)] flex items-center gap-2"
            > 
                <img src={UserIcon} alt="User" className="w-6 h-6 brightness-0 invert" />
                <span>Log In</span>
            </button>
            <span className="text-white/50">|</span>
            <button 
              onClick={() => setIsRegisterModalOpen(true)}
              className="border-none text-white cursor-pointer px-3 py-2 rounded-md text-sm transition-all duration-200 hover:text-[rgba(250,214,24,1)]"
            >
                Register
            </button>
            </div>
        )}
    <LoginModal 
      isOpen={isLoginModalOpen} 
      onClose={() => setIsLoginModalOpen(false)}
      onLoginSuccess={handleLoginSuccess}
    />
    <RegisterModal 
      isOpen={isRegisterModalOpen} 
      onClose={() => setIsRegisterModalOpen(false)}
      onRegisterSuccess={handleLoginSuccess}
    />
        </div>
    </div>
    </header>
</>
);
};

export default Header;
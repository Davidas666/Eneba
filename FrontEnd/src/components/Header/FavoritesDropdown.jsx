import { useState, useEffect, useRef } from 'react';
import { getFavorites } from '../../services/api';
import ProductCard from '../ProductCard/ProductCard';
import Icon from '../common/Icon';

const FavoritesDropdown = ({ isOpen, onClose, isLoggedIn, onLoginClick }) => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      loadFavorites();
    }
  }, [isOpen, isLoggedIn]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const data = await getFavorites();
      // Map backend data to match ProductCard expected format
      const mappedFavorites = (data || []).map(fav => ({
        ...fav,
        game_title: fav.title // Backend returns 'title', ProductCard expects 'game_title'
      }));
      setFavorites(mappedFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = (listingId) => {
    // Remove from local state immediately for better UX
    setFavorites(prev => prev.filter(fav => fav.listing_id !== listingId));
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 bg-[#351183] rounded-none shadow-xl z-2000 w-100 max-h-150 overflow-y-auto"
      style={{ border: '1px solid #e5e7eb' }}
    >
      <div className="p-4 border-b border-none bg-[#351183] rounded-t-none">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Icon name="heart" size={20} className="text-red-500" />
            Favorites
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {!isLoggedIn ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <Icon name="heart" size={48} className="text-gray-300 mx-auto" />
            </div>
            <p className="text-white mb-4">
              Log in to see your favorite games
            </p>
            <button
              onClick={() => {
                onClose();
                onLoginClick();
              }}
              className="bg-primary-purple text-white px-6 py-2 rounded-none hover:bg-purple-700 transition-colors"
            >
              Log In
            </button>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto"></div>
            <p className="text-white mt-4">Loading...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <Icon name="heart" size={48} className="text-white mx-auto" />
            </div>
            <p className="text-white">
              You don't have any favorite games yet
            </p>
            <p className="text-sm text-white mt-2">
              Click the heart icon on a game card to add it to your favorites
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((favorite) => (
              <div key={favorite.listing_id} className="">
                <ProductCard 
                  product={favorite} 
                  compact={true} 
                  onRemove={handleRemoveFavorite}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesDropdown;

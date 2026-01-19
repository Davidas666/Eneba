import { useEffect, useState } from 'react';
import Badge from '../common/Badge';
import Icon from '../common/Icon';
import Cashback from './Cashback';
import { getPlatformIcon, getPlatformText } from '../../utils/platformIcons';
import { addToFavorites, removeFromFavorites, checkFavorite, addToCart } from '../../services/api';
import { useCartModal } from '../../context/CartModalContext';

const ProductCard = ({ product, compact = false, onRemove }) => {
  const {
    listing_id,
    game_title,
    image_url,
    platform_name,
    region_name,
    price,
    discount_percentage,
    discounted_price,
    cashback,
    wishlist_count,
  } = product;

  const initialWishlistCount = Number(wishlist_count) || 0;
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wishlistTotal, setWishlistTotal] = useState(initialWishlistCount);
  const [isHovering, setIsHovering] = useState(false);
  const { showCartModal } = useCartModal();

  const platformIcon = getPlatformIcon(platform_name);
  const platformText = getPlatformText(platform_name);
  
  const originalPrice = parseFloat(price);
  const currentPrice = parseFloat(discounted_price || price);
  const cashbackAmount = parseFloat(cashback);
  const discount = parseFloat(discount_percentage);
  const hasCashback = cashbackAmount > 0;
  const hasDiscount = discount > 0;

  useEffect(() => {
    let isActive = true;

    const fetchFavoriteState = async () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (!isLoggedIn) {
        if (isActive) {
          setIsFavorite(false);
        }
        return;
      }

      try {
        const favoriteStatus = await checkFavorite(listing_id);
        if (isActive) {
          setIsFavorite(!!favoriteStatus);
        }
      } catch (error) {
        console.error('Failed to fetch favorite status:', error);
      }
    };

    fetchFavoriteState();

    return () => {
      isActive = false;
    };
  }, [listing_id]);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation(); 
    
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      alert('Please log in to add game to favorites');
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        await removeFromFavorites(listing_id);
        setIsFavorite(false);
        setWishlistTotal((prev) => Math.max(prev - 1, 0));
        console.log('Removed from favorites');
        if (onRemove) {
          onRemove(listing_id);
        }
      } else {
        await addToFavorites(listing_id);
        setIsFavorite(true);
        setWishlistTotal((prev) => prev + 1);
        console.log('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert(error.message || 'Failed to update favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      alert('Please log in to add game to cart');
      return;
    }

    setIsLoading(true);
    try {
      const response = await addToCart(listing_id);
      const itemQuantity = response.data?.item?.quantity || 1;
      showCartModal(itemQuantity);
      console.log('Added to cart:', listing_id);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(error.message || 'Failed to add to cart');
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    const handleCompactRemove = async (e) => {
      e.stopPropagation();
      
      setIsLoading(true);
      try {
        await removeFromFavorites(listing_id);
        console.log('Removed from favorites in compact mode');
        if (onRemove) {
          onRemove(listing_id);
        }
      } catch (error) {
        console.error('Error removing favorite:', error);
        alert(error.message || 'Failed to remove from favorites');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="flex items-center gap-3 p-2 bg-[#4618ac] hover:bg-[#5a23d1] rounded-lg transition-colors">
        <div className="relative w-20 h-20 shrink-0 rounded overflow-hidden">
          <img src={image_url} alt={game_title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate mb-1">
            {game_title}
          </h4>
          <div className="flex items-center gap-2 mb-1">
            <img src={platformIcon} alt={platform_name} className="w-4 h-4" />
            <span className="text-xs text-[#23c299]">{region_name}</span>
          </div>
          <div className="flex items-center gap-2">
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                €{originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-lg font-bold text-white">
              €{currentPrice.toFixed(2)}
            </span>
          </div>
        </div>
        <button
          onClick={handleCompactRemove}
          disabled={isLoading}
          className="shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
          title="Remove from favorites"
        >
          <Icon name="heartFilled" size={20} />
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`bg-[#1f0a4d] overflow-hidden transition-all duration-300 cursor-pointer border border-[rgb(99,227,194)] h-full flex flex-col hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:border-[#00ff9d]/30 ${
        isHovering ? '-translate-y-1' : ''
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      
      <div className={`relative w-full overflow-hidden bg-[#1f0a4d] transition-all duration-300 ${
        isHovering ? 'pt-[110%]' : 'pt-[140%]'
      }`}>
        <img src={image_url} alt={game_title} className="absolute top-0 left-0 w-full h-full object-cover" />
        
        {hasCashback && (
          <div className="absolute bottom-8 z-2">
            <Cashback />
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 z-2">
          <div className="flex items-center justify-center gap-1 w-full py-1 px-2" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
            <img src={platformIcon} alt={platform_name} className="w-4 h-4" />
            <span className="text-white text-xs font-bold">{platformText || platform_name}</span>
          </div>
        </div>
      </div>

      <div className={`p-4 flex flex-col gap-1 flex-1 transition-all duration-300 ${isHovering ? '-translate-y-4' : ''}`}>
        <div ></div>
        
        <div className="mt-auto pt-1 transition-all duration-300 flex flex-col gap-2">
          <h3 className="text-[12px] font-extrabold text-white m-0 leading-[1.4] line-clamp-2 min-h-10" style={{ fontFamily: 'metropolis, Arial, Helvetica, sans-serif' }}>
            {game_title}
          </h3>
          
          <Badge variant="region" className="">
            {region_name}
          </Badge>

          {hasDiscount && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-extrabold text-white/50 line-through text-start" style={{ fontFamily: 'metropolis, Arial, Helvetica, sans-serif' }}>
                  From €{originalPrice.toFixed(2)}
                </span>
                <Badge variant="discount" className="text-[12px] font-extrabold" style={{ fontFamily: 'metropolis, Arial, Helvetica, sans-serif' }}>
                  -{discount.toFixed(0)}%
                </Badge>
              </div>
            </div>
          )}

          {!hasDiscount && (
            <span className="text-[12px] font-extrabold text-white/50 text-start" style={{ fontFamily: 'metropolis, Arial, Helvetica, sans-serif' }}>
              From
            </span>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold flex items-end">
              €{currentPrice.toFixed(2)}
              <button className="bg-transparent border-0 text-white/40 cursor-pointer p-1 flex items-center rounded transition-all duration-200 ">
                <Icon name="info" size={20} />
              </button>
            </div>
          </div>

          {hasCashback && (
            <div>
              <span className="flex items-center gap-1 text-sm font-semibold text-[#84e916]">
                Cashback: €{cashbackAmount.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-start pt-1">
            <button 
              onClick={handleFavoriteClick}
              disabled={isLoading}
              className={`flex items-center gap-1.5 bg-transparent cursor-pointer px-2 py-1.5  text-[13px] transition-all duration-200 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed ${
                isFavorite ? 'text-red-500 hover:text-red-400' : 'text-white/60 hover:text-white'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Icon name="heart" size={16} />
              <span className="font-semibold">{wishlistTotal}</span>
            </button>
          </div>

          {isHovering && (
            <div className={`flex flex-col gap-2 transition-all duration-300 ${isHovering ? '-translate-y-4' : ''}`}>
              <button 
                onClick={handleAddToCart}
                disabled={isLoading}
                className="w-full bg-[#ffd700] text-black font-bold py-2 hover:bg-yellow-400 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to cart
              </button>
              <button 
                onClick={handleFavoriteClick}
                disabled={isLoading}
                className={`w-full font-bold py-2  transition-colors text-sm ${
                  isFavorite 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'border-2 border-white text-white hover:bg-white/10'
                }`}
              >
                {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

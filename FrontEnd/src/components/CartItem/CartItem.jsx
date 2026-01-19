import { useState } from 'react';
import Icon from '../common/Icon';
import Badge from '../common/Badge';
import { removeFromCart, updateCartItem, addToFavorites, removeFromFavorites } from '../../services/api';

const CartItem = ({ item, onRemove, onUpdate, isFavorite: initialIsFavorite = false }) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);

  const discount = parseFloat(item.discount_percentage) || 0;
  const price = parseFloat(item.price) || 0;
  const discountedPrice = parseFloat(item.discounted_price) || price;
  const cashback = parseFloat(item.cashback) || 0;

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1) return;
    
    setIsLoading(true);
    try {
      await updateCartItem(item.listing_id, newQuantity);
      setQuantity(newQuantity);
      onUpdate && onUpdate(item.listing_id, newQuantity);
    } catch (error) {
      console.error('Error updating cart:', error);
      alert('Failed to update quantity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromCart = async () => {
    setIsLoading(true);
    try {
      await removeFromCart(item.listing_id);
      onRemove && onRemove(item.listing_id);
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Failed to remove from cart');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    setIsLoading(true);
    try {
      if (isFavorite) {
        await removeFromFavorites(item.listing_id);
        setIsFavorite(false);
      } else {
        await addToFavorites(item.listing_id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPrice = item.discounted_price || item.price;

  return (
    <div className="bg-[#2d1456]  p-4 flex gap-4 border border-[#4d1fa0]/30">
      {/* Image */}
      <div className="relative w-24 h-24 shrink-0 overflow-hidden">
        <img 
          src={item.image_url} 
          alt={item.game_title} 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Header with seller and actions */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">{item.seller_name}</p>
            <h3 className="text-sm font-semibold text-white line-clamp-2">
              {item.game_title}
            </h3>
          </div>
          <div className="flex gap-2 ml-2">
            <button
              onClick={handleToggleFavorite}
              disabled={isLoading}
              className={`p-1.5  transition-colors ${
                isFavorite 
                  ? 'text-red-500 hover:text-red-400' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Icon name={isFavorite ? 'heartFilled' : 'heart'} size={16} />
            </button>
            <button
              onClick={handleRemoveFromCart}
              disabled={isLoading}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors bg-[#1f0a4d] border border-[#4d1fa0]/50 hover:border-red-500/50"
              title="Remove from cart"
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        </div>

        {/* Pricing info */}
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-400">Skaitmeninė prekė</p>
          {discount > 0 && (
            <Badge variant="discount" className="text-xs">
              -{discount.toFixed(0)}%
            </Badge>
          )}
        </div>

        {/* Bottom row - quantity and price */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 bg-[#1f0a4d] rounded px-2 py-1">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={isLoading || quantity <= 1}
              className="text-gray-400 hover:text-white disabled:opacity-50 text-lg"
            >
              −
            </button>
            <span className="w-8 text-center text-white text-sm font-semibold">
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={isLoading}
              className="text-gray-400 hover:text-white disabled:opacity-50 text-lg"
            >
              +
            </button>
          </div>
          
          <div className="text-right">
            {discount > 0 && (
              <p className="text-xs text-gray-400 line-through">
                €{(price * quantity).toFixed(2)}
              </p>
            )}
            <p className="text-lg font-bold text-white">
              €{(discountedPrice * quantity).toFixed(2)}
            </p>
            {cashback > 0 && (
              <p className="text-xs text-[#84e916]">
                Cashback: €{(cashback * quantity).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;

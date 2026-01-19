import { useEffect } from 'react';
import cartSvg from '../../assets/svg_143.svg';

const AddToCartModal = ({ isOpen, onClose, onContinueShopping, onViewCart, itemCount = 1 }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#4618ac] p-8 w-[500px] h-[300px] mx-4 text-center flex flex-col justify-center items-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <img src={cartSvg} alt="cart" className="w-21 h-21 filter brightness-0 invert" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-2">
          Added to Cart
        </h2>

        {/* Subtitle */}
        <p className="text-gray-300 text-sm mb-8">
          You have <span className='text-white font-bold'>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span> in your cart
        </p>

        {/* Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onContinueShopping}
            className="bg-[#ffd700] text-black font-bold hover:bg-yellow-400 transition-colors"
            style={{ width: '203px', height: '35px' }}
          >
            Continue Shopping
          </button>
          <button
            onClick={onViewCart}
            className="border-2 border-white text-white font-bold hover:bg-white/10 transition-colors"
            style={{ width: '203px', height: '35px' }}
          >
            View Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToCartModal;

import { useEffect, useState } from 'react';
import CartItem from '../components/CartItem/CartItem';
import { getCart } from '../services/api';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalCashback, setTotalCashback] = useState(0);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      setError('Please log in to view your cart');
      setIsLoading(false);
      return;
    }
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setIsLoading(true);
    try {
      const response = await getCart();
      console.log('Cart response:', response);
      setCartItems(response.cart.items || []);
      setTotalPrice(response.cart.summary.total || 0);
      setTotalCashback(response.cart.summary.totalCashback || 0);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = (listingId) => {
    setCartItems(cartItems.filter(item => item.listing_id !== listingId));
    fetchCart();
  };

  const handleUpdateItem = (listingId, newQuantity) => {
    fetchCart();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#4618ac] flex items-center justify-center">
        <div className="text-white text-xl">Loading cart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#4618ac] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">{error}</p>
          <a
            href="/"
            className="inline-block bg-[#ffd700] text-black font-bold py-3 px-6  hover:bg-yellow-400 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#351183] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">My Cart</h1>

        {cartItems.length === 0 ? (
          <div className="bg-[#2d1456]  p-8 text-center">
            <p className="text-gray-300 text-lg mb-4">Your cart is empty</p>
            <a
              href="/"
              className="inline-block bg-[#ffd700] text-black font-bold py-3 px-6 hover:bg-yellow-400 transition-colors"
            >
              Continue Shopping
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <CartItem
                  key={item.listing_id}
                  item={item}
                  onRemove={handleRemoveItem}
                  onUpdate={handleUpdateItem}
                />
              ))}
            </div>

            {/* Summary */}
            <div className="bg-[#2d1456] p-6 ">
              <h2 className="text-xl font-bold text-white mb-6">Summary</h2>

              <div className="space-y-3 mb-6 pb-6">
                <div className="flex justify-between text-gray-300">
                  <span>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</span>
                  <span>€{cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                </div>

                {totalCashback > 0 && (
                  <div className="flex justify-between text-[#84e916] text-sm">
                    <span>Cashback</span>
                    <span>€{totalCashback.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-white font-bold">Total:</span>
                <span className="text-2xl font-bold text-white">€{totalPrice.toFixed(2)}</span>
              </div>

              <button className="w-full bg-[#ffd700] text-black font-bold py-3 hover:bg-yellow-400 transition-colors mb-3">
                Proceed to Checkout
              </button>

              <a
                href="/"
                className="block text-center text-white border-2 border-white font-bold py-3 hover:bg-white/10 transition-colors"
              >
                Continue Shopping
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;

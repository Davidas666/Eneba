import { useState, useEffect } from 'react';
import ProductGrid from '../components/ProductGrid/ProductGrid';
import { fetchListings } from '../services/api';
import { mockProducts } from '../data/mockProducts';

const Home = ({ searchQuery }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        console.log('Fetching products...', searchQuery ? `Search: ${searchQuery}` : '');
        const listings = await fetchListings(searchQuery);
        console.log('Products received:', listings.length, 'items');
        setProducts(listings);
        setError(null);
      } catch (err) {
        console.error('Failed to load from API:', err);
        setProducts(mockProducts);
        setError('Using fallback data');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {error && (
        <div className="bg-yellow-500/20 text-yellow-200 px-4 py-2 text-center">
          {error}
        </div>
      )}
      <ProductGrid products={products} />
    </div>
  );
};

export default Home;

import ProductCard from '../ProductCard/ProductCard';

const ProductGrid = ({ products }) => {
  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.listing_id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;

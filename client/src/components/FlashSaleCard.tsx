import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { Product } from '@shared/schema';
import { Link } from 'wouter';

interface FlashSaleCardProps {
  product: Product;
  claimedPercentage: number;
}

const FlashSaleCard = ({ product, claimedPercentage }: FlashSaleCardProps) => {
  const { currency, convertPrice } = useCurrency();
  
  // Convert prices to selected currency
  const convertedSalePrice = product.salePrice ? convertPrice(product.salePrice) : convertPrice(product.price);
  const convertedOriginalPrice = convertPrice(product.price);
  
  // Calculate discount percentage
  const discountPercentage = product.discount || 
    (product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : null);

  return (
    <Link href={`/product/${product.slug}`}>
      <div className="bg-white rounded-lg overflow-hidden shadow-sm p-4 flex flex-col hover:shadow-md transition-all">
        <div className="relative mb-3">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-24 object-cover rounded"
          />
          <div className="absolute top-1 left-1">
            {discountPercentage && (
              <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                -{discountPercentage}%
              </span>
            )}
          </div>
        </div>
        <h3 className="font-medium text-gray-800 text-sm mb-1 truncate">{product.name}</h3>
        <div className="flex items-baseline mb-2">
          <span className="text-base font-bold text-gray-800">
            {formatCurrency(convertedSalePrice, currency)}
          </span>
          {product.salePrice && (
            <span className="text-xs text-gray-500 line-through ml-2">
              {formatCurrency(convertedOriginalPrice, currency)}
            </span>
          )}
        </div>
        <div className="mt-auto">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: `${claimedPercentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500">{claimedPercentage}% claimed</div>
        </div>
      </div>
    </Link>
  );
};

export default FlashSaleCard;

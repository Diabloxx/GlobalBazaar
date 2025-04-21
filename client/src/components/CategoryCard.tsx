import { Link } from 'wouter';
import { Category } from '@shared/schema';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  // Get icon component based on category.icon string
  const getIconClass = (iconName: string) => {
    return `fas fa-${iconName}`;
  };

  const getBgColorClass = (index: number) => {
    const colors = [
      "bg-primary/10", // Primary with opacity
      "bg-secondary/10", // Secondary with opacity
      "bg-amber-400/10", // Amber with opacity
      "bg-emerald-500/10", // Emerald with opacity
      "bg-violet-500/10", // Violet with opacity
      "bg-pink-500/10", // Pink with opacity
    ];
    
    return colors[index % colors.length];
  };
  
  const getTextColorClass = (index: number) => {
    const colors = [
      "text-primary",
      "text-secondary",
      "text-amber-500",
      "text-emerald-500",
      "text-violet-500",
      "text-pink-500",
    ];
    
    return colors[index % colors.length];
  };

  // Since we can't know the index in this component, 
  // we'll derive a consistent index from the category id
  const colorIndex = (category.id - 1) % 6;
  
  return (
    <Link 
      href={`/category/${category.slug}`} 
      className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className={`w-16 h-16 flex items-center justify-center rounded-full ${getBgColorClass(colorIndex)} mb-3`}>
        <i className={`${getIconClass(category.icon || 'box')} ${getTextColorClass(colorIndex)} text-xl`}></i>
      </div>
      <span className="text-gray-800 font-medium text-sm text-center">{category.name}</span>
    </Link>
  );
};

export default CategoryCard;

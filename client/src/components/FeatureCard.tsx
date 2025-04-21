import { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  bgColor: string;
  textColor: string;
}

const FeatureCard = ({ icon, title, description, bgColor, textColor }: FeatureCardProps) => {
  return (
    <div className="flex items-center p-4 bg-white rounded-lg shadow-sm">
      <div className={`w-12 h-12 flex items-center justify-center rounded-full ${bgColor} mr-4`}>
        <div className={textColor}>{icon}</div>
      </div>
      <div>
        <h3 className="font-medium text-gray-800 mb-1">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  );
};

export default FeatureCard;

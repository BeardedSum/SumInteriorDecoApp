import React, { useEffect } from 'react';
import { Check, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import type { StylePreset } from '../../types';
import { useGenerationStore } from '../../store/generationStore';
import { Card, Loading } from '../ui';

export interface StylePickerProps {
  onStyleSelect?: (style: StylePreset) => void;
  selectedStyleId?: string | null;
  category?: string;
  className?: string;
}

export const StylePicker: React.FC<StylePickerProps> = ({
  onStyleSelect,
  selectedStyleId,
  category,
  className,
}) => {
  const { styles, selectedStyle, fetchStyles, setSelectedStyle } = useGenerationStore();

  useEffect(() => {
    if (styles.length === 0) {
      fetchStyles();
    }
  }, []);

  const filteredStyles = category
    ? styles.filter((s) => s.category === category)
    : styles;

  const handleStyleSelect = (style: StylePreset) => {
    setSelectedStyle(style);
    onStyleSelect?.(style);
  };

  if (styles.length === 0) {
    return <Loading text="Loading styles..." />;
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Category Pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'african', 'luxury', 'modern', 'traditional', 'eclectic', 'retro'].map((cat) => (
          <button
            key={cat}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
              category === cat || (cat === 'all' && !category)
                ? 'bg-primary-navy text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
            onClick={() => {
              // This would be handled by parent component
            }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Styles Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredStyles.map((style) => {
          const isSelected = selectedStyleId
            ? style.id === selectedStyleId
            : selectedStyle?.id === style.id;

          return (
            <motion.div
              key={style.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={cn(
                  'cursor-pointer transition-all relative overflow-hidden',
                  isSelected && 'ring-4 ring-secondary-accent-blue'
                )}
                onClick={() => handleStyleSelect(style)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                  {style.thumbnail_url ? (
                    <img
                      src={style.thumbnail_url}
                      alt={style.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-4xl">🎨</span>
                    </div>
                  )}

                  {/* Premium Badge */}
                  {style.is_premium && (
                    <div className="absolute top-2 right-2 bg-secondary-luxury-purple text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs">
                      <Crown className="w-3 h-3" />
                      <span>Pro</span>
                    </div>
                  )}

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-secondary-accent-blue/20 flex items-center justify-center">
                      <div className="bg-secondary-accent-blue rounded-full p-2">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Style Info */}
                <div>
                  <h4 className="font-semibold text-sm mb-1">{style.name}</h4>
                  {style.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {style.description}
                    </p>
                  )}

                  {/* Popularity */}
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <span>⭐</span>
                    <span>{style.popularity}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredStyles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No styles found in this category</p>
        </div>
      )}
    </div>
  );
};

export default StylePicker;

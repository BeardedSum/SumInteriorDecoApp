import React from 'react';
import ReactCompareImage from 'react-compare-image';
import { Download, Share2, Heart } from 'lucide-react';
import { Button, Card } from '../ui';
import { cn } from '../../utils/cn';

export interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  onDownload?: () => void;
  onShare?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  onDownload,
  onShare,
  onFavorite,
  isFavorite = false,
  className,
}) => {
  const handleDownload = () => {
    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = afterImage;
    link.download = `sum-decor-design-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onDownload?.();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        // Fetch the image as a blob
        const response = await fetch(afterImage);
        const blob = await response.blob();
        const file = new File([blob], 'design.jpg', { type: 'image/jpeg' });

        await navigator.share({
          title: 'My Sum Decor AI Design',
          text: 'Check out my AI-generated interior design!',
          files: [file],
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to copy link
        navigator.clipboard.writeText(afterImage);
        alert('Link copied to clipboard!');
      }
    } else {
      // Fallback for desktop
      navigator.clipboard.writeText(afterImage);
      alert('Link copied to clipboard!');
    }
    onShare?.();
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent('Check out my AI-generated interior design from Sum Decor AI!');
    const url = encodeURIComponent(afterImage);
    window.open(`https://wa.me/?text=${message} ${url}`, '_blank');
    onShare?.();
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Comparison Slider */}
      <div className="relative aspect-[4/3] bg-gray-100">
        <ReactCompareImage
          leftImage={beforeImage}
          rightImage={afterImage}
          sliderLineColor="#42c3f7"
          sliderLineWidth={4}
          handleSize={48}
          hover={true}
        />

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
          Before
        </div>
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
          After
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 flex flex-wrap gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={handleDownload}
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleShare}
          className="flex-1"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleWhatsAppShare}
          className="bg-[#25d366] text-white hover:bg-[#20bd5a]"
        >
          <span className="text-lg mr-2">💬</span>
          WhatsApp
        </Button>

        {onFavorite && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onFavorite}
            className={cn(
              isFavorite && 'text-error'
            )}
          >
            <Heart
              className={cn('w-4 h-4', isFavorite && 'fill-current')}
            />
          </Button>
        )}
      </div>
    </Card>
  );
};

export default BeforeAfterSlider;

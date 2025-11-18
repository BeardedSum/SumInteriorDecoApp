import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui';

export interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onImageRemove?: () => void;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
  preview?: string | null;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onImageRemove,
  maxSize = 10,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  preview,
  className,
}) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(`File is too large. Maximum size is ${maxSize}MB`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('Invalid file type. Please upload a JPEG, PNG, or WebP image');
        } else {
          setError('Failed to upload file');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        onImageSelect(acceptedFiles[0]);
      }
    },
    [maxSize, onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => ({ ...acc, [format]: [] }), {}),
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    multiple: false,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    onImageRemove?.();
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer',
          isDragActive
            ? 'border-secondary-accent-blue bg-blue-50'
            : 'border-gray-300 hover:border-secondary-accent-blue hover:bg-gray-50',
          error && 'border-error bg-red-50'
        )}
      >
        <input {...getInputProps()} />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            {onImageRemove && (
              <Button
                variant="danger"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="p-4 bg-gray-100 rounded-full">
              {isDragActive ? (
                <Upload className="w-8 h-8 text-secondary-accent-blue animate-bounce" />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>

            <div>
              <p className="text-lg font-semibold text-gray-900 mb-1">
                {isDragActive ? 'Drop your image here' : 'Upload an image'}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-2">
                JPEG, PNG, WebP (max {maxSize}MB)
              </p>
            </div>

            <Button variant="accent" size="sm" type="button">
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-error">{error}</p>
      )}
    </div>
  );
};

export default ImageUpload;

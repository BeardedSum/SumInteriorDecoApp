import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Wand2 } from 'lucide-react';
import { useGenerationStore } from '../store/generationStore';
import { useAuthStore } from '../store/authStore';
import { Button, Card } from '../components/ui';
import { ImageUpload } from '../components/features/ImageUpload';
import { StylePicker } from '../components/features/StylePicker';
import { GenerationOverlay } from '../components/features/GenerationOverlay';
import type { GenerationMode, StylePreset } from '../types';
import { toast } from 'react-toastify';

export const Create: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuthStore();
  const { generateImage, isGenerating, progress, currentJob, clearCurrentJob } = useGenerationStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(null);
  const [mode, setMode] = useState<GenerationMode>(
    (searchParams.get('mode') as GenerationMode) || '2d_redesign'
  );
  const [creativeFreedom, setCreativeFreedom] = useState(0.5);

  const modes = [
    { id: '3d_vision', name: '3D Vision', description: 'Maintains structure', cost: 1 },
    { id: '2d_redesign', name: '2D Redesign', description: 'Flexible changes', cost: 1 },
    { id: 'virtual_staging', name: 'Virtual Staging', description: 'Fill empty rooms', cost: 2 },
    { id: 'freestyle', name: 'Freestyle', description: 'From scratch', cost: 1 },
  ];

  useEffect(() => {
    // Create preview URL when file is selected
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const handleGenerate = async () => {
    if (!selectedFile) {
      toast.error('Please upload an image');
      return;
    }

    if (!selectedStyle) {
      toast.error('Please select a style');
      return;
    }

    // Check credits
    const cost = modes.find(m => m.id === mode)?.cost || 1;
    if (user && user.credits_balance < cost) {
      toast.error('Insufficient credits. Please purchase more.');
      navigate('/account');
      return;
    }

    try {
      await generateImage({
        mode,
        inputImage: selectedFile,
        stylePresetId: selectedStyle.id,
        creativeFreedom,
      });

      // Deduct credits locally (will be synced from server)
      if (user) {
        updateUser({ credits_balance: user.credits_balance - cost });
      }

      toast.success('Generation started!');
    } catch (error: any) {
      toast.error(error.message || 'Generation failed');
    }
  };

  const handleViewResult = () => {
    if (currentJob?.output_image_url) {
      clearCurrentJob();
      navigate('/projects');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-montserrat font-bold">Create Design</h1>
          <p className="text-gray-600">Transform your space with AI</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Upload & Mode */}
        <div className="space-y-6">
          {/* Image Upload */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">1. Upload Image</h2>
            <ImageUpload
              onImageSelect={setSelectedFile}
              onImageRemove={() => setSelectedFile(null)}
              preview={previewUrl}
            />
          </Card>

          {/* Mode Selection */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">2. Select Mode</h2>
            <div className="grid grid-cols-2 gap-3">
              {modes.map((m) => (
                <button
                  key={m.id}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    mode === m.id
                      ? 'border-secondary-accent-blue bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setMode(m.id as GenerationMode)}
                >
                  <div className="font-semibold mb-1">{m.name}</div>
                  <div className="text-xs text-gray-600 mb-2">{m.description}</div>
                  <div className="text-xs font-medium text-secondary-accent-blue">
                    {m.cost} credit{m.cost > 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Creative Freedom */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">3. Creative Freedom</h2>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={creativeFreedom}
              onChange={(e) => setCreativeFreedom(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Faithful</span>
              <span className="font-semibold">{Math.round(creativeFreedom * 100)}%</span>
              <span>Creative</span>
            </div>
          </Card>
        </div>

        {/* Right Column - Style Selection */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold mb-4">4. Choose Style</h2>
            <StylePicker
              onStyleSelect={setSelectedStyle}
              selectedStyleId={selectedStyle?.id}
            />
          </Card>

          {/* Generate Button */}
          <Button
            variant="premium"
            size="lg"
            fullWidth
            onClick={handleGenerate}
            disabled={!selectedFile || !selectedStyle || isGenerating}
          >
            <Wand2 className="w-5 h-5 mr-2" />
            Generate Design
          </Button>
        </div>
      </div>

      {/* Generation Overlay */}
      <GenerationOverlay
        isOpen={isGenerating || currentJob?.status === 'completed'}
        progress={progress}
        status={
          currentJob?.status === 'completed' ? 'complete' :
          currentJob?.status === 'failed' ? 'error' :
          isGenerating ? 'processing' : 'idle'
        }
        error={currentJob?.error_message || undefined}
        onClose={handleViewResult}
      />
    </div>
  );
};

export default Create;

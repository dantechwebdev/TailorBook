/**
 * Mock Image Provider
 *
 * Always available. Returns placeholder images so TailorStudio and the
 * design preview tool behave realistically without requiring an image-gen
 * API key. Mirrors mock.provider.ts's role for text completion.
 */

import { IImageProvider } from '../../ImageGenerationService';
import { ImageGenerationRequest, ImageGenerationResult, GeneratedImage } from '../../../../types';

const PLACEHOLDER_POOL = [
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80',
  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80',
  'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80',
  'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80',
  'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800&q=80',
];

export class MockImageProvider implements IImageProvider {
  readonly name = 'mock-image' as const;

  isAvailable(): boolean {
    return true;
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    await new Promise((resolve) => setTimeout(resolve, 900));

    const count = Math.min(Math.max(request.count ?? 1, 1), 4);
    const images: GeneratedImage[] = Array.from({ length: count }, (_, i) => ({
      id: `mockimg_${Date.now()}_${i}`,
      uri: PLACEHOLDER_POOL[(Date.now() + i) % PLACEHOLDER_POOL.length],
      prompt: request.prompt,
      provider: 'mock-image',
      createdAt: new Date().toISOString(),
    }));

    return { success: true, images };
  }
}

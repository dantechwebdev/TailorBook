/**
 * Gemini Image Provider
 *
 * Google Gemini (Imagen) integration for TailorBook design concepts.
 *
 * TO ACTIVATE:
 *   1. npm install @google/generative-ai
 *   2. Set EXPO_PUBLIC_GEMINI_API_KEY in your .env (shared with the text provider)
 *   3. Set EXPO_PUBLIC_IMAGE_PROVIDER=gemini-image in your .env
 *   4. Uncomment the implementation below
 *
 * Mirrors gemini.provider.ts's activation pattern exactly.
 */

import { IImageProvider } from '../../ImageGenerationService';
import { ImageGenerationRequest, ImageGenerationResult } from '../../../../types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const MODEL = 'imagen-3.0-generate-001';

export class GeminiImageProvider implements IImageProvider {
  readonly name = 'gemini-image' as const;

  isAvailable(): boolean {
    return API_KEY.length > 0;
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key not configured');
    }

    // ── Activate with @google/generative-ai ──────────────────────────────
    // import { GoogleGenerativeAI } from '@google/generative-ai';
    //
    // const client = new GoogleGenerativeAI(API_KEY);
    // const model = client.getGenerativeModel({ model: MODEL });
    //
    // const result = await model.generateImages({
    //   prompt: request.prompt,
    //   numberOfImages: request.count ?? 1,
    //   aspectRatio: request.aspectRatio ?? '3:4',
    // });
    //
    // const images = result.images.map((img, i) => ({
    //   id: `gemini_${Date.now()}_${i}`,
    //   uri: img.uri,
    //   prompt: request.prompt,
    //   provider: 'gemini-image' as const,
    //   createdAt: new Date().toISOString(),
    // }));
    //
    // return { success: true, images };

    throw new Error('Gemini image provider: uncomment the implementation above after installing @google/generative-ai');
  }
}

/**
 * Gemini Image Provider
 *
 * Generates garment design concept images using Google's
 * gemini-2.0-flash-exp-image-generation model. The model returns inline
 * base64 image data which we convert to data URIs for display in the app.
 *
 * Activated automatically when EXPO_PUBLIC_GEMINI_API_KEY is set and
 * EXPO_PUBLIC_IMAGE_PROVIDER=gemini-image.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { IImageProvider } from '../../ImageGenerationService';
import { ImageGenerationRequest, ImageGenerationResult, GeneratedImage } from '../../../../types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const MODEL = 'gemini-2.0-flash-exp-image-generation';

export class GeminiImageProvider implements IImageProvider {
  readonly name = 'gemini-image' as const;

  private client: GoogleGenerativeAI | null = null;

  isAvailable(): boolean {
    return API_KEY.length > 0;
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key not configured');
    }

    if (!this.client) {
      this.client = new GoogleGenerativeAI(API_KEY);
    }

    const model = this.client.getGenerativeModel({
      model: MODEL,
      // @ts-ignore — responseModalities is supported by this model but not yet
      // typed in all SDK versions
      generationConfig: { responseModalities: ['image', 'text'] } as any,
    });

    const count = Math.min(Math.max(request.count ?? 1, 1), 4);
    const images: GeneratedImage[] = [];

    // The model generates one image per call; run sequentially to respect
    // the requested count without overwhelming the API.
    for (let i = 0; i < count; i++) {
      try {
        const result = await model.generateContent(request.prompt);
        const parts = result.response.candidates?.[0]?.content?.parts ?? [];

        for (const part of parts) {
          if ((part as any).inlineData) {
            const { data, mimeType } = (part as any).inlineData as {
              data: string;
              mimeType: string;
            };
            images.push({
              id: `gemini_${Date.now()}_${i}`,
              uri: `data:${mimeType};base64,${data}`,
              prompt: request.prompt,
              provider: 'gemini-image',
              createdAt: new Date().toISOString(),
            });
            break; // one image per call
          }
        }
      } catch (err) {
        // Partial failure — return what we have so far rather than crashing
        if (images.length > 0) break;
        throw err;
      }
    }

    if (images.length === 0) {
      return {
        success: false,
        images: [],
        error: 'No images returned by Gemini. The model may not support image generation on this account.',
      };
    }

    return { success: true, images };
  }
}

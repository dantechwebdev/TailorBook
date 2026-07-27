/**
 * ImageGenerationService
 *
 * Mirrors AIService's provider-agnostic architecture exactly, but for image
 * generation instead of text completion. The AI never generates images
 * itself — it invokes GenerateDesignPreviewTool, which calls this service,
 * which delegates to whichever provider is active (Mock/Gemini/OpenAI).
 *
 * Switching image providers requires zero changes to the tool or the AI
 * orchestrator — only a new provider file plus one registration line, same
 * as AIService's text-completion providers.
 */

import { ImageGenerationRequest, ImageGenerationResult, ImageProviderName } from '../../types';
import { createLogger } from '../../utils/logger';

const log = createLogger('ImageGenerationService');

// ─── Provider Interface ────────────────────────────────────────────────────────

export interface IImageProvider {
  readonly name: ImageProviderName;
  isAvailable(): boolean;
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}

// ─── Provider Registry ─────────────────────────────────────────────────────────

class ImageProviderRegistry {
  private providers: Map<ImageProviderName, IImageProvider> = new Map();
  private preferred: ImageProviderName = 'mock-image';

  register(provider: IImageProvider): void {
    this.providers.set(provider.name, provider);
    log.debug(`Registered image provider: ${provider.name}`);
  }

  setPreferred(name: ImageProviderName): void {
    this.preferred = name;
  }

  getActive(): IImageProvider {
    const preferred = this.providers.get(this.preferred);
    if (preferred?.isAvailable()) return preferred;

    for (const [, provider] of this.providers) {
      if (provider.name !== 'mock-image' && provider.isAvailable()) return provider;
    }

    const mock = this.providers.get('mock-image');
    if (mock) return mock;

    throw new Error('No image provider registered. Did you call imageGenerationService.initialize()?');
  }
}

export const imageProviderRegistry = new ImageProviderRegistry();

// ─── Service ───────────────────────────────────────────────────────────────────

class ImageGenerationService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const { MockImageProvider } = await import('./providers/image/mock.image.provider');
    imageProviderRegistry.register(new MockImageProvider());

    try {
      const { GeminiImageProvider } = await import('./providers/image/gemini.image.provider');
      imageProviderRegistry.register(new GeminiImageProvider());
    } catch {
      // Package/key not available — skip silently, mock remains the fallback
    }

    const envProvider = process.env.EXPO_PUBLIC_IMAGE_PROVIDER as ImageProviderName | undefined;
    if (envProvider) imageProviderRegistry.setPreferred(envProvider);

    this.initialized = true;
    log.info(`Image generation initialized. Active provider: ${imageProviderRegistry.getActive().name}`);
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!this.initialized) await this.initialize();

    const provider = imageProviderRegistry.getActive();
    log.debug(`Image generation via ${provider.name}`, { prompt: request.prompt });

    try {
      return await provider.generate(request);
    } catch (err) {
      log.warn('Image generation failed, falling back to mock', err);
      const { MockImageProvider } = await import('./providers/image/mock.image.provider');
      return new MockImageProvider().generate(request);
    }
  }

  get isRealProviderAvailable(): boolean {
    if (!this.initialized) return false;
    return imageProviderRegistry.getActive().name !== 'mock-image';
  }
}

export const imageGenerationService = new ImageGenerationService();

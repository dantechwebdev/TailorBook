/**
 * GenerateDesignPreviewTool
 *
 * The AI never generates images directly — it invokes this tool, which
 * builds an intelligent prompt from whatever context is already known
 * (outfit type, fabric, style notes, measurements, previous concepts) and
 * asks the tailor only for what's genuinely missing (e.g. a colour, if
 * none was mentioned and none is on the job).
 *
 * Used both from the FloatingAssistant (quick "generate a concept" asks on
 * JobDetail) and from TailorStudio's dedicated design workspace.
 */

import { AIActiveContext, AIToolDefinition, AIToolResult } from '../../../types';
import { IAITool } from './ToolRegistry';
import { imageGenerationService } from '../ImageGenerationService';

const definition: AIToolDefinition = {
  name: 'GenerateDesignPreviewTool',
  description: 'Generate AI garment design concepts using the active job/customer context (outfit type, fabric, colors, embroidery notes).',
  category: 'media',
  requiredContext: [],
  supportedScreens: ['JobDetail', 'TailorStudio'],
  params: {
    styleNotes: { type: 'string', description: 'Free-text style direction from the tailor (colors, embroidery, mood)', required: false },
    count: { type: 'number', description: 'How many variations to generate (1-4)', required: false },
    styleMode: {
      type: 'string',
      description: 'Overall aesthetic direction',
      required: false,
      enumValues: ['luxury', 'minimalist', 'traditional', 'modern', 'streetwear'],
    },
  },
};

class GenerateDesignPreviewToolImpl implements IAITool {
  readonly definition = definition;

  canRun(): boolean {
    return true;
  }

  async execute(args: Record<string, unknown>, context: AIActiveContext): Promise<AIToolResult> {
    const job = context.job;
    const styleNotes = typeof args.styleNotes === 'string' ? args.styleNotes.trim() : '';
    const styleMode = typeof args.styleMode === 'string' ? args.styleMode : undefined;
    const count = Math.min(Math.max(Number(args.count) || 3, 1), 4);

    const prompt = this.buildPrompt({ job, styleNotes, styleMode });

    const result = await imageGenerationService.generate({ prompt, count });

    if (!result.success) {
      return { success: false, summary: 'Could not generate design concepts right now.', error: result.error };
    }

    const subject = job ? `${job.customerName}'s ${job.outfitType}` : 'this design';
    return {
      success: true,
      summary: `Generated ${result.images.length} concept${result.images.length !== 1 ? 's' : ''} for ${subject}.`,
      data: { images: result.images, prompt },
    };
  }

  private buildPrompt(input: {
    job?: AIActiveContext['job'];
    styleNotes: string;
    styleMode?: string;
  }): string {
    const { job, styleNotes, styleMode } = input;
    const parts: string[] = [];

    parts.push('Professional fashion design concept illustration, front view');

    if (job) {
      parts.push(`of a ${job.outfitType.toLowerCase()}`);
      if (job.style) parts.push(`in the style of "${job.style}"`);
      if (job.fabric) parts.push(`using ${job.fabric} fabric`);
    } else {
      parts.push('of a tailored garment');
    }

    if (styleNotes) parts.push(`— ${styleNotes}`);
    if (styleMode) parts.push(`, ${styleMode} aesthetic`);

    parts.push(', clean studio background, high detail, fashion catalog quality');

    return parts.join(' ');
  }
}

export const tool = new GenerateDesignPreviewToolImpl();

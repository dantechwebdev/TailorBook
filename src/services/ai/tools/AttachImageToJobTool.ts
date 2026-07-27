/**
 * AttachImageToJobTool
 *
 * Attaches an image to the active job's categorized gallery (Customer Photos,
 * Reference Images, AI Generated Concepts, Approved Designs, Production
 * Photos, Final Delivery Photos). This is the tool that TailorStudio's
 * "Save to Job" action calls under the hood — the AI never manipulates the
 * database directly, even from Studio.
 */

import { AIActiveContext, AIToolDefinition, AIToolResult, JobImageCategory } from '../../../types';
import { IAITool } from './ToolRegistry';
import * as db from '../../../utils/database';

const definition: AIToolDefinition = {
  name: 'AttachImageToJobTool',
  description: "Save an image into the active job's gallery under a specific category.",
  category: 'media',
  requiredContext: ['job'],
  supportedScreens: ['JobDetail', 'TailorStudio'],
  params: {
    uri: { type: 'string', description: 'Local or remote URI of the image', required: true },
    category: {
      type: 'string',
      description: 'Which gallery to save into',
      required: true,
      enumValues: ['customer_photo', 'reference', 'ai_concept', 'approved_design', 'production_photo', 'final_delivery'],
    },
    caption: { type: 'string', description: 'Optional caption', required: false },
    sourceConceptId: { type: 'string', description: 'If saved from a Studio concept, its id', required: false },
  },
};

const VALID_CATEGORIES: JobImageCategory[] = [
  'customer_photo', 'reference', 'ai_concept', 'approved_design', 'production_photo', 'final_delivery',
];

const CATEGORY_LABELS: Record<JobImageCategory, string> = {
  customer_photo: 'Customer Photos',
  reference: 'Reference Images',
  ai_concept: 'AI Generated Concepts',
  approved_design: 'Approved Designs',
  production_photo: 'Production Photos',
  final_delivery: 'Final Delivery Photos',
};

class AttachImageToJobToolImpl implements IAITool {
  readonly definition = definition;

  canRun(context: AIActiveContext): boolean {
    return !!context.job;
  }

  async execute(args: Record<string, unknown>, context: AIActiveContext): Promise<AIToolResult> {
    const job = context.job;
    if (!job) {
      return { success: false, summary: 'No active job to attach an image to.', error: 'MISSING_CONTEXT' };
    }

    const uri = String(args.uri ?? '').trim();
    const category = String(args.category ?? '') as JobImageCategory;

    if (!uri) {
      return { success: false, summary: 'No image URI provided.', error: 'MISSING_PARAM' };
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return { success: false, summary: `Unrecognized image category "${args.category}".`, error: 'INVALID_PARAM' };
    }

    const image = {
      id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      jobId: job.id,
      category,
      uri,
      caption: typeof args.caption === 'string' ? args.caption : undefined,
      sourceConceptId: typeof args.sourceConceptId === 'string' ? args.sourceConceptId : undefined,
      createdAt: new Date().toISOString(),
    };

    await db.addJobImage(image);

    return {
      success: true,
      summary: `Saved to ${CATEGORY_LABELS[category]} for ${job.customerName}'s ${job.outfitType}.`,
      data: { image },
    };
  }
}

export const tool = new AttachImageToJobToolImpl();

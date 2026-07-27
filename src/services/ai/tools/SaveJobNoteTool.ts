/**
 * SaveJobNoteTool
 *
 * Appends a timestamped note to the active job's notes field. Preserves
 * whatever notes already exist rather than overwriting them, so a tailor
 * can build up a running log through conversation ("note that she wants
 * the sleeves shorter").
 */

import { AIActiveContext, AIToolDefinition, AIToolResult } from '../../../types';
import { IAITool } from './ToolRegistry';
import { useStore } from '../../../context/store';
import { formatDate } from '../../../utils/helpers';

const definition: AIToolDefinition = {
  name: 'SaveJobNoteTool',
  description: "Append a note to the active job's notes (e.g. alteration requests, style preferences).",
  category: 'note',
  requiredContext: ['job'],
  supportedScreens: ['JobDetail', 'Measurements'],
  params: {
    note: { type: 'string', description: 'The note text to save', required: true },
  },
};

class SaveJobNoteToolImpl implements IAITool {
  readonly definition = definition;

  canRun(context: AIActiveContext): boolean {
    return !!context.job;
  }

  async execute(args: Record<string, unknown>, context: AIActiveContext): Promise<AIToolResult> {
    const job = context.job;
    if (!job) {
      return { success: false, summary: 'No active job to add a note to.', error: 'MISSING_CONTEXT' };
    }

    const note = String(args.note ?? '').trim();
    if (!note) {
      return { success: false, summary: 'No note text provided.', error: 'MISSING_PARAM' };
    }

    const stamped = `[${formatDate(new Date().toISOString())}] ${note}`;
    const combinedNotes = job.notes ? `${job.notes}\n${stamped}` : stamped;

    const { updateJob } = useStore.getState();
    await updateJob({ ...job, notes: combinedNotes });

    return {
      success: true,
      summary: `Noted: "${note}"`,
      data: { note: stamped },
    };
  }
}

export const tool = new SaveJobNoteToolImpl();

/**
 * ValidateMeasurementsTool
 *
 * Checks the active customer's most recent measurements for the job's
 * outfit-type template: flags missing required fields and values outside
 * plausible human ranges (catching data-entry mistakes like a chest of "3.5"
 * where "35" was meant). This is the kind of sanity-check a careful
 * employee does automatically — not something the tailor should have to ask
 * for explicitly every time.
 */

import { AIActiveContext, AIToolDefinition, AIToolResult } from '../../../types';
import { IAITool } from './ToolRegistry';
import { MEASUREMENT_FIELDS, TEMPLATE_LABELS } from '../../../constants/theme';

const definition: AIToolDefinition = {
  name: 'ValidateMeasurementsTool',
  description: "Check the active customer's measurements for missing fields or implausible values.",
  category: 'estimation',
  requiredContext: ['measurements'],
  supportedScreens: ['Measurements', 'JobDetail'],
  params: {},
};

const PLAUSIBLE_RANGE: [number, number] = [8, 70];

class ValidateMeasurementsToolImpl implements IAITool {
  readonly definition = definition;

  canRun(context: AIActiveContext): boolean {
    return !!context.measurements && context.measurements.length > 0;
  }

  async execute(_args: Record<string, unknown>, context: AIActiveContext): Promise<AIToolResult> {
    const measurementSet = context.measurements?.[0];
    if (!measurementSet) {
      return { success: false, summary: 'No measurements on file to check.', error: 'MISSING_CONTEXT' };
    }

    const templateKey = measurementSet.template as keyof typeof MEASUREMENT_FIELDS;
    const expectedFields = MEASUREMENT_FIELDS[templateKey] ?? [];
    const templateLabel = TEMPLATE_LABELS[measurementSet.template] ?? measurementSet.template;

    const missing: string[] = [];
    const suspicious: string[] = [];

    for (const field of expectedFields) {
      const raw = measurementSet.data[field.key];
      if (!raw || raw.trim() === '') {
        missing.push(field.label);
        continue;
      }
      const value = parseFloat(raw);
      if (isNaN(value) || value < PLAUSIBLE_RANGE[0] || value > PLAUSIBLE_RANGE[1]) {
        suspicious.push(`${field.label} (${raw}${field.unit})`);
      }
    }

    if (missing.length === 0 && suspicious.length === 0) {
      return {
        success: true,
        summary: `All ${templateLabel} measurements look complete and within a normal range.`,
        data: { valid: true },
      };
    }

    const parts: string[] = [];
    if (missing.length > 0) parts.push(`missing ${missing.join(', ')}`);
    if (suspicious.length > 0) parts.push(`double-check ${suspicious.join(', ')} — looks unusual`);

    return {
      success: true,
      summary: `${templateLabel} measurements: ${parts.join('; ')}.`,
      data: { valid: false, missing, suspicious },
    };
  }
}

export const tool = new ValidateMeasurementsToolImpl();

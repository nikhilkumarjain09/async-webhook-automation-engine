import { Injectable } from '@nestjs/common';
import { AutomationRule } from './schemas/automation-rule.schema';
import { AppLogger } from '../common/logger/logger.service';

@Injectable()
export class RulesEngineService {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext('RulesEngine');
  }

  filterMatchingRules(payload: Record<string, any>, rules: AutomationRule[]): AutomationRule[] {
    this.logger.log(`Evaluating rules matching count: ${rules.length}`);
    const matched = rules.filter((rule) => this.evaluateRule(payload, rule));
    this.logger.log(`Matching rules evaluation complete. Matched: ${matched.length}/${rules.length}`);
    return matched;
  }

  evaluateRule(payload: Record<string, any>, rule: AutomationRule): boolean {
    const conditions = rule.conditions;
    if (!conditions || conditions.length === 0) {
      return true;
    }

    return conditions.every((cond) => {
      // Strip 'payload.' prefix if present to match nested paths in payload directly
      const fieldPath = cond.field.startsWith('payload.')
        ? cond.field.substring(8)
        : cond.field;

      const actualValue = this.getValueByPath(payload, fieldPath);
      const expectedValue = cond.value;

      this.logger.debug(`Evaluating condition: path '${fieldPath}' (${actualValue}) ${cond.operator} expected '${expectedValue}'`);

      switch (cond.operator) {
        case 'equals':
          return String(actualValue) === String(expectedValue);
        case 'greaterThan':
          return Number(actualValue) > Number(expectedValue);
        case 'contains':
          return (
            typeof actualValue === 'string' &&
            actualValue.toLowerCase().includes(String(expectedValue).toLowerCase())
          );
        default:
          this.logger.warn(`Unsupported rule operator: ${cond.operator}`);
          return false;
      }
    });
  }

  private getValueByPath(obj: any, path: string): any {
    if (!obj) return undefined;
    return path.split('.').reduce((acc, part) => {
      if (acc === undefined || acc === null) return undefined;
      return acc[part];
    }, obj);
  }
}

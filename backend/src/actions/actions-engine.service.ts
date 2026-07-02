import { Injectable } from '@nestjs/common';
import { AppLogger } from '../common/logger/logger.service';
import {
  RetryableActionException,
  NonRetryableActionException,
} from './exceptions/action.exceptions';

@Injectable()
export class ActionsEngineService {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext('ActionsEngine');
  }

  async execute(actionType: string, config: any, payload: any): Promise<any> {
    this.logger.log(`Starting execution of action '${actionType}'`);

    switch (actionType) {
      case 'http_call':
        return this.executeHttpCall(config);
      case 'email_send':
        return this.executeEmailSend(config);
      case 'slack_notify':
      case 'db_operation':
        return this.executeMockAction(actionType, config);
      default:
        throw new NonRetryableActionException(`Unsupported action type: '${actionType}'`);
    }
  }

  private async executeHttpCall(config: any): Promise<any> {
    const url = config.url || '';
    const method = (config.method || 'POST').toUpperCase();
    const headers = config.headers || {};
    const body = config.body || {};

    if (!url) {
      throw new NonRetryableActionException('HTTP outbound URL config is missing');
    }

    this.logger.log(`Outbound HTTP webhook: dispatching ${method} request to ${url}`);

    try {
      // Execute actual HTTP outbound call using built-in fetch (Node 18+)
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(body) : undefined,
      });

      const responseText = await response.text();
      let responseBody: any = responseText;
      try {
        responseBody = JSON.parse(responseText);
      } catch {}

      this.logger.log(`Outbound HTTP webhook response status: ${response.status}`);

      if (!response.ok) {
        const errorMsg = `HTTP call failed with status ${response.status}: ${JSON.stringify(responseBody)}`;

        // Throw retryable errors for transient server errors (500s or gateway timeouts)
        if (response.status >= 500) {
          throw new RetryableActionException(errorMsg);
        }
        
        // Throw permanent non-retryable errors for client configuration errors (400s)
        throw new NonRetryableActionException(errorMsg);
      }

      return {
        status: response.status,
        statusText: response.statusText,
        body: responseBody,
      };
    } catch (error: any) {
      if (
        error instanceof RetryableActionException ||
        error instanceof NonRetryableActionException
      ) {
        throw error;
      }
      
      // Treat network timeouts or host resolution exceptions as retryable
      this.logger.warn(`Network connection error calling ${url}: ${error.message}`);
      throw new RetryableActionException(`Network error: ${error.message}`);
    }
  }

  private async executeEmailSend(config: any): Promise<any> {
    const to = config.to || '';
    const subject = config.subject || '';
    const body = config.body || '';

    if (!to) {
      throw new NonRetryableActionException("Email destination address 'to' is missing");
    }

    this.logger.log(`Mock Email dispatch: sending mail to '${to}', subject: '${subject}'`);

    // Testing stubs: trigger specific errors depending on recipient string
    if (to.includes('fail')) {
      this.logger.error(`Simulated permanent email failure to address: ${to}`);
      throw new NonRetryableActionException(`Permanent failure: Invalid destination address '${to}'`);
    }

    if (to.includes('retry')) {
      this.logger.warn(`Simulated transient email failure to address: ${to}`);
      throw new RetryableActionException(`Transient failure: SMTP server temporary timeout for '${to}'`);
    }

    return {
      success: true,
      to,
      subject,
      timestamp: new Date().toISOString(),
    };
  }

  private async executeMockAction(actionType: string, config: any): Promise<any> {
    this.logger.log(`Simulated execution of mock action type '${actionType}'`);
    return {
      simulated: true,
      actionType,
      timestamp: new Date().toISOString(),
    };
  }
}

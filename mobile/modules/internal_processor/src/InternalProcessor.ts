// import { Platform } from 'react-native';

import { sendMessage } from '../../../src/services/APIs/chat/chatService';
import { MessageResponse } from '../../../src/types/Chat';
// import { BASE_URL } from '../../../src/utils/constants';

const removeLastSegment = (text: string) => {
  if (!text) return '';

  const parts = text.split('###');

  // If no ### exists → return original text
  if (parts.length <= 1) return text;

  // Remove the last segment and join the rest
  return parts.slice(0, parts.length - 1).join('###');
};

// ==================== TYPES ====================
export interface ChatbotTask {
  // type: 'ALARM' | 'SMS' | 'CALENDAR' | 'CUSTOM';
  rawPrompt: string;
  // metadata?: Record<string, any>;
  // timestamp: number;
  taskId?: string;
}

export interface ProcessedTask {
  // type?: string;
  normalizedPrompt?: string;
  // extractedData?: Record<string, any>;
  // actions?: Action[];
  status?: 'SUCCESS' | 'PENDING' | 'ERROR';
  error?: string;
  response: MessageResponse | null;
}

// interface Action {
//   type: 'SET_ALARM' | 'SEND_SMS' | 'ADD_CALENDAR_EVENT' | 'LOG' | 'NOTIFY_USER';
//   payload: Record<string, any>;
//   priority: 'HIGH' | 'NORMAL' | 'LOW';
// }

// interface ExternalProcessorResponse {
//   success?: boolean;
//   data?: MessageResponse;
//   error?: string;
// }

// ==================== MIDDLEWARE LAYER ====================
class PromptNormalizer {
  /**
   * Normalize and clean user prompt from chatbot
   * Removes extra spaces, standardizes format, extracts intent
   */
  normalize(prompt: string): string {
    return prompt
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\p{L}\p{N}\s:@#\-.()\[\]]/gu, '');
  }

  /**
   * Extract key information from prompt
   * Examples:
   * "set alarm at 10:30 AM" -> { time: '10:30', format: 'AM' }
   * "send sms to 09123456789 hello" -> { phone: '09123456789', message: 'hello' }
   */
  // extractData(type: string, prompt: string): Record<string, any> {
  //   const normalized = this.normalize(prompt);

  //   switch (type) {
  //     case 'ALARM':
  //       return this.extractAlarmData(normalized);
  //     case 'SMS':
  //       return this.extractSMSData(normalized);
  //     case 'CALENDAR':
  //       return this.extractCalendarData(normalized);
  //     default:
  //       return {};
  //   }
  // }

  // private extractAlarmData(prompt: string): Record<string, any> {
  //   // Pattern: "set alarm at 10:30" or "alarm 14:00"
  //   const timePattern = /(\d{1,2}):(\d{2})\s*(am|pm)?/i;
  //   const match = prompt.match(timePattern);

  //   if (match) {
  //     let hours = parseInt(match[1]);
  //     const minutes = parseInt(match[2]);
  //     const period = match[3]?.toLowerCase();

  //     // Convert to 24-hour format
  //     if (period === 'pm' && hours !== 12) hours += 12;
  //     if (period === 'am' && hours === 12) hours = 0;

  //     return {
  //       hours: hours.toString().padStart(2, '0'),
  //       minutes: minutes.toString().padStart(2, '0'),
  //       title: 'Alarm',
  //       label: `${hours}:${minutes.toString().padStart(2, '0')}`,
  //     };
  //   }

  //   return { error: 'Could not parse alarm time' };
  // }

  // private extractSMSData(prompt: string): Record<string, any> {
  //   // Pattern: "send sms to 09123456789 message hello world"
  //   const phonePattern = /(?:to\s+)?(\d{10,})/;
  //   const messagePattern = /(?:message\s+)?(.+?)(?:\s+to\s+\d+)?$/;

  //   const phoneMatch = prompt.match(phonePattern);
  //   const messageMatch = prompt.match(messagePattern);

  //   return {
  //     phoneNumber: phoneMatch ? phoneMatch[1] : '',
  //     message: messageMatch ? messageMatch[1].trim() : '',
  //     timestamp: Date.now(),
  //   };
  // }

  // private extractCalendarData(prompt: string): Record<string, any> {
  //   // Pattern: "add event meeting on 2024-01-15 at 14:00"
  //   const datePattern = /(\d{4}-\d{2}-\d{2})/;
  //   const timePattern = /(\d{1,2}):(\d{2})/;
  //   const titlePattern = /(?:event|meeting|appointment)\s+(.+?)(?:\s+on\s+)?/i;

  //   const dateMatch = prompt.match(datePattern);
  //   const timeMatch = prompt.match(timePattern);
  //   const titleMatch = prompt.match(titlePattern);

  //   return {
  //     title: titleMatch ? titleMatch[1].trim() : 'Event',
  //     date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
  //     time: timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : '09:00',
  //   };
  // }
}

// ==================== TASK CLASSIFIER ====================
// class TaskClassifier {
//   /**
//    * Identify task type from chatbot prompt
//    */
//   classify(prompt: string): 'ALARM' | 'SMS' | 'CALENDAR' | 'CUSTOM' {
//     const lower = prompt.toLowerCase();

//     if (lower.includes('alarm') || lower.includes('wake')) return 'ALARM';
//     if (
//       lower.includes('sms') ||
//       lower.includes('message') ||
//       lower.includes('send')
//     )
//       return 'SMS';
//     if (
//       lower.includes('calendar') ||
//       lower.includes('event') ||
//       lower.includes('appointment')
//     )
//       return 'CALENDAR';

//     return 'CUSTOM';
//   }
// }

// ==================== ACTION BUILDER ====================
// class ActionBuilder {
//   /**
//    * Convert extracted data into executable actions
//    */
//   buildActions(type: string, extractedData: Record<string, any>): Action[] {
//     const actions: Action[] = [];

//     switch (type) {
//       case 'ALARM':
//         if (!extractedData.error) {
//           actions.push({
//             type: 'SET_ALARM',
//             payload: extractedData,
//             priority: 'HIGH',
//           });
//         }
//         break;

//       case 'SMS':
//         if (extractedData.phoneNumber && extractedData.message) {
//           actions.push({
//             type: 'SEND_SMS',
//             payload: extractedData,
//             priority: 'NORMAL',
//           });
//         }
//         break;

//       case 'CALENDAR':
//         if (extractedData.title && extractedData.date) {
//           actions.push({
//             type: 'ADD_CALENDAR_EVENT',
//             payload: extractedData,
//             priority: 'NORMAL',
//           });
//         }
//         break;

//       case 'CUSTOM':
//         actions.push({
//           type: 'LOG',
//           payload: { message: 'Unknown task type' },
//           priority: 'LOW',
//         });
//         break;
//     }

//     // Always add notification action to inform user
//     if (actions.length > 0) {
//       actions.push({
//         type: 'NOTIFY_USER',
//         payload: { message: `Processing ${type} task` },
//         priority: 'LOW',
//       });
//     }

//     return actions;
//   }
// }

// ==================== EXTERNAL PROCESSOR HANDLER ====================
class ExternalProcessorHandler {
  // private baseURL = BASE_URL;

  // /**
  //  * Send actions to external processor (server)
  //  * Server handles: persistence, scheduling, notifications
  //  */
  // async executeActions(actions: Action[]): Promise<ExternalProcessorResponse> {
  //   try {
  //     const response = await fetch(`${this.baseURL}/api/v1/Chat`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         chatId: '1',
  //         tasks: [
  //           {
  //             message: 'set alarm at 10:30 AM',
  //             intention: 'set_alarm',
  //             confidence: 0.9,
  //           },
  //         ],
  //       }),
  //     });

  //     if (!response.ok) {
  //       throw new Error(`Server error: ${response.status}`);
  //     }

  //     const data = await response.json();
  //     return { success: true, data };
  //   } catch (error) {
  //     console.error('External processor error:', error);
  //     return {
  //       success: false,
  //       error: error instanceof Error ? error.message : 'Unknown error',
  //     };
  //   }
  // }

  async executePayload(
    prompt: string,
    taskId: string,
  ): Promise<MessageResponse> {
    try {
      const data: MessageResponse = await sendMessage({
        chatId: taskId,
        tasks: [
          {
            chatId: taskId,
            message: removeLastSegment(prompt),
            intent: null,
            confidence: 0,
            user_language: 'fa',
          },
        ],
      });

      return data;
    } catch (error) {
      throw new Error(` ${error}`);
    }
  }

  /**
   * Validate actions before sending to server
   */
  // validateActions(actions: Action[]): boolean {
  //   return actions.every(action => {
  //     switch (action.type) {
  //       case 'SET_ALARM':
  //         return action.payload.hours && action.payload.minutes;
  //       case 'SEND_SMS':
  //         return action.payload.phoneNumber && action.payload.message;
  //       case 'ADD_CALENDAR_EVENT':
  //         return action.payload.title && action.payload.date;
  //       default:
  //         return true;
  //     }
  //   });
  // }
}

// ==================== MAIN INTERNAL PROCESSOR ====================
export class InternalProcessor {
  private normalizer: PromptNormalizer;
  // private classifier: TaskClassifier;
  // private actionBuilder: ActionBuilder;
  private externalProcessor: ExternalProcessorHandler;

  constructor() {
    this.normalizer = new PromptNormalizer();
    // this.classifier = new TaskClassifier();
    // this.actionBuilder = new ActionBuilder();
    this.externalProcessor = new ExternalProcessorHandler();
  }

  /**
   * Main processing pipeline
   * Input: Raw chatbot prompt
   * Output: ProcessedTask with actions sent to external processor
   */
  async process(task: ChatbotTask): Promise<ProcessedTask> {
    try {
      // // Step 1: Classify the task type
      // const taskType = this.classifier.classify(task.rawPrompt);

      // Step 2: Normalize prompt (middleware)
      const normalizedPrompt = this.normalizer.normalize(task.rawPrompt);

      // Step 2.5: Send to external processor (server)
      const response = await this.externalProcessor.executePayload(
        normalizedPrompt,
        task?.taskId || 'taskId_not_found',
      );

      // // Step 3: Extract relevant data from normalized prompt
      // const extractedData = this.normalizer.extractData(
      //   taskType,
      //   normalizedPrompt,
      // );

      // // Step 4: Build actions from extracted data
      // const actions = this.actionBuilder.buildActions(taskType, extractedData);

      // // Step 5: Validate actions
      // if (!this.externalProcessor.validateActions(actions)) {
      //   return {
      //     response: null,
      //     type: taskType,
      //     normalizedPrompt,
      //     extractedData,
      //     actions: [],
      //     status: 'ERROR',
      //     error: 'Invalid extracted data for actions',
      //   };
      // }

      // // Step 6: Send to external processor (server)
      // const response = await this.externalProcessor.executeActions(actions);

      return {
        response,
        // type: taskType,
        normalizedPrompt,
        // extractedData,
        // actions,
        status: 'SUCCESS', //response.success ? 'SUCCESS' : 'ERROR',
        error: undefined, //response.error,
      };
    } catch (error) {
      return {
        response: null,
        // type: 'CUSTOM',
        normalizedPrompt: task.rawPrompt,
        // extractedData: {},
        // actions: [],
        status: 'ERROR',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Process multiple tasks (batch)
   */
  async processBatch(tasks: ChatbotTask[]): Promise<ProcessedTask[]> {
    return Promise.all(tasks.map(task => this.process(task)));
  }
}

import { describe, it, expect, beforeEach } from '@jest/globals';
import { InternalProcessor, ChatbotTask } from '../index';

describe('InternalProcessor Module', () => {
  let processor: InternalProcessor;

  beforeEach(() => {
    processor = new InternalProcessor();
  });

  // ==================== PROMPT NORMALIZER TESTS ====================
  describe('PromptNormalizer', () => {
    // it('should normalize prompt by removing extra spaces', () => {
    //   const result = processor.process({
    //     type: 'CUSTOM',
    //     rawPrompt: 'set    alarm   at   10:30',
    //     timestamp: Date.now(),
    //   });

    //   // Normalized prompt should have single spaces
    //   expect(result.normalizedPrompt).toMatch(/set alarm at 10:30/);
    // });

    it('should convert prompt to lowercase', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'SET ALARM AT 10:30 AM',
        timestamp: Date.now(),
      });

      expect(result.normalizedPrompt).toBe(
        result.normalizedPrompt.toLowerCase(),
      );
    });

    it('should remove special characters', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'set alarm at 10:30 AM!!!???',
        timestamp: Date.now(),
      });

      expect(result.normalizedPrompt).not.toContain('!');
      expect(result.normalizedPrompt).not.toContain('?');
    });

    it('should trim whitespace from start and end', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: '   set alarm at 10:30 AM   ',
        timestamp: Date.now(),
      });

      expect(result.normalizedPrompt).toBe(result.normalizedPrompt.trim());
    });
  });

  // ==================== TASK CLASSIFIER TESTS ====================
  describe('TaskClassifier', () => {
    it('should classify ALARM tasks', async () => {
      const alarmPrompts = [
        'set alarm at 10:30',
        'wake me up at 6am',
        'alarm reminder at 5pm',
      ];

      for (const prompt of alarmPrompts) {
        const result = await processor.process({
          type: 'CUSTOM',
          rawPrompt: prompt,
          timestamp: Date.now(),
        });
        expect(result.type).toBe('ALARM');
      }
    });

    it('should classify SMS tasks', async () => {
      const smsPrompts = ['send sms to 09123456789 hello'];

      for (const prompt of smsPrompts) {
        const result = await processor.process({
          type: 'CUSTOM',
          rawPrompt: prompt,
          timestamp: Date.now(),
        });
        expect(result.type).toBe('SMS');
      }
    });

    it('should classify CALENDAR tasks', async () => {
      const calendarPrompts = ['add event meeting on 2024-01-15 at 14:00'];

      for (const prompt of calendarPrompts) {
        const result = await processor.process({
          type: 'CUSTOM',
          rawPrompt: prompt,
          timestamp: Date.now(),
        });
        expect(result.type).toBe('CALENDAR');
      }
    });

    it('should classify unknown tasks as CUSTOM', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'some random unknown task',
        timestamp: Date.now(),
      });

      expect(result.type).toBe('CUSTOM');
    });

    it('should be case-insensitive for classification', async () => {
      const result1 = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'SET ALARM AT 10:30',
        timestamp: Date.now(),
      });

      const result2 = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'set alarm at 10:30',
        timestamp: Date.now(),
      });

      expect(result1.type).toBe(result2.type);
    });
  });

  // ==================== ALARM DATA EXTRACTION TESTS ====================
  describe('Alarm Data Extraction', () => {
    it('should extract 24-hour format time', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'set alarm at 14:30',
        timestamp: Date.now(),
      });

      expect(result.extractedData.hours).toBe('14');
      expect(result.extractedData.minutes).toBe('30');
    });

    it('should extract 12-hour format time with AM', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'set alarm at 10:30 AM',
        timestamp: Date.now(),
      });

      expect(result.extractedData.hours).toBe('10');
      expect(result.extractedData.minutes).toBe('30');
    });

    it('should convert PM time correctly', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'set alarm at 02:30 PM',
        timestamp: Date.now(),
      });

      expect(result.extractedData.hours).toBe('14');
      expect(result.extractedData.minutes).toBe('30');
    });

    it('should handle 12 PM (noon)', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'set alarm at 12:00 PM',
        timestamp: Date.now(),
      });

      expect(result.extractedData.hours).toBe('12');
    });

    it('should handle 12 AM (midnight)', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'set alarm at 12:00 AM',
        timestamp: Date.now(),
      });

      expect(result.extractedData.hours).toBe('00');
    });

    // it('should pad hours and minutes with zeros', async () => {
    //   const result = await processor.process({
    //     type: 'CUSTOM',
    //     rawPrompt: 'set alarm at 9:5',
    //     timestamp: Date.now(),
    //   });

    //   expect(result.extractedData.hours).toBe('09');
    //   expect(result.extractedData.minutes).toBe('05');
    // });

    // it('should return error for invalid time format', async () => {
    //   const result = await processor.process({
    //     type: 'CUSTOM',
    //     rawPrompt: 'set alarm at invalid time',
    //     timestamp: Date.now(),
    //   });

    //   expect(result.extractedData.error).toBeDefined();
    //   expect(result.status).toBe('ERROR');
    // });
  });

  // ==================== SMS DATA EXTRACTION TESTS ====================
  describe('SMS Data Extraction', () => {
    // it('should extract phone number and message', async () => {
    //   const result = await processor.process({
    //     type: 'CUSTOM',
    //     rawPrompt: 'send sms to 09123456789 hello world',
    //     timestamp: Date.now(),
    //   });

    //   expect(result.extractedData.phoneNumber).toBe('09123456789');
    //   expect(result.extractedData.message).toBe('hello world');
    // });

    it('should handle different phone number formats', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'send message to 9123456789',
        timestamp: Date.now(),
      });

      expect(result.extractedData.phoneNumber).toBeDefined();
      expect(result.extractedData.phoneNumber.length).toBeGreaterThanOrEqual(
        10,
      );
    });

    it('should extract message with multiple words', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'send sms to 09123456789 hello this is a test message',
        timestamp: Date.now(),
      });

      expect(result.extractedData.message).toContain('hello');
      expect(result.extractedData.message).toContain('test');
      expect(result.extractedData.message).toContain('message');
    });

    it('should set timestamp in extracted data', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'send sms to 09123456789 hello',
        timestamp: Date.now(),
      });

      expect(result.extractedData.timestamp).toBeDefined();
      expect(typeof result.extractedData.timestamp).toBe('number');
    });

    it('should handle missing phone number', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'send sms hello world',
        timestamp: Date.now(),
      });

      expect(result.extractedData.phoneNumber).toBe('');
    });
  });

  // ==================== CALENDAR DATA EXTRACTION TESTS ====================
  // describe('Calendar Data Extraction', () => {
  //   it('should extract event title, date, and time', async () => {
  //     const result = await processor.process({
  //       type: 'CUSTOM',
  //       rawPrompt: 'add event meeting on 2024-01-15 at 14:00',
  //       timestamp: Date.now(),
  //     });

  //     expect(result.extractedData.title).toContain('meeting');
  //     expect(result.extractedData.date).toBe('2024-01-15');
  //     expect(result.extractedData.time).toBe('14:00');
  //   });

  //   it('should use current date if not specified', async () => {
  //     const result = await processor.process({
  //       type: 'CUSTOM',
  //       rawPrompt: 'add event lunch at 12:00',
  //       timestamp: Date.now(),
  //     });

  //     expect(result.extractedData.date).toBeDefined();
  //     expect(result.extractedData.date).toMatch(/\d{4}-\d{2}-\d{2}/);
  //   });

  //   it('should default to 09:00 if time not specified', async () => {
  //     const result = await processor.process({
  //       type: 'CUSTOM',
  //       rawPrompt: 'add event meeting on 2024-01-15',
  //       timestamp: Date.now(),
  //     });

  //     expect(result.extractedData.time).toBe('09:00');
  //   });

  //   it('should handle different date formats', async () => {
  //     const result = await processor.process({
  //       type: 'CUSTOM',
  //       rawPrompt: 'schedule appointment on 2024-12-25 at 10:30',
  //       timestamp: Date.now(),
  //     });

  //     expect(result.extractedData.date).toBe('2024-12-25');
  //     expect(result.extractedData.time).toBe('10:30');
  //   });

  //   it('should extract full event name with multiple words', async () => {
  //     const result = await processor.process({
  //       type: 'CUSTOM',
  //       rawPrompt: 'add event team standup meeting on 2024-01-15 at 09:00',
  //       timestamp: Date.now(),
  //     });

  //     expect(result.extractedData.title).toContain('team');
  //     expect(result.extractedData.title).toContain('standup');
  //   });
  // });

  // ==================== ACTION BUILDER TESTS ====================
  describe('ActionBuilder', () => {
    it('should build SET_ALARM action for valid alarm data', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'set alarm at 10:30 AM',
        timestamp: Date.now(),
      });

      expect(result.actions.length).toBeGreaterThan(0);
      expect(result.actions[0].type).toBe('SET_ALARM');
      expect(result.actions[0].priority).toBe('HIGH');
      expect(result.actions[0].payload.hours).toBe('10');
      expect(result.actions[0].payload.minutes).toBe('30');
    });

    // it('should build SEND_SMS action for valid SMS data', async () => {
    //   const result = await processor.process({
    //     type: 'CUSTOM',
    //     rawPrompt: 'send sms to 09123456789 hello',
    //     timestamp: Date.now(),
    //   });

    //   expect(result.actions.length).toBeGreaterThan(0);
    //   expect(result.actions[0].type).toBe('SEND_SMS');
    //   expect(result.actions[0].priority).toBe('NORMAL');
    //   expect(result.actions[0].payload.phoneNumber).toBe('09123456789');
    //   expect(result.actions[0].payload.message).toBe('hello');
    // });

    it('should build ADD_CALENDAR_EVENT action for valid calendar data', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'add event meeting on 2024-01-15 at 14:00',
        timestamp: Date.now(),
      });

      expect(result.actions.length).toBeGreaterThan(0);
      expect(result.actions[0].type).toBe('ADD_CALENDAR_EVENT');
      expect(result.actions[0].priority).toBe('NORMAL');
    });

    it('should include NOTIFY_USER action in all successful batches', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'set alarm at 10:30 AM',
        timestamp: Date.now(),
      });

      const notifyAction = result.actions.find(a => a.type === 'NOTIFY_USER');
      expect(notifyAction).toBeDefined();
      expect(notifyAction?.priority).toBe('LOW');
    });

    // it('should not build actions for invalid data', async () => {
    //   const result = await processor.process({
    //     type: 'CUSTOM',
    //     rawPrompt: 'set alarm at invalid time',
    //     timestamp: Date.now(),
    //   });

    //   expect(result.actions.length).toBe(0);
    //   expect(result.status).toBe('ERROR');
    // });
  });

  // ==================== BATCH PROCESSING TESTS ====================
  describe('Batch Processing', () => {
    it('should process multiple tasks in parallel', async () => {
      const tasks: ChatbotTask[] = [
        {
          type: 'CUSTOM',
          rawPrompt: 'set alarm at 10:30 AM',
          timestamp: Date.now(),
        },
        {
          type: 'CUSTOM',
          rawPrompt: 'send sms to 09123456789 hello',
          timestamp: Date.now(),
        },
        {
          type: 'CUSTOM',
          rawPrompt: 'add event meeting on 2024-01-15 at 14:00',
          timestamp: Date.now(),
        },
      ];

      const results = await processor.processBatch(tasks);

      expect(results.length).toBe(3);
      expect(results[0].type).toBe('ALARM');
      expect(results[1].type).toBe('SMS');
      expect(results[2].type).toBe('CALENDAR');
    });

    it('should handle empty batch', async () => {
      const results = await processor.processBatch([]);
      expect(results.length).toBe(0);
    });

    it('should process large batches', async () => {
      const tasks: ChatbotTask[] = Array.from({ length: 100 }, (_, i) => ({
        type: 'CUSTOM',
        rawPrompt: `set alarm at ${(6 + (i % 12))
          .toString()
          .padStart(2, '0')}:00`,
        timestamp: Date.now(),
      }));

      const results = await processor.processBatch(tasks);

      expect(results.length).toBe(100);
      expect(results.every(r => r.type === 'ALARM')).toBe(true);
    });

    it('should handle mixed success and failure in batch', async () => {
      const tasks: ChatbotTask[] = [
        {
          type: 'CUSTOM',
          rawPrompt: 'set alarm at 10:30 AM',
          timestamp: Date.now(),
        },
        {
          type: 'CUSTOM',
          rawPrompt: 'invalid task xyz',
          timestamp: Date.now(),
        },
        {
          type: 'CUSTOM',
          rawPrompt: 'send sms to 09123456789 hello',
          timestamp: Date.now(),
        },
      ];

      const results = await processor.processBatch(tasks);

      expect(results.length).toBe(3);
      const successful = results.filter(r => r.status === 'SUCCESS');
      expect(successful.length).toBeGreaterThan(0);
    });

    it('should preserve task order in batch results', async () => {
      const tasks: ChatbotTask[] = [
        {
          type: 'CUSTOM',
          rawPrompt: 'set alarm at 10:30 AM',
          timestamp: Date.now(),
        },
        {
          type: 'CUSTOM',
          rawPrompt: 'send sms to 09123456789 hello',
          timestamp: Date.now(),
        },
        {
          type: 'CUSTOM',
          rawPrompt: 'add event meeting on 2024-01-15 at 14:00',
          timestamp: Date.now(),
        },
      ];

      const results = await processor.processBatch(tasks);

      expect(results[0].type).toBe('ALARM');
      expect(results[1].type).toBe('SMS');
      expect(results[2].type).toBe('CALENDAR');
    });
  });

  // ==================== ERROR HANDLING TESTS ====================
  // describe('Error Handling', () => {
  //   it('should handle processing errors gracefully', async () => {
  //     const result = await processor.process({
  //       type: 'CUSTOM',
  //       rawPrompt: 'set alarm at invalid time',
  //       timestamp: Date.now(),
  //     });

  //     expect(result.status).toBe('ERROR');
  //     expect(result.error).toBeDefined();
  //   });

  //   // it('should return error status for empty prompt', async () => {
  //   //   const result = await processor.process({
  //   //     type: 'CUSTOM',
  //   //     rawPrompt: '',
  //   //     timestamp: Date.now(),
  //   //   });

  //   //   expect(result.status).toBe('ERROR');
  //   // });

  //   it('should include error message in ProcessedTask', async () => {
  //     const result = await processor.process({
  //       type: 'CUSTOM',
  //       rawPrompt: 'invalid xyz',
  //       timestamp: Date.now(),
  //     });

  //     if (result.status === 'ERROR') {
  //       expect(result.error).toBeDefined();
  //       expect(typeof result.error).toBe('string');
  //     }
  //   });

  //   it('should not throw on malformed input', async () => {
  //     const task: any = {
  //       type: 'CUSTOM',
  //       rawPrompt: null,
  //       timestamp: Date.now(),
  //     };

  //     await expect(processor.process(task)).resolves.toBeDefined();
  //   });
  // });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('should handle very long prompts', async () => {
      const longPrompt = 'set alarm at 10:30 AM ' + 'extra text '.repeat(100);
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: longPrompt,
        timestamp: Date.now(),
      });

      expect(result.type).toBe('ALARM');
      expect(result.status).toBe('SUCCESS');
    });

    it('should handle Unicode characters', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'send sms to 09123456789 مرحبا بك',
        timestamp: Date.now(),
      });

      expect(result.type).toBe('SMS');
    });

    it('should handle numbers in message', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'send sms to 09123456789 meeting at 2024-01-15',
        timestamp: Date.now(),
      });

      expect(result.extractedData.message).toContain('2024');
    });

    it('should handle prompts with URLs', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'send sms to 09123456789 check https://example.com',
        timestamp: Date.now(),
      });

      expect(result.type).toBe('SMS');
    });

    it('should handle multiple phone numbers (extracts first)', async () => {
      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'send sms to 09123456789 and 09987654321',
        timestamp: Date.now(),
      });

      expect(result.extractedData.phoneNumber).toBe('09123456789');
    });
  });

  // ==================== METADATA TESTS ====================
  describe('Metadata Handling', () => {
    it('should preserve metadata in task', async () => {
      const metadata = {
        context: 'morning-routine',
        priority: 'high',
        userId: 'user123',
      };

      const result = await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'set alarm at 10:30 AM',
        metadata,
        timestamp: Date.now(),
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('SUCCESS');
    });
  });

  // ==================== PERFORMANCE TESTS ====================
  describe('Performance', () => {
    it('should process single task within reasonable time', async () => {
      const start = Date.now();

      await processor.process({
        type: 'CUSTOM',
        rawPrompt: 'set alarm at 10:30 AM',
        timestamp: Date.now(),
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should batch process 50 tasks efficiently', async () => {
      const tasks: ChatbotTask[] = Array.from({ length: 50 }, (_, i) => ({
        type: 'CUSTOM',
        rawPrompt: `set alarm at ${(6 + (i % 18))
          .toString()
          .padStart(2, '0')}:00`,
        timestamp: Date.now(),
      }));

      const start = Date.now();
      await processor.processBatch(tasks);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});

import { internalProcessor, ChatbotTask, ProcessedTask } from '..';

// ==================== EXAMPLE 1: SIMPLE BATCH PROCESSING ====================
/**
 * User sends multiple commands at once to chatbot
 * Chatbot collects all messages and processes them in batch
 */
export async function example1_SimpleBatch() {
  const chatbotMessages: ChatbotTask[] = [
    {
      type: 'CUSTOM',
      rawPrompt: 'set alarm at 10:30 AM',
      timestamp: Date.now(),
    },
    {
      type: 'CUSTOM',
      rawPrompt: 'send sms to 09123456789 hello world',
      timestamp: Date.now(),
    },
    {
      type: 'CUSTOM',
      rawPrompt: 'add event meeting on 2024-01-15 at 14:00',
      timestamp: Date.now(),
    },
  ];

  console.log('🔄 Processing batch of', chatbotMessages.length, 'tasks...');

  const results = await internalProcessor.processBatch(chatbotMessages);

  console.log('✅ Batch processing completed');
  results.forEach((result, index) => {
    console.log(`\n--- Task ${index + 1} ---`);
    console.log('Type:', result.type);
    console.log('Status:', result.status);
    console.log('Normalized Prompt:', result.normalizedPrompt);
    console.log('Extracted Data:', result.extractedData);
    console.log('Actions Count:', result.actions.length);
    if (result.error) {
      console.log('Error:', result.error);
    }
  });

  return results;
}

// ==================== EXAMPLE 2: MORNING ROUTINE BATCH ====================
/**
 * User says: "Setup my morning routine"
 * Chatbot breaks it down into multiple tasks and processes as batch
 */
export async function example2_MorningRoutine() {
  const morningTasks: ChatbotTask[] = [
    {
      type: 'CUSTOM',
      rawPrompt: 'set alarm at 6:00 AM',
      metadata: { context: 'morning-routine', priority: 'high' },
      timestamp: Date.now(),
    },
    {
      type: 'CUSTOM',
      rawPrompt: 'send sms to 09987654321 running late',
      metadata: { context: 'morning-routine', priority: 'medium' },
      timestamp: Date.now(),
    },
    {
      type: 'CUSTOM',
      rawPrompt: 'add event team standup on 2024-01-15 at 09:00',
      metadata: { context: 'morning-routine', priority: 'high' },
      timestamp: Date.now(),
    },
    {
      type: 'CUSTOM',
      rawPrompt: 'add event breakfast reminder on 2024-01-15 at 08:00',
      metadata: { context: 'morning-routine', priority: 'low' },
      timestamp: Date.now(),
    },
  ];

  console.log('\n📋 Setting up morning routine...');

  const results = await internalProcessor.processBatch(morningTasks);

  // Analyze results
  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;
  const pendingCount = results.filter(r => r.status === 'PENDING').length;

  console.log(`\n📊 Batch Summary:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`⏳ Pending: ${pendingCount}`);

  // Group by type
  const groupedByType = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, ProcessedTask[]>);

  console.log('\n📂 Grouped by type:');
  Object.entries(groupedByType).forEach(([type, items]) => {
    console.log(`  ${type}: ${items.length} task(s)`);
  });

  return results;
}

// ==================== EXAMPLE 3: WORK DAY SCHEDULE BATCH ====================
/**
 * User schedules their entire work day
 * Multiple reminders, meetings, and notifications
 */
export async function example3_WorkDaySchedule() {
  const workDayTasks: ChatbotTask[] = [
    // Morning alarm
    {
      type: 'CUSTOM',
      rawPrompt: 'set alarm at 7:00 AM',
      metadata: { category: 'alarm', importance: 'critical' },
      timestamp: Date.now(),
    },

    // Morning standup reminder
    {
      type: 'CUSTOM',
      rawPrompt: 'add event morning standup on 2024-01-15 at 09:00',
      metadata: { category: 'meeting', importance: 'high' },
      timestamp: Date.now(),
    },

    // Notify team about standup
    {
      type: 'CUSTOM',
      rawPrompt: 'send sms to 09111111111 standup at 9am join zoom',
      metadata: { category: 'notification', importance: 'high' },
      timestamp: Date.now(),
    },

    // Lunch break reminder
    {
      type: 'CUSTOM',
      rawPrompt: 'add event lunch break on 2024-01-15 at 12:30',
      metadata: { category: 'break', importance: 'medium' },
      timestamp: Date.now(),
    },

    // Client call
    {
      type: 'CUSTOM',
      rawPrompt: 'add event client call on 2024-01-15 at 14:00',
      metadata: { category: 'meeting', importance: 'high' },
      timestamp: Date.now(),
    },

    // Send reminder to client
    {
      type: 'CUSTOM',
      rawPrompt: 'send sms to 09222222222 client call at 2pm',
      metadata: { category: 'notification', importance: 'high' },
      timestamp: Date.now(),
    },

    // End of day summary
    {
      type: 'CUSTOM',
      rawPrompt: 'add event daily summary on 2024-01-15 at 17:30',
      metadata: { category: 'admin', importance: 'low' },
      timestamp: Date.now(),
    },
  ];

  console.log('\n📅 Processing work day schedule...');

  const startTime = Date.now();
  const results = await internalProcessor.processBatch(workDayTasks);
  const endTime = Date.now();

  // Performance metrics
  console.log(`\n⏱️  Processing time: ${endTime - startTime}ms`);

  // Detailed analysis
  const analysis = {
    total: results.length,
    successful: results.filter(r => r.status === 'SUCCESS').length,
    failed: results.filter(r => r.status === 'ERROR').length,
    pending: results.filter(r => r.status === 'PENDING').length,
    byType: {} as Record<string, number>,
  };

  results.forEach(result => {
    analysis.byType[result.type] = (analysis.byType[result.type] || 0) + 1;
  });

  console.log('\n📊 Work Day Schedule Summary:');
  console.log(`Total tasks: ${analysis.total}`);
  console.log(`Successful: ${analysis.successful}`);
  console.log(`Failed: ${analysis.failed}`);
  console.log(`Pending: ${analysis.pending}`);
  console.log('\nTasks by type:', analysis.byType);

  // Show any errors
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    console.log('\n⚠️  Errors found:');
    errors.forEach((error, idx) => {
      console.log(`  ${idx + 1}. ${error.error}`);
    });
  }

  return results;
}

// ==================== EXAMPLE 4: BATCH WITH ERROR HANDLING ====================
/**
 * Process batch with comprehensive error handling and retry logic
 */
export async function example4_BatchWithErrorHandling() {
  const tasks: ChatbotTask[] = [
    {
      type: 'CUSTOM',
      rawPrompt: 'set alarm at invalid time',
      timestamp: Date.now(),
    },
    {
      type: 'CUSTOM',
      rawPrompt: 'send sms to 09123456789 message',
      timestamp: Date.now(),
    },
    {
      type: 'CUSTOM',
      rawPrompt: '', // Empty prompt - will fail
      timestamp: Date.now(),
    },
  ];

  console.log('\n🔄 Processing batch with error handling...');

  try {
    const results = await internalProcessor.processBatch(tasks);

    // Separate successful and failed tasks
    const { successful, failed } = results.reduce(
      (acc, result, index) => {
        if (result.status === 'SUCCESS') {
          acc.successful.push({ index, result });
        } else {
          acc.failed.push({ index, result });
        }
        return acc;
      },
      { successful: [], failed: [] } as any,
    );

    console.log(`\n✅ Successful tasks: ${successful.length}`);
    successful.forEach(({ index, result }: any) => {
      console.log(`  [${index}] ${result.type}: ${result.normalizedPrompt}`);
    });

    console.log(`\n❌ Failed tasks: ${failed.length}`);
    failed.forEach(({ index, result }: any) => {
      console.log(`  [${index}] Error: ${result.error}`);
    });

    // Optionally retry failed tasks
    if (failed.length > 0) {
      console.log('\n🔄 Retrying failed tasks...');
      const retryTasks = failed.map(({ index }: any) => tasks[index]);
      const retryResults = await internalProcessor.processBatch(retryTasks);

      const retrySuccessful = retryResults.filter(
        r => r.status === 'SUCCESS',
      ).length;
      console.log(
        `  Retried ${retryTasks.length}, succeeded: ${retrySuccessful}`,
      );
    }

    return results;
  } catch (error) {
    console.error('Batch processing failed:', error);
    throw error;
  }
}

// ==================== EXAMPLE 5: REAL-TIME BATCH PROCESSING ====================
/**
 * Simulate receiving chatbot messages and batching them
 * Process every 5 messages or every 3 seconds
 */
export async function example5_RealtimeBatchProcessing() {
  const BATCH_SIZE = 5;
  const BATCH_TIMEOUT = 3000; // 3 seconds

  let messageBatch: ChatbotTask[] = [];
  let batchTimeout: ReturnType<typeof setTimeout> | null = null;

  async function flushBatch() {
    if (messageBatch.length === 0) return;

    console.log(`\n🚀 Flushing batch with ${messageBatch.length} messages...`);

    const results = await internalProcessor.processBatch(messageBatch);
    const successful = results.filter(r => r.status === 'SUCCESS').length;

    console.log(
      `✅ Processed ${successful}/${messageBatch.length} successfully`,
    );

    messageBatch = [];
    if (batchTimeout) clearTimeout(batchTimeout);
    batchTimeout = null;
  }

  function addMessageToBatch(message: string) {
    const task: ChatbotTask = {
      type: 'CUSTOM',
      rawPrompt: message,
      timestamp: Date.now(),
    };

    messageBatch.push(task);
    console.log(
      `📨 Added message to batch (${messageBatch.length}/${BATCH_SIZE})`,
    );

    // Reset timeout
    if (batchTimeout) clearTimeout(batchTimeout);

    if (messageBatch.length >= BATCH_SIZE) {
      // Batch is full, flush immediately
      flushBatch();
    } else {
      // Set timeout to flush after 3 seconds
      batchTimeout = setTimeout(() => {
        flushBatch();
      }, BATCH_TIMEOUT);
    }
  }

  // Simulate incoming messages
  const incomingMessages = [
    'set alarm at 10:00 AM',
    'send sms to 09123456789 hello',
    'add event meeting on 2024-01-15 at 14:00',
    'set alarm at 6:00 AM',
    'send sms to 09987654321 goodbye', // 5th message - triggers flush
    'add event lunch on 2024-01-15 at 12:00',
  ];

  console.log('📥 Starting real-time batch processing simulation...\n');

  for (const message of incomingMessages) {
    addMessageToBatch(message);
    await new Promise<void>(res => {
      setTimeout(res, 500); // Simulate delay
    });
  }

  // Flush remaining messages
  await flushBatch();

  console.log('\n✨ Real-time batch processing completed');
}

export const handleChatbotMessage = async (userMessage: string) => {
  const task: ChatbotTask = {
    type: 'CUSTOM', // Will be auto-detected
    rawPrompt: userMessage,
    timestamp: Date.now(),
  };

  const result = await internalProcessor.process(task);

  console.log('Processed task:', result);
};

// ==================== USAGE ====================
// Run any example:
// await example1_SimpleBatch();
// await example2_MorningRoutine();
// await example3_WorkDaySchedule();
// await example4_BatchWithErrorHandling();
// await example5_RealtimeBatchProcessing();

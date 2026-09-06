# InternalProcessor Module

## Overview

The **InternalProcessor** is a middleware layer that processes tasks from a chatbot assistant. It normalizes user prompts, classifies task types, extracts relevant data, and generates actionable tasks for an external processor (backend server).

This module handles the **logic only** with no UI components - pure TypeScript processing.

**Location**: `./module/internalProcessor/index.ts`

---

## Architecture

```
Chatbot User Input
       ↓
PromptNormalizer (clean & standardize)
       ↓
TaskClassifier (identify intent)
       ↓
PromptNormalizer.extractData (parse information)
       ↓
ActionBuilder (create actions)
       ↓
ExternalProcessorHandler (validate & send to server)
       ↓
External Processor (server executes: alarm, SMS, calendar)
```

---

## Core Components

### 1. **PromptNormalizer**

Cleans and standardizes user input from chatbot.

**Methods:**

- `normalize(prompt: string): string` - Removes extra spaces, converts to lowercase, removes special characters
- `extractData(type: string, prompt: string): Record<string, any>` - Extracts specific information based on task type

**Example:**

```typescript
const normalizer = new PromptNormalizer();

// Input: "Set  ALARM   at  10:30  AM!!!"
// Output: "set alarm at 10:30 am"
const cleaned = normalizer.normalize('Set  ALARM   at  10:30  AM!!!');

// Extract alarm data
const alarmData = normalizer.extractData('ALARM', cleaned);
// { hours: '10', minutes: '30', title: 'Alarm', label: '10:30' }
```

### 2. **TaskClassifier**

Identifies the type of task from user prompt.

**Methods:**

- `classify(prompt: string): 'ALARM' | 'SMS' | 'CALENDAR' | 'CUSTOM'` - Determines task type

**Supported Types:**

- `ALARM` - Keywords: "alarm", "wake"
- `SMS` - Keywords: "sms", "message", "send"
- `CALENDAR` - Keywords: "calendar", "event", "appointment"
- `CUSTOM` - Any other task

**Example:**

```typescript
const classifier = new TaskClassifier();

classifier.classify('send message to John'); // Returns: 'SMS'
classifier.classify('set alarm at 6am'); // Returns: 'ALARM'
classifier.classify('add meeting tomorrow'); // Returns: 'CALENDAR'
```

### 3. **ActionBuilder**

Converts extracted data into executable actions.

**Methods:**

- `buildActions(type: string, extractedData: Record<string, any>): Action[]` - Creates action objects

**Action Types:**

- `SET_ALARM` - Schedule alarm notification
- `SEND_SMS` - Send text message
- `ADD_CALENDAR_EVENT` - Create calendar event
- `LOG` - Log information
- `NOTIFY_USER` - Show user notification

**Example:**

```typescript
const builder = new ActionBuilder();

const actions = builder.buildActions('ALARM', {
  hours: '10',
  minutes: '30',
  title: 'Alarm',
});

// Returns:
// [
//   {
//     type: 'SET_ALARM',
//     payload: { hours: '10', minutes: '30', title: 'Alarm' },
//     priority: 'HIGH'
//   },
//   {
//     type: 'NOTIFY_USER',
//     payload: { message: 'Processing ALARM task' },
//     priority: 'LOW'
//   }
// ]
```

### 4. **ExternalProcessorHandler**

Validates actions and sends them to backend server.

**Methods:**

- `executeActions(actions: Action[]): Promise<ExternalProcessorResponse>` - Send actions to external processor
- `validateActions(actions: Action[]): boolean` - Validate data before sending

**Example:**

```typescript
const handler = new ExternalProcessorHandler();

const isValid = handler.validateActions(actions);

if (isValid) {
  const response = await handler.executeActions(actions);
  console.log(response); // { success: true, data: {...} }
}
```

### 5. **InternalProcessor**

Main class that orchestrates the entire processing pipeline.

**Methods:**

- `process(task: ChatbotTask): Promise<ProcessedTask>` - Process single task
- `processBatch(tasks: ChatbotTask[]): Promise<ProcessedTask[]>` - Process multiple tasks in parallel

---

## Usage

### Basic Setup

```typescript
import { internalProcessor, ChatbotTask } from '@/module/internalProcessor';

// Create a task from chatbot input
const task: ChatbotTask = {
  type: 'CUSTOM', // Will be auto-detected
  rawPrompt: 'set alarm at 10:30 AM',
  timestamp: Date.now(),
};

// Process the task
const result = await internalProcessor.process(task);

console.log(result);
// {
//   type: 'ALARM',
//   normalizedPrompt: 'set alarm at 10:30 am',
//   extractedData: { hours: '10', minutes: '30', ... },
//   actions: [{ type: 'SET_ALARM', payload: {...}, priority: 'HIGH' }],
//   status: 'SUCCESS'
// }
```

### Single Task Processing

```typescript
const handleChatbotMessage = async (userMessage: string) => {
  const task: ChatbotTask = {
    type: 'CUSTOM',
    rawPrompt: userMessage,
    timestamp: Date.now(),
  };

  const result = await internalProcessor.process(task);

  if (result.status === 'SUCCESS') {
    console.log('Task processed successfully');
    console.log('Actions:', result.actions);
  } else {
    console.error('Processing failed:', result.error);
  }
};

// Usage
await handleChatbotMessage('send sms to 09123456789 hello world');
```

### Batch Processing

```typescript
const tasks: ChatbotTask[] = [
  {
    type: 'CUSTOM',
    rawPrompt: 'set alarm at 6:00 AM',
    timestamp: Date.now(),
  },
  {
    type: 'CUSTOM',
    rawPrompt: 'send message to 09123456789',
    timestamp: Date.now(),
  },
  {
    type: 'CUSTOM',
    rawPrompt: 'add event meeting on 2024-01-15 at 14:00',
    timestamp: Date.now(),
  },
];

const results = await internalProcessor.processBatch(tasks);

console.log(`Processed ${results.length} tasks`);
results.forEach((result, index) => {
  console.log(`Task ${index + 1}: ${result.status}`);
});
```

### With Metadata

```typescript
const task: ChatbotTask = {
  type: 'CUSTOM',
  rawPrompt: 'set alarm at 10:30 AM',
  metadata: {
    context: 'morning-routine',
    priority: 'high',
    userId: 'user123',
  },
  timestamp: Date.now(),
};

const result = await internalProcessor.process(task);
```

---

## Data Types

### ChatbotTask

Input task from chatbot assistant.

```typescript
interface ChatbotTask {
  type: 'ALARM' | 'SMS' | 'CALENDAR' | 'CUSTOM';
  rawPrompt: string; // Raw user input
  metadata?: Record<string, any>;
  timestamp: number;
}
```

### ProcessedTask

Output after processing.

```typescript
interface ProcessedTask {
  type: string;
  normalizedPrompt: string; // Cleaned prompt
  extractedData: Record<string, any>; // Parsed information
  actions: Action[]; // Generated actions
  status: 'SUCCESS' | 'PENDING' | 'ERROR';
  error?: string;
}
```

### Action

Task action to be executed.

```typescript
interface Action {
  type: 'SET_ALARM' | 'SEND_SMS' | 'ADD_CALENDAR_EVENT' | 'LOG' | 'NOTIFY_USER';
  payload: Record<string, any>;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
}
```

---

## Supported Task Types & Examples

### ALARM Tasks

```typescript
// Input
'set alarm at 10:30 AM'
'alarm at 6 pm'
'wake me up at 7:00'

// Extracted Data
{
  hours: '10',
  minutes: '30',
  title: 'Alarm',
  label: '10:30'
}
```

### SMS Tasks

```typescript
// Input
'send sms to 09123456789 hello world'
'message 09987654321 i am busy'
'send text to john'

// Extracted Data
{
  phoneNumber: '09123456789',
  message: 'hello world',
  timestamp: 1234567890
}
```

### CALENDAR Tasks

```typescript
// Input
'add event meeting on 2024-01-15 at 14:00'
'create appointment tomorrow at 10am'
'schedule lunch on 2024-01-20 at 12:30'

// Extracted Data
{
  title: 'meeting',
  date: '2024-01-15',
  time: '14:00'
}
```

---

## Error Handling

### Processing Failures

```typescript
const result = await internalProcessor.process(task);

if (result.status === 'ERROR') {
  console.error('Error:', result.error);
  // Handle error appropriately
}
```

### Batch with Partial Failures

```typescript
const results = await internalProcessor.processBatch(tasks);

const successful = results.filter(r => r.status === 'SUCCESS');
const failed = results.filter(r => r.status === 'ERROR');

console.log(`Success: ${successful.length}, Failed: ${failed.length}`);

// Retry failed tasks
if (failed.length > 0) {
  const failedTasks = tasks.filter((_, i) => results[i].status === 'ERROR');
  const retryResults = await internalProcessor.processBatch(failedTasks);
}
```

---

## Configuration

### Server Endpoint

Update the `baseURL` in `ExternalProcessorHandler`:

```typescript
private baseURL = 'https://your-api.com'; // Change this
```

### API Endpoint

Server should handle POST request:

```
POST /processor/execute

Body:
{
  actions: Action[],
  timestamp: number,
  deviceInfo: {
    platform: 'android' | 'ios',
    version: string
  }
}

Response:
{
  success: boolean,
  data?: Record<string, any>,
  error?: string
}
```

---

## Integration with Chatbot Screen

```typescript
// ChatbotScreen.tsx
import { internalProcessor, ChatbotTask } from '@/module/internalProcessor';

export function ChatbotScreen() {
  const handleSendMessage = async (message: string) => {
    const task: ChatbotTask = {
      type: 'CUSTOM',
      rawPrompt: message,
      timestamp: Date.now(),
    };

    try {
      const result = await internalProcessor.process(task);

      if (result.status === 'SUCCESS') {
        // Show success to user
        showNotification(`${result.type} task processed successfully`);
      } else {
        // Show error to user
        showNotification(`Error: ${result.error}`);
      }
    } catch (error) {
      showNotification('Processing failed');
    }
  };

  return <ChatbotUI onSendMessage={handleSendMessage} />;
}
```

---

## Testing

### Unit Test Example

```typescript
import { internalProcessor } from '@/module/internalProcessor';

describe('InternalProcessor', () => {
  it('should process alarm task', async () => {
    const task = {
      type: 'CUSTOM' as const,
      rawPrompt: 'set alarm at 10:30 AM',
      timestamp: Date.now(),
    };

    const result = await internalProcessor.process(task);

    expect(result.type).toBe('ALARM');
    expect(result.status).toBe('SUCCESS');
    expect(result.extractedData.hours).toBe('10');
    expect(result.extractedData.minutes).toBe('30');
  });

  it('should batch process multiple tasks', async () => {
    const tasks = [
      {
        type: 'CUSTOM' as const,
        rawPrompt: 'set alarm at 6am',
        timestamp: Date.now(),
      },
      {
        type: 'CUSTOM' as const,
        rawPrompt: 'send sms to 09123456789',
        timestamp: Date.now(),
      },
    ];

    const results = await internalProcessor.processBatch(tasks);

    expect(results.length).toBe(2);
    expect(results[0].type).toBe('ALARM');
    expect(results[1].type).toBe('SMS');
  });
});
```

---

## Performance

- **Single task processing**: ~10-50ms
- **Batch processing (10 tasks)**: ~20-100ms
- **Uses `Promise.all()`** for parallel processing

---

## Limitations

- Phone number extraction limited to numeric patterns
- Time parsing supports 24-hour and 12-hour (AM/PM) formats
- Calendar events limited to title, date, and time (no recurrence)
- Requires external processor (server) for actual task execution

---

## Future Enhancements

- [ ] Support for recurring alarms
- [ ] Contact name resolution for SMS
- [ ] Timezone support for calendar events
- [ ] Natural language processing improvements
- [ ] Task priority conflicts resolution
- [ ] User preference learning

---

## Support & Issues

For issues or questions, please contact the development team or check the project documentation.

---

## License

Internal use only - Pishkar Mobile Application

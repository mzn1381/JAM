---
name: pishkar-mobile
description: Complete project knowledge for the Pishkar React Native mobile app — a Persian-language AI assistant. Use this skill whenever working on anything inside pishkar/mobile/src/ or pishkar/mobile/modules/. Covers architecture, state management, API layer, navigation, theming, coding conventions, data models, the full AI chat pipeline, and the internal_processor module in depth.
---

# Pishkar Mobile — Canonical Engineering Reference

## Project Overview

**Pishkar** (پیشکار — "assistant") is a Persian-language, privacy-first AI assistant for Android and iOS, built with React Native 0.82.1 and TypeScript. Users converse with an AI assistant that understands natural-language commands and executes real device actions: setting alarms, sending SMS, making calls, adding calendar events, and sending emails.

Every conversation is a persisted "task." The app processes user input through a local middleware module (`internal_processor`) which normalizes the prompt and forwards it to a remote AI server. The server's intent classification drives on-device tool execution.

**Key facts:**
- App name in `package.json`: `pishkar` (v0.0.1)
- Default locale: **Persian (Farsi)**. All user-facing strings are in Persian.
- RTL-first: `isRTL` defaults to `true`. Every layout uses RTL-aware flex.
- Privacy positioning: The UI claims all data stays on-device. Processing goes through `internal_processor`, which does call an external AI server.
- Custom font: **Vazirmatn-Black** throughout.
- Error monitoring: **Sentry** (`@sentry/react-native` v8) — fully initialized in `index.js` with session replay, mobile replay, and feedback integrations.
- Node engine requirement: `>=20`
- React version: 19.1.1

---

## Top-Level Project Structure

```
pishkar/mobile/
├── App.tsx                  ← Root component; provider tree + navigation onReady logic
├── index.js                 ← Entry point; Sentry init; AppRegistry
├── app.json                 ← App name used by AppRegistry
├── package.json             ← Dependencies and scripts
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── jest.config.js
├── sentry.options.json
├── modules/                 ← Self-contained TypeScript modules (outside src/)
│   ├── README.md
│   └── internal_processor/  ← AI middleware: prompt normalization + server relay
└── src/                     ← Application source
    ├── actions/
    ├── common/
    ├── components/
    ├── hooks/
    ├── navigation/
    ├── screens/
    ├── services/
    ├── store/
    ├── theme/
    ├── types/
    └── utils/
```

---

## Application Bootstrap

### `index.js` — Entry Point

```ts
import 'react-native-get-random-values'; // polyfill for uuid
import * as Sentry from '@sentry/react-native';
import { BASE_SENTRY_DNS } from './src/utils/constants';

Sentry.init({
  dsn: BASE_SENTRY_DNS,
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

AppRegistry.registerComponent(appName, () => Sentry.wrap(App));
```

The entire `App` component is wrapped by `Sentry.wrap()`. Sentry captures all crashes, session replays (10% sample rate), and 100% replays on error.

### `App.tsx` — Provider Tree and Startup Logic

**Exact provider nesting order (outermost first):**
```
SafeAreaProvider
  CustomQueryClientProvider      ← TanStack Query client (staleTime: 5 min)
    AuthProvider                 ← AuthContext; fetches identity on mount
      GlobalLogicProvider        ← AI pipeline orchestrator; renders global modals
        SafeContainer            ← Safe-area inset padding (bottom/left/right)
          StatusBar
          Navigation (RootStack) ← React Navigation native stack
          Toast                  ← react-native-toast-message global instance
```

**Startup sequence in `App.tsx`:**
1. `useDoubleBackToExit()` — registers Android back-button listener
2. RTL effect: if `I18nManager.isRTL !== isRTL` (from store), forces RTL and re-applies
3. Theme effect: calls `updateTheme(systemColorScheme)` → shows 1-second `<LoadingScreen>` during init
4. Navigation `onReady` callback:
   ```ts
   if (!isOnboarded) navigateWithRef('OnBoarding');
   else if (!isSelectedPreferences && isAuthenticated) navigateWithRef('PreferencesSelection');
   ```

The React Navigation `DefaultTheme` is overridden with the current Zustand theme values so the navigator's internal UI (header, background) matches the app theme.

---

## src/ Directory Structure

```
src/
├── actions/
│   ├── tools/
│   │   ├── alarm.ts          ← NativeModules.AlarmModule wrapper
│   │   ├── calendar.ts       ← react-native-calendar-events wrapper
│   │   ├── call.ts           ← Linking tel: URL
│   │   ├── contact.ts        ← react-native-contacts full CRUD API
│   │   ├── email.ts          ← Linking mailto: URL + react-native-email-link
│   │   ├── MessageToUser.ts  ← Writes bot message directly to Zustand store
│   │   └── SMS.ts            ← Linking sms: URL
│   ├── test/                 ← (directory exists, action tests)
│   ├── PermissionManager.ts  ← Static class: check/request/ensure permissions
│   ├── handlers.ts           ← handleChatbotMessage + handelActions switch
│   └── index.ts              ← useToolsHandler hook
├── common/
│   ├── commonUI/
│   │   ├── AvatarSelectorModal.tsx
│   │   ├── LoadingScreen.tsx
│   │   ├── LoginModal.tsx
│   │   ├── ReportErrorBottomSheet.tsx
│   │   └── UnlockModal.tsx
│   └── providers/
│       ├── AuthProvider.tsx
│       ├── GlobalLogicProvider.tsx
│       └── SafeContainer.tsx
├── components/
│   ├── Button/Button.tsx
│   ├── IconButton/
│   ├── Image/
│   ├── MaterialIcon/         ← Material Symbols icon component
│   ├── ScrollView/
│   ├── Text/Text.tsx
│   ├── View/View.tsx
│   ├── loading/Spinner.tsx
│   ├── textInput/
│   └── index.ts              ← Barrel: Button, View, Text, Image, ScrollView, IconButton
├── hooks/
│   ├── useBackHandler.ts
│   ├── useBiometric.ts       ← useBiometric hook + checkBiometricAvailability + promptBiometric
│   ├── useCamera.ts
│   ├── useDoubleBackToExit.ts
│   ├── useKeyboard.ts
│   ├── useNetwork.ts         ← useSetupNetworking + fetch monkey-patch logger
│   └── useUploadImage.ts
├── navigation/
│   ├── NavigationContainer.ts
│   ├── NavigationService.ts
│   ├── Routes.ts             ← RootStackParamList + NativeStackNavigator definition
│   ├── linking.ts
│   └── navigationRef.ts      ← createNavigationContainerRef + navigateWithRef()
├── screens/
│   ├── Login/
│   ├── chat/                 ← includes components/renderChatMessage.tsx, OtpInput.tsx
│   ├── errorState/
│   ├── home/
│   ├── internalProcessorSetting/  ← stub screen
│   ├── logger/
│   ├── onboarding/
│   ├── permissionsManager/
│   ├── personalVault/
│   ├── preferences/
│   ├── settings/
│   ├── taskList/
│   └── unlock/
├── services/
│   ├── APIs/
│   │   ├── auth/             ← authServices.ts + 4 hooks
│   │   ├── chat/             ← chatService.ts (sendMessage function)
│   │   ├── tasks/            ← tasksServices.ts + 2 hooks (scaffolded)
│   │   └── user/             ← userSarvices.ts + 3 hooks
│   └── provider/
│       └── CustomQueryClientProvider.tsx
├── store/
│   ├── index.ts              ← useStore, composite selectors, Logger facade
│   └── slices/
│       ├── authSlice.ts
│       ├── localSecuritySlice.ts
│       ├── loggerSlice.ts
│       ├── messageSlice.ts
│       ├── taskSlice.ts
│       ├── themeSlice.ts
│       ├── toastSlice.ts     ← empty stub
│       └── userSlice.ts
├── theme/
│   ├── colors.ts
│   ├── index.ts
│   ├── radius.ts
│   ├── spacing.ts
│   └── typography.ts
├── types/
│   ├── AppConfigInterface.ts ← empty stub
│   ├── Auth.ts
│   ├── Chat.ts
│   ├── Tasks.ts
│   └── User.ts
└── utils/
    ├── Analytics.ts          ← empty stub
    ├── DateTimeUtils.ts
    ├── EncryptedStore.ts     ← empty stub
    ├── ErrorManager.ts       ← empty stub
    ├── Logger.ts             ← empty (logging lives in store/index.ts)
    ├── constants.ts          ← all app-wide constants
    ├── enums.ts              ← empty stub
    ├── handlers.ts           ← apiClient, auth token helpers, randomText
    └── string.ts             ← empty stub
```

### Screen Folder Convention (enforced for every screen)

```
screens/ScreenName/
  ScreenName.tsx        ← default export (main component)
  Header.tsx            ← named export Custom{Name}Header
  index.js              ← barrel: re-exports screen + header
  [screen].test.tsx     ← Jest test (most screens have one)
  components/           ← screen-local sub-components (only chat/ uses this)
```

---

## modules/ — The Internal Processor

### Overview

`modules/internal_processor/` is a **self-contained TypeScript module** with its own `package.json` (dependencies: jest, ts-jest), `tsconfig.json`, and `jest.config.js`. It lives outside `src/` and has no React Native dependencies — it is pure TypeScript logic plus a cross-reference to `src/services/APIs/chat/chatService`.

The module exports a **singleton** instance of the `InternalProcessor` class and its TypeScript types. The app imports it as a relative path:

```ts
import { internalProcessor, ChatbotTask } from '../../modules/internal_processor';
```

### Module File Layout

```
modules/internal_processor/
├── index.ts                         ← Singleton export point
├── src/
│   └── InternalProcessor.ts         ← All classes (single file)
├── __tests__/
│   ├── InternalProcessor.test.ts    ← 50+ unit tests
│   └── TEST_DOC.md                  ← Test coverage documentation
├── doc/
│   └── internalProcessorUseage.ts   ← Usage examples (5 patterns)
├── package.json
├── tsconfig.json
└── jest.config.js
```

### Public API

```ts
// index.ts
export const internalProcessor = new InternalProcessor(); // singleton
export { InternalProcessor };
export type { ChatbotTask, ProcessedTask };
```

### TypeScript Interfaces

```ts
interface ChatbotTask {
  type: 'ALARM' | 'SMS' | 'CALENDAR' | 'CUSTOM';
  rawPrompt: string;       // Raw user input text
  metadata?: Record<string, any>;
  timestamp: number;       // Unix ms
  taskId?: string;         // Required by the actual server call
}

interface ProcessedTask {
  type: string;            // Classified type (ALARM/SMS/CALENDAR/CUSTOM)
  normalizedPrompt: string;
  extractedData: Record<string, any>;
  actions: Action[];
  status: 'SUCCESS' | 'PENDING' | 'ERROR';
  error?: string;
  response?: any;          // The raw MessageResponse from the AI server
}

interface Action {
  type: 'SET_ALARM' | 'SEND_SMS' | 'ADD_CALENDAR_EVENT' | 'LOG' | 'NOTIFY_USER';
  payload: Record<string, any>;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
}

interface ExternalProcessorResponse {
  success?: boolean;
  data?: MessageResponse;  // from src/types/Chat.ts
  error?: string;
}
```

### Internal Classes (all private to the module)

#### 1. `PromptNormalizer`

Cleans and standardizes user input, then extracts structured data.

```ts
normalize(prompt: string): string
// → trim → lowercase → collapse whitespace → strip non-(letter/digit/space/:@-.[])
// Unicode-aware via /\p{L}\p{N}/gu flag

extractData(type: string, prompt: string): Record<string, any>
// Delegates to private methods based on type
```

**Extraction behavior:**

| Type | Regex patterns | Output shape |
|------|---------------|--------------|
| `ALARM` | `/(\d{1,2}):(\d{2})\s*(am\|pm)?/i` | `{ hours, minutes, title: 'Alarm', label }` — converts to 24h |
| `SMS` | phone: `/(?:to\s+)?(\d{10,})/`, msg: `/(?:message\s+)?(.+?)$/` | `{ phoneNumber, message, timestamp }` |
| `CALENDAR` | date: `/(\d{4}-\d{2}-\d{2})/`, time: `/(\d{1,2}):(\d{2})/`, title: `/(?:event\|meeting\|appointment)\s+(.+?)/i` | `{ title, date, time }` |
| `CUSTOM` | none | `{}` |

**AM/PM conversion:** 12:xx PM stays 12, 12:xx AM becomes 00, others ±12 as expected.

#### 2. `TaskClassifier`

Simple keyword matching to pre-classify prompts locally:

```ts
classify(prompt: string): 'ALARM' | 'SMS' | 'CALENDAR' | 'CUSTOM'
```

| Classification | Keywords (case-insensitive) |
|---------------|---------------------------|
| `ALARM` | "alarm", "wake" |
| `SMS` | "sms", "message", "send" |
| `CALENDAR` | "calendar", "event", "appointment" |
| `CUSTOM` | fallback for everything else |

> **Important:** This local classification is a pre-processing hint only. The actual AI intent that drives tool execution comes from the **server's response** (`externalResponseMessage.intent`), not from `TaskClassifier`.

#### 3. `ActionBuilder`

Converts extracted data into typed `Action[]`:

```ts
buildActions(type: string, extractedData: Record<string, any>): Action[]
```

- `ALARM` → `SET_ALARM` (HIGH) — only if `!extractedData.error`
- `SMS` → `SEND_SMS` (NORMAL) — only if `phoneNumber && message`
- `CALENDAR` → `ADD_CALENDAR_EVENT` (NORMAL) — only if `title && date`
- `CUSTOM` → `LOG` (LOW) — always
- If any primary action was added, always appends `NOTIFY_USER` (LOW)

#### 4. `ExternalProcessorHandler`

Manages the network call to the AI backend.

**Active method:**
```ts
async executePayload(prompt: string, taskId: string): Promise<MessageResponse>
```
This calls `sendMessage()` from `src/services/APIs/chat/chatService.ts`:
```ts
sendMessage({
  chatId: taskId,
  tasks: [{
    chatId: taskId,
    message: prompt,     // the normalized prompt
    intent: null,
    confidence: 0.9,
    user_language: 'fa',
  }],
})
// → POST BASE_AI_URL/api/v2/Chat
```

**Deprecated/commented out:** `executeActions()` which POSTed to `BASE_URL/api/v1/Chat`. This code path is fully commented out.

**Validation:**
```ts
validateActions(actions: Action[]): boolean
// SET_ALARM: requires hours + minutes
// SEND_SMS: requires phoneNumber + message
// ADD_CALENDAR_EVENT: requires title + date
// Others: always valid
```

### `InternalProcessor.process()` — Actual Step Order

This is the **actual execution order** in the source code (the step numbering in comments is slightly misleading):

```
Step 1: classify(rawPrompt) → taskType           [local keyword matching]
Step 2: normalize(rawPrompt) → normalizedPrompt   [cleanup]
Step 2.5: externalProcessor.executePayload(normalizedPrompt, taskId)
         → sendMessage() → POST /api/v2/Chat      [AI server call happens HERE]
         → returns MessageResponse stored as response
Step 3: normalizer.extractData(taskType, normalizedPrompt) → extractedData
Step 4: actionBuilder.buildActions(taskType, extractedData) → actions
Step 5: externalProcessor.validateActions(actions)
        → on failure: return { status: 'ERROR', response: null }
Step 6: return ProcessedTask { response, type, normalizedPrompt, extractedData, actions, status: 'SUCCESS' }
```

**Error handling:** All errors in `process()` are caught and return `{ status: 'ERROR', error: message, response: null }`. The method never throws.

**Batch processing:** `processBatch(tasks[])` → `Promise.all(tasks.map(t => this.process(t)))`. Fully parallel.

### Test Coverage

Tests are in `__tests__/InternalProcessor.test.ts`. Run with `npm test` from the `modules/internal_processor/` directory. Covers: PromptNormalizer (4), TaskClassifier (6), Alarm extraction (8), SMS extraction (5), Calendar extraction (5), ActionBuilder (6), Batch processing (5), Error handling (4), Edge cases (5), Metadata/Performance (3).

---

## Full AI Pipeline (End-to-End)

This is the complete request lifecycle from user keystroke to device action:

```
1. User types message in Chat screen
   → Chat.tsx: handleSend({ text, toolType: 'TEXT' })
   → creates Message { isUser: true, toolType: 'TEXT', ... }
   → addMessage(taskId, newMessage) → Zustand messageSlice

2. GlobalLogicProvider detects new message
   → useEffect([messages]) fires
   → checks last message: if !isUser → skip (prevents infinite loop)
   → if isUser → setIsPendingChat(true) → calls handleActionsTools(taskId, text, messages)

3. useToolsHandler.handleActionsTools (src/actions/index.ts)
   → calls handleChatbotMessage(taskId, text)

4. handleChatbotMessage (src/actions/handlers.ts)
   → builds ChatbotTask { type: 'CUSTOM', rawPrompt: text, timestamp, taskId }
   → calls internalProcessor.process(task)

5. internalProcessor.process (modules/internal_processor)
   → classify(rawPrompt) → taskType (local keywords)
   → normalize(rawPrompt) → normalizedPrompt
   → sendMessage({ chatId: taskId, tasks: [{ message: normalizedPrompt, ... }] })
     → POST BASE_AI_URL/api/v2/Chat          ← SERVER CALL (AI inference happens here)
     → returns MessageResponse
   → extractData(taskType, normalizedPrompt) (local regex)
   → buildActions(taskType, extractedData)
   → validateActions(actions)
   → returns ProcessedTask { response: MessageResponse, ... }

6. Back in handleChatbotMessage
   → extracts result.response (MessageResponse from server)
   → parses data.tools[0].responseMessage (JSON string) → externalResponseMessage
   → returns { data, externalResponseMessage, message, success, error }

7. Back in handleActionsTools
   → checks for error / missing response → shows Toast if invalid
   → on first ≤2 messages: extracts response.intent → looks up TASKS_BADGE_CATEGORY
     → updateTask(taskId, { title: userText.trim(), category, categoryColor })
   → checkAndEnsurePermission(externalResponseMessage) → PermissionManager
   → handelActions(externalResponseMessage, taskId)   ← TOOL DISPATCH

8. handelActions switch on externalResponseMessage.intent
   → 'set_alarm'       → setAlarm(hour, minutes, message) via NativeModules.AlarmModule
   → 'set_calendar'    → addCalendarEvent(event) via react-native-calendar-events
   → 'send_sms'        → resolves contact if needed → sendSMSWithLinking(phone, msg)
   → 'make_call'       → resolves contact if needed → makeCallWithLinking(phone)
   → 'send_email'      → sendEmailWithLinking({ email, subject, body, cc, bcc })
   → 'message_to_user' → handleSendMessage(taskId, message) → addMessage to store
   → default           → Logger.warn (unhandled intent)

9. Chat screen re-renders as messages store updates
   → setIsPendingChat(false) in finally block
```

**Key insight:** The `TaskClassifier` inside `internal_processor` determines local pre-processing only. The authoritative intent (`externalResponseMessage.intent`) always comes from the AI server response and drives all tool dispatch decisions.

---

## externalResponseMessage Shape

The AI server returns a `MessageResponse` whose `data.tools[0].responseMessage` is a **stringified JSON** object. After `JSON.parse()`:

```ts
{
  intent: string,        // e.g. 'set_alarm', 'send_sms', 'make_call', 'set_calendar', 'send_email', 'message_to_user'
  message_to_user: string,
  
  // Intent-specific payloads:
  alarm?: { hour: number, minutes: number, message?: string },
  event?: { title: string, description?: string, startDate: string, endDate?: string, ... },
  call?: { contact?: string, phoneNumber?: string },
  phoneNumber?: string,  // for send_sms direct
  contactName?: string,  // for send_sms by name
  message?: string,      // SMS body or message_to_user text
  email?: string,
  subject?: string,
  body?: string,
  cc?: string,
  bcc?: string,
}
```

---

## State Management

### Zustand Store

```ts
// store/index.ts
export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createThemeSlice(...a),
      ...createUserSlice(...a),
      ...createTaskSlice(...a),
      ...createMessageSlice(...a),
      ...createLocalSecuritySlice(...a),
      ...createLoggerSlice(...a),
      ...createAuthSlice(...a),
    }),
    {
      name: 'pishkar-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({        // Only these fields are persisted:
        themeMode: state.themeMode,
        isRTL: state.isRTL,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        tasks: state.tasks,
        activeTaskId: state.activeTaskId,
        messages: state.messages,
        isOnboarded: state.isOnboarded,
        isSelectedPreferences: state.isSelectedPreferences,
      }),
    },
  ),
);
```

`StoreState` = intersection of all 8 slice interfaces.

### Slice Reference

#### `authSlice`
| State | Type | Persisted |
|-------|------|-----------|
| `accessToken` | `string \| null` | No |
| `refreshToken` | `string \| null` | No |
| `expiresIn` | `number \| null` | No |
| `tokenType` | `string \| null` | No |

Actions: `setTokens(tokens)`, `updateTokens(partial)`, `clearTokens()`

#### `taskSlice`
| State | Type | Persisted |
|-------|------|-----------|
| `tasks` | `Task[]` | Yes |
| `activeTaskId` | `string \| null` | Yes |
| `isInitialized` | `boolean` | No |

Actions: `createTask(task)`, `createNewTask()`, `deleteTask(id)`, `updateTask(id, partial)`, `toggleTaskCompletion(id)`, `initializeDefaultTasks()`, `ensureTaskExists(id)`, `setActiveTaskId(id)`, `getActiveTask()`, `getTaskById(id)`, `getAllTasks()`, `getPinnedTasks()`, `getTasksByCategory(cat)`

`createNewTask()` uses `uuidv4()` for IDs. `ensureTaskExists('0')` creates a new task automatically.

#### `messageSlice`
| State | Type | Persisted |
|-------|------|-----------|
| `messages` | `Message[]` | Yes |

Actions: `addMessage(taskId, msg)`, `updateMessage(id, partial)`, `deleteMessage(id)`, `deleteMessagesByTaskId(taskId)`, `getMessagesByTaskId(taskId)`, `getMessageById(id)`, `getMessageCount(taskId)`, `getLatestMessage(taskId)`

#### `userSlice`
| State | Type | Persisted |
|-------|------|-----------|
| `user` | `User \| null` | Yes |
| `isAuthenticated` | `boolean` | Yes |
| `netInfo` | `{ type, isConnected } \| null` | No |
| `isPendingChat` | `boolean` | No |
| `loginModalVisibility` | `boolean` | No |
| `isOnboarded` | `boolean` | Yes |
| `isSelectedPreferences` | `boolean` | Yes |

Actions: `setUser(user)`, `updateUser(partial)`, `logout()`, `completeOnboarding()`, `setIsOnboarded(v)`, `completeSelectedPreferences()`, `setIsPendingChat(v)`, `setNetInfo(info)`, `setLoginModalVisibility(v)`

#### `themeSlice`
| State | Type | Persisted |
|-------|------|-----------|
| `themeMode` | `'light' \| 'dark' \| 'auto'` | Yes |
| `currentTheme` | `Theme` | No (recomputed) |
| `isRTL` | `boolean` | Yes |

Actions: `setThemeMode(mode)`, `updateTheme(systemColorScheme)`, `setRTL(v)`, `toggleRTL()`

`updateTheme` computes `currentTheme` from `themeMode` + system scheme. It uses `I18nManager.forceRTL()` when `setRTL` is called.

#### `localSecuritySlice`
| State | Type | Persisted |
|-------|------|-----------|
| `isLockEnabled` | `boolean` | Yes |
| `isLocked` | `boolean` | No |
| `passwordHash` | `string \| null` (SHA-256) | Yes |
| `isBiometricEnabled` | `boolean` | Yes |
| `biometricType` | `string \| null` | No |

Actions: `enableLock(password)`, `disableLock()`, `lockApp()`, `unlockWithPassword(pwd)`, `unlockWithBiometric()`, `enableBiometric()`, `disableBiometric()`, `changePassword(old, new)`, `activeBiometric(v)`

Password hashing: `sha256(password)` from `js-sha256`. `unlockWithPassword` compares SHA-256 of input against stored hash.
Biometric: calls `promptBiometric('Unlock app')` from `hooks/useBiometric.ts`.

#### `loggerSlice`
| State | Type | Persisted |
|-------|------|-----------|
| `logs` | `LogEntry[]` (max 500, ring buffer) | No |
| `filterLevel` | `LogLevel \| 'all'` | No |

`LogLevel = 'info' \| 'warn' \| 'error' \| 'success' \| 'network'`

Actions: `addLog(level, message, details?)`, `clearLogs()`, `setFilterLevel(level)`

`addLog` uses `.slice(-500)` to keep the buffer bounded.

#### `toastSlice`
Empty stub. Has no state or actions.

### Logger Facade (exported from store/index.ts)

```ts
export const Logger = {
  info:    (message, details?) => { store.addLog('info', ...);    console.log('ℹ️', ...) },
  warn:    (message, details?) => { store.addLog('warn', ...);    console.warn('⚠️', ...) },
  error:   (message, details?) => { store.addLog('error', ...);   console.error('❌', ...) },
  success: (message, details?) => { store.addLog('success', ...); console.log('✅', ...) },
  network: (message, details?) => { store.addLog('network', ...); console.log('🌐', ...) },
};
```

Always use `Logger` — never `console.*` directly. It routes to both the terminal and the in-app Logger screen.

### Composite Selectors (store/index.ts)

```ts
useTaskById(taskId)            // → Task | undefined
useRemoveTaskAndMessages()     // → (taskId) => void  (atomic delete: task + messages)
useCreateMessageDirectly()     // → () => taskId  (creates Task + welcome Message atomically)
useLocalTask(taskId)           // → LocalTask | undefined  (Task merged with messages)
useLocalTasks()                // → LocalTask[]  (all tasks with their messages)
```

**`useCreateMessageDirectly` pattern** (used in Home and TaskList for the FAB):
```ts
const createMessageDirectly = useCreateMessageDirectly();
const taskId = createMessageDirectly(); // creates Task (uuidv4) + randomText welcome message
if (taskId && taskId !== '0') navigation.navigate('Chat', { taskId });
```

### Auth Token Storage (Dual-Location)

Tokens exist in two separate places by design:

1. **`authSlice`** (Zustand in-memory, **NOT persisted**) — populated after login for in-app slice access but NOT used by `apiClient`.
2. **AsyncStorage key `'auth'`** — the source of truth for HTTP calls.

`apiClient` reads from AsyncStorage via `getAuthTokens()`. After successful OTP verification, `useVerifyRegisterOtp.onSuccess` calls `setAuthTokens()` (AsyncStorage). These are the only functions that manage the AsyncStorage auth key:

```ts
// utils/handlers.ts
const AUTH_STORAGE_KEY = 'auth';
getAuthTokens(): Promise<AuthTokens | null>   // reads AsyncStorage
setAuthTokens(tokens): Promise<void>           // writes AsyncStorage
clearAuthTokens(): Promise<void>               // removes from AsyncStorage
```

**`useLogout` behavior:** Clears both AsyncStorage (`clearAuthTokens()`) AND Zustand (`logout()`). Importantly, even on server error (401), it still clears local tokens — because a 401 means the server already considers the session invalid.

---

## API Layer

### Base HTTP Client

```ts
// utils/handlers.ts
export const apiClient = async (url: string, options: RequestInit = {}) => {
  const tokens = await getAuthTokens(); // reads AsyncStorage
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: tokens?.accessToken ? `Bearer ${tokens.accessToken}` : '',
      ...(options.headers || {}),
    },
  });
  const traceId = res.headers.get('x-trace-id') ?? undefined;
  const response = await res.json();
  return { ...response, traceId };  // traceId appended to all responses
};
```

All API responses include an optional `traceId` field injected by the client (not the server).

### Base URLs

Both defined in `utils/constants.ts`:
- `BASE_URL` — Main backend, API v1
- `BASE_AI_URL` — AI inference service, API v2 (used only by `chatService.sendMessage`)
- `BASE_SENTRY_DNS` — Sentry DSN

### Service Layer Pattern

```
services/APIs/{domain}/
  {domain}Services.ts    ← raw async functions, call apiClient directly
  use{Action}.ts         ← TanStack React Query useMutation / useQuery wrapper
```

### Hook Inventory

| Hook | Type | Endpoint | Key behavior |
|------|------|----------|-------------|
| `useRegisterOtp` | mutation | `POST /api/v1/Auth/register-otp` | Logs success with `expiresInSeconds` |
| `useVerifyRegisterOtp` | mutation | `POST /api/v1/Auth/register-otp/verify` | `onSuccess`: calls `setAuthTokens()` (AsyncStorage) |
| `useLogout` | mutation | `POST /api/v1/Auth/logout` | `onSuccess` AND `onError`: clears tokens + calls `logout()` |
| `useRefreshToken` | mutation | `POST /api/v1/Auth/refresh` | `onSuccess`: calls `setAuthTokens()` — **never called automatically** |
| `useFetchIdentityUserInfo` | query (`enabled: false`) | `GET /api/v1/Auth/identity-user-info` | Only runs via `refetch()` / `checkAuth()` |
| `useFetchCurrentUser` | query | `GET /api/v1/Users/{userId}` | By user ID |
| `useUpdateUserContext` | mutation | `POST /api/v1/UserContext` | Sends `{ preferencesItems: Record<string, boolean> }` |
| `useFetchTasksByUserId` | query | tasks endpoint | Scaffolded |
| `useCreateTask` | mutation | tasks endpoint | Scaffolded |

### Network Logger

`useSetupNetworking` (called from `GlobalLogicProvider`) monkey-patches `globalThis.fetch` **once** on startup using a `globalThis.__networkLoggerSetup` guard:

```ts
globalThis.fetch = async (...args) => {
  Logger.network(`→ ${method} ${url}`);
  const response = await originalFetch(...args);
  Logger.network(`← ${response.status} ${method} ${url} (${duration}ms)`, { ... });
  return response;
};
```

All HTTP traffic (including AI calls from `internal_processor`) is automatically logged to the Logger screen.

---

## Navigation

### Route Registry

```ts
type RootStackParamList = {
  OnBoarding: undefined;
  Home: undefined;
  Chat: { taskId: string };        // only route with params
  Settings: undefined;
  TaskList: undefined;
  PersonalVault: undefined;
  InternalProcessorSetting: undefined;
  ErrorPage: undefined;
  PermissionsManager: undefined;
  TerminalLogger: undefined;
  PreferencesSelection: undefined;
  UnLock: undefined;
  Login: undefined;
};
```

`initialRouteName: 'Home'`. The `onReady` callback in App.tsx may immediately redirect to `OnBoarding` or `PreferencesSelection` based on store state.

### Typed Navigation in Components

```ts
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../navigation/Routes';
const navigation = useNavigation<NavigationProp>();
navigation.navigate('Chat', { taskId });
```

### Imperative Navigation (outside React tree)

```ts
import { navigateWithRef } from '../../navigation/navigationRef';
navigateWithRef('PreferencesSelection'); // safe: checks isReady() first
```

### Custom Headers

Every screen exports `Custom{Name}Header` from `Header.tsx`. The navigator wires them via `header:` option in `Routes.ts`. Keep header logic in the screen's own folder.

---

## Data Models

### Task

```ts
interface Task {
  id: string;           // uuidv4
  title: string;        // Initially empty; set from user's first message text
  datetime: string;     // ISO 8601
  completed: boolean;
  pinned: boolean;
  category: string;     // e.g. "تماس", "پیامک", "تقویم", "ایمیل", "هشدار"
  categoryColor: string;// hex color string
}

interface LocalTask extends Task {
  messages: Message[];  // composed in selectors (useLocalTask/useLocalTasks)
}
```

Tasks are created locally (uuidv4). The `title` and `category` are set from the AI's `intent` response on the first exchange via `updateTask()`.

### Message

```ts
interface Message {
  id: string;               // Date.now().toString() — known collision risk
  taskId: string;
  isUser: boolean;
  toolType: MessageType;    // 'TEXT' | 'OTP' | 'CONFIRMATION' | 'LIST_OPTION' | 'ON_DEVICE'
  text?: string;
  status?: 'pending' | 'completed';
  timestamp?: string;       // ISO 8601
  otpPayload?: OtpPayload;
  confirmationPayload?: ConfirmPayload;
  listOptionPayload?: ListOptionPayload;
  ondevicePayload?: { invocationJson: string };
}
```

`toolType` is deliberately `MessageType` not `toolType?: MessageType` — always required.

### MessageType Details

| Type | Payload interface | Renders as |
|------|------------------|-----------|
| `TEXT` | `text` field | Standard bubble |
| `OTP` | `OtpPayload { length, resendLabel?, expiresInSeconds?, text? }` | `<OtpInput>` component |
| `CONFIRMATION` | `ConfirmPayload { options: ConfirmOption[], text? }` | Yes/No button row |
| `LIST_OPTION` | `ListOptionPayload { options: ListOptionItem[], text?, defaultOptionId? }` | Selectable list |
| `ON_DEVICE` | `ondevicePayload.invocationJson` | Not rendered yet |

### User / Auth

```ts
interface User {
  id: string; username: string; email: string;
  firstName: string; lastName: string;
  avatar?: string; isOnboarded: boolean; roles?: string[];
}

interface AuthTokens {
  accessToken: string; refreshToken: string;
  expiresIn: number; tokenType: string;
}
```

Auth flow: phone number (11 digits, starts 09) → OTP (5 digits, 60s timer).

---

## Theme System

### Theme Interface

```ts
interface Theme {
  colors: ColorScheme;
  typography: Typography;
  spacing: Spacing;
  borderRadius: typeof borderRadius;
  elevation: typeof elevation;
}
```

### Color Tokens

Primary: `#00B3A6` (teal). Accent: `#FF7A59` (coral).

| Token | Light | Dark |
|-------|-------|------|
| `background` | `#FFFFFF` | `#0f2321` |
| `surface` | `#f5f8f8ff` | `#273937` |
| `textPrimary` | `#4b4b4b` | `#e6e6e6` |
| `textSecondary` | `#777777` | `#a7a7a7` |
| `border` | `#e5e5e5` | `#1c302eff` |
| `messageBubble` | `#dad7d7d0` | `#323333ff` |
| `inputColor` | `#e0f2f1` | `#183532` |
| `error` | `#E53935` | `#E53935` |
| `success` | `#16A34A` | `#16A34A` |
| `primary` | `#00B3A6` | `#00B3A6` |
| `onPrimary` | `#FFFFFF` | `#FFFFFF` |

### Typography Scale

Font family: `Vazirmatn-Black` (all weights use this family; `fontWeight` is set but the family name implies black weight).

| Variant | Size | Weight | LineHeight |
|---------|------|--------|-----------|
| `h1` | 32px | 700 | 40 |
| `h2` | 24px | 600 | 32 |
| `h3` | 20px | 500 | 28 |
| `h4` | 18px | 500 | 28 |
| `h5` | 16px | 500 | 28 |
| `body` | 16px | 400 | 24 |
| `small` | 14px | 400 | 20 |
| `x_small` | 12px | 300 | 20 |
| `xx_small` | 10px | 200 | 20 |

### Spacing Scale (exact values)

```ts
xsmall: 4, small: 8, medium: 12, large: 16,
xlarge: 24, xxlarge: 32, xxxlarge: 48
```

### Border Radius & Elevation

```ts
borderRadius: { small: 8, medium: 16, large: 24 }
elevation: { none: 0, xsmall: 1, small: 2, medium: 4, large: 8 }
```

### Consuming Theme

**Always** read from the Zustand store — never from the `useTheme()` hook (which exists but is bypassed in practice):

```ts
const theme = useStore(state => state.currentTheme);
const isRTL  = useStore(state => state.isRTL);
```

---

## UI Architecture

### Component Primitives

Import from the barrel at `../../components`:
```ts
import { Button, View, Text, Image, ScrollView, IconButton } from '../../components';
import MaterialIcon from '../../components/MaterialIcon';
import Spinner from '../../components/loading/Spinner';
```

Custom `View` accepts `variant` prop (e.g. `variant="surface"`). Custom `Text` accepts `variant` (typography scale) and `color` (`'primary' | 'secondary' | 'error'` etc.). Always prefer these over bare RN components.

### Styles-Inside-Function Pattern

`StyleSheet.create()` is defined **inside the component function body** to close over `theme` and `isRTL`. This is the established convention — do not move styles to module level:

```ts
export default function MyScreen() {
  const theme = useStore(state => state.currentTheme);
  const isRTL  = useStore(state => state.isRTL);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
  });

  return <View style={styles.container}>...</View>;
}
```

### RTL Layout Pattern

Every directional style must be conditioned on `isRTL`:

```ts
flexDirection: isRTL ? 'row' : 'row-reverse',
textAlign: isRTL ? 'right' : 'left',
[isRTL ? 'right' : 'left']: theme.spacing.large,  // FAB/absolute positioning
paddingLeft: isRTL ? theme.spacing.large : 48,     // icon-padded inputs
```

### Toast Notifications

```ts
import Toast from 'react-native-toast-message';
// Always include fontFamily in text*Style for correct Persian rendering:
Toast.show({
  type: 'error',   // 'error' | 'success' | 'info'
  text1: 'عنوان خطا',
  text2: 'پیام خطا',
  text2Style: { fontFamily: typography.fontFamily, fontSize: 14 },
  autoHide: false,   // for errors; true for info/success
  visibilityTime: 3000,
});
```

### Chat Message Rendering (`screens/chat/components/renderChatMessage.tsx`)

The `ChatMessage` component switches on `message.toolType`:

- **TEXT/default**: plain bubble with `message.text`
- **OTP**: renders `<OtpInput length={otpPayload.length}>` — calls `onOtpComplete(id, code)` when all digits filled
- **CONFIRMATION**: two buttons from `confirmationPayload.options[]` — calls `onConfirm(id, option)` on tap
- **LIST_OPTION**: selectable list from `listOptionPayload.options[]` — tracks selection via `defaultOptionId` — calls `onSelectOption(id, option)` on tap

When a non-TEXT message is completed, `Chat.tsx`:
1. Creates a new user `Message` with the selection/response text
2. Calls `updateMessage(id, { status: 'completed', ... })` on the original assistant message
3. Optionally updates `listOptionPayload.defaultOptionId` for LIST_OPTION

OTP input (`OtpInput.tsx`): configurable `length`, optional `expiresInSeconds` countdown, digit-by-digit refs with auto-advance, backspace-navigate, always LTR regardless of app RTL setting.

---

## Tool Implementations

### `tools/MessageToUser.ts` — Critical Pattern

Uses `useStore.getState()` (not a React hook) to write to the store from outside the React tree:

```ts
import { useStore } from '../../store';

export const handleSendMessage = (taskId: string, inputText: string) => {
  const { addMessage } = useStore.getState();  // imperative access
  const newMessage: Message = {
    id: Date.now().toString(),
    taskId,
    text: inputText.trim(),
    isUser: false,                             // bot message
    timestamp: new Date().toISOString(),
  };
  addMessage(taskId, newMessage);
};
```

Note: `toolType` is not set in the message created by `handleSendMessage`. This may cause the renderer to fall through to `default` (TEXT rendering).

### `tools/SMS.ts`

```ts
sendSMSWithLinking(phoneNumber, message)
// → Linking.openURL(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`)
```

The library `react-native-sms` is installed but commented out in favor of `Linking`.

### `tools/call.ts`

```ts
makeCallWithLinking(phoneNumber)
// → Linking.openURL(`tel:${phoneNumber}`)
```

### `tools/email.ts`

```ts
sendEmailWithLinking({ email, subject, body, cc, bcc })
// → builds mailto: URL with encoded query params → Linking.openURL()

composeEmail({ email, subject, body, cc, bcc })
// → openComposer from react-native-email-link (shows email app picker)

openEmailInbox()
// → openInbox from react-native-email-link
```

### `tools/alarm.ts`

Uses a custom native Android module `NativeModules.AlarmModule`. Methods:
- `setAlarm(hour, minute, message?, skipUI)` — one-time alarm
- `setRepeatingAlarm(id, hour, minute, message, intervalMinutes)`
- `cancelAlarm(id)`
- `createTimer(durationSeconds, message, skipUI)`
- `openAlarms()`, `openTimers()`, `openStopwatch()`

The old `Linking` approach is commented out with a note that it only works on Android 7-10.

### `tools/calendar.ts`

Full `IncomingCalendarEvent` interface accepted:
```ts
{ title, description?, startDate, endDate?, allDay?, location?,
  timezone?, calendarId?, recurrenceRule?, alarms? }
```

`addCalendarEvent()` flow:
1. Requests calendar permission via `RNCalendarEvents.requestPermissions()`
2. Resolves calendar ID: tries `requestedId` → "primary" keyword → exact ID → title match → primary calendar → first writable → first available
3. Builds `CalendarEventWritable`: note description is `notes` on iOS, `description` on Android
4. Handles recurrence rules — **known bug fix**: sets `endDate = undefined` when `recurrenceRule` is present (prevents crash)
5. Calls `RNCalendarEvents.saveEvent(title, eventDetails)`

### `tools/contact.ts`

Full CRUD wrapper around `react-native-contacts` with `Logger` integration. Key functions:
- `checkPermission()` / `requestPermission()` — cross-platform
- `getAll()`, `getAllWithoutPhotos()`, `getByName(name)` — fuzzy name match
- `getContactsMatchingString(text)`, `getContactsByPhoneNumber(phone)`, `getContactsByEmailAddress(email)`
- `addContact()`, `openContactForm()`, `updateContact()`, `editExistingContact()`
- `deleteContact()`, `deleteContactById()`
- Full `ContactsAPI` object exported for convenience

`getByName` fetches ALL contacts then filters in-memory (case-insensitive substring match on `givenName + familyName`). For SMS/call tools that receive a `contactName`, the handler calls `getByName` and uses `matches[0].phoneNumbers[0].number`.

---

## Permissions

`PermissionManager` class — all static methods:

```ts
PermissionManager.checkActionPermission(action)    → PermissionResponse
PermissionManager.requestActionPermissions(action) → PermissionResponse
PermissionManager.ensurePermission(action)         → Promise<boolean>
PermissionManager.checkMultipleActions(actions[])  → BatchPermissionResponse
PermissionManager.requestMultipleActions(actions[])→ BatchPermissionResponse
PermissionManager.getPermissionDetails(action)     → debug info (both platforms)
```

`PermissionAction` type: `'SET_ALARM' | 'SEND_SMS' | 'ADD_CALENDAR_EVENT' | 'MAKING_CALL' | 'SEND_EMAIL_WITH_LINKING' | 'LOG' | 'NOTIFY_USER' | 'CONTACTS' | 'MESSAGE_TO_USER'`

**`ensurePermission` logic:**
1. Check if already granted → return `true`
2. If BLOCKED → warn, return `false` (user must go to Settings)
3. If UNAVAILABLE → return `true` (not applicable on this platform)
4. Request → return `isGranted`

**Android permission mappings:**

| Action | Android Permissions |
|--------|---------------------|
| `SET_ALARM` | `SCHEDULE_EXACT_ALARM` |
| `SEND_SMS` | `SEND_SMS`, `READ_CONTACTS`, `WRITE_CONTACTS` |
| `ADD_CALENDAR_EVENT` | `READ_CALENDAR`, `WRITE_CALENDAR` |
| `MAKING_CALL` | `READ_CONTACTS`, `WRITE_CONTACTS` |
| `NOTIFY_USER` | `POST_NOTIFICATIONS` |
| `CONTACTS` | `READ_CONTACTS`, `WRITE_CONTACTS` |
| `SEND_EMAIL_WITH_LINKING`, `LOG`, `MESSAGE_TO_USER` | (none — auto-granted) |

iOS: most actions have empty permission arrays (handled by system/Linking).

---

## Key Screens

### Home
- Recent activities list (hardcoded mock data — not from store)
- FAB ("از پیشکار بپرس") + bottom input bar both call `useCreateMessageDirectly()` → navigate to Chat
- Uses `* as Sentry` import — available for manual error capture

### Chat
- Receives `taskId` via `route.params`
- Filters `messages` by `msg.taskId === taskId`
- Offline guard: if `!netInfo?.isConnected` → Toast + early return
- `handleSend` creates user message → `addMessage` → also adds a local placeholder assistant response (the real response arrives via `GlobalLogicProvider`)
- Shows `<Spinner>` in place of send button when `isPendingChat === true`
- Auto-scrolls via `onContentSizeChange → scrollViewRef.current?.scrollToEnd()`

### TaskList
- Lists all tasks from store; handles empty state
- Completion: `toggleTaskCompletion(id)`
- Delete: `useRemoveTaskAndMessages(id)` (atomic — task + all its messages)
- Tap task row → `navigate('Chat', { taskId: task.id })`

### Settings
- Sections: Account, Appearance, Security, About, Danger Zone
- Dark mode toggle → `setThemeMode`
- Biometric toggle → `activeBiometric(value)` (note: sets `isLockEnabled`, not `isBiometricEnabled`)
- Login/Logout: shows LoginModal via `setLoginModalVisibility(true)` or `useLogout` mutation
- Data deletion: countdown modal with `INITIAL_DELETE_COUNTDOWN`

### Onboarding
- 3 horizontal slides (horizontal pagingEnabled ScrollView), each `SCREEN_WIDTH` wide
- Dot indicators: active = 32px wide primary-colored, inactive = 10px wide surface-colored
- Skip/Next/Start buttons. `handleStart()` → `completeOnboarding()` → navigate Home

### PreferencesSelection
- `preferences` array from `constants.ts` (~50 items)
- Each: `{ name, description, faName, image, isFollowed }`
- On save: `useUpdateUserContext.mutate({ preferencesItems: Record<string, boolean> })`
- After success: `completeSelectedPreferences()`

### UnlockPage (screen) vs UnlockModal (common modal)
Both exist and are visually similar (biometric pulse animation + password form). The screen (`screens/unlock/`) is a full-screen route. The modal (`common/commonUI/UnlockModal.tsx`) is rendered in `GlobalLogicProvider` with `visible={false}` (not yet activated).

### Logger / TerminalLogger
Reads `logs` from `loggerSlice`. Filters by `filterLevel`. Developer-only tool; accessible via the `TerminalLogger` route (headerShown: false).

### InternalProcessorSetting
Stub — uses bare `react-native` imports instead of the design system. Has no logic. Treat as placeholder.

---

## Common Utilities

### Task Creation + Chat Navigation

```ts
const createMessageDirectly = useCreateMessageDirectly();
const taskId = createMessageDirectly(); // uuidv4 task + welcome message from randomText()
if (taskId && taskId !== '0') navigation.navigate('Chat', { taskId });
```

### Atomic Task + Message Deletion

```ts
const removeTaskAndMessages = useRemoveTaskAndMessages();
removeTaskAndMessages(taskId); // deletes task AND all messages for that taskId
```

### Date/Time Formatting

```ts
import { formatTime, formatDateTimeLocale } from '../../utils/DateTimeUtils';
formatTime(timestamp)               // → "03:07 AM" (12h)
formatDateTimeLocale(timestamp)     // → "12-15-2025 9:00 AM"
formatDateTimeLocale(timestamp, true) // → "12-15-2025 09:07:00" (for Logger screen)
```

### Random Welcome Text

```ts
import { randomText } from '../../utils/handlers';
import { WELCOME_TEXT_MESSAGES } from '../../utils/constants';
const text = randomText(WELCOME_TEXT_MESSAGES); // picks random Persian welcome phrase
```

### Navigating Outside React Tree

```ts
import { navigateWithRef } from '../../navigation/navigationRef';
navigateWithRef('PreferencesSelection');  // safe outside components
```

### Getting Store State Outside React

```ts
import { useStore } from '../../store';
const { addMessage } = useStore.getState(); // imperative, like in MessageToUser.ts
```

---

## Coding Conventions

1. **Import from component barrel**: `import { Button, View, Text } from '../../components'` — never from subfolders directly.
2. **Theme from store**: `const theme = useStore(state => state.currentTheme)` — not `useTheme()`.
3. **Styles inside function body**: `StyleSheet.create({...})` inside the component, closing over `theme` and `isRTL`.
4. **Logger not console**: `import { Logger } from '../../store'` everywhere.
5. **Toast for feedback**: `import Toast from 'react-native-toast-message'` — always set `fontFamily` in `text*Style` for Persian text.
6. **Slice factory naming**: `createXxxSlice` function + `XxxSlice` interface, both exported from the slice file.
7. **Service layer separation**: raw functions in `{entity}Services.ts`, hooks in `use{Action}.ts`.
8. **Screen barrel**: every screen folder has `index.js` re-exporting the screen + `Custom*Header`.
9. **Task IDs use uuidv4**: `Message` IDs currently use `Date.now().toString()` — known inconsistency.
10. **All user strings in Persian**: including error messages in toasts. Internal log messages use English.
11. **`handelActions` typo is intentional**: The main intent dispatcher is spelled `handelActions` (not `handleActions`) in `src/actions/handlers.ts`. Do not rename it.
12. **`userSarvices.ts` typo is intentional**: The file is named `userSarvices.ts` (not `userServices.ts`). Do not rename it.

---

## Known Constraints and Pitfalls

1. **Auth tokens NOT in authSlice for HTTP**: `apiClient` reads from AsyncStorage. Do not try to read `useStore(s => s.accessToken)` for HTTP calls.

2. **Token refresh is never triggered automatically**: `useRefreshToken` exists but no interceptor calls it on 401. The app silently fails authenticated requests when the token expires.

3. **Message IDs may collide**: `Date.now().toString()` used for message IDs will collide under rapid-fire messages (e.g., bot response delayed by 1ms). Should be `uuidv4()`.

4. **`GlobalLogicProvider` fires on EVERY message change**: The `useEffect` dependency is the full `messages` array reference. Every new message triggers the whole pipeline check. The `!isUser` guard prevents loops, but be careful adding logic here.

5. **`internal_processor` calls the server BEFORE local extraction**: Step 2.5 in `process()` sends to the AI server using the normalized prompt. The local `extractData` (step 3) runs afterward — its results go into `ProcessedTask.extractedData` but the actual intent that drives execution comes from `externalResponseMessage.intent` (server response). Local extraction is informational/unused in the main flow.

6. **Alarm module is Android-only**: `NativeModules.AlarmModule` has no iOS implementation.

7. **Calendar recurrence crash fix**: Setting `endDate = undefined` when `recurrenceRule` is present prevents a crash in `react-native-calendar-events`. Do not remove this.

8. **`AvatarSelectorModal` is inactive**: Rendered in Chat with `visible={false}`. Not functional.

9. **`UnlockModal` in GlobalLogicProvider is inactive**: Rendered with `visible={false}`. The actual unlock screen is the `UnLock` route.

10. **`InternalProcessorSetting` uses bare RN imports**: Bypasses the design system. Treat as a stub.

11. **Multiple empty stubs**: `utils/enums.ts`, `utils/string.ts`, `utils/ErrorManager.ts`, `utils/Analytics.ts`, `utils/EncryptedStore.ts`, `store/slices/toastSlice.ts`, `types/AppConfigInterface.ts` are all empty. Do not import from them expecting functionality.

12. **`useFetchIdentityUserInfo` has `enabled: false`**: It only runs when `refetch()` is explicitly called. It will never auto-fetch on mount by itself.

13. **`getByName` contact lookup is O(n)**: Fetches ALL device contacts then filters in-memory. On devices with large contact lists, this may be slow.

---

## Extension Guidelines

### Adding a New AI Tool / Intent

1. Create `src/actions/tools/{newTool}.ts` with the execution function.
2. Add the `PermissionAction` variant to `PermissionManager.ts` and map its Android/iOS permissions in `actionPermissionMap`.
3. Add the intent key → action mapping in `ACTION_TO_INTENT_MAP` in `src/actions/handlers.ts`.
4. Add a new `case '{intent}':` block to `handelActions()` in `src/actions/handlers.ts`.
5. Optionally add to `TASKS_BADGE_CATEGORY` in `utils/constants.ts` for task categorization.

### Adding a New Screen

1. Create `src/screens/NewName/NewName.tsx`, `Header.tsx`, `index.js`.
2. Add `NewName: undefined` (or with params) to `RootStackParamList` in `navigation/Routes.ts`.
3. Import and register in the `RootStack` object in `Routes.ts`.
4. Add a test file `newName.test.tsx`.

### Adding a New Zustand Slice

1. Create `src/store/slices/newSlice.ts` exporting `NewSlice` interface and `createNewSlice` factory function.
2. Add `& NewSlice` to `StoreState` in `store/index.ts`.
3. Add `...createNewSlice(...a)` inside the store composer.
4. Add any fields that need persistence to the `partialize` object.

### Adding a New Chat Message Type

1. Add the type name to `MessageType` union in `types/Chat.ts`.
2. Define the payload interface (e.g. `NewTypePayload`) in `types/Chat.ts`.
3. Add the optional `newTypePayload?` field to `Message` interface.
4. Add a `case 'NEW_TYPE':` to `renderBubbleContent()` in `screens/chat/components/renderChatMessage.tsx`.
5. Add a callback prop to `ChatMessage` and wire it from `Chat.tsx`'s `handleSend`.

### Adding a New API Service

1. Add the raw function to `services/APIs/{domain}/{domain}Services.ts` using `apiClient`.
2. Create `services/APIs/{domain}/use{Action}.ts` with `useMutation` or `useQuery`.
3. Log with `Logger.success` / `Logger.error` in callbacks.
4. Show user feedback with `Toast.show`.

---

## Things Future Agents Must Know

- **`APP_PERSIAN_NAME`** from `constants.ts` is the user-visible Persian app name shown in the UI.
- **`DEFAULT_TASKS`** (10 items) seeds the task list on first launch via `initializeDefaultTasks()`.
- **`WELCOME_TEXT_MESSAGES`** is a list of Persian welcome messages; `randomText()` picks one for each new chat.
- **`preferences`** array in `constants.ts` has ~50 interest categories used by `PreferencesSelection` screen.
- The `doc_call_api_flow.webp` image in `src/services/` is documentation — not code.
- `MaterialIcon` uses Material Symbols names in snake_case. Pass `name`, `size`, `color`, optional `filled` (boolean) props.
- The navigation `onReady` logic in `App.tsx` is the only place that enforces the onboarding/preferences flow. There are no route guards inside the navigator.
- `useLogout` clears auth tokens even on server error — this is intentional.
- All tools use `Linking` (opens native apps) rather than executing actions programmatically — by design, for user confirmation and to avoid complex permissions.
- The `internal_processor` module is designed to be extended: add new `TaskClassifier` keywords, `ActionBuilder` cases, and `PromptNormalizer.extractData` branches together when adding local-only processing. Server-driven intents do not require changes to this module.
- Running tests for `internal_processor`: `cd modules/internal_processor && npm test`
- Running app tests: `cd mobile && npm test` (uses Jest with `jest.config.js` at mobile root)

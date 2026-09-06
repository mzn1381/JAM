# Internal Processor Module

## Test Coverage Summary

Comprehensive unit tests have been created to ensure full correctness and stability across all core components.

### ✅ PromptNormalizer (4 tests)

- Extra spaces removal
- Lowercase conversion
- Special character removal
- Whitespace trimming

### ✅ TaskClassifier (6 tests)

- ALARM classification
- SMS classification
- CALENDAR classification
- CUSTOM (unknown) tasks
- Case-insensitivity

### ✅ Alarm Data Extraction (8 tests)

- 24-hour format
- 12-hour format with AM/PM
- PM time conversion
- Noon/Midnight handling
- Zero padding
- Invalid time handling

### ✅ SMS Data Extraction (5 tests)

- Phone number and message extraction
- Different phone formats
- Multi-word messages
- Timestamp handling
- Missing data handling

### ✅ Calendar Data Extraction (5 tests)

- Title, date, time extraction
- Default date/time values
- Different date formats
- Multi-word event names

### ✅ ActionBuilder (6 tests)

- SET_ALARM actions
- SEND_SMS actions
- ADD_CALENDAR_EVENT actions
- NOTIFY_USER actions
- Invalid data handling

### ✅ Batch Processing (5 tests)

- Parallel processing
- Empty batches
- Large batches (100 tasks)
- Mixed success/failure
- Order preservation

### ✅ Error Handling (4 tests)

- Graceful error handling
- Empty prompts
- Error messages
- Malformed input

### ✅ Edge Cases (5 tests)

- Very long prompts
- Unicode characters
- Numbers in messages
- URLs in prompts
- Multiple phone numbers

### ✅ Metadata & Performance (3 tests)

- Metadata preservation
- Single task performance
- Batch performance (50 tasks)

---

## Running Tests

```bash
# Install Jest if not already installed
npm install --save-dev jest @types/jest ts-jest

# Run all tests
npm test

# Run specific test file
npm test internalProcessor.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

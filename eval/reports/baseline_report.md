# iChAt RAG Baseline

> Evaluation snapshot generated at `2026-10-07T17:23:07`

## 1. Run Summary

| Item | Value |
|---|---:|
| Dataset samples | 14 |
| Average retrieved contexts | 8.00 |
| Average answer length | 171 chars |

## 2. Core Metrics

| Metric | Mean | Median | Min | Max | Coverage |
|---|---:|---:|---:|---:|---:|
| `faithfulness` | 0.8010 | 1.0000 | 0.0000 | 1.0000 | 100.0% |
| `context_precision` | 0.6738 | 0.7500 | 0.0000 | 1.0000 | 100.0% |
| `context_recall` | 0.7500 | 1.0000 | 0.0000 | 1.0000 | 100.0% |
| `answer_relevancy` | N/A | N/A | N/A | N/A | 0.0% |

## 3. Metric Interpretation

- **Faithfulness:** آیا پاسخ تولیدشده توسط مدل با شواهد بازیابی‌شده سازگار است؟
- **Context Precision:** آیا chunkهای مرتبط در رتبه‌های بالاتر Retrieval قرار گرفته‌اند؟
- **Context Recall:** آیا اطلاعات لازم برای پاسخ در chunkهای بازیابی‌شده وجود دارد؟
- **Answer Relevancy:** آیا پاسخ واقعاً به سؤال کاربر مرتبط است؟

## 4. Evaluation Coverage

- `faithfulness` → **AVAILABLE**
- `context_precision` → **AVAILABLE**
- `context_recall` → **AVAILABLE**
- `answer_relevancy` → **PARTIAL / MISSING 14**

## 5. Lowest-Scoring Cases

### faithfulness

| Case | Score | Question |
|---|---:|---|
| CASE-001 | 0.0000 | طبق آیین‌نامه سطح دو، در حالت معمول و بدون استثنا، حداقل و حداکثر واحد هر نیمسال چقدر است؟ |
| CASE-014 | 0.0000 | اصلاح می‌کنم؛ منظورم سطح چهار بود. سقف معمول آن چقدر است؟ |
| CASE-007 | 0.5000 | طبق آیین‌نامه سطح دو، طلبه ممتاز با موافقت گروه علمی‌ـ‌تربیتی، در نخستین نیمسال بعد حداکثر چند وا... |
| CASE-009 | 0.7143 | در حالت معمول هر ترم حداکثر چند واحد می‌توانم بردارم؟ |
| CASE-002 | 1.0000 | طبق آیین‌نامه سطح سه، در شیوه غیرحضوری و بدون استثنا، حداقل و حداکثر واحد هر نیمسال چقدر است؟ |

### context_precision

| Case | Score | Question |
|---|---:|---|
| CASE-006 | 0.0000 | سقف معمول واحد در سطح دو و سطح چهار، بدون استثنا، چقدر است و چند واحد اختلاف دارد؟ |
| CASE-009 | 0.0000 | در حالت معمول هر ترم حداکثر چند واحد می‌توانم بردارم؟ |
| CASE-007 | 0.3750 | طبق آیین‌نامه سطح دو، طلبه ممتاز با موافقت گروه علمی‌ـ‌تربیتی، در نخستین نیمسال بعد حداکثر چند وا... |
| CASE-010 | 0.5000 | طبق آیین‌نامه سطح سه، هر نیمسال چند هفته است، چند هفته درسی و چند هفته امتحان دارد و سقف معمول وا... |
| CASE-012 | 0.6250 | اگر حضوری باشم چطور؟ |

### context_recall

| Case | Score | Question |
|---|---:|---|
| CASE-007 | 0.0000 | طبق آیین‌نامه سطح دو، طلبه ممتاز با موافقت گروه علمی‌ـ‌تربیتی، در نخستین نیمسال بعد حداکثر چند وا... |
| CASE-009 | 0.0000 | در حالت معمول هر ترم حداکثر چند واحد می‌توانم بردارم؟ |
| CASE-006 | 0.5000 | سقف معمول واحد در سطح دو و سطح چهار، بدون استثنا، چقدر است و چند واحد اختلاف دارد؟ |
| CASE-012 | 0.5000 | اگر حضوری باشم چطور؟ |
| CASE-014 | 0.5000 | اصلاح می‌کنم؛ منظورم سطح چهار بود. سقف معمول آن چقدر است؟ |

## 6. Baseline Notes

- Answer Relevancy has no valid values and must be treated as N/A, not zero.
- Metric coverage is incomplete; baseline comparisons should use both score and coverage.
- No composite overall score is calculated. The four RAGAS metrics represent different quality dimensions.
- This baseline is a snapshot of the current system and should be kept unchanged for future regression comparison.

## 7. Case-Level Results

| Case | Contexts | Faithfulness | Context Precision | Context Recall | Answer Relevancy |
|---|---:|---:|---:|---:|---:|
| CASE-001 | 8 | 0.0000 | 1.0000 | 1.0000 | N/A |
| CASE-002 | 8 | 1.0000 | 1.0000 | 1.0000 | N/A |
| CASE-003 | 8 | 1.0000 | 1.0000 | 1.0000 | N/A |
| CASE-004 | 8 | 1.0000 | 0.8135 | 1.0000 | N/A |
| CASE-005 | 8 | 1.0000 | 0.7500 | 1.0000 | N/A |
| CASE-006 | 8 | 1.0000 | 0.0000 | 0.5000 | N/A |
| CASE-007 | 8 | 0.5000 | 0.3750 | 0.0000 | N/A |
| CASE-008 | 8 | 1.0000 | 0.9762 | 1.0000 | N/A |
| CASE-009 | 8 | 0.7143 | 0.0000 | 0.0000 | N/A |
| CASE-010 | 8 | 1.0000 | 0.5000 | 1.0000 | N/A |
| CASE-011 | 8 | 1.0000 | 1.0000 | 1.0000 | N/A |
| CASE-012 | 8 | 1.0000 | 0.6250 | 0.5000 | N/A |
| CASE-013 | 8 | 1.0000 | 0.7500 | 1.0000 | N/A |
| CASE-014 | 8 | 0.0000 | 0.6429 | 0.5000 | N/A |

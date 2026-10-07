from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import math
import platform
import re
import statistics
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


REPORTER_VERSION = "1.0.0"

METRICS = {
    "faithfulness": "Faithfulness",
    "context_precision": "Context Precision",
    "context_recall": "Context Recall",
    "answer_relevancy": "Answer Relevancy",
}

STATUS_LABELS = {
    "valid": "معتبر",
    "absent": "فیلد غایب",
    "null": "مقدار null",
    "non_finite": "NaN یا Infinity",
    "invalid_type": "نوع نامعتبر",
    "out_of_range": "خارج از بازه",
}

MISSING_STATUSES = {"absent", "null", "non_finite"}

CITATION_PATTERN = re.compile(r"\[ID:\s*(\d+)\s*\]", re.IGNORECASE)


def escape(value):
    return html.escape(str(value), quote=True)


def display(value):
    return "N/A" if value is None else f"{value:.4f}"


def percent(value):
    return "N/A" if value is None else f"{value * 100:.1f}%"


def sha256(data: bytes):
    return hashlib.sha256(data).hexdigest()


def json_safe(value):
    """Convert non-finite floats to null without changing ordinary strings."""
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if isinstance(value, dict):
        return {key: json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [json_safe(item) for item in value]
    return value


def write_json(path, value):
    path.write_text(
        json.dumps(
            json_safe(value),
            ensure_ascii=False,
            indent=2,
            allow_nan=False,
        ),
        encoding="utf-8",
    )


def read_json(path):
    try:
        # Python's parser accepts NaN / Infinity in legacy exports.
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"{path}: JSON نامعتبر یا ناقص؛ "
            f"خط {exc.lineno}، ستون {exc.colno}: {exc.msg}"
        ) from exc


def validate_input(data):
    if not isinstance(data, list) or not data:
        raise ValueError("ورودی باید یک آرایه غیرخالی از نمونه‌ها باشد.")

    for index, row in enumerate(data, start=1):
        if not isinstance(row, dict):
            raise ValueError(f"نمونه {index}: باید object باشد.")

        for field in ("user_input", "response", "reference"):
            if not isinstance(row.get(field), str):
                raise ValueError(
                    f"نمونه {index}: فیلد {field} باید رشته باشد."
                )

        contexts = row.get("retrieved_contexts")
        if not isinstance(contexts, list) or not all(
            isinstance(item, str) for item in contexts
        ):
            raise ValueError(
                f"نمونه {index}: retrieved_contexts باید فهرستی از رشته‌ها باشد."
            )


def classify_score(row, metric):
    if metric not in row:
        return None, "absent"

    value = row[metric]

    if value is None:
        return None, "null"

    # bool is a subclass of int, but is not an acceptable metric score.
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None, "invalid_type"

    if isinstance(value, float) and not math.isfinite(value):
        return None, "non_finite"

    if not 0 <= value <= 1:
        return None, "out_of_range"

    return float(value), "valid"


def aggregate(values, total, statuses, threshold):
    count = len(values)

    return {
        "total": total,
        "valid": count,
        "missing": sum(statuses[key] for key in MISSING_STATUSES),
        "invalid": statuses["invalid_type"] + statuses["out_of_range"],
        "coverage": count / total,
        "mean": statistics.mean(values) if values else None,
        "median": statistics.median(values) if values else None,
        "std_sample": statistics.stdev(values) if count > 1 else None,
        "min": min(values) if values else None,
        "max": max(values) if values else None,
        "zero_count": sum(value == 0 for value in values),
        "below_review_threshold": sum(
            value < threshold for value in values
        ),
        "status_counts": {
            key: statuses[key] for key in STATUS_LABELS
        },
    }


def analyze(data, threshold, citation_base):
    samples = []

    for index, row in enumerate(data, start=1):
        scores = {}
        score_status = {}
        review_reasons = []

        for metric in METRICS:
            value, status = classify_score(row, metric)
            scores[metric] = value
            score_status[metric] = status

            if status != "valid":
                review_reasons.append(
                    f"{metric}: {STATUS_LABELS[status]}"
                )
            elif value < threshold:
                review_reasons.append(
                    f"{metric}: کمتر از آستانه بازبینی"
                )

        if not row["response"].strip():
            review_reasons.append("پاسخ خالی")

        if not row["reference"].strip():
            review_reasons.append("پاسخ مرجع خالی")

        if not row["retrieved_contexts"]:
            review_reasons.append("فهرست Context خالی")

        cited_ids = [
            int(match)
            for match in CITATION_PATTERN.findall(row["response"])
        ]

        invalid_citation_ids = None
        if citation_base is not None:
            context_count = len(row["retrieved_contexts"])
            invalid_citation_ids = [
                cited_id
                for cited_id in cited_ids
                if not (
                    citation_base
                    <= cited_id
                    < citation_base + context_count
                )
            ]
            if invalid_citation_ids:
                review_reasons.append("شناسه استناد خارج از محدوده")

        samples.append({
            "sample_id": f"Q{index:04d}",
            "question_sha256": sha256(
                row["user_input"].encode("utf-8")
            ),
            "user_input": row["user_input"],
            "response": row["response"],
            "reference": row["reference"],
            "retrieved_contexts": row["retrieved_contexts"],
            "context_count": len(row["retrieved_contexts"]),
            "response_chars": len(row["response"]),
            "scores": scores,
            "score_status": score_status,
            "cited_ids": cited_ids,
            "invalid_citation_ids": invalid_citation_ids,
            "review_reasons": review_reasons,
        })

    metric_summary = {}
    for metric in METRICS:
        values = [
            sample["scores"][metric]
            for sample in samples
            if sample["score_status"][metric] == "valid"
        ]
        statuses = Counter(
            sample["score_status"][metric] for sample in samples
        )
        metric_summary[metric] = aggregate(
            values, len(samples), statuses, threshold
        )

    return samples, metric_summary


def make_notes(samples, metric_summary):
    notes = [
        "این گزارش فقط امتیازهای ورودی را تجمیع می‌کند؛ "
        "ارزیابی معنایی جدید انجام نشده است.",
        "میانگین هر معیار فقط بر مقادیر معتبر همان معیار محاسبه شده؛ "
        "مقادیر ناموجود یا نامعتبر صفر محسوب نشده‌اند.",
        "پوشش معتبر، نسبت امتیازهای عددی معتبر به کل نمونه‌هاست؛ "
        "این شاخص صحت داوری ارزیاب را تضمین نمی‌کند.",
        "آستانه بازبینی صرفاً برای اولویت‌بندی بررسی است؛ "
        "معادل معیار پذیرش محصول یا تشخیص قطعی خطا نیست.",
        "نرخ پاسخ صحیح، کامل‌بودن پاسخ و صحت معنایی استنادها "
        "با این گزارش اندازه‌گیری نشده‌اند.",
        "بررسی اختیاری IDها فقط محدوده عددی استناد را کنترل می‌کند، "
        "نه پشتیبانی معنایی منبع از ادعا.",
        "اطلاعات مدل و تنظیمات در metadata توسط کاربر اعلام می‌شود "
        "و گزارش‌ساز آن‌ها را مستقلاً تأیید نمی‌کند.",
        "برای مقایسه معتبر، مجموعه آزمون، منابع و پروتکل ارزیابی "
        "باید ثابت و نسخه‌بندی‌شده باشند.",
        "زمان پاسخ‌گویی، مصرف توکن و هزینه در ساختار فعلی موجود نیست.",
    ]

    for metric, result in metric_summary.items():
        if result["valid"] == 0:
            notes.append(
                f"{metric}: هیچ امتیاز معتبر موجود نیست؛ "
                "نتیجه‌گیری درباره این معیار ممکن نیست."
            )
        elif result["coverage"] < 1:
            notes.append(
                f"{metric}: پوشش ناقص است؛ میانگین ممکن است "
                "به علت ناموجودبودن غیرتصادفی امتیازها سوگیرانه باشد."
            )

    if len(samples) < 30:
        notes.append(
            "تعداد نمونه‌ها کم است؛ نتایج را توصیفی و مقدماتی بدانید. "
            "عدد ۳۰ یک هشدار اجرایی است، نه تضمین کفایت آماری."
        )

    duplicate_count = len(samples) - len({
        sample["user_input"] for sample in samples
    })
    if duplicate_count:
        notes.append(
            f"{duplicate_count} تکرار متنیِ دقیق در پرسش‌ها وجود دارد؛ "
            "ممکن است عمدی باشد، اما در میانگین وزن تکراری ایجاد می‌کند."
        )

    return notes


def csv_safe(value):
    """Reduce spreadsheet formula-injection risk for textual cells."""
    if isinstance(value, str) and value.lstrip().startswith(
        ("=", "+", "-", "@")
    ):
        return "'" + value
    return value


def write_csv(path, samples):
    fields = [
        "sample_id", "question_sha256", "user_input",
        "response", "reference", "context_count", "response_chars",
        *METRICS,
        *[f"{metric}_status" for metric in METRICS],
        "cited_ids", "invalid_citation_ids", "review_reasons",
    ]

    with path.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()

        for sample in samples:
            row = {
                key: sample[key]
                for key in fields
                if key in sample
            }
            row.update(sample["scores"])
            row.update({
                f"{metric}_status": status
                for metric, status in sample["score_status"].items()
            })
            row["cited_ids"] = json.dumps(sample["cited_ids"])
            row["invalid_citation_ids"] = json.dumps(
                sample["invalid_citation_ids"]
            )
            row["review_reasons"] = " | ".join(
                sample["review_reasons"]
            )
            writer.writerow({
                key: csv_safe(value)
                for key, value in row.items()
            })


def write_markdown(path, summary, samples):
    lines = [
        "# گزارش Baseline سیستم RAG",
        "",
        f"- شناسه گزارش: `{summary['run_id']}`",
        f"- زمان تولید گزارش: `{summary['report_created_at_utc']}`",
        f"- تعداد نمونه: **{summary['sample_count']}**",
        f"- نیازمند بازبینی: **{summary['review_sample_count']}**",
        f"- آستانه بازبینی: `{summary['review_threshold']}`",
        f"- SHA-256 ورودی: `{summary['input_sha256']}`",
        "",
        "## شاخص‌ها",
        "",
        "| معیار | میانگین | میانه | انحراف معیار نمونه‌ای | "
        "معتبر/کل | پوشش | ناموجود | نامعتبر | زیر آستانه |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]

    for metric, result in summary["metrics"].items():
        lines.append(
            f"| {metric} | {display(result['mean'])} | "
            f"{display(result['median'])} | "
            f"{display(result['std_sample'])} | "
            f"{result['valid']}/{result['total']} | "
            f"{percent(result['coverage'])} | "
            f"{result['missing']} | {result['invalid']} | "
            f"{result['below_review_threshold']} |"
        )

    lines += ["", "## ملاحظات", ""]
    lines += [f"- {note}" for note in summary["notes"]]

    lines += [
        "",
        "## مشخصات اعلام‌شده سیستم و ارزیابی",
        "",
        "```json",
        json.dumps(
            json_safe(summary["metadata"]),
            ensure_ascii=False,
            indent=2,
            allow_nan=False,
        ),
        "```",
        "",
        "## نمونه‌های نیازمند بازبینی",
        "",
    ]

    for sample in samples:
        if sample["review_reasons"]:
            lines += [
                f"### {sample['sample_id']}",
                "",
                f"**پرسش:** {escape(sample['user_input'])}",
                "",
                f"**پاسخ:** {escape(sample['response'])}",
                "",
                f"**مرجع:** {escape(sample['reference'])}",
                "",
                "**علت علامت‌گذاری:** "
                + escape("؛ ".join(sample["review_reasons"])),
                "",
            ]

    path.write_text("\n".join(lines), encoding="utf-8")


def write_html(path, summary, samples):
    cards = []
    metric_rows = []

    for metric, result in summary["metrics"].items():
        cards.append(f"""
        <section class="card">
          <span class="muted">{escape(METRICS[metric])}</span>
          <strong dir="ltr">{display(result['mean'])}</strong>
          <div class="muted">
            معتبر: {result['valid']} از {result['total']}
            · پوشش: {percent(result['coverage'])}
          </div>
          <div class="bar">
            <i style="width:{result['coverage'] * 100:.2f}%"></i>
          </div>
          <small class="muted">نوار: پوشش امتیاز معتبر، نه کیفیت پاسخ</small>
        </section>
        """)

        metric_rows.append(f"""
        <tr>
          <td dir="ltr">{escape(metric)}</td>
          <td>{display(result['mean'])}</td>
          <td>{display(result['median'])}</td>
          <td>{display(result['std_sample'])}</td>
          <td>{display(result['min'])}</td>
          <td>{display(result['max'])}</td>
          <td>{result['missing']}</td>
          <td>{result['invalid']}</td>
          <td>{result['zero_count']}</td>
          <td>{result['below_review_threshold']}</td>
        </tr>
        """)

    sample_blocks = []
    for sample in samples:
        tags = []
        for metric in METRICS:
            value = sample["scores"][metric]
            status = sample["score_status"][metric]
            css_class = (
                "warn"
                if value is None or value < summary["review_threshold"]
                else "neutral"
            )
            label = (
                display(value)
                if status == "valid"
                else STATUS_LABELS[status]
            )
            tags.append(
                f'<span class="tag {css_class}" dir="auto">'
                f'{escape(metric)}: {escape(label)}</span>'
            )

        contexts = "".join(
            f"<li><div class='text'>{escape(context)}</div></li>"
            for context in sample["retrieved_contexts"]
        )
        reasons = (
            "؛ ".join(sample["review_reasons"])
            or "هشدار خودکار ثبت نشد؛ این به معنای تأیید صحت پاسخ نیست."
        )
        review = int(bool(sample["review_reasons"]))

        sample_blocks.append(f"""
        <details class="sample" data-review="{review}">
          <summary>
            <b>{sample['sample_id']}</b>
            {escape(sample['user_input'])}
            <span class="badge">
              {'نیازمند بازبینی' if review else 'بدون هشدار خودکار'}
            </span>
          </summary>
          <div class="body">
            <div class="tags">{''.join(tags)}</div>
            <h4>پاسخ سیستم</h4>
            <div class="text">{escape(sample['response'])}</div>
            <h4>پاسخ مرجع</h4>
            <div class="text reference">{escape(sample['reference'])}</div>
            <p class="muted">{escape(reasons)}</p>
            <p>تعداد Context: {sample['context_count']}
               · شناسه‌های استناد:
               <b dir="ltr">{escape(sample['cited_ids'])}</b>
            </p>
            <details>
              <summary>مشاهده Contextها به ترتیب بازیابی</summary>
              <ol>{contexts}</ol>
            </details>
          </div>
        </details>
        """)

    notes = "".join(
        f"<li>{escape(note)}</li>" for note in summary["notes"]
    )
    metadata = escape(json.dumps(
        json_safe(summary["metadata"]),
        ensure_ascii=False,
        indent=2,
        allow_nan=False,
    ))

    template = """<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RAG Baseline Report</title>
<style>
:root {
  --bg:#f3f6fb; --panel:#fff; --text:#17233b;
  --muted:#64748b; --line:#e2e8f0; --accent:#2563eb;
}
* { box-sizing:border-box; }
body {
  margin:0; background:var(--bg); color:var(--text);
  font:14px/1.9 Tahoma, Arial, sans-serif;
}
main { max-width:1280px; margin:auto; padding:28px 20px; }
header {
  background:linear-gradient(120deg,#172554,#2563eb);
  padding:28px; color:white; border-radius:18px; margin-bottom:20px;
}
h1 { margin:0 0 8px; font-size:26px; }
h2 { margin-top:28px; font-size:20px; }
h4 { margin-bottom:8px; }
.grid {
  display:grid; grid-template-columns:repeat(4,1fr); gap:14px;
}
.card,.panel,.sample {
  background:var(--panel); border:1px solid var(--line);
  border-radius:14px;
}
.card { padding:20px; }
.card strong { display:block; font-size:32px; margin:8px 0; }
.muted { color:var(--muted); }
.bar { height:7px; background:#e2e8f0; border-radius:9px; margin:12px 0; }
.bar i { display:block; height:100%; background:var(--accent); border-radius:9px; }
.panel { padding:20px; margin:16px 0; }
.scroll { overflow-x:auto; }
table { border-collapse:collapse; width:100%; white-space:nowrap; }
th,td { border-bottom:1px solid var(--line); padding:11px; text-align:right; }
th { background:#f8fafc; }
.sample { margin:12px 0; overflow:hidden; }
summary { cursor:pointer; padding:16px; }
.body { padding:0 20px 20px; }
.text {
  white-space:pre-wrap; overflow-wrap:anywhere;
  background:#f8fafc; border-radius:10px; padding:14px;
}
.reference { background:#eff6ff; }
.tags { display:flex; gap:8px; flex-wrap:wrap; margin:8px 0; }
.tag,.badge { border-radius:7px; padding:3px 9px; font-size:12px; }
.warn { background:#fff1d6; color:#8a4b00; }
.neutral { background:#eef2ff; color:#334155; }
.badge { background:#f1f5f9; margin-right:8px; }
input[type=search] {
  width:100%; padding:13px; border:1px solid #cbd5e1;
  border-radius:10px; font:inherit; margin-bottom:10px;
}
button {
  padding:9px 16px; border:0; border-radius:9px; cursor:pointer;
  font:inherit; background:#dbeafe; color:#1e3a8a;
}
pre { direction:ltr; text-align:left; white-space:pre-wrap; overflow-wrap:anywhere; }
li { margin-bottom:8px; }
.hash { overflow-wrap:anywhere; font-size:12px; }
@media(max-width:850px) { .grid { grid-template-columns:repeat(2,1fr); } }
@media(max-width:480px) { .grid { grid-template-columns:1fr; } }
@media print {
  body { background:white; }
  main { max-width:none; padding:0; }
  .controls { display:none; }
  .card,.panel { break-inside:avoid; }
}
</style>
</head>
<body>
<main>
<header>
  <h1>گزارش خط مبنای سیستم RAG</h1>
  <div>__RUN_ID__ · __TIME__</div>
  <p>نمونه‌ها: __COUNT__ · نیازمند بازبینی: __REVIEW__</p>
  <div>آستانه بازبینی: __THRESHOLD__ · بدون امتیاز کلی ترکیبی</div>
</header>

<div class="grid">__CARDS__</div>

<h2>خلاصه آماری</h2>
<div class="panel scroll">
<table>
<thead><tr>
<th>معیار</th><th>میانگین</th><th>میانه</th><th>انحراف معیار نمونه‌ای</th>
<th>کمینه</th><th>بیشینه</th><th>ناموجود</th><th>نامعتبر</th>
<th>صفر</th><th>زیر آستانه</th>
</tr></thead>
<tbody>__METRIC_ROWS__</tbody>
</table>
</div>

<h2>حدود اعتبار و ملاحظات</h2>
<div class="panel"><ul>__NOTES__</ul></div>

<details class="panel">
<summary>مشخصات اعلام‌شده سیستم و ارزیابی</summary>
<pre>__METADATA__</pre>
<p class="hash">SHA-256 ورودی: <b dir="ltr">__HASH__</b></p>
</details>

<h2>بررسی نمونه‌ها</h2>
<div class="panel controls">
  <input id="search" type="search" placeholder="جست‌وجو در پرسش، پاسخ یا Contextها">
  <label><input id="reviewOnly" type="checkbox"> فقط نیازمند بازبینی</label>
  <div>
    <button id="expand">بازکردن جزئیات نمایان</button>
    <button id="print">چاپ / ذخیره PDF</button>
  </div>
</div>

__SAMPLES__
</main>
<script>
const items = [...document.querySelectorAll(".sample")];
const search = document.querySelector("#search");
const reviewOnly = document.querySelector("#reviewOnly");

function filterItems() {
  const query = search.value.trim().toLocaleLowerCase();
  items.forEach(item => {
    const matchesText = item.textContent.toLocaleLowerCase().includes(query);
    const matchesReview = !reviewOnly.checked || item.dataset.review === "1";
    item.hidden = !(matchesText && matchesReview);
  });
}
search.addEventListener("input", filterItems);
reviewOnly.addEventListener("change", filterItems);

document.querySelector("#expand").addEventListener("click", () => {
  items.filter(item => !item.hidden).forEach(item => {
    item.open = true;
    item.querySelectorAll("details").forEach(detail => detail.open = true);
  });
});
document.querySelector("#print").addEventListener("click", () => window.print());
</script>
</body>
</html>
"""

    replacements = {
        "RUN_ID": escape(summary["run_id"]),
        "TIME": escape(summary["report_created_at_utc"]),
        "COUNT": str(summary["sample_count"]),
        "REVIEW": str(summary["review_sample_count"]),
        "THRESHOLD": str(summary["review_threshold"]),
        "CARDS": "".join(cards),
        "METRIC_ROWS": "".join(metric_rows),
        "NOTES": notes,
        "METADATA": metadata,
        "HASH": summary["input_sha256"],
        "SAMPLES": "".join(sample_blocks),
    }

    # Single-pass replacement avoids interpreting placeholders in user text.
    output = re.sub(
        r"__([A-Z_]+)__",
        lambda match: replacements.get(match.group(1), match.group(0)),
        template,
    )
    path.write_text(output, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(
        description="Generate a Persian offline RAG baseline report."
    )
    parser.add_argument("input", type=Path)
    parser.add_argument("--out", type=Path, default=Path("reports"))
    parser.add_argument("--metadata", type=Path)
    parser.add_argument("--review-threshold", type=float, default=0.8)
    parser.add_argument(
        "--citation-base",
        type=int,
        choices=[0, 1],
        default=None,
        help="Only set if citation IDs map to context list positions.",
    )
    args = parser.parse_args()

    if not 0 <= args.review_threshold <= 1:
        parser.error("--review-threshold باید بین صفر و یک باشد.")

    data = read_json(args.input)
    validate_input(data)

    metadata = (
        read_json(args.metadata)
        if args.metadata
        else {"status": "not_provided"}
    )
    if not isinstance(metadata, dict):
        raise ValueError("فایل metadata باید یک JSON object باشد.")

    raw = args.input.read_bytes()
    input_hash = sha256(raw)
    now = datetime.now(timezone.utc)
    run_id = (
        f"baseline_{now.strftime('%Y%m%dT%H%M%S_%fZ')}_{input_hash[:8]}"
    )

    samples, metric_summary = analyze(
        data,
        args.review_threshold,
        args.citation_base,
    )

    summary = {
        "schema_version": "1.0",
        "reporter_version": REPORTER_VERSION,
        "run_id": run_id,
        "report_created_at_utc": now.isoformat(),
        "input_filename": args.input.name,
        "input_sha256": input_hash,
        "reporter_sha256": sha256(Path(__file__).read_bytes()),
        "report_environment": {
            "python": platform.python_version(),
            "platform": platform.platform(),
        },
        "sample_count": len(samples),
        "review_sample_count": sum(
            bool(sample["review_reasons"]) for sample in samples
        ),
        "review_threshold": args.review_threshold,
        "citation_index_base": args.citation_base,
        "context_count_mean": statistics.mean(
            sample["context_count"] for sample in samples
        ),
        "context_count_min": min(
            sample["context_count"] for sample in samples
        ),
        "context_count_max": max(
            sample["context_count"] for sample in samples
        ),
        "metrics": metric_summary,
        "metadata": metadata,
        "notes": make_notes(samples, metric_summary),
    }

    out = args.out / run_id
    out.mkdir(parents=True, exist_ok=False)

    # Preserve original bytes, including any non-standard NaN tokens.
    (out / "source_input.json").write_bytes(raw)

    write_json(out / "summary.json", summary)
    write_json(out / "samples.json", samples)
    write_csv(out / "samples.csv", samples)
    write_markdown(out / "report.md", summary, samples)
    write_html(out / "report.html", summary, samples)

    print(f"\nReport: {out.resolve()}")
    print(f"Samples: {len(samples)}")
    for metric, result in metric_summary.items():
        print(
            f"{metric:20s} mean={display(result['mean'])} "
            f"valid={result['valid']}/{result['total']} "
            f"coverage={percent(result['coverage'])}"
        )
    print(f"\nOpen: {(out / 'report.html').resolve()}")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError) as exc:
        raise SystemExit(str(exc))
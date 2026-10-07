from __future__ import annotations

import csv
import hashlib
import html
import json
import math
import re
import statistics
import traceback
import webbrowser

from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


# ============================================================
# تنظیمات شما — فقط این قسمت را تغییر دهید
# ============================================================

# مسیر فایل JSON خروجی ارزیابی
INPUT_FILE = r"C:\Users\MGZ\MGZ\JAM_ORI_RIGHT\JAM\eval\ragas_results.json"

# مسیر پوشه‌ای که گزارش‌ها داخل آن ساخته می‌شوند
OUTPUT_DIRECTORY = r"C:\Users\MGZ\MGZ\JAM_ORI_RIGHT\JAM\eval\baseline_01"

REPORT_TITLE = "گزارش خط مبنای سیستم پاسخ‌گویی RAG"
SYSTEM_NAME = "سامانه پاسخ‌گویی آیین‌نامه‌های آموزشی"

# این مقدار فقط برای علامت‌گذاری جهت بازبینی است.
# معیار قبولی محصول یا اثبات غلط بودن پاسخ نیست.
REVIEW_THRESHOLD = 0.80

# بازکردن گزارش در مرورگر پس از تولید
OPEN_BROWSER = True

# جلوگیری از بسته‌شدن فوری پنجره هنگام اجرای مستقیم فایل
PAUSE_AT_END = True

# مشخصات واقعی سیستم را در صورت اطلاع تکمیل کنید.
# موارد نامعلوم را None نگه دارید.
SYSTEM_METADATA = {
    "نسخه سیستم": None,
    "مدل پاسخ‌گو": None,
    "مدل Embedding": None,
    "روش بازیابی": None,
    "مدل Reranker": None,
    "Top K تنظیم‌شده": None,
    "نسخه مجموعه آزمون": None,
    "نسخه منابع": None,
    "کتابخانه ارزیابی و نسخه": None,
    "مدل ارزیاب": None,
    "نسخه Prompt": None,
    "Git Commit": None,
}

# ============================================================
# پایان تنظیمات
# ============================================================


METRICS = {
    "faithfulness": {
        "title": "وفاداری به زمینه",
        "english": "Faithfulness",
        "description": (
            "امتیاز ثبت‌شده برای پشتیبانی محتوای پاسخ توسط زمینه بازیابی‌شده؛ "
            "معادل صحت کامل پاسخ یا صحت تک‌تک استنادها نیست."
        ),
    },
    "context_precision": {
        "title": "دقت زمینه",
        "english": "Context Precision",
        "description": (
            "امتیاز ثبت‌شده کیفیت زمینه بازیابی‌شده؛ تعریف دقیق آن به "
            "پیاده‌سازی ارزیاب وابسته است و لزوماً Precision@K نیست."
        ),
    },
    "context_recall": {
        "title": "پوشش زمینه",
        "english": "Context Recall",
        "description": (
            "امتیاز ثبت‌شده پوشش اطلاعات مرجع توسط زمینه بازیابی‌شده؛ "
            "تعریف دقیق آن به پیاده‌سازی ارزیاب وابسته است."
        ),
    },
    "answer_relevancy": {
        "title": "ارتباط پاسخ با سؤال",
        "english": "Answer Relevancy",
        "description": (
            "امتیاز ثبت‌شده ارتباط پاسخ با سؤال؛ "
            "این معیار به‌تنهایی صحت پاسخ را تضمین نمی‌کند."
        ),
    },
}

STATUS_NAMES = {
    "valid": "معتبر",
    "missing": "ناموجود",
    "invalid": "نامعتبر",
}


def esc(value):
    return html.escape(str(value), quote=True)


def fmt(value):
    return "N/A" if value is None else f"{value:.4f}"


def pct(value):
    return f"{100 * value:.1f}%"


def clean_json(value):
    """تبدیل NaN و Infinity به null در خروجی استاندارد JSON."""
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if isinstance(value, dict):
        return {key: clean_json(item) for key, item in value.items()}
    if isinstance(value, list):
        return [clean_json(item) for item in value]
    return value


def save_json(path, data):
    path.write_text(
        json.dumps(
            clean_json(data),
            ensure_ascii=False,
            indent=2,
            allow_nan=False,
        ),
        encoding="utf-8",
    )


def load_and_validate(path):
    if not path.exists():
        raise FileNotFoundError(
            f"فایل ورودی پیدا نشد:\n{path}\n\n"
            "مقدار INPUT_FILE را در ابتدای کد اصلاح کنید."
        )

    if not path.is_file():
        raise ValueError(f"مسیر ورودی باید یک فایل باشد:\n{path}")

    raw_bytes = path.read_bytes()

    try:
        text = raw_bytes.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValueError(
            "کدگذاری فایل باید UTF-8 باشد. "
            "در VS Code فایل را با Save with Encoding → UTF-8 ذخیره کنید."
        ) from exc

    if not text.strip():
        raise ValueError("فایل ورودی خالی است.")

    try:
        # Python توکن‌های NaN و Infinity خروجی‌های قدیمی را می‌پذیرد.
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        lines = text.splitlines()
        problem_line = (
            lines[exc.lineno - 1]
            if 0 < exc.lineno <= len(lines)
            else ""
        )

        start = max(0, exc.colno - 90)
        snippet = problem_line[start:start + 180]

        raise ValueError(
            "فایل JSON ناقص یا از نظر نگارشی نامعتبر است.\n"
            f"خط: {exc.lineno} | ستون: {exc.colno}\n"
            f"توضیح Parser: {exc.msg}\n"
            f"بخشی از خط مشکل‌دار: {snippet}\n\n"
            "فایل باید آرایه کامل JSON باشد، نه متن پیام، "
            "نه کد داخل ``` و نه خروجی قطع‌شده."
        ) from exc

    if not isinstance(data, list):
        raise ValueError(
            "ساختار اصلی فایل باید یک آرایه JSON باشد:\n"
            '[{"user_input": "...", "retrieved_contexts": [...], '
            '"response": "...", "reference": "..."}]'
        )

    if not data:
        raise ValueError("آرایه ورودی خالی است؛ نمونه‌ای برای گزارش وجود ندارد.")

    errors = []

    for number, row in enumerate(data, 1):
        if not isinstance(row, dict):
            errors.append(f"نمونه {number}: باید یک object باشد.")
            continue

        for field in ("user_input", "response", "reference"):
            if not isinstance(row.get(field), str):
                errors.append(
                    f"نمونه {number}: فیلد {field} باید موجود و از نوع رشته باشد."
                )

        contexts = row.get("retrieved_contexts")
        if not isinstance(contexts, list):
            errors.append(
                f"نمونه {number}: retrieved_contexts باید فهرست باشد."
            )
        elif not all(isinstance(item, str) for item in contexts):
            errors.append(
                f"نمونه {number}: همه Contextها باید رشته باشند."
            )

    if errors:
        shown = "\n".join(errors[:15])
        remaining = len(errors) - 15
        if remaining > 0:
            shown += f"\n... و {remaining} خطای دیگر."

        raise ValueError("ساختار داده قابل گزارش نیست:\n" + shown)

    return data, raw_bytes


def read_score(row, metric):
    if metric not in row:
        return None, "missing", "فیلد معیار وجود ندارد"

    value = row[metric]

    if value is None:
        return None, "missing", "مقدار null"

    # پشتیبانی از خروجی‌هایی که NaN را به صورت رشته ذخیره کرده‌اند
    if isinstance(value, str):
        if value.strip().lower() in {
            "", "nan", "null", "none", "n/a",
            "infinity", "+infinity", "-infinity",
            "inf", "+inf", "-inf",
        }:
            return None, "missing", "مقدار ناموجود یا غیرمتناهی به صورت رشته"
        return None, "invalid", "مقدار معیار عددی نیست"

    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None, "invalid", "نوع داده نامعتبر"

    if isinstance(value, float) and not math.isfinite(value):
        return None, "missing", "مقدار NaN یا Infinity"

    if not 0 <= value <= 1:
        return None, "invalid", "عدد خارج از بازه صفر تا یک"

    return float(value), "valid", ""


def analyze(data):
    samples = []

    for number, row in enumerate(data, 1):
        scores = {}
        statuses = {}
        reasons = []
        low_metrics = []
        incomplete_metrics = []

        for metric, definition in METRICS.items():
            value, status, reason = read_score(row, metric)
            scores[metric] = value
            statuses[metric] = status

            if status != "valid":
                incomplete_metrics.append(metric)
                reasons.append(f"{definition['title']}: {reason}")
            elif value < REVIEW_THRESHOLD:
                low_metrics.append(metric)
                reasons.append(
                    f"{definition['title']}: "
                    f"{value:.4f} کمتر از آستانه {REVIEW_THRESHOLD:.2f}"
                )

        if not row["user_input"].strip():
            reasons.append("متن پرسش خالی است")
        if not row["response"].strip():
            reasons.append("پاسخ سیستم خالی است")
        if not row["reference"].strip():
            reasons.append("پاسخ مرجع خالی است")
        if not row["retrieved_contexts"]:
            reasons.append("هیچ Context بازیابی نشده است")

        samples.append({
            "id": f"Q{number:04d}",
            "user_input": row["user_input"],
            "response": row["response"],
            "reference": row["reference"],
            "retrieved_contexts": row["retrieved_contexts"],
            "context_count": len(row["retrieved_contexts"]),
            "scores": scores,
            "statuses": statuses,
            "low_metrics": low_metrics,
            "incomplete_metrics": incomplete_metrics,
            "review_reasons": reasons,
        })

    total = len(samples)
    summaries = {}

    for metric in METRICS:
        values = [
            sample["scores"][metric]
            for sample in samples
            if sample["statuses"][metric] == "valid"
        ]

        counts = Counter(
            sample["statuses"][metric] for sample in samples
        )

        summaries[metric] = {
            "valid": len(values),
            "missing": counts["missing"],
            "invalid": counts["invalid"],
            "total": total,
            "coverage": len(values) / total,
            "mean": statistics.mean(values) if values else None,
            "median": statistics.median(values) if values else None,
            "min": min(values) if values else None,
            "max": max(values) if values else None,
            "std_sample": (
                statistics.stdev(values) if len(values) > 1 else None
            ),
            "below_threshold": sum(
                value < REVIEW_THRESHOLD for value in values
            ),
        }

    return samples, summaries


def save_csv(path, samples):
    fields = [
        "id", "user_input", "response", "reference", "context_count",
        *METRICS,
        *[f"{metric}_status" for metric in METRICS],
        "review_reasons",
    ]

    def safe_cell(value):
        if isinstance(value, str) and value.lstrip().startswith(
            ("=", "+", "-", "@")
        ):
            return "'" + value
        return value

    with path.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()

        for sample in samples:
            row = {
                key: sample[key]
                for key in (
                    "id", "user_input", "response", "reference", "context_count"
                )
            }

            row.update(sample["scores"])
            row.update({
                f"{metric}_status": sample["statuses"][metric]
                for metric in METRICS
            })
            row["review_reasons"] = " | ".join(sample["review_reasons"])

            writer.writerow({
                key: safe_cell(value) for key, value in row.items()
            })


def make_html(summary, samples):
    metrics = summary["metrics"]
    total = summary["sample_count"]

    metric_cards = []
    statistics_rows = []

    for metric, definition in METRICS.items():
        result = metrics[metric]
        mean = result["mean"]

        if result["valid"] == 0:
            state = "فاقد امتیاز معتبر"
            color = "amber"
        elif result["valid"] < total:
            state = "پوشش ناقص ارزیابی"
            color = "amber"
        else:
            state = "پوشش کامل مقادیر"
            color = "blue"

        # نوار امتیاز و نوار پوشش جداگانه‌اند.
        score_bar = (
            '<div class="empty-score">امتیاز قابل محاسبه نیست</div>'
            if mean is None
            else (
                '<div class="track score">'
                f'<span style="width:{mean * 100:.4f}%"></span></div>'
            )
        )

        metric_cards.append(f"""
        <article class="metric-card">
          <div class="card-top">
            <span class="pill {color}">{state}</span>
            <span class="english">{esc(definition['english'])}</span>
          </div>
          <h3>{esc(definition['title'])}</h3>
          <div class="score-number" dir="ltr">{fmt(mean)}</div>
          <div class="small muted">میانگین امتیاز معتبر · مقیاس صفر تا یک</div>
          {score_bar}
          <div class="coverage-label">
            <span>پوشش معتبر</span>
            <b dir="ltr">{pct(result['coverage'])}</b>
          </div>
          <div class="track coverage">
            <span style="width:{result['coverage'] * 100:.4f}%"></span>
          </div>
          <div class="small muted">
            {result['valid']} معتبر از {total} نمونه
            · {result['missing']} ناموجود
            · {result['invalid']} نامعتبر
          </div>
          <p class="definition">{esc(definition['description'])}</p>
        </article>
        """)

        statistics_rows.append(f"""
        <tr>
          <td>
            <b>{esc(definition['title'])}</b>
            <div class="english muted">{esc(metric)}</div>
          </td>
          <td>{fmt(result['mean'])}</td>
          <td>{fmt(result['median'])}</td>
          <td>{fmt(result['std_sample'])}</td>
          <td>{fmt(result['min'])}</td>
          <td>{fmt(result['max'])}</td>
          <td>{result['valid']} / {total}</td>
          <td>{result['missing']}</td>
          <td>{result['invalid']}</td>
          <td>{result['below_threshold']}</td>
        </tr>
        """)

    observations = []

    for metric, definition in METRICS.items():
        result = metrics[metric]
        name = definition["title"]

        if result["valid"] == 0:
            observations.append((
                "اولویت: تکمیل ارزیابی",
                f"برای «{name}» هیچ امتیاز معتبری موجود نیست. "
                "از این فایل نمی‌توان درباره وضعیت این معیار نتیجه‌گیری کرد. "
                "لاگ اجرای معیار و تنظیمات ارزیاب را بررسی کنید.",
            ))
        elif result["coverage"] < 1:
            observations.append((
                "پوشش ناقص",
                f"میانگین «{name}» فقط از {result['valid']} نمونه "
                f"از مجموع {total} نمونه محاسبه شده است. "
                "نمونه‌های فاقد امتیاز ممکن است تصادفی نباشند.",
            ))

        if result["below_threshold"]:
            observations.append((
                "بازبینی نمونه‌ها",
                f"در «{name}»، تعداد {result['below_threshold']} نمونه "
                f"امتیاز کمتر از {REVIEW_THRESHOLD:.2f} دارند. "
                "این علامت‌گذاری به معنای اثبات غلط‌بودن پاسخ نیست.",
            ))

    if not observations:
        observations.append((
            "کنترل عددی",
            "مقدار ناموجود یا نامعتبر و امتیاز زیر آستانه مشاهده نشد. "
            "این نتیجه، صحت معنایی پاسخ‌ها یا استنادها را تأیید نمی‌کند.",
        ))

    if summary["duplicate_questions"]:
        observations.append((
            "پرسش‌های تکراری",
            f"{summary['duplicate_questions']} تکرار متنی دقیق در پرسش‌ها "
            "وجود دارد. تکرارها حذف نشده‌اند و در میانگین وزن دارند.",
        ))

    if total < 30:
        observations.append((
            "دامنه محدود آزمون",
            f"این گزارش بر {total} نمونه استوار است. "
            "تعداد کم نمونه‌ها و تنوع نامشخص آزمون، تعمیم نتایج را محدود می‌کند. "
            "آستانه ۳۰ در این هشدار صرفاً اجرایی است، نه تضمین کفایت آماری.",
        ))

    observation_html = "".join(
        f'<div class="finding"><b>{esc(title)}</b>'
        f'<p>{esc(text)}</p></div>'
        for title, text in observations
    )

    sample_html = []

    for sample in samples:
        metric_cells = []
        metric_tags = []

        for metric, definition in METRICS.items():
            value = sample["scores"][metric]
            status = sample["statuses"][metric]

            if status != "valid":
                label = STATUS_NAMES[status]
                css = "gray"
            elif value < REVIEW_THRESHOLD:
                label = fmt(value)
                css = "amber"
            else:
                label = fmt(value)
                css = "blue"

            metric_cells.append(
                f'<td><span class="pill {css}">{esc(label)}</span></td>'
            )

            metric_tags.append(
                f'<span class="pill {css}">'
                f'{esc(definition["title"])}: {esc(label)}</span>'
            )

        contexts = "".join(
            f"""
            <details class="context">
              <summary>قطعه {index + 1}
                <span class="muted small"> · اندیس فهرست: {index}</span>
              </summary>
              <div class="text-box">{esc(context)}</div>
            </details>
            """
            for index, context in enumerate(sample["retrieved_contexts"])
        ) or '<p class="muted">Context موجود نیست.</p>'

        reasons = (
            "<ul>"
            + "".join(
                f"<li>{esc(reason)}</li>"
                for reason in sample["review_reasons"]
            )
            + "</ul>"
            if sample["review_reasons"]
            else (
                "<p>هشدار خودکار ثبت نشده است؛ "
                "صحت پاسخ همچنان نیازمند ارزیابی مستقل است.</p>"
            )
        )

        needs_review = bool(sample["review_reasons"])

        sample_html.append(f"""
        <tbody class="sample-group"
          data-review="{int(needs_review)}"
          data-low="{int(bool(sample['low_metrics']))}"
          data-missing="{int(bool(sample['incomplete_metrics']))}">
          <tr class="sample-row">
            <td><b dir="ltr">{sample['id']}</b></td>
            <td class="question-cell">{esc(sample['user_input'])}</td>
            {''.join(metric_cells)}
            <td>{sample['context_count']}</td>
            <td>
              <span class="pill {'amber' if needs_review else 'gray'}">
                {'بازبینی' if needs_review else 'بدون هشدار'}
              </span>
            </td>
          </tr>
          <tr>
            <td colspan="8" class="detail-cell">
              <details class="sample-detail">
                <summary>مشاهده پاسخ، مرجع، دلایل بازبینی و منابع</summary>
                <div class="detail-content">
                  <div class="tag-list">{''.join(metric_tags)}</div>
                  <div class="answer-grid">
                    <section>
                      <h4>پاسخ سیستم</h4>
                      <div class="text-box">{esc(sample['response'])}</div>
                    </section>
                    <section>
                      <h4>پاسخ مرجع</h4>
                      <div class="text-box reference">
                        {esc(sample['reference'])}
                      </div>
                    </section>
                  </div>
                  <section class="review-box">
                    <h4>دلایل علامت‌گذاری خودکار</h4>
                    {reasons}
                  </section>
                  <h4>متون بازیابی‌شده به ترتیب ورودی</h4>
                  <p class="small muted">
                    اندیس فهرست صرفاً موقعیت قطعه در ورودی است؛
                    نگاشت آن به ID استنادها در این گزارش فرض نشده است.
                  </p>
                  {contexts}
                </div>
              </details>
            </td>
          </tr>
        </tbody>
        """)

    metadata_rows = "".join(
        f"<tr><td>{esc(key)}</td>"
        f"<td>{esc(value if value is not None else 'ثبت نشده')}</td></tr>"
        for key, value in summary["system_metadata"].items()
    )

    overall_status = (
        "ارزیابی عددی کامل نیست"
        if summary["incomplete_samples"] > 0
        else "مقادیر عددی معیارها کامل است"
    )

    overall_description = (
        "این وضعیت مربوط به موجودبودن امتیازهاست، نه خوب یا بد بودن سیستم."
    )

    template = r"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>@@TITLE@@</title>
<style>
:root {
  --bg:#f1f5f9;
  --panel:#ffffff;
  --ink:#17243b;
  --muted:#64748b;
  --line:#e2e8f0;
  --blue:#2563eb;
  --navy:#10254a;
}
* { box-sizing:border-box; }
body {
  margin:0; color:var(--ink); background:var(--bg);
  font:14px/1.9 Tahoma, "Segoe UI", Arial, sans-serif;
}
button,input,select { font:inherit; }
.container { max-width:1500px; padding:26px; margin:auto; }
.hero {
  background:linear-gradient(120deg,#10254a,#1e40af);
  color:white; border-radius:20px; padding:30px;
  box-shadow:0 12px 35px #10254a18;
}
.hero-top,.card-top,.coverage-label,.toolbar,.section-heading {
  display:flex; align-items:center; justify-content:space-between;
  gap:12px; flex-wrap:wrap;
}
.eyebrow { color:#bfdbfe; font-size:12px; letter-spacing:1px; }
h1 { font-size:27px; margin:8px 0; }
h2 { font-size:20px; margin:0; }
h3 { font-size:16px; margin:16px 0 5px; }
h4 { margin:12px 0 8px; }
p { margin:8px 0; }
.hero-meta { color:#dbeafe; font-size:12px; margin-top:18px; }
.hero .status {
  background:#ffffff16; border:1px solid #ffffff30;
  padding:12px 18px; border-radius:12px;
}
.kpi-grid {
  display:grid; grid-template-columns:repeat(4,1fr);
  gap:16px; margin:20px 0;
}
.kpi,.metric-card,.panel {
  background:var(--panel); border:1px solid var(--line);
  border-radius:16px;
}
.kpi { padding:20px; }
.kpi strong { display:block; font-size:30px; margin:3px 0; }
.kpi .label { color:var(--muted); }
.small { font-size:12px; }
.muted { color:var(--muted); }
.english { direction:ltr; font:12px/1.7 "Segoe UI",Arial,sans-serif; }
.section-heading { margin:30px 0 14px; }
.metric-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
.metric-card { padding:20px; }
.score-number { font:700 38px/1.5 "Segoe UI",Arial,sans-serif; text-align:right; }
.track { height:8px; border-radius:20px; overflow:hidden; background:#edf2f7; }
.track span { display:block; height:100%; border-radius:20px; }
.score { margin:14px 0 22px; }
.score span { background:#2563eb; }
.coverage span { background:#0f766e; }
.coverage-label { margin-bottom:6px; font-size:12px; }
.coverage { margin-bottom:8px; }
.empty-score {
  padding:7px; background:#f8fafc; color:#64748b;
  border-radius:7px; margin:12px 0 18px; font-size:12px;
}
.definition {
  font-size:12px; color:#64748b; border-top:1px solid var(--line);
  margin-top:16px; padding-top:12px;
}
.pill {
  display:inline-block; font-size:11px; padding:3px 9px;
  border-radius:7px; white-space:nowrap;
}
.blue { background:#eaf1ff; color:#1d4ed8; }
.amber { background:#fff4da; color:#92400e; }
.gray { background:#eef2f6; color:#475569; }
.panel { padding:22px; margin-bottom:18px; }
.notice {
  border-right:4px solid #2563eb; background:#eff6ff;
  padding:15px 18px; border-radius:10px; margin:18px 0;
}
.findings { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
.finding {
  background:white; border:1px solid var(--line);
  border-right:4px solid #d97706; border-radius:12px; padding:18px;
}
.finding b { color:#92400e; }
.finding p { color:#475569; font-size:13px; }
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; }
th {
  color:#475569; background:#f8fafc; font-size:12px;
  text-align:right; white-space:nowrap;
}
th,td { padding:13px 12px; border-bottom:1px solid var(--line); vertical-align:top; }
.stats-table td { white-space:nowrap; }
.question-cell { min-width:260px; max-width:470px; }
.sample-row td { background:#fff; }
.detail-cell { padding:0 12px 12px; }
summary { cursor:pointer; }
.sample-detail > summary {
  color:#1d4ed8; padding:10px 12px; background:#f8fafc; border-radius:8px;
}
.detail-content { padding:16px; background:#fbfdff; }
.answer-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
.text-box {
  white-space:pre-wrap; overflow-wrap:anywhere; background:#f1f5f9;
  padding:16px; border-radius:10px;
}
.reference { background:#ecfdf5; }
.review-box {
  padding:12px 16px; margin:16px 0;
  background:#fffbeb; border:1px solid #fde68a; border-radius:10px;
}
.review-box ul { margin:4px 0; padding-right:20px; }
.tag-list { display:flex; gap:8px; flex-wrap:wrap; }
.context { border:1px solid var(--line); border-radius:10px; margin:10px 0; }
.context summary { padding:12px; }
.context .text-box { margin:0 10px 10px; }
.toolbar { margin-bottom:16px; }
.search {
  flex:1; min-width:220px; padding:11px 14px;
  border:1px solid #cbd5e1; border-radius:10px;
}
select {
  padding:10px; border:1px solid #cbd5e1;
  border-radius:10px; background:white;
}
button,.download {
  border:0; padding:9px 13px; border-radius:9px; cursor:pointer;
  background:#e8efff; color:#1d4ed8; text-decoration:none;
}
.actions { display:flex; gap:8px; flex-wrap:wrap; }
.code {
  direction:ltr; text-align:left; overflow-wrap:anywhere;
  font:12px/1.8 Consolas,monospace; background:#f8fafc;
  padding:12px; border-radius:9px;
}
footer { color:#64748b; font-size:12px; padding:16px 0; }
[hidden] { display:none !important; }
@media(max-width:1150px) {
  .metric-grid,.kpi-grid { grid-template-columns:repeat(2,1fr); }
}
@media(max-width:650px) {
  .container { padding:12px; }
  .metric-grid,.kpi-grid,.findings,.answer-grid { grid-template-columns:1fr; }
  h1 { font-size:21px; }
  .hero { padding:22px; }
}
@media print {
  body { background:white; font-size:11px; }
  .container { padding:0; max-width:none; }
  .no-print { display:none !important; }
  .hero { background:white; color:#17243b; border:1px solid #cbd5e1; box-shadow:none; }
  .hero-meta,.eyebrow { color:#475569; }
  .kpi,.metric-card,.finding { break-inside:avoid; }
  .table-wrap { overflow:visible; }
  th,td { padding:6px; }
  .question-cell { min-width:0; }
  .answer-grid { grid-template-columns:1fr; }
}
</style>
</head>

<body>
<div class="container">
  <header class="hero">
    <div class="hero-top">
      <div>
        <div class="eyebrow">RAG BASELINE · EVALUATION SNAPSHOT</div>
        <h1>@@TITLE@@</h1>
        <div>@@SYSTEM_NAME@@</div>
      </div>
      <div class="status">
        <b>@@OVERALL_STATUS@@</b>
        <div class="small">@@OVERALL_DESCRIPTION@@</div>
      </div>
    </div>
    <div class="hero-meta">
      زمان تولید گزارش: <span dir="ltr">@@CREATED_AT@@</span>
      · شناسه گزارش: <span dir="ltr">@@RUN_ID@@</span>
    </div>
  </header>

  <section class="kpi-grid">
    <div class="kpi">
      <span class="label">کل نمونه‌های آزمون</span>
      <strong>@@TOTAL@@</strong>
      <span class="small muted">تعداد رکوردهای ورودی</span>
    </div>
    <div class="kpi">
      <span class="label">نمونه با ارزیابی عددی کامل</span>
      <strong>@@COMPLETE@@</strong>
      <span class="small muted">هر چهار معیار دارای مقدار معتبرند</span>
    </div>
    <div class="kpi">
      <span class="label">نمونه با امتیاز زیر آستانه</span>
      <strong>@@LOW@@</strong>
      <span class="small muted">حداقل یک امتیاز معتبر کمتر از @@THRESHOLD@@</span>
    </div>
    <div class="kpi">
      <span class="label">نمونه نیازمند بازبینی</span>
      <strong>@@REVIEW@@</strong>
      <span class="small muted">هشدار امتیاز، داده ناموجود یا محتوای خالی</span>
    </div>
  </section>

  <div class="notice">
    <b>چگونه این گزارش را بخوانیم؟</b>
    <div>
      میانگین‌ها فقط از امتیازهای معتبر محاسبه شده‌اند.
      N/A یعنی امتیاز قابل گزارش نیست، نه امتیاز صفر.
      کارت‌های بالا هم‌پوشانی دارند و جمع آن‌ها لزوماً برابر کل نمونه‌ها نیست.
      این گزارش امتیاز کلی، نرخ پاسخ صحیح یا تأیید صحت استناد تولید نمی‌کند.
    </div>
  </div>

  <div class="section-heading">
    <h2>۱. وضعیت معیارهای ارزیابی</h2>
    <span class="small muted">نوار آبی: میانگین امتیاز · نوار سبز: پوشش معتبر</span>
  </div>
  <section class="metric-grid">@@METRIC_CARDS@@</section>

  <div class="section-heading">
    <h2>۲. یافته‌ها و اقدام‌های پیشنهادی</h2>
  </div>
  <section class="findings">@@OBSERVATIONS@@</section>

  <div class="section-heading"><h2>۳. خلاصه آماری قابل ممیزی</h2></div>
  <section class="panel">
    <div class="table-wrap">
      <table class="stats-table">
        <thead>
          <tr>
            <th>معیار</th><th>میانگین</th><th>میانه</th>
            <th>انحراف معیار نمونه‌ای</th><th>کمینه</th><th>بیشینه</th>
            <th>معتبر / کل</th><th>ناموجود</th><th>نامعتبر</th><th>زیر آستانه</th>
          </tr>
        </thead>
        <tbody>@@STATISTICS_ROWS@@</tbody>
      </table>
    </div>
    <p class="small muted">
      ناموجود: فیلد غایب، null، NaN یا مقدار غیرمتناهی.
      نامعتبر: نوع غیرعددی یا عدد خارج از بازه صفر تا یک.
      انحراف معیار با کمتر از دو امتیاز معتبر گزارش نمی‌شود.
      اعداد نمایشی گرد شده‌اند؛ محاسبات از مقدار اصلی استفاده می‌کنند.
    </p>
    <p class="small muted">
      تعداد Context در هر نمونه:
      کمینه @@CONTEXT_MIN@@ · بیشینه @@CONTEXT_MAX@@ · میانگین @@CONTEXT_MEAN@@.
      تعداد Context نشان‌دهنده تعداد قطعات مرتبط نیست.
    </p>
  </section>

  <div class="section-heading">
    <h2>۴. بررسی نمونه‌به‌نمونه</h2>
    <span id="visible-count" class="small muted"></span>
  </div>
  <section class="panel">
    <div class="toolbar no-print">
      <input id="search" class="search" type="search"
        placeholder="جست‌وجو در سؤال، پاسخ، مرجع و Contextها">
      <select id="filter">
        <option value="all">همه نمونه‌ها</option>
        <option value="review">نیازمند بازبینی</option>
        <option value="low">دارای امتیاز زیر آستانه</option>
        <option value="missing">دارای معیار ناموجود یا نامعتبر</option>
      </select>
      <div class="actions">
        <button id="expand">بازکردن جزئیات</button>
        <button id="collapse">بستن جزئیات</button>
        <button id="print">چاپ / PDF</button>
      </div>
    </div>

    <div class="table-wrap">
      <table id="samples-table">
        <thead>
          <tr>
            <th>شناسه</th><th>پرسش</th>
            <th>Faithfulness</th><th>Context Precision</th>
            <th>Context Recall</th><th>Answer Relevancy</th>
            <th>Context</th><th>وضعیت</th>
          </tr>
        </thead>
        @@SAMPLES@@
      </table>
    </div>
    <p id="no-results" class="muted" hidden>نمونه‌ای با این فیلتر پیدا نشد.</p>
  </section>

  <div class="section-heading"><h2>۵. مشخصات و حدود اعتبار</h2></div>
  <section class="panel">
    <details>
      <summary><b>مشخصات اعلام‌شده سیستم</b></summary>
      <div class="table-wrap"><table><tbody>@@METADATA@@</tbody></table></div>
      <p class="small muted">
        این مشخصات از تنظیمات گزارش خوانده شده‌اند و توسط گزارش‌ساز تأیید نشده‌اند.
        زمان بالای صفحه، زمان تولید گزارش است؛ نه لزوماً زمان اجرای ارزیابی.
      </p>
    </details>

    <h4>روش محاسبه و محدودیت‌ها</h4>
    <ul>
      <li>هر رکورد برای هر معیار دارای امتیاز معتبر، وزن برابر دارد.</li>
      <li>امتیازهای ورودی دوباره توسط مدل یا انسان داوری نشده‌اند.</li>
      <li>آستانه @@THRESHOLD@@ صرفاً برای بازبینی است؛ معیار پذیرش محصول نیست.</li>
      <li>امتیاز Faithfulness پایین به‌تنهایی اثبات توهم نیست؛ نمونه و خروجی ارزیاب باید بررسی شوند.</li>
      <li>صحت و کامل‌بودن پاسخ و صحت معنایی استنادها مستقلاً اندازه‌گیری نشده‌اند.</li>
      <li>تعریف دقیق معیارها باید همراه نسخه کتابخانه و تنظیمات ارزیاب ثبت شود.</li>
      <li>اطلاعات زمان پاسخ، هزینه و مصرف توکن در ساختار فعلی گزارش نشده است.</li>
      <li>برای مقایسه نسخه‌ها، مجموعه آزمون، منابع و پروتکل ارزیابی باید ثابت باشند.</li>
    </ul>

    <h4>اثر انگشت فایل ورودی — SHA-256</h4>
    <div class="code">@@INPUT_HASH@@</div>
    <p class="small muted">
      این Hash شامل پاسخ‌ها و امتیازها نیز هست؛
      جایگزین نسخه یا Hash مستقل مجموعه پرسش‌ها و مراجع نیست.
    </p>

    <div class="actions no-print">
      <a class="download" href="summary.json" download>خلاصه JSON</a>
      <a class="download" href="samples.csv" download>جدول CSV</a>
      <a class="download" href="samples.json" download>جزئیات JSON</a>
    </div>
  </section>

  <footer>
    گزارش آفلاین و بدون وابستگی خارجی است.
    فایل HTML شامل پرسش‌ها، پاسخ‌ها و Contextهاست؛ پیش از اشتراک‌گذاری،
    محرمانگی محتوای آن را بررسی کنید.
  </footer>
</div>

<script>
const groups = [...document.querySelectorAll(".sample-group")];
const searchBox = document.getElementById("search");
const filterBox = document.getElementById("filter");

function normalizeText(text) {
  return text.toLocaleLowerCase()
    .replace(/ي/g, "ی").replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ").trim();
}

const searchable = new Map(
  groups.map(group => [group, normalizeText(group.textContent)])
);

function applyFilters() {
  const query = normalizeText(searchBox.value);
  const mode = filterBox.value;
  let visible = 0;

  groups.forEach(group => {
    const textMatch = searchable.get(group).includes(query);
    const modeMatch = mode === "all" || group.dataset[mode] === "1";
    group.hidden = !(textMatch && modeMatch);
    if (!group.hidden) visible++;
  });

  document.getElementById("visible-count").textContent =
    `${visible} نمونه نمایان از ${groups.length}`;
  document.getElementById("no-results").hidden = visible !== 0;
}

searchBox.addEventListener("input", applyFilters);
filterBox.addEventListener("change", applyFilters);

document.getElementById("expand").addEventListener("click", () => {
  groups.filter(group => !group.hidden).forEach(group => {
    group.querySelectorAll("details").forEach(detail => detail.open = true);
  });
});

document.getElementById("collapse").addEventListener("click", () => {
  groups.forEach(group => {
    group.querySelectorAll("details").forEach(detail => detail.open = false);
  });
});

document.getElementById("print").addEventListener("click", () => {
  window.print();
});

applyFilters();
</script>
</body>
</html>
"""

    replacements = {
        "TITLE": esc(REPORT_TITLE),
        "SYSTEM_NAME": esc(SYSTEM_NAME),
        "OVERALL_STATUS": esc(overall_status),
        "OVERALL_DESCRIPTION": esc(overall_description),
        "CREATED_AT": esc(summary["report_created_at"]),
        "RUN_ID": esc(summary["run_id"]),
        "TOTAL": str(total),
        "COMPLETE": str(summary["complete_samples"]),
        "LOW": str(summary["low_score_samples"]),
        "REVIEW": str(summary["review_samples"]),
        "THRESHOLD": f"{REVIEW_THRESHOLD:.2f}",
        "METRIC_CARDS": "".join(metric_cards),
        "OBSERVATIONS": observation_html,
        "STATISTICS_ROWS": "".join(statistics_rows),
        "SAMPLES": "".join(sample_html),
        "METADATA": metadata_rows,
        "INPUT_HASH": summary["input_sha256"],
        "CONTEXT_MIN": str(summary["context_count"]["min"]),
        "CONTEXT_MAX": str(summary["context_count"]["max"]),
        "CONTEXT_MEAN": f"{summary['context_count']['mean']:.2f}",
    }

    # جایگزینی یک‌مرحله‌ای؛ محتوای ورودی دوباره تفسیر نمی‌شود.
    return re.sub(
        r"@@([A-Z_]+)@@",
        lambda match: replacements[match.group(1)],
        template,
    )


def main():
    if not 0 <= REVIEW_THRESHOLD <= 1:
        raise ValueError("REVIEW_THRESHOLD باید بین صفر و یک باشد.")

    input_path = Path(INPUT_FILE).expanduser()
    output_root = Path(OUTPUT_DIRECTORY).expanduser()

    print("=" * 65)
    print("RAG Baseline Report")
    print("=" * 65)
    print(f"\n[1/5] Reading input:\n{input_path}")

    data, raw_bytes = load_and_validate(input_path)
    print(f"Input validated. Samples: {len(data)}")

    print("\n[2/5] Analyzing existing scores...")
    samples, metric_summary = analyze(data)

    now = datetime.now(timezone.utc)
    run_id = now.strftime("baseline_%Y%m%d_%H%M%S_%f_UTC")

    complete = sum(
        all(status == "valid" for status in sample["statuses"].values())
        for sample in samples
    )

    context_counts = [sample["context_count"] for sample in samples]

    summary = {
        "report_schema_version": "1.0",
        "run_id": run_id,
        "report_title": REPORT_TITLE,
        "system_name": SYSTEM_NAME,
        "report_created_at": now.isoformat(timespec="seconds"),
        "input_filename": input_path.name,
        "input_sha256": hashlib.sha256(raw_bytes).hexdigest(),
        "sample_count": len(samples),
        "complete_samples": complete,
        "incomplete_samples": len(samples) - complete,
        "low_score_samples": sum(
            bool(sample["low_metrics"]) for sample in samples
        ),
        "review_samples": sum(
            bool(sample["review_reasons"]) for sample in samples
        ),
        "duplicate_questions": (
            len(samples) - len({
                sample["user_input"] for sample in samples
            })
        ),
        "review_threshold": REVIEW_THRESHOLD,
        "aggregation": "unweighted_mean_of_valid_scores_per_metric",
        "semantic_evaluation_performed": False,
        "context_count": {
            "min": min(context_counts),
            "max": max(context_counts),
            "mean": statistics.mean(context_counts),
        },
        "metrics": metric_summary,
        "system_metadata": SYSTEM_METADATA,
    }

    print("\n[3/5] Preparing HTML...")
    report_html = make_html(summary, samples)

    output_root.mkdir(parents=True, exist_ok=True)
    run_directory = output_root / run_id
    run_directory.mkdir(exist_ok=False)

    print(f"\n[4/5] Saving files:\n{run_directory}")

    report_path = run_directory / "report.html"
    report_path.write_text(report_html, encoding="utf-8")

    save_json(run_directory / "summary.json", summary)
    save_json(run_directory / "samples.json", samples)
    save_csv(run_directory / "samples.csv", samples)

    # نسخه دقیق ورودی بدون تغییر؛ ممکن است حاوی NaN غیر استاندارد باشد.
    (run_directory / "source_input.json").write_bytes(raw_bytes)

    required_files = [
        report_path,
        run_directory / "summary.json",
        run_directory / "samples.json",
        run_directory / "samples.csv",
        run_directory / "source_input.json",
    ]

    for path in required_files:
        if not path.is_file() or path.stat().st_size == 0:
            raise RuntimeError(f"فایل خروجی درست ایجاد نشده است:\n{path}")

    print("\n[5/5] Report files created successfully.")
    print("\n" + "-" * 65)

    for metric, result in metric_summary.items():
        print(
            f"{metric:<20} "
            f"mean={fmt(result['mean']):<8} "
            f"valid={result['valid']}/{len(samples)}"
        )

    print("-" * 65)
    print(f"\nHTML report:\n{report_path.resolve()}")
    print(f"\nOutput folder:\n{run_directory.resolve()}")

    if OPEN_BROWSER:
        try:
            opened = webbrowser.open(report_path.resolve().as_uri())
            if not opened:
                print(
                    "\nBrowser could not be opened automatically. "
                    "Open report.html manually."
                )
        except Exception as exc:
            # شکست بازکردن مرورگر به معنای شکست ساخت گزارش نیست.
            print(f"\nBrowser warning: {exc}")
            print("Report is saved. Open report.html manually.")

    return report_path


if __name__ == "__main__":
    try:
        main()

    except Exception as exc:
        error_text = traceback.format_exc()

        print("\n" + "=" * 65)
        print("ERROR — گزارش کامل تولید نشد")
        print("=" * 65)
        print(str(exc))

        log_saved = False

        # ابتدا کنار کد؛ اگر امکان نوشتن نبود، در پوشه جاری.
        candidates = [
            Path(__file__).resolve().parent / "baseline_error.log",
            Path.cwd() / "baseline_error.log",
        ]

        for log_path in candidates:
            try:
                log_path.write_text(error_text, encoding="utf-8")
                print(f"\nError log:\n{log_path}")
                log_saved = True
                break
            except OSError:
                continue

        if not log_saved:
            print("\nCould not save error log.")
            print(error_text)

        if PAUSE_AT_END:
            try:
                input("\nPress Enter to close...")
            except (EOFError, KeyboardInterrupt):
                pass

        raise SystemExit(1)

    else:
        if PAUSE_AT_END:
            try:
                input("\nDone. Press Enter to close...")
            except (EOFError, KeyboardInterrupt):
                pass
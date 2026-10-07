import argparse
import csv
import json
import math
import statistics
from datetime import datetime
from pathlib import Path
from html import escape


METRICS = [
    "faithfulness",
    "context_precision",
    "context_recall",
    "answer_relevancy",
]


def is_valid_number(value):
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
    )


def load_results(path: Path):
    """
    Supports:
    1) JSON array
    2) JSON object containing a list
    3) JSONL
    """
    text = path.read_text(encoding="utf-8").strip()

    if not text:
        raise ValueError("Input file is empty.")

    # Standard JSON
    try:
        data = json.loads(text)

        if isinstance(data, list):
            return data

        if isinstance(data, dict):
            for key in ["results", "data", "samples"]:
                if isinstance(data.get(key), list):
                    return data[key]

            raise ValueError(
                "JSON object found, but no list under results/data/samples."
            )

    except json.JSONDecodeError:
        pass

    # JSONL fallback
    rows = []
    for line_no, line in enumerate(text.splitlines(), start=1):
        line = line.strip()

        if not line:
            continue

        try:
            row = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"Invalid JSONL at line {line_no}: {exc}"
            ) from exc

        rows.append(row)

    return rows


def safe_mean(values):
    if not values:
        return None
    return statistics.mean(values)


def safe_median(values):
    if not values:
        return None
    return statistics.median(values)


def metric_stats(rows, metric):
    values = [
        row.get(metric)
        for row in rows
        if is_valid_number(row.get(metric))
    ]

    total = len(rows)
    available = len(values)
    missing = total - available

    return {
        "metric": metric,
        "samples": total,
        "available": available,
        "missing": missing,
        "coverage": available / total if total else 0,
        "mean": safe_mean(values),
        "median": safe_median(values),
        "min": min(values) if values else None,
        "max": max(values) if values else None,
    }


def build_case_rows(rows):
    output = []

    for index, row in enumerate(rows, start=1):
        contexts = row.get("retrieved_contexts") or []

        metric_values = {
            metric: row.get(metric)
            if is_valid_number(row.get(metric))
            else None
            for metric in METRICS
        }

        output.append(
            {
                "case_id": row.get("id") or f"CASE-{index:03d}",
                "index": index,
                "question": row.get("user_input", ""),
                "answer": row.get("response", ""),
                "reference": row.get("reference", ""),
                "context_count": len(contexts),
                "answer_chars": len(row.get("response", "") or ""),
                **metric_values,
            }
        )

    return output


def worst_cases(case_rows, metric, limit=5):
    valid = [
        row for row in case_rows
        if is_valid_number(row.get(metric))
    ]

    return sorted(
        valid,
        key=lambda x: x[metric]
    )[:limit]


def build_markdown(report):
    lines = []

    lines.append(f"# iChAt RAG Baseline")
    lines.append("")
    lines.append(
        f"> Evaluation snapshot generated at `{report['generated_at']}`"
    )
    lines.append("")

    lines.append("## 1. Run Summary")
    lines.append("")
    lines.append("| Item | Value |")
    lines.append("|---|---:|")
    lines.append(f"| Dataset samples | {report['dataset']['samples']} |")
    lines.append(
        f"| Average retrieved contexts | "
        f"{report['dataset']['avg_context_count']:.2f} |"
    )
    lines.append(
        f"| Average answer length | "
        f"{report['dataset']['avg_answer_chars']:.0f} chars |"
    )
    lines.append("")

    lines.append("## 2. Core Metrics")
    lines.append("")
    lines.append(
        "| Metric | Mean | Median | Min | Max | Coverage |"
    )
    lines.append("|---|---:|---:|---:|---:|---:|")

    for metric in report["metrics"]:
        mean = (
            f"{metric['mean']:.4f}"
            if metric["mean"] is not None
            else "N/A"
        )
        median = (
            f"{metric['median']:.4f}"
            if metric["median"] is not None
            else "N/A"
        )
        min_value = (
            f"{metric['min']:.4f}"
            if metric["min"] is not None
            else "N/A"
        )
        max_value = (
            f"{metric['max']:.4f}"
            if metric["max"] is not None
            else "N/A"
        )

        coverage = f"{metric['coverage'] * 100:.1f}%"

        lines.append(
            f"| `{metric['metric']}` | {mean} | {median} | "
            f"{min_value} | {max_value} | {coverage} |"
        )

    lines.append("")

    lines.append("## 3. Metric Interpretation")
    lines.append("")
    lines.append(
        "- **Faithfulness:** آیا پاسخ تولیدشده توسط مدل با شواهد بازیابی‌شده سازگار است؟"
    )
    lines.append(
        "- **Context Precision:** آیا chunkهای مرتبط در رتبه‌های بالاتر Retrieval قرار گرفته‌اند؟"
    )
    lines.append(
        "- **Context Recall:** آیا اطلاعات لازم برای پاسخ در chunkهای بازیابی‌شده وجود دارد؟"
    )
    lines.append(
        "- **Answer Relevancy:** آیا پاسخ واقعاً به سؤال کاربر مرتبط است؟"
    )
    lines.append("")

    lines.append("## 4. Evaluation Coverage")
    lines.append("")
    for metric in report["metrics"]:
        if metric["missing"] == 0:
            status = "AVAILABLE"
        else:
            status = f"PARTIAL / MISSING {metric['missing']}"

        lines.append(
            f"- `{metric['metric']}` → **{status}**"
        )

    lines.append("")

    lines.append(
        "## 5. Lowest-Scoring Cases"
    )
    lines.append("")

    for metric in ["faithfulness", "context_precision", "context_recall"]:
        lines.append(f"### {metric}")
        lines.append("")
        lines.append("| Case | Score | Question |")
        lines.append("|---|---:|---|")

        for row in report["worst_cases"][metric]:
            question = row["question"].replace("\n", " ")
            if len(question) > 100:
                question = question[:97] + "..."

            lines.append(
                f"| {row['case_id']} | "
                f"{row[metric]:.4f} | {question} |"
            )

        lines.append("")

    lines.append("## 6. Baseline Notes")
    lines.append("")
    for note in report["notes"]:
        lines.append(f"- {note}")

    lines.append("")

    lines.append("## 7. Case-Level Results")
    lines.append("")
    lines.append(
        "| Case | Contexts | Faithfulness | Context Precision | "
        "Context Recall | Answer Relevancy |"
    )
    lines.append(
        "|---|---:|---:|---:|---:|---:|"
    )

    for row in report["cases"]:
        def fmt(metric):
            value = row.get(metric)
            return f"{value:.4f}" if is_valid_number(value) else "N/A"

        lines.append(
            f"| {row['case_id']} | {row['context_count']} | "
            f"{fmt('faithfulness')} | "
            f"{fmt('context_precision')} | "
            f"{fmt('context_recall')} | "
            f"{fmt('answer_relevancy')} |"
        )

    lines.append("")

    return "\n".join(lines)


def score_class(value):
    if not is_valid_number(value):
        return "na"

    if value >= 0.8:
        return "high"

    if value >= 0.6:
        return "medium"

    return "low"


def build_html(report):
    metric_labels = {
        "faithfulness": "Faithfulness",
        "context_precision": "Context Precision",
        "context_recall": "Context Recall",
        "answer_relevancy": "Answer Relevancy",
    }

    cards = []

    for metric in report["metrics"]:
        value = metric["mean"]

        if value is None:
            display = "N/A"
            css_class = "na"
        else:
            display = f"{value:.3f}"
            css_class = score_class(value)

        cards.append(
            f"""
            <div class="metric-card {css_class}">
                <div class="metric-title">
                    {metric_labels[metric["metric"]]}
                </div>
                <div class="metric-value">{display}</div>
                <div class="metric-meta">
                    Coverage: {metric["coverage"] * 100:.1f}%
                </div>
            </div>
            """
        )

    rows_html = []

    for row in report["cases"]:
        def cell(metric):
            value = row.get(metric)

            if not is_valid_number(value):
                return '<span class="na-text">N/A</span>'

            cls = score_class(value)

            return (
                f'<span class="score {cls}">'
                f'{value:.3f}'
                f'</span>'
            )

        rows_html.append(
            f"""
            <tr>
                <td>{escape(row["case_id"])}</td>
                <td>{row["context_count"]}</td>
                <td>{cell("faithfulness")}</td>
                <td>{cell("context_precision")}</td>
                <td>{cell("context_recall")}</td>
                <td>{cell("answer_relevancy")}</td>
                <td class="question">
                    {escape(row["question"])}
                </td>
            </tr>
            """
        )

    notes_html = "".join(
        f"<li>{escape(note)}</li>"
        for note in report["notes"]
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>iChAt RAG Baseline</title>

<style>
body {{
    font-family: Segoe UI, Arial, sans-serif;
    margin: 0;
    padding: 32px;
    background: #f5f7fa;
    color: #202124;
}}

.container {{
    max-width: 1400px;
    margin: auto;
}}

.header {{
    background: white;
    border-radius: 16px;
    padding: 28px;
    margin-bottom: 24px;
    box-shadow: 0 3px 15px rgba(0,0,0,.06);
}}

h1 {{
    margin: 0 0 8px;
}}

.subtitle {{
    color: #666;
}}

.metric-grid {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
}}

.metric-card {{
    background: white;
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 3px 12px rgba(0,0,0,.05);
    border-top: 5px solid #bbb;
}}

.metric-card.high {{
    border-top-color: #2e7d32;
}}

.metric-card.medium {{
    border-top-color: #ed8b00;
}}

.metric-card.low {{
    border-top-color: #c62828;
}}

.metric-card.na {{
    border-top-color: #777;
}}

.metric-title {{
    font-size: 14px;
    color: #666;
}}

.metric-value {{
    font-size: 34px;
    font-weight: 700;
    margin: 12px 0;
}}

.metric-meta {{
    font-size: 13px;
    color: #777;
}}

.section {{
    background: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 3px 12px rgba(0,0,0,.05);
}}

table {{
    width: 100%;
    border-collapse: collapse;
}}

th, td {{
    padding: 10px;
    border-bottom: 1px solid #eee;
    text-align: left;
    vertical-align: top;
}}

th {{
    background: #f8f9fa;
}}

.question {{
    max-width: 500px;
}}

.score {{
    display: inline-block;
    min-width: 58px;
    text-align: center;
    padding: 4px 8px;
    border-radius: 8px;
    font-weight: 600;
}}

.score.high {{
    background: #e8f5e9;
    color: #2e7d32;
}}

.score.medium {{
    background: #fff3e0;
    color: #ef6c00;
}}

.score.low {{
    background: #ffebee;
    color: #c62828;
}}

.na-text {{
    color: #999;
}}

ul {{
    line-height: 1.8;
}}

@media (max-width: 1000px) {{
    .metric-grid {{
        grid-template-columns: repeat(2, 1fr);
    }}
}}
</style>
</head>

<body>
<div class="container">

<div class="header">
    <h1>iChAt — RAG Baseline</h1>
    <div class="subtitle">
        Generated: {escape(report["generated_at"])}
    </div>
</div>

<div class="metric-grid">
    {"".join(cards)}
</div>

<div class="section">
    <h2>Evaluation Coverage</h2>

    <table>
        <tr>
            <th>Metric</th>
            <th>Available</th>
            <th>Missing</th>
            <th>Coverage</th>
        </tr>

        {
    "".join(
        (
            f"<tr>"
            f"<td>{escape(m['metric'])}</td>"
            f"<td>{m['available']}</td>"
            f"<td>{m['missing']}</td>"
            f"<td>{m['coverage'] * 100:.1f}%</td>"
            f"</tr>"
        )
        for m in report["metrics"]
    )
}
    </table>
</div>

<div class="section">
    <h2>Baseline Notes</h2>
    <ul>
        {notes_html}
    </ul>
</div>

<div class="section">
    <h2>Case-Level Results</h2>

    <table>
        <tr>
            <th>Case</th>
            <th>Contexts</th>
            <th>Faithfulness</th>
            <th>Context Precision</th>
            <th>Context Recall</th>
            <th>Answer Relevancy</th>
            <th>Question</th>
        </tr>

        {"".join(rows_html)}
    </table>
</div>

</div>
</body>
</html>
"""


def main():
    parser = argparse.ArgumentParser(
        description="Build a technical baseline report from RAGAS results."
    )

    parser.add_argument(
        "input",
        help="Path to RAGAS result JSON/JSONL file",
    )

    parser.add_argument(
        "--output-dir",
        default="baseline",
        help="Output directory",
    )

    args = parser.parse_args()

    input_path = Path(args.input)
    output_dir = Path(args.output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)

    rows = load_results(input_path)

    if not rows:
        raise ValueError("No evaluation rows found.")

    case_rows = build_case_rows(rows)

    metrics = [
        metric_stats(rows, metric)
        for metric in METRICS
    ]

    avg_context_count = statistics.mean(
        row["context_count"]
        for row in case_rows
    )

    avg_answer_chars = statistics.mean(
        row["answer_chars"]
        for row in case_rows
    )

    notes = []

    answer_relevancy = next(
        m for m in metrics
        if m["metric"] == "answer_relevancy"
    )

    if answer_relevancy["available"] == 0:
        notes.append(
            "Answer Relevancy has no valid values and must be treated as "
            "N/A, not zero."
        )
    elif answer_relevancy["missing"] > 0:
        notes.append(
            "Answer Relevancy is only partially available."
        )

    if any(
        m["missing"] > 0
        for m in metrics
    ):
        notes.append(
            "Metric coverage is incomplete; baseline comparisons should "
            "use both score and coverage."
        )

    notes.append(
        "No composite overall score is calculated. The four RAGAS metrics "
        "represent different quality dimensions."
    )

    notes.append(
        "This baseline is a snapshot of the current system and should be "
        "kept unchanged for future regression comparison."
    )

    report = {
        "baseline_version": "1.0",
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "source_file": str(input_path),
        "dataset": {
            "samples": len(rows),
            "avg_context_count": avg_context_count,
            "avg_answer_chars": avg_answer_chars,
        },
        "metrics": metrics,
        "notes": notes,
        "cases": case_rows,
        "worst_cases": {
            metric: worst_cases(case_rows, metric)
            for metric in [
                "faithfulness",
                "context_precision",
                "context_recall",
            ]
        },
    }

    # ---------------------------------------------------------
    # JSON
    # ---------------------------------------------------------

    json_path = output_dir / "baseline_summary.json"

    json_path.write_text(
        json.dumps(
            report,
            ensure_ascii=False,
            indent=2,
            allow_nan=False,
        ),
        encoding="utf-8",
    )

    # ---------------------------------------------------------
    # Markdown
    # ---------------------------------------------------------

    markdown_path = output_dir / "baseline_report.md"

    markdown_path.write_text(
        build_markdown(report),
        encoding="utf-8",
    )

    # ---------------------------------------------------------
    # HTML
    # ---------------------------------------------------------

    html_path = output_dir / "baseline_report.html"

    html_path.write_text(
        build_html(report),
        encoding="utf-8",
    )

    # ---------------------------------------------------------
    # CSV
    # ---------------------------------------------------------

    csv_path = output_dir / "baseline_cases.csv"

    fieldnames = [
        "case_id",
        "index",
        "context_count",
        "answer_chars",
        "faithfulness",
        "context_precision",
        "context_recall",
        "answer_relevancy",
        "question",
        "answer",
        "reference",
    ]

    with csv_path.open(
        "w",
        encoding="utf-8-sig",
        newline="",
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=fieldnames,
        )

        writer.writeheader()

        for row in case_rows:
            writer.writerow(row)

    print()
    print("=" * 70)
    print("iChAt RAG Baseline")
    print("=" * 70)
    print(f"Samples : {len(rows)}")
    print()

    for metric in metrics:
        value = (
            f"{metric['mean']:.4f}"
            if metric["mean"] is not None
            else "N/A"
        )

        print(
            f"{metric['metric']:20} "
            f"mean={value:>7} "
            f"coverage={metric['coverage'] * 100:>6.1f}%"
        )

    print()
    print("Generated files:")
    print(f"  {json_path}")
    print(f"  {markdown_path}")
    print(f"  {html_path}")
    print(f"  {csv_path}")
    print("=" * 70)


if __name__ == "__main__":
    main()
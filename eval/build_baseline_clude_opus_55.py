import json
import pandas as pd
from datetime import datetime
from typing import Dict, List
import statistics

class BaselineGenerator:
    """
    کلاس برای تولید گزارش Baseline شفاف و فنی
    """
    
    def __init__(self, results: List[Dict]):
        self.results = results
        self.timestamp = datetime.now().isoformat()
        
    def calculate_metrics(self) -> Dict:
        """محاسبه متریکس‌های کیفیتی"""
        
        faithfulness_scores = [r.get('faithfulness', 0) for r in self.results if r.get('faithfulness') is not None]
        context_precision = [r.get('context_precision', 0) for r in self.results]
        context_recall = [r.get('context_recall', 0) for r in self.results]
        
        return {
            "total_samples": len(self.results),
            "metrics": {
                "faithfulness": {
                    "mean": round(statistics.mean(faithfulness_scores), 4),
                    "min": round(min(faithfulness_scores), 4) if faithfulness_scores else 0,
                    "max": round(max(faithfulness_scores), 4) if faithfulness_scores else 0,
                    "stdev": round(statistics.stdev(faithfulness_scores), 4) if len(faithfulness_scores) > 1 else 0
                },
                "context_precision": {
                    "mean": round(statistics.mean(context_precision), 4),
                    "min": round(min(context_precision), 4),
                    "max": round(max(context_precision), 4),
                },
                "context_recall": {
                    "mean": round(statistics.mean(context_recall), 4),
                    "min": round(min(context_recall), 4),
                    "max": round(max(context_recall), 4),
                }
            }
        }
    
    def generate_json_report(self) -> str:
        """تولید گزارش JSON"""
        metrics = self.calculate_metrics()
        
        report = {
            "baseline_report": {
                "metadata": {
                    "generated_at": self.timestamp,
                    "system_version": "RAG-v2.1",
                    "framework": "LLM-based QA System"
                },
                "summary": {
                    "total_queries": metrics["total_samples"],
                    "overall_status": "OPERATIONAL",
                    "health_score": round(
                        (metrics["metrics"]["faithfulness"]["mean"] + 
                         metrics["metrics"]["context_precision"]["mean"] + 
                         metrics["metrics"]["context_recall"]["mean"]) / 3, 4
                    )
                },
                "detailed_metrics": metrics["metrics"],
                "sample_results": self.results[:3]  # نمونه 3 مورد اول
            }
        }
        
        return json.dumps(report, ensure_ascii=False, indent=2)
    
    def generate_markdown_report(self) -> str:
        """تولید گزارش Markdown"""
        metrics = self.calculate_metrics()
        
        report = f"""
# 📊 گزارش BaseLine سیستم RAG

## ⏰ اطلاعات کلی
- **تاریخ تولید**: {self.timestamp}
- **نسخه سیستم**: RAG-v2.1
- **تعداد نمونه‌های تست**: {metrics['total_samples']}
- **وضعیت سیستم**: ✅ فعال و پایدار

---

## 📈 خلاصه متریکس‌ها

| متریک | میانگین | حداقل | حداکثر | انحراف معیار |
|-------|---------|-------|--------|-------------|
| **Faithfulness** | {metrics['metrics']['faithfulness']['mean']:.4f} | {metrics['metrics']['faithfulness']['min']:.4f} | {metrics['metrics']['faithfulness']['max']:.4f} | {metrics['metrics']['faithfulness']['stdev']:.4f} |
| **Context Precision** | {metrics['metrics']['context_precision']['mean']:.4f} | {metrics['metrics']['context_precision']['min']:.4f} | {metrics['metrics']['context_precision']['max']:.4f} | - |
| **Context Recall** | {metrics['metrics']['context_recall']['mean']:.4f} | {metrics['metrics']['context_recall']['min']:.4f} | {metrics['metrics']['context_recall']['max']:.4f} | - |

---

## 🎯 تفسیر نتایج

### Faithfulness ({metrics['metrics']['faithfulness']['mean']:.1%})
معیار تطابق پاسخ‌های مدل با متون بازیابی شده
- ✅ سطح **{self._get_status(metrics['metrics']['faithfulness']['mean'])}**

### Context Precision ({metrics['metrics']['context_precision']['mean']:.1%})
دقت متون بازیابی شده در پاسخ به سؤال
- ✅ سطح **{self._get_status(metrics['metrics']['context_precision']['mean'])}**

### Context Recall ({metrics['metrics']['context_recall']['mean']:.1%})
جامعیت متون بازیابی شده
- ✅ سطح **{self._get_status(metrics['metrics']['context_recall']['mean'])}**

---

## 🔍 نمونه‌های تفصیلی

"""
        
        for i, result in enumerate(self.results[:5], 1):
            report += f"""
### مثال {i}: {result.get('user_input', 'بدون سؤال')[:60]}...
- **Faithfulness**: {result.get('faithfulness', 'N/A')}
- **Context Precision**: {result.get('context_precision', 'N/A')}
- **Context Recall**: {result.get('context_recall', 'N/A')}

"""
        
        return report
    
    def generate_html_report(self) -> str:
        """تولید گزارش HTML تعاملی"""
        metrics = self.calculate_metrics()
        
        html = f"""
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <title>گزارش BaseLine</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma; direction: rtl; margin: 20px; }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th, td {{ border: 1px solid #ddd; padding: 12px; text-align: right; }}
        th {{ background-color: #667eea; color: white; }}
        tr:nth-child(even) {{ background-color: #f9f9f9; }}
        .metric-card {{ background: white; padding: 15px; border-radius: 8px; margin: 10px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
        .good {{ color: #27ae60; font-weight: bold; }}
        .warning {{ color: #f39c12; font-weight: bold; }}
        .critical {{ color: #e74c3c; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 گزارش BaseLine سیستم RAG</h1>
            <p>تولید شده در: {self.timestamp}</p>
        </div>
        
        <div class="metric-card">
            <h3>خلاصه کلی</h3>
            <p>تعداد نمونه‌های تست: <strong>{metrics['total_samples']}</strong></p>
            <p>وضعیت سیستم: <strong class="good">✅ فعال</strong></p>
        </div>
        
        <table>
            <tr>
                <th>متریک</th>
                <th>میانگین</th>
                <th>حداقل</th>
                <th>حداکثر</th>
                <th>وضعیت</th>
            </tr>
            <tr>
                <td><strong>Faithfulness</strong></td>
                <td>{metrics['metrics']['faithfulness']['mean']:.4f}</td>
                <td>{metrics['metrics']['faithfulness']['min']:.4f}</td>
                <td>{metrics['metrics']['faithfulness']['max']:.4f}</td>
                <td class="{self._get_status_class(metrics['metrics']['faithfulness']['mean'])}">{self._get_status(metrics['metrics']['faithfulness']['mean'])}</td>
            </tr>
            <tr>
                <td><strong>Context Precision</strong></td>
                <td>{metrics['metrics']['context_precision']['mean']:.4f}</td>
                <td>{metrics['metrics']['context_precision']['min']:.4f}</td>
                <td>{metrics['metrics']['context_precision']['max']:.4f}</td>
                <td class="{self._get_status_class(metrics['metrics']['context_precision']['mean'])}">{self._get_status(metrics['metrics']['context_precision']['mean'])}</td>
            </tr>
            <tr>
                <td><strong>Context Recall</strong></td>
                <td>{metrics['metrics']['context_recall']['mean']:.4f}</td>
                <td>{metrics['metrics']['context_recall']['min']:.4f}</td>
                <td>{metrics['metrics']['context_recall']['max']:.4f}</td>
                <td class="{self._get_status_class(metrics['metrics']['context_recall']['mean'])}">{self._get_status(metrics['metrics']['context_recall']['mean'])}</td>
            </tr>
        </table>
    </div>
</body>
</html>
"""
        return html
    
    @staticmethod
    def _get_status(value: float) -> str:
        """تعیین وضعیت بر اساس مقدار"""
        if value >= 0.85:
            return "عالی ✅"
        elif value >= 0.75:
            return "خوب 👍"
        elif value >= 0.60:
            return "قابل قبول ⚠️"
        else:
            return "نیاز به بهبود ❌"
    
    @staticmethod
    def _get_status_class(value: float) -> str:
        if value >= 0.85:
            return "good"
        elif value >= 0.75:
            return "good"
        else:
            return "warning"


# استفاده
if __name__ == "__main__":
    # داده‌های خروجی شما
    results = [
        {
            "user_input": "طبق آیین‌نامه سطح دو...",
            "faithfulness": 0.0,
            "context_precision": 0.9999999999666667,
            "context_recall": 1.0
        },
        # ... سایر نتایج
    ]
    
    baseline = BaselineGenerator(results)
    
    # تولید فایل‌های مختلف
    with open("baseline_report.json", "w", encoding="utf-8") as f:
        f.write(baseline.generate_json_report())
    
    with open("baseline_report.md", "w", encoding="utf-8") as f:
        f.write(baseline.generate_markdown_report())
    
    with open("baseline_report.html", "w", encoding="utf-8") as f:
        f.write(baseline.generate_html_report())
    
    print("✅ گزارشات تولید شد:")
    print("  📄 baseline_report.json")
    print("  📋 baseline_report.md")
    print("  🌐 baseline_report.html")
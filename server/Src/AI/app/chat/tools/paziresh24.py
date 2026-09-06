import json
from typing import Optional
import re
from fastapi import params
import requests
from langchain_core.tools import tool
from app.chat.logger import get_logger
from app.chat.models.models import CardMetric, CardViewResponse, CardViewType, ListOptionItem, ListOptionResponse, ResponseType, GraphResult, ToolCallResult

logger = get_logger("paziresh24")

# ---------------------------------------------------------------------------
# City slug mapping: Persian city name → Paziresh24 URL slug
# ---------------------------------------------------------------------------
_CITY_SLUG_MAP: dict[str, str] = {
    "آب بر": "abbar",
    "آبادان": "abadan",
    "آباده": "abadeh",
    "آبدانان": "abdanan",
    "آبگرم": "abegarm",
    "آبیک": "abyek",
    "آذر شهر": "azarshahr",
    "آرادان": "aradan",
    "آران و بیدگل": "aran-va-bidgol",
    "آزاد شهر": "azadshahr",
    "آسارا": "asara",
    "آستارا": "astara",
    "آستانه اشرفیه": "astaneh-ye-ashrafiyeh",
    "آشتیان": "ashtian",
    "آشخانه": "ashkhaneh",
    "آغاجاری": "aghajari",
    "آق قلا": "aq-qala",
    "آمل": "amol",
    "آوج": "avej",
    "ابرکوه": "abarkooh",
    "ابوموسی": "abu-musa",
    "ابهر": "abhar",
    "اراک": "arak",
    "اردبیل": "ardabil",
    "اردستان": "ardestān",
    "اردکان": "ardakan",
    "اردکان فارس": "ardakan-fars",
    "اردل": "ardal",
    "ارزوئیه": "arzuiyeh",
    "ارژن": "arzhan",
    "ارسنجان": "arsenjan",
    "ارومیه": "orumieh",
    "ازنا": "azna",
    "استهبان": "estahban",
    "اسدآباد": "asadabad",
    "اسفراین": "esfarāyen",
    "اسکو": "osku",
    "اسلام آباد غرب": "eslamabad-e-gharb",
    "اسلامشهر": "eslamshahr",
    "اشتهارد": "eshtehard",
    "اشکذر": "ashkezar",
    "اشنویه": "oshnavieh",
    "اصفهان": "isfahan",
    "اقلید": "eghlid",
    "الشتر": "aleshtar",
    "الوند": "alvand",
    "الیگودرز": "aligudarz",
    "املش": "amlash",
    "امیدیه": "omidiyeh",
    "انار": "anar",
    "اندیشه": "andisheh",
    "اندیمشک": "andimeshk",
    "انگهران": "gouharan",
    "اوز": "evaz",
    "اهر": "ahar",
    "اهرم": "ahram",
    "اهواز": "ahvaz",
    "ایجرود": "ijrud",
    "ایذه": "izeh",
    "ایرانشهر خوزسنان": "iranshahr-khuzestan",
    "ایرانشهر سیستان و بلوچستان": "iranshahr",
    "ایلام": "ilam",
    "ایلخچی": "ilkhchi",
    "ایوان": "iwan",
    "ایوانکی": "eyvanakey",
    "باب انار/خفر": "bab-anar",
    "بابک": "babak",
    "بابل": "babol",
    "بابلسر": "babolsar",
    "باسمنج": "basmenj",
    "باشت": "basht",
    "باغ بهادران": "baghbahadoran",
    "باغ ملک": "baghmalek",
    "بافت": "baft",
    "بافق": "bafgh",
    "باقرشهر": "baghershahr",
    "بانه": "baneh",
    "بجستان": "bajestan",
    "بجنورد": "bojnurd",
    "برازجان": "borazjan",
    "بردخون": "bord-khun",
    "بردسکن": "bardaskan",
    "بردسیر": "bardsir",
    "بروجرد": "borujerd",
    "بروجن": "borujen",
    "بستان آباد": "bostanabad",
    "بستک": "bastak",
    "بسطام": "bastam",
    "بشرویه": "boshruyeh",
    "بلده": "baladeh",
    "بم": "bam",
    "بناب": "bonab",
    "بندر امام خمینی": "bandar-imam-khomeini",
    "بندر جاسک": "bandar-e-jask",
    "بندر خمیر": "bandar-khamir",
    "بندر شرفخانه": "sharafkhaneh",
    "بندر کیاشهر": "kiashahr",
    "بندر گز": "bandar-gaz",
    "بندر لنگه": "bandar-lengeh",
    "بندر ماهشهر": "bandar-mahshahr",
    "بندرانزلی": "bandar-anzali",
    "بندرعباس": "bandar-abbas",
    "بوانات": "bavanat",
    "بوئین زهرا": "buin-zahra",
    "بوشهر": "bushehr",
    "بوکان": "bukan",
    "بومهن": "boomehen",
    "بهار": "bahar",
    "بهارستان": "baharestan",
    "بهبهان": "behbahan",
    "بهشهر": "behshahr",
    "بیجار": "bijar",
    "بیرجند": "birjand",
    "بیضا": "beyza",
    "بیله سوار": "bileh-savar",
    "پارس آباد": "parsabad",
    "پارسیان": "parsian",
    "پاسارگاد": "pasargad",
    "پاکدشت": "pakdasht",
    "پاوه": "pave",
    "پردیس": "pardis",
    "پرند": "parand",
    "پل سفید": "pol-sefid",
    "پلدختر": "pol-dokhtar",
    "پلدشت": "poldasht",
    "پیرانشهر": "piranshahr",
    "تاکستان": "takestan",
    "تالش": "talesh",
    "تایباد": "taybad",
    "تبریز": "tabriz",
    "تجریش": "tajrish",
    "تربت جام": "torbat-e-jam",
    "تربت حیدریه": "torbat-heydariyeh",
    "ترکمن": "torkaman",
    "تسوج": "tasuj",
    "تفت": "taft",
    "تفرش": "tafresh",
    "تکاب": "takab",
    "تنب بزرگ": "greater-tunb",
    "تنکابن": "tonekabon",
    "تنگستان": "tangestan",
    "تودشک": "toodeshk",
    "تویسرکان": "tuyserkan",
    "تهران": "tehran",
    "تیران": "tiran",
    "جاجرم": "jajarm",
    "جلفا": "jolfa",
    "جم": "jam",
    "جوانرود": "javanrud",
    "جویبار": "juybar",
    "جهرم": "jahrom",
    "جیرفت": "jiroft",
    "چابهار": "chabahar",
    "چادگان": "chadegan",
    "چالدران": "chaldoran",
    "چالوس": "chalus",
    "چایپاره": "qarah-ziyaeddin",
    "چرام": "charam",
    "چلگرد": "chelgerd",
    "چناران": "chenaran",
    "چهاردانگه": "chahar-dangeh",
    "حاجی آباد": "haji-abad",
    "حاجی آباد اصفهان": "haji-abad-isfahan",
    "حاجی آباد فارس": "haji-abad-fars",
    "حسن آباد": "hasan-abad",
    "حمیدیه": "hamidiyeh",
    "حمیدیه شهر": "hamidiyeh-shahr",
    "خارک": "kharg",
    "خاش": "khash",
    "خان زنیان": "khaneh-zenyan",
    "خدابنده": "khodabandeh",
    "خرامه": "kharameh",
    "خرم آباد": "khorramabad",
    "خرم بید": "khorrambid",
    "خرمدره": "khorramdarreh",
    "خرمشهر": "khorramshahr",
    "خسروشهر": "khosroshahr",
    "خشک بیجار": "khoshkebijar",
    "خضرآباد": "khezrabad",
    "خلخال": "khalkhal",
    "خلیل‌آباد": "khalilabad",
    "خمام": "khomam",
    "خمین": "khomein",
    "خمینی شهر": "khomeini-shahr",
    "خنج": "khonj",
    "خنداب": "khondab",
    "خواف": "khaf",
    "خوانسار": "khansar",
    "خورموج": "khormoj",
    "خوی": "khoy",
    "داراب": "darab",
    "داریون": "dariun",
    "دامغان": "damghan",
    "داورزن": "davarzan",
    "درچه": "dorcheh",
    "درگز": "dargaz",
    "درمیان": "darmiyan",
    "دره شهر": "darreh-shahr",
    "دزفول": "dezful",
    "دزفول لرستان": "dezful-lorestan",
    "دشتستان": "dashtestan",
    "دشتی": "dashti",
    "دغاغله": "daghagheleh",
    "دلگان": "dalgan",
    "دلیجان": "delijan",
    "دماوند": "damavand",
    "دنا": "dana",
    "دورود": "dorud",
    "دوگنبدان": "dogonbadan",
    "دولت آباد": "dowlatabad",
    "ده بید": "deh-bid",
    "دهاقان": "dehaghan",
    "دهبارز": "dehbārez",
    "دهدشت": "dehdasht",
    "دهگلان": "dehgolan",
    "دهلران": "dehloran",
    "دیر": "dayyer",
    "دیلم": "bandar-deylam",
    "دیواندره": "divandarreh",
    "رابر": "rabor",
    "راسک": "rask",
    "رامسر": "ramsar",
    "رامشیر": "ramshir",
    "رامهرمز": "ramhormoz",
    "رامیان": "ramian",
    "راور": "ravar",
    "رباط کریم": "robat-karim",
    "رزن": "razan",
    "رشت": "rasht",
    "رضوان شهر": "rezvanshahr",
    "رفسنجان": "rafsanjan",
    "روانسر": "ravansar",
    "رود سر": "rudsar",
    "رودان": "rudan",
    "رودبار": "rudbar",
    "رودهن": "roodehen",
    "ری": "shahr-e-rey",
    "ریشهر": "rishehr",
    "زابل": "zabol",
    "زارچ": "zarch",
    "زاهدان": "zahedan",
    "زرقان": "zarghan",
    "زرند": "zarand",
    "زرندیه": "zarandiyeh",
    "زرین آباد": "zarinabad",
    "زرین شهر": "zarinshahr",
    "زنجان": "zanjan",
    "ساری": "sari",
    "سامان": "saman",
    "ساوه": "saveh",
    "سبزوار": "sabzevar",
    "سپیدان": "sepidan",
    "سر پل ذهاب": "sarpol-zahab",
    "سر دشت": "sardasht",
    "سر ولایت": "sarvelayat",
    "سراب": "sarab",
    "سرابله": "sarableh",
    "سراوان": "saravan",
    "سرایان": "sarayan",
    "سرباز": "sarbaz",
    "سربند": "sarband",
    "سربیشه": "sarbishe",
    "سرخس": "sarakhs",
    "سرخه": "sorkheh",
    "سرعین": "sarein",
    "سروآباد": "sarvabad",
    "سروستان": "sarvestan",
    "سقز": "saqqez",
    "سلطانیه": "soltaniyeh",
    "سلماس": "salmas",
    "سلمان شهر": "salmanshahr",
    "سمنان": "semnan",
    "سمیرم": "semirom",
    "سنقر": "sonqor",
    "سنندج": "sanandaj",
    "سواد کوه": "savadkuh",
    "سوریان": "surian",
    "سوسنگرد": "susangerd",
    "سهند": "sahand",
    "سی سخت": "sisakht",
    "سیاخ دارنگون": "siyakh-darengun",
    "سیاهکل": "siahkal",
    "سید میرزا": "seyyed-mirza",
    "سیرجان": "sirjan",
    "سیریک": "sirik",
    "سیه چشمه": "siah-cheshmeh",
    "شادگان": "shadegan",
    "شازند": "shazand",
    "شاندیز": "shandiz",
    "شاهدیه": "shahediyeh",
    "شاهرود": "shahroud",
    "شاهو": "shaho",
    "شاهین دژ": "shahin-dej",
    "شاهین شهر": "shahin-shahr",
    "شبستر": "shabestar",
    "شریف آباد": "sharifabad",
    "شفت": "shaft",
    "شوش": "shush",
    "شوشتر": "shushtar",
    "شوط": "showt",
    "شهرضا": "shahreza",
    "شهرک گلستان": "shahrak-e-golestan",
    "شهرکرد": "shahrekord",
    "شهریار": "shahriar",
    "شیراز": "shiraz",
    "شیروان": "shirvan",
    "شیروان چرداول": "chardavol",
    "صحنه": "sahneh",
    "صفاشهر": "safashahr",
    "صلوات آباد": "salvatabad",
    "صوفیان": "soufian",
    "صومعه سرا": "someh-sara",
    "طارم": "tarom",
    "طالقان": "taleqan",
    "طبس": "tabas",
    "طبس مسینا": "tabas-masina",
    "طبس یزد": "tabas-yazd",
    "طرقبه": "torghabeh",
    "عباس‌آباد": "abbasabad",
    "عجبشیر": "ajabshir",
    "عسگران": "asgaran",
    "عسلویه": "asaluyeh",
    "علویجه": "alavijeh",
    "علی آباد کتول": "aliabad-e-katul",
    "عنبرآباد": "anbarabad",
    "فارسان": "farsan",
    "فاروج": "faruj",
    "فامنین": "famenin",
    "فراشبند": "farashband",
    "فرخ‌شهر": "farrokh-shahr",
    "فردوس": "ferdows",
    "فردیس": "fardis",
    "فریدن": "fereidan",
    "فریدون شهر": "fereydun-shahr",
    "فریدون کنار": "fereydunkenar",
    "فریمان": "fariman",
    "فسا": "fasa",
    "فشم": "fasham",
    "فلارد": "felard",
    "فلاورجان": "falavarjan",
    "فنوج": "fannuj",
    "فولاد شهر": "fooladshahr",
    "فومن": "fooman",
    "فیروز آباد": "firuzabad",
    "فیروزکوه": "firuzkuh",
    "فیروزه": "firooze",
    "قائم شهر": "qaemshahr",
    "قائمیه": "ghaemiyeh",
    "قائن": "ghayen",
    "قادرآباد": "qaderabad",
    "قدس": "qods",
    "قدمگاه": "ghadamgah",
    "قرچک": "qarchak",
    "قروه": "qorveh",
    "قره آغاج": "ghareaghaj",
    "قزوین": "qazvin",
    "قشم": "qeshm",
    "قصر شیرین": "qasr-e-shirin",
    "قصرقند": "qasr-e-qand",
    "قلعه‌گنج": "qaleh-ganj",
    "قم": "qom",
    "قوچان": "ghochan",
    "قهستان": "qohestan",
    "قیدار": "qeydar",
    "قیروکارزین": "ghirokarzin",
    "کازرون": "kazeroon",
    "کاشان": "kashan",
    "کاشمر": "kashmar",
    "کاکی": "kaki",
    "کامیاران": "kamyaran",
    "کبودر اهنگ": "kabudrahang",
    "کرج": "karaj",
    "کردکوی": "kordkuy",
    "کرمان": "kerman",
    "کرمانشاه": "kermanshah",
    "کلات": "kalat-nader",
    "کلاچای": "kelachay",
    "کلاردشت": "kelardasht",
    "کلاله": "kalaleh",
    "کلیبر": "kaleybar",
    "کمیجان": "komijan",
    "کن": "kan",
    "کندوان": "kandovan",
    "کنگان": "bandar-e-kangan",
    "کنگاور": "kangavar",
    "کوار": "kavar",
    "کوثر": "kosar",
    "کوهبنان": "kouhbanan",
    "کوهپایه": "kuhpayeh",
    "کوهدشت": "kuhdasht",
    "کهریزک": "kahrizak",
    "کهنوج": "kahnooj",
    "کیار": "kiar",
    "کیش": "kish",
    "کیوی": "kivi",
    "گچساران": "gachsaran",
    "گراش": "gerash",
    "گرگان": "gorgan",
    "گرمسار": "garmsar",
    "گرمه": "garmeh",
    "گرمی": "germi",
    "گلپایگان": "golpayegan",
    "گلوگاه": "galugah",
    "گناباد": "gonabad",
    "گناوه": "bandar-ganaveh",
    "گنبد کاووس": "gonbad-kavus",
    "گوهردشت": "gohardasht",
    "گویم": "gouyom",
    "گیلان غرب": "gilan-gharb",
    "لار": "lar",
    "لالی": "lali",
    "لامرد": "lamerd",
    "لاهیجان": "lahijan",
    "لردگان": "lordegan",
    "لشت نشا": "lasht-e-nesha",
    "لنده": "landeh",
    "لنگرود": "langarud",
    "لواسان": "lavasan",
    "لیکک": "likak",
    "ماسال": "masal",
    "ماسوله": "masuleh",
    "ماکو": "maku",
    "ماهدشت": "mahdasht",
    "ماهشهر": "mahshahr",
    "ماهنشان": "mahneshan",
    "مبارکه": "mobarakeh",
    "محلات": "mahalat",
    "محمدشهر": "mohammadshahr",
    "محمدیه": "mohammadieh",
    "محمود آباد": "mahmudabad",
    "مراغه": "maragheh",
    "مرند": "marand",
    "مرودشت": "marvdasht",
    "مریوان": "mariwan",
    "مسجد سلیمان": "masjed-soleiman",
    "مشکین دشت": "meshkindasht",
    "مشگین شهر": "meshgin-shahr",
    "مشهد": "mashhad",
    "مغان": "mughan",
    "ملاثانی": "mollasani",
    "ملارد": "malard",
    "ملایر": "malayer",
    "ملکان": "malekan",
    "ممسنی": "mamasani",
    "ممقان": "mamaghan",
    "منجیل": "manjil",
    "منوجان": "manujan",
    "مهاباد": "mahabad",
    "مهدی‌شهر": "mehdishahr",
    "مهر": "mehr",
    "مهران": "mehran",
    "مهردشت": "mehrdasht",
    "مهریز": "mehriz",
    "میاندوآب": "qoshachay",
    "میانه": "mianeh",
    "میبد": "meybod",
    "میرجاوه": "mirjaveh",
    "میناب": "minab",
    "مینو دشت": "minudasht",
    "نایین": "naein",
    "نجف": "najaf",
    "نجف آباد": "najafabad",
    "نرماشیر": "narmashir",
    "نطنز": "natanz",
    "نظر آباد": "nazarabad",
    "نقده": "naqadeh",
    "نکا": "neka",
    "نمین": "namin",
    "نور": "nur",
    "نور آباد": "nourabad",
    "نورآباد": "nurabad",
    "نوشهر": "nowshahr",
    "نهاوند": "nahavand",
    "نهبندان": "nehbandan",
    "نهضت آباد": "nehzat-abad",
    "نی ریز": "neyriz",
    "نیر": "nir",
    "نیشابور": "neyshabur",
    "نیکشهر": "nikshahr",
    "ورامین": "varamin",
    "ورزقان": "varzeghan",
    "ورزنه": "varzaneh",
    "ویسی": "veysi",
    "هادیشهر": "hadishahr",
    "هرات": "herat",
    "هرسین": "harsin",
    "هریس": "heris",
    "هشتپر": "hashtpar",
    "هشترود": "hashtrood",
    "هشتگرد": "hashtgerd",
    "همدان": "hamedan",
    "هندیجان": "hendijan",
    "هویزه": "hoveyzeh",
    "یاسوج": "yasuj",
    "یزد": "yazd",
}

# ---------------------------------------------------------------------------
# Sort option mapping: friendly name → Paziresh24 sortBy value
# ---------------------------------------------------------------------------
_SORT_MAP: dict[str, str] = {
    "nearest_turn": "clinic_first_freeturn",
    "best_score": "clinic",
    "popular": "clinic_doctor_popular",
    "cheapest": "clinic_doctor_price",
    "most_visits": "clinic_doctor_visits",
    "less_waiting": "clinic_less_waiting_time",
}

# ---------------------------------------------------------------------------
# Free-turn (appointment time) mapping
# ---------------------------------------------------------------------------
_FREETURN_MAP: dict[str, str] = {
    "today": "today",
    "tomorrow": "tomorrow",
    "this_week": "this_week",
    "next_week": "next_week",
}

def _city_to_slug(city: str) -> Optional[str]:

    """Return URL slug for a Persian city name, or None if not found."""

    city = city.strip()

    slug = _CITY_SLUG_MAP.get(city)

    if slug:
        return slug

    for key, val in _CITY_SLUG_MAP.items():
        if key.replace("\u200c", "") == city.replace("\u200c", ""):

            return val

    return None

def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text).strip()

def _extract_results(data: dict) -> tuple[list, int, str]:
    """Normalize Paziresh24 search payloads into (results, total, format_name)."""
    if "search" in data:
        search = data.get("search") or {}
        results = search.get("result") or []
        total = search.get("total", len(results))
        return results, total, "search.result"

    status = data.get("status", "")

    if status == "SUCCESS":
        raw = data.get("data") or []
        results = raw if isinstance(raw, list) else [raw]
        return results, len(results), "legacy.data"

    message = data.get("message", "")
    logger.warning(
        f"Unrecognized response format | top_keys={list(data.keys())} | "
        f"status={status!r} | message={message!r}"
    )

    return [], 0, "unknown"

def _doctor_name(doc: dict) -> str:
    display_name = doc.get("display_name")

    if display_name:
        return display_name

    prefix = doc.get("prefix", "")
    title = doc.get("title") or doc.get("name", "")
    name = f"{prefix} {title}".strip()

    return name or "نامشخص"

def _doctor_specialty(doc: dict) -> str:

    if doc.get("display_expertise"):
        return doc["display_expertise"]

    expertises = doc.get("expertises") or []

    if expertises:
        return expertises[0].get("alias_title", "")

    return doc.get("expertise", "")

def _doctor_city(doc: dict) -> str:
    centers = doc.get("centers") or []
    if centers:
        return centers[0].get("city_name") or centers[0].get("city", "")

    return ""

def _doctor_freeturn(doc: dict) -> str:

    actions = doc.get("actions") or []
    for action in actions:
        top_title = action.get("top_title")
        if top_title:
            return _strip_html(top_title)

    if doc.get("presence_freeturn"):
        return doc["presence_freeturn"]

    if doc.get("waiting_time"):
        return doc["waiting_time"]

    centers = doc.get("centers") or []

    if centers:
        return centers[0].get("freeturn_text", "")

    return ""

def _doctor_image_url(doc: dict) -> str:

    image_url = doc.get("image") or ""

    # if image start with http or https, return as is
    if image_url.startswith("http://") or image_url.startswith("https://"):
        return image_url
    
    # else add base cdn url to it, https://cdn.paziresh24.com
    if image_url:
        return f"https://cdn.paziresh24.com{image_url}"

    return image_url

def _doctor_profile_url(doc: dict) -> str:
    url = doc.get("url") or ""

    if not url:
        slug = doc.get("slug", "")
        if slug:
            return f"https://paziresh24.com/{slug}"
        return ""

    if url.startswith("http"):
        return url

    return f"https://paziresh24.com{url}"


def _doctor_gender(doc: dict) -> str:
    gender = doc.get("gender")

    if gender in (1, "1", "male", "m"):
        return "مرد"

    if gender in (2, "2", "female", "f"):
        return "زن"

    return "نامشخص"

def _doctor_biography(doc: dict) -> str:
    biography = doc.get("biography") or ""

    if biography:
        return _strip_html(biography)

    return ""


def _doctor_visits(doc: dict) -> int:
    visits = doc.get("number_of_visits")

    if isinstance(visits, int):
        return visits

    if visits is not None:
        try:
            return int(visits)
        except (TypeError, ValueError):
            pass

    fallback_visits = doc.get("view")

    if fallback_visits is not None:
        try:
            return int(fallback_visits)
        except (TypeError, ValueError):
            return 0

    return 0


def _doctor_city_slug(doc: dict) -> str:
    return doc.get("city_en_slug") or ""


def _doctor_expertise_list(doc: dict) -> list[str]:
    expertises = doc.get("expertises") or []
    expertise_names: list[str] = []

    for expertise in expertises:
        title = expertise.get("alias_title")
        if title:
            expertise_names.append(title)
            continue

        nested_expertise = expertise.get("expertise") or {}
        name = nested_expertise.get("name")
        if name:
            expertise_names.append(name)

    if not expertise_names:
        fallback = doc.get("expertise")
        if fallback:
            expertise_names.append(fallback)

    return expertise_names


def _format_doctor_profile(data: dict) -> ToolCallResult:
    """Convert raw doctor profile JSON into a concise Persian summary."""

    if not isinstance(data, dict):
        return ToolCallResult(
            message="اطلاعات پروفایل پزشک معتبر نیست.",
            graph_result=None,
            success=False,
        )

    profile = data.get("data") or data

    if not isinstance(profile, dict):
        return ToolCallResult(
            message="اطلاعات پروفایل پزشک معتبر نیست.",
            graph_result=None,
            success=False,
        )

    display_name = profile.get("display_name") or _doctor_name(profile)
    gender = _doctor_gender(profile)
    biography = _doctor_biography(profile)
    expertise_names = _doctor_expertise_list(profile)
    alias_expertise = profile.get('expertises', [{}])[0].get('alias_title', '') if profile.get('expertises') else ''
    visits = _doctor_visits(profile)
    city_slug = _doctor_city_slug(profile)
    image_url = _doctor_image_url(profile)

    lines: list[str] = [f"👨‍⚕️ {display_name}"]

    if gender:
        lines.append(f"جنسیت: {gender}")

    if expertise_names:
        lines.append(f"تخصص: {'، '.join(expertise_names)}")

    if visits:
        lines.append(f"تعداد بازدید: {visits}")

    if city_slug:
        lines.append(f"شناسه شهر: {city_slug}")

    if image_url:
        lines.append(f"تصویر: {image_url}")

    if biography:
        lines.append("بیوگرافی:")
        lines.append(biography)

    centers = profile.get("centers") or []
    available_centers = [center for center in centers if center.get("is_active", True)]

    doctor_profile_string = "\n".join(lines)

    if available_centers:
        lines.append("مراکز فعال:")
        for index, center in enumerate(available_centers, 1):
            center_name = center.get("name") or "مرکز نامشخص"
            city_name = center.get("city") or ""
            address = center.get("address") or ""
            freeturn_text = center.get("freeturn_text") or ""
            center_line = f"{index}. {center_name}"

            if city_name:
                center_line += f" | {city_name}"
            if freeturn_text:
                center_line += f" | نوبت: {freeturn_text}"

            lines.append(center_line)

            if address:
                lines.append(f"   آدرس: {address}")

            tell = center.get("display_number") or center.get("tell")
            if tell:
                lines.append(f"   تلفن: {tell}")

    cardView = CardViewResponse(
        id=profile.get("id", ""),
        type=CardViewType.DOCTOR_PROFILE,
        title=display_name,
        subtitle=alias_expertise,
        image=image_url or None,
        primaryMetric=CardMetric(label="تعداد بازدید", value=str(visits)),
        secondaryMetric=CardMetric(label="جنسیت", value=gender),
        text=None,
        description=biography or None,

        actionLabel="ویزیت آنلاین" if profile.get("is_online") else "ویزیت حضوری",
        actionValue=None,

        rawPayload=json.dumps(profile, ensure_ascii=False, indent=2),

        location=available_centers[0].get("address") if available_centers else None,
        rating=None,
    )

    tool_result = GraphResult(
        text=None,
        toolType= ResponseType.CARD_VIEW,
        cardViewPayload=cardView,
    )

    return ToolCallResult(
        graph_result=tool_result,
        success=True,
    )

def _format_doctor_results(data: dict, limit: int = 3) -> ToolCallResult:
    """Convert raw search JSON into a concise Persian summary."""
    results, total, fmt = _extract_results(data)
    logger.debug(f"Parsed response via {fmt} | total={total} | returned={len(results)}")


    if fmt == "unknown":
        msg = data.get("message", "ساختار پاسخ API شناخته نشد")
        return ToolCallResult(
            message=f"متأسفانه جستجو موفق نبود: {msg}",
            graph_result=None,
            success=False,
        )

    if not results:
        return ToolCallResult(
            message="متأسفانه نتیجه‌ای برای جستجوی شما پیدا نشد. لطفاً با کلمات کلیدی دیگری دوباره امتحان کنید.",
            graph_result=None,
            success=False,
        )

    shown = results[:limit]

    find_text = f"✅ {total} نتیجه یافت شد. بهترین گزینه‌ها:\n"
    lines: list[str] = [find_text]

    list_options = []

    for i, doc in enumerate(shown, 1):
        name = _doctor_name(doc)
        specialty = _doctor_specialty(doc)
        city_name = _doctor_city(doc)
        freeturn_text = _doctor_freeturn(doc)
        profile_url = _doctor_profile_url(doc)
        image_url = _doctor_image_url(doc)

        doctor_slug = doc.get("slug", "")
        score = doc.get("satisfaction") or doc.get("calculated_rate") or doc.get("score", 0)
        visits = doc.get("view") or doc.get("number_of_visits", 0)

        entry = f"{i}. {name}"
        if specialty:
            entry += f"\n   📋 {specialty}"
        if city_name:
            entry += f" | 📍 {city_name}"
        if freeturn_text:
            entry += f"\n   🕐 {freeturn_text}"
        else:
            entry += "\n   🕐 نوبت: اطلاعاتی موجود نیست"
        if score:
            entry += f" | ⭐ امتیاز: {score}"
        if visits:
            entry += f" | 👁 بازدید: {visits}"
        if profile_url:
            entry += f"\n   🔗 {profile_url}"

        lines.append(entry)

        list_options.append(
            ListOptionItem(
                id=doctor_slug or f"doctor_{i}",
                title=name,
                image=image_url or None,
                subtitle=specialty,
                subtitle2=city_name,
            )
        )

    if total > limit:
        lines.append(f"\n📌 برای مشاهده {total - limit} نتیجه دیگر می‌توانید فیلترها را تغییر دهید.")

    doctor_search_string = "\n".join(lines)
    raw_payload = json.dumps(data, ensure_ascii=False, indent=2)
    tool_result = GraphResult(
        text=doctor_search_string,
        toolType= ResponseType.LIST_OPTION,
        listOptionsPayload=ListOptionResponse(text=find_text, options=list_options, rawPayload=raw_payload),
    )

    return ToolCallResult(
        message=doctor_search_string,
        graph_result=tool_result,
        success=True,
    )

class Paziresh24Tools:
    _SEARCH_BASE_URL = "https://apigw.paziresh24.com/seapi/v1/search"
    _PROFILE_BASE_URL = "https://drprofile.paziresh24.com/api/full-profile"
    _HEADERS = {"Content-Type": "application/json"}

    @tool
    def paziresh24_SearchDoctor(
        city: Optional[str] = None,
        query: Optional[str] = None,
        sort_by: Optional[str] = None,
        freeturn: Optional[str] = None,
        turn_type: Optional[str] = None,
        gender: Optional[str] = None,
        page: Optional[int] = 1,
        pageSize: Optional[int] = 3
    ) -> ToolCallResult:
        """
        Search for doctors and find available appointments on Paziresh24.

        Args:
            city: Persian city name (e.g. تهران, شیراز, قم).
            query: Symptom, illness, or specialty in Persian (e.g. چشم‌پزشک, پیچ خوردگی پا).
            sort_by: Sort preference — nearest_turn, best_score, popular, cheapest, most_visits, less_waiting.
            freeturn: Appointment time filter — today, tomorrow, this_week, next_week.
            turn_type: Visit type — non-consult (in-person), consult (online).
            gender: Doctor gender — female, male.
        """

        city_slug = _city_to_slug(city) if city else None

        if city and not city_slug:
            logger.warning(f"Unknown city slug for city={city!r}")

        if city_slug:
            url = f"{Paziresh24Tools._SEARCH_BASE_URL}/{city_slug}"
        else:
            url = Paziresh24Tools._SEARCH_BASE_URL

        params: dict[str, str] = {
            # "ref": "pishkar_assistant",
            "semantic_search": "false",
        }

        if query:
            params["text"] = query

        sort_api_value = _SORT_MAP.get(sort_by or "", "")

        if sort_api_value:
            params["sortBy"] = sort_api_value

        freeturn_api_value = _FREETURN_MAP.get(freeturn or "", "")

        if freeturn_api_value:
            params["freeturn"] = freeturn_api_value

        if turn_type in ("non-consult", "consult"):
            params["turn_type"] = turn_type

        if gender in ("female", "male"):
            params["gender"] = gender

        if page and isinstance(page, int) and page > 0:
            params["page"] = str(page)
        if pageSize and isinstance(pageSize, int) and pageSize > 0:
            params["limit"] = str(pageSize)


        logger.info(
            f"SearchDoctor request | city={city!r} slug={city_slug!r} | "
            f"query={query!r} | params={params}"
        )

        logger.debug(f"SearchDoctor URL base={url}")

        try:
            response = requests.get(
                url,
                params=params,
                headers=Paziresh24Tools._HEADERS,
                timeout=30,
            )

            elapsed = response.elapsed.total_seconds()

            logger.info(
                f"SearchDoctor response | http={response.status_code} | "
                f"elapsed={elapsed:.2f}s | final_url={response.url}"
            )

            if response.status_code != 200:
                body_preview = response.text[:300]
                logger.error(f"Non-200 response body preview: {body_preview}")

                return ToolCallResult(
                    message=f"خطا در ارتباط با سرویس پذیرش24 (کد {response.status_code}). لطفاً دوباره تلاش کنید.",
                    graph_result=None,
                    success=False,
                )

            try:
                data = response.json()
            except ValueError as exc:
                logger.error(
                    f"SearchDoctor invalid JSON | url={response.url} | "
                    f"body_preview={response.text[:300]}"
                )
                return ToolCallResult(
                    message=f"پاسخ نامعتبر از پذیرش24: {exc}",
                    graph_result=None,
                    success=False,
                )

            top_keys = list(data.keys())

            results, total, fmt = _extract_results(data)

            logger.info(
                f"SearchDoctor parsed | format={fmt} | top_keys={top_keys} | "
                f"total={total} | result_count={len(results)}"
            )

            if not results:
                logger.debug(f"Empty results payload preview: {response.text[:500]}")

            return _format_doctor_results(data)

        except requests.Timeout:
            logger.error(f"SearchDoctor timeout | url={url} | params={params}")
            return ToolCallResult(
                message="سرویس پذیرش24 در حال حاضر پاسخ نمی‌دهد. لطفاً چند لحظه دیگر دوباره امتحان کنید.",
                graph_result=None,
                success=False,
            )

        except requests.RequestException as exc:
            logger.exception(f"SearchDoctor network error | url={url}")
            return ToolCallResult(
                message=f"خطا در ارتباط با پذیرش24: {exc}",
                graph_result=None,
                success=False,
            )

        except Exception as exc:
            logger.exception("SearchDoctor unexpected error")
            return ToolCallResult(
                message=f"خطا در جستجو: {exc}",
                graph_result=None,
                success=False,
            )

    @tool
    def paziresh24_GetDoctorProfile(doctor_id: str) -> ToolCallResult:
        """
            Retrieve a doctor's full profile from Paziresh24.
                
        Args:
            doctor_id: The unique identifier (slug) of the doctor on Paziresh24.
        """
        if doctor_id is None:
            return ToolCallResult(
                message="شناسه پزشک مشخص نشده است.",
                graph_result=None,
                success=False,
            )

        url = f"{Paziresh24Tools._PROFILE_BASE_URL}/{doctor_id}"

        try:
            response = requests.get(
                url,
                headers=Paziresh24Tools._HEADERS,
                timeout=30,
            )

            elapsed = response.elapsed.total_seconds()

            logger.info(
                f"Doctor profile response | http={response.status_code} | "
                f"elapsed={elapsed:.2f}s | final_url={response.url}"
            )

            if response.status_code != 200:
                body_preview = response.text[:300]
                logger.error(f"Non-200 response body preview: {body_preview}")

                return ToolCallResult(
                    message=f"خطا در ارتباط با سرویس پذیرش24 (کد {response.status_code}). لطفاً دوباره تلاش کنید.",
                    graph_result=None,
                    success=False,
                )

            try:
                data = response.json()
            except ValueError as exc:
                logger.error(
                    f"Doctor profile invalid JSON | url={response.url} | "
                    f"body_preview={response.text[:300]}"
                )
                return ToolCallResult(
                    message=f"پاسخ نامعتبر از پذیرش24: {exc}",
                    graph_result=None,
                    success=False,
                )

            top_keys = list(data.keys())

            logger.info(f"Doctor profile parsed | top_keys={top_keys}")

            return _format_doctor_profile(data)

        except requests.Timeout:
            logger.error(f"Doctor profile timeout | url={url}")
            return ToolCallResult(
                message="سرویس پذیرش24 در حال حاضر پاسخ نمی‌دهد. لطفاً چند لحظه دیگر دوباره امتحان کنید.",
                graph_result=None,
                success=False,
            )

        except requests.RequestException as exc:
            logger.exception(f"Doctor profile network error | url={url}")
            return ToolCallResult(
                message=f"خطا در ارتباط با پذیرش24: {exc}",
                graph_result=None,
                success=False,
            )

        except Exception as exc:
            logger.exception("Doctor profile unexpected error")
            return ToolCallResult(
                message=f"خطا در جستجو: {exc}",
                graph_result=None,
                success=False,
            )

    tools = [paziresh24_SearchDoctor, paziresh24_GetDoctorProfile]

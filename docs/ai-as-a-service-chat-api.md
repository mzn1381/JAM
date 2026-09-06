# مستند سرویس چت پیشکار 

## 1. معرفی کلی وب سرویس
وب سرویس چت پیشکار یک REST API برای ارائه قابلیت مکالمه هوشمند به سرویس ها و سامانه ها است. این سرویس پیام کاربر نهایی را دریافت می کند، آن را در زمینه یک مکالمه مشخص پردازش می کند و پاسخ مناسب را در قالب یک ساختار استاندارد JSON برمی گرداند.

آدرس سرویس:

```http
POST /api/v2/Chat
```

این API برای سناریوهایی مانند گفت وگوی عمومی، پاسخ به سوالات، هدایت کاربر در فرایندهای چندمرحله ای، دریافت تایید از کاربر، نمایش گزینه ها، نمایش کارت اطلاعاتی و تولید payload قابل استفاده در سمت کلاینت طراحی شده است.

## 2. روند استفاده از سرویس

روند کلی استفاده از این وب سرویس به شکل زیر است:

1. دریافت API Token از پنل ادمین.
2. ارسال پیام کاربر به endpoint چت با متد `POST`.
3. نگهداری و ارسال `chatId` ثابت برای ادامه یک مکالمه.
4. خواندن فیلد `success` و `HTTP Status Code` برای تشخیص موفق یا ناموفق بودن عملیات.
5. خواندن آرایه `data.tools` و پردازش پاسخ بر اساس مقدار `toolType`.
6. در صورت بروز خطا، ذخیره `traceId` و اعلام آن به تیم پشتیبانی پیشکار برای پیگیری سریع تر.

نکته مهم: سرویس برای پردازش، آخرین آیتم آرایه `tasks` را به عنوان پیام جاری مکالمه در نظر می گیرد. بنابراین برای هر پیام جدید، مقدار `chatId` همان مکالمه و متن پیام جدید را در آخرین عضو `tasks` ارسال کنید.

## 3. احراز هویت

برای فراخوانی سرویس چت، کلاینت باید در هدر درخواست از توکن Bearer استفاده کند:

```http
Authorization: Bearer <API_TOKEN>
```

برای دریافت توکن مورد نیاز جهت کال کردن سرویس چت، باید از پنل ادمین در آدرس زیر استفاده شود:

```text
https://web-develop.mypishkar.ir/api-keys
```

## 4. قرارداد عمومی درخواست و پاسخ

### هدرهای درخواست

| Header | مقدار | توضیح |
| --- | --- | --- |
| `Content-Type` | `application/json` | نوع بدنه درخواست |
| `Authorization` | `Bearer <API_TOKEN>` | توکن دسترسی سرویس گیرنده |

### ساختار استاندارد پاسخ

تمام پاسخ های موفق و خطاهای کنترل شده با ساختار کلی زیر برگردانده می شوند:

```json
{
  "data": {},
  "success": true,
  "message": "OK",
  "errorCode": 0,
  "traceId": "2fd753d43bff3101044a7d5faa043b0d"
}
```

| فیلد | نوع | توضیح |
| --- | --- | --- |
| `data` | object/null | داده اصلی پاسخ |
| `success` | boolean | وضعیت موفقیت عملیات |
| `message` | string | پیام قابل خواندن برای کلاینت یا تیم فنی |
| `errorCode` | number | کد خطای داخلی سرویس؛ در حالت موفق `0` است |
| `traceId` | string/null | شناسه رهگیری درخواست برای لاگ و پشتیبانی |

## 5. سرویس چت

### مشخصات سرویس

```http
POST /api/v2/Chat
```

این سرویس پیام کاربر را دریافت می کند و پاسخ AI را در قالب یک یا چند ابزار نمایشی/عملیاتی در `data.tools` برمی گرداند.

### بدنه درخواست

```json
{
  "tasks": [
    {
      "chatId": "b2b-session-1001",
      "message": "سلام، می خوام یک نوبت دکتر قلب بگیرم"
    }
  ]
}
```

| فیلد | نوع | اجباری | توضیح |
| --- | --- | --- | --- |
| `tasks` | array | بله | لیست پیام ها یا taskهای ارسالی به سرویس |
| `tasks[].chatId` | string | بله | شناسه مکالمه. برای ادامه مکالمه باید ثابت بماند |
| `tasks[].message` | string | بله | متن پیام کاربر |

### نمونه فراخوانی با cURL

```bash
curl -X POST "https://<BASE_URL>/api/v2/Chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <API_TOKEN>" \
  -d '{
    "tasks": [
      {
        "chatId": "b2b-session-1001",
        "message": "سلام، می خوام یک نوبت دکتر قلب بگیرم"
      }
    ]
  }'
```

### نمونه پاسخ موفق متنی

```json
{
  "data": {
    "tools": [
      {
        "toolName": "chat_response",
        "responseMessage": "{\"message\": \"سلام، لطفا شهر مورد نظر خود را اعلام کنید.\", \"intent\": \"message_to_user\"}",
        "toolType": "TEXT",
        "text": "سلام، لطفا شهر مورد نظر خود را اعلام کنید.",
        "otpPayload": null,
        "ondevicePayload": null,
        "confirmationPayload": null,
        "listOptionsPayload": null,
        "cardViewPayload": null
      }
    ]
  },
  "success": true,
  "message": "OK",
  "errorCode": 0,
  "traceId": "2fd753d43bff3101044a7d5faa043b0d"
}
```

### ساختار `tools`

| فیلد | نوع | توضیح |
| --- | --- | --- |
| `toolName` | string/null | نام ابزار پاسخ. در پاسخ چت معمولا `chat_response` است |
| `responseMessage` | string/null | نسخه سازگار با کلاینت های قبلی؛ مقدار آن یک JSON string شامل پیام و intent است |
| `toolType` | string | نوع پاسخ قابل پردازش توسط کلاینت |
| `text` | string/null | متن اصلی قابل نمایش به کاربر |
| `otpPayload` | object/null | اطلاعات مورد نیاز برای نمایش OTP |
| `ondevicePayload` | object/null | payload قابل اجرا در دستگاه یا کلاینت |
| `confirmationPayload` | object/null | اطلاعات لازم برای دریافت تایید کاربر |
| `listOptionsPayload` | object/null | اطلاعات لازم برای نمایش لیست گزینه ها |
| `cardViewPayload` | object/null | اطلاعات لازم برای نمایش کارت داده |

### انواع `toolType`

| مقدار | کاربرد |
| --- | --- |
| `TEXT` | نمایش پاسخ متنی به کاربر |
| `OTP` | نمایش فرم ورود کد یک بار مصرف |
| `CONFIRMATION` | دریافت تایید یا رد از کاربر |
| `LIST_OPTION` | نمایش چند گزینه و دریافت انتخاب کاربر |
| `CARD_VIEW` | نمایش یک کارت اطلاعاتی مثل پروفایل، نتیجه یا آیتم انتخابی |

## 6. نمونه های خروجی بر اساس نوع پاسخ

### پاسخ `TEXT`

```json
{
  "toolType": "TEXT",
  "text": "برای ادامه، لطفا شهر مورد نظر را وارد کنید."
}
```

### پاسخ `OTP`

```json
{
  "toolType": "OTP",
  "text": "کد تایید برای شما ارسال شد.",
  "otpPayload": {
    "length": 5,
    "expiresInSeconds": 60,
    "resendLabel": "ارسال مجدد کد",
    "text": "کد تایید را وارد کنید"
  }
}
```

### پاسخ `CONFIRMATION`

```json
{
  "toolType": "CONFIRMATION",
  "text": "آیا اطلاعات زیر مورد تایید است؟",
  "confirmationPayload": {
    "text": "نوبت دکتر قلب در تهران ثبت شود؟",
    "options": [
      {
        "id": "confirm",
        "label": "تایید",
        "icon": "check",
        "variant": "primary"
      },
      {
        "id": "cancel",
        "label": "لغو",
        "icon": "x",
        "variant": "secondary"
      }
    ]
  }
}
```

### پاسخ `LIST_OPTION`

```json
{
  "toolType": "LIST_OPTION",
  "text": "لطفا یکی از گزینه های زیر را انتخاب کنید.",
  "listOptionsPayload": {
    "text": "پزشکان پیشنهادی",
    "defaultOptionId": "doctor-123",
    "optionType": "DEFAULT",
    "rawPayload": null,
    "options": [
      {
        "id": "doctor-123",
        "title": "دکتر نمونه",
        "image": "https://example.com/doctor.jpg",
        "subtitle": "متخصص قلب",
        "subtitle2": "تهران"
      }
    ]
  }
}
```

### پاسخ `CARD_VIEW`

```json
{
  "toolType": "CARD_VIEW",
  "text": "اطلاعات پزشک انتخابی",
  "cardViewPayload": {
    "id": "doctor-123",
    "type": "DOCTOR_PROFILE",
    "title": "دکتر نمونه",
    "subtitle": "متخصص قلب",
    "text": "اولین نوبت آزاد: شنبه",
    "image": "https://example.com/doctor.jpg",
    "primaryMetric": {
      "label": "امتیاز",
      "value": "4.8"
    },
    "secondaryMetric": {
      "label": "نظر کاربران",
      "value": "120"
    },
    "description": "پروفایل پزشک و اطلاعات نوبت دهی",
    "actionLabel": "مشاهده و رزرو",
    "actionValue": "https://example.com/reserve/doctor-123",
    "rawPayload": null,
    "location": "تهران",
    "rating": "4.8"
  }
}
```

## 7. مدیریت مکالمه با `chatId`

`chatId` شناسه مکالمه است و برای حفظ زمینه گفتگو استفاده می شود. پیشنهاد می شود سمت سرویس گیرنده برای هر مکالمه کاربر یک `chatId` یکتا تولید و تا پایان همان مکالمه از همان مقدار استفاده شود.

نمونه ادامه مکالمه:

```json
{
  "tasks": [
    {
      "chatId": "b2b-session-1001",
      "message": "تهران"
    }
  ]
}
```

## 8. کدهای خطا

### خطاهای داخل envelope

در برخی خطاهای کنترل شده، سرویس با ساختار استاندارد پاسخ می دهد و مقدار `success` برابر `false` است.

| `errorCode` | وضعیت | توضیح | نمونه `message` |
| --- | --- | --- | --- |
| `0` | موفق | درخواست با موفقیت پردازش شده است | `OK` |
| `1` | خطای ورودی منطقی | آرایه `tasks` خالی است | `No tasks provided` |
| `2` | خطای پردازش چت | خطای داخلی هنگام اجرای موتور چت یا وابستگی های آن | متن خطای تولید شده توسط سرویس |
| `4` | خطای اعتبار/مصرف | خطا در کنترل اعتبار، سهمیه یا ثبت مصرف | متن خطای سرویس مصرف |

نمونه خطای خالی بودن `tasks`:

```json
{
  "data": {
    "tools": []
  },
  "success": false,
  "message": "No tasks provided",
  "errorCode": 1,
  "traceId": "2fd753d43bff3101044a7d5faa043b0d"
}
```

### خطاهای HTTP

| HTTP Status | `errorCode` | توضیح |
| --- | --- | --- |
| `401` | `401` | هدر `Authorization` ارسال نشده، فرمت آن معتبر نیست، یا توکن منقضی/نامعتبر است |
| `422` | `422` | ساختار JSON ورودی با مدل مورد انتظار سازگار نیست |
| `500` | `500` | خطای پیش بینی نشده سمت سرور |

نمونه خطای احراز هویت:

```json
{
  "data": null,
  "success": false,
  "message": "{'code': 'INVALID_TOKEN', 'message': 'Missing Authorization header'}",
  "errorCode": 401,
  "traceId": "2fd753d43bff3101044a7d5faa043b0d"
}
```

نمونه خطای اعتبارسنجی ورودی:

```json
{
  "data": null,
  "success": false,
  "message": "Invalid request payload.",
  "errorCode": 422,
  "traceId": "2fd753d43bff3101044a7d5faa043b0d"
}
```

## 9. توصیه های پیاده سازی برای سرویس گیرنده

- برای هر مکالمه یک `chatId` پایدار و یکتا نگهداری کنید.
- مقدار `success` را معیار اصلی تشخیص موفقیت یا شکست درخواست قرار دهید.
- برای نمایش پاسخ، ابتدا `data.tools[0].toolType` را بررسی کنید.
- در حالت `TEXT`، مقدار `text` را مستقیما به کاربر نمایش دهید.
- در response typeهای غیرمتنی، payload متناظر همان type را پردازش کنید.
- مقدار `traceId` را در لاگ سمت خود ذخیره کنید تا در صورت نیاز به پشتیبانی قابل پیگیری باشد.
- از قرار دادن API Token در کد سمت کاربر نهایی یا اپلیکیشن های عمومی خودداری کنید؛ فراخوانی مستقیم بهتر است از backend سرویس گیرنده انجام شود.

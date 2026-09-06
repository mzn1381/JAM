import { Message } from '../../../types/Chat';

// --- OTP sample (doc 3: vehicle violation check, 5-digit code) ---
export const otpMessageSample: Message = {
  id: 'msg-otp-001',
  taskId: 'task-001',
  text: 'من در حال گرفتن خلافی هستم لطفا کد ارسال شده را برای من بفرستید.',
  isUser: false,
  status: 'pending',
  timestamp: new Date().toISOString(),
  toolType: 'OTP',
  otpPayload: {
    length: 5,
    resendLabel: 'ارسال مجدد کد',
    expiresInSeconds: 60,
  },
};

// --- CONFIRM sample (doc 2: package tracking permission, یس/نه) ---
export const confirmMessageSample: Message = {
  id: 'msg-confirm-001',
  taskId: 'task-001',
  text: 'آیا اجازه دسترسی به اطلاعات بسته‌های در حال ارسال خود را می‌دهید؟',
  isUser: false,
  status: 'pending',
  timestamp: new Date().toISOString(),
  toolType: 'CONFIRMATION',
  confirmationPayload: {
    options: [
      {
        id: 'confirm-yes',
        label: 'بلی',
        icon: 'check_circle',
        variant: 'primary',
      },
      {
        id: 'confirm-no',
        label: 'خیر',
        icon: 'cancel',
        variant: 'secondary',
      },
    ],
  },
};

// --- A second CONFIRM sample, different context (e.g. bank transfer confirmation) ---
export const confirmMessageSample2: Message = {
  id: 'msg-confirm-002',
  taskId: 'task-001',
  text: 'آیا انتقال وجه به حساب انتخاب‌شده تایید می‌شود؟',
  isUser: false,
  status: 'pending',
  timestamp: new Date().toISOString(),
  toolType: 'CONFIRMATION',
  confirmationPayload: {
    options: [
      {
        id: 'confirm-yes',
        label: 'تایید',
        icon: 'check_circle',
        variant: 'primary',
      },
      {
        id: 'confirm-no',
        label: 'انصراف',
        icon: 'cancel',
        variant: 'secondary',
      },
    ],
  },
};

// --- LIST_OPTION sample (doc 4: bank account selection for fund transfer) ---
export const listOptionMessageSample: Message = {
  id: 'msg-list-001',
  taskId: 'task-001',
  text: 'لطفاً بانک مورد نظر خود را انتخاب کنید:',
  isUser: false,
  status: 'pending',
  timestamp: new Date().toISOString(),
  toolType: 'LIST_OPTION',
  listOptionsPayload: {
    optionType: 'DEFAULT',
    options: [
      {
        id: 'دکتر-نگین-نویدی',
        title: 'نگین نویدی',
        image: 'https://pic.paziresh24.com/api/image/21386885',
        subtitle: 'کارشناس ارشد روانشناسی عمومی',
        subtitle2: 'رشت',
        rating: '۴.۹',
      },
      {
        id: 'دکتر-سیده-فاطمه-تکریمی-نیاراد',
        title: 'سیده فاطمه تکریمی نیاراد',
        image: 'https://pic.paziresh24.com/api/image/21575663',
        subtitle: 'دکترای پزشکی',
        subtitle2: 'رشت',
        rating: '۴.۹',
      },
      {
        id: 'دکتر-پدرام-عاشوری',
        title: 'پدرام عاشوری',
        image: 'https://pic.paziresh24.com/api/image/17212073',
        subtitle: 'کارشناس ارشد روانشناسی بالینی, کارشناس ارشد روانشناسی عمومی',
        subtitle2: 'رشت',
        rating: '۴.۹',
      },
      {
        id: 'دکتر-فرهاد-فتوحی-سیاپرانی',
        title: 'فرهاد فتوحی',
        image: 'https://pic.paziresh24.com/api/image/16559028',
        subtitle: 'کارشناس ارشد روانشناسی عمومی',
        subtitle2: 'رشت',
        rating: '۴.۹',
      },
      {
        id: 'دکتر-یاسمن-فلاح-خیراندیش-لیالستانی',
        title: 'یاسمن فلاح خیراندیش لیالستانی',
        image:
          'https://cdn.paziresh24.com/getImage/p24/search-women/3f261e062ac28afaa927641d8f62a5f0.jpg?size=150',
        subtitle: 'دکترای پزشکی',
        subtitle2: 'رشت',
        rating: '۴.۹',
      },
    ],
    // no selectedId yet — user hasn't picked one
  },
};

// --- A second sample showing a post-selection state (bank already chosen) ---
export const listOptionMessageSampleSelected: Message = {
  id: 'msg-list-002',
  taskId: 'task-001',
  text: 'لطفاً بانک مورد نظر خود را انتخاب کنید:',
  isUser: false,
  status: 'pending',
  timestamp: new Date().toISOString(),
  toolType: 'LIST_OPTION',
  listOptionsPayload: {
    optionType: 'DEFAULT',
    options: [
      {
        id: 'bank-saman-342',
        title: 'بانک سامان - ۳۴۲',
        subtitle: 'حساب جاری دیجیتال',
        image: 'account_balance',
      },
      {
        id: 'bank-resalat-8743',
        title: 'بانک رسالت - ۸۷۴۳',
        subtitle: 'حساب قرض‌الحسنه',
        image: 'account_balance',
      },
      {
        id: 'bank-melli-2498',
        title: 'بانک ملی - ۲۴۹۸',
        subtitle: 'سپرده کوتاه‌مدت',
        image: 'account_balance',
      },
    ],
    defaultOptionId: 'bank-resalat-8743', // user tapped this one
  },
};

export const cardViewMessageSample: Message = {
  id: 'msg-card-001',
  taskId: 'task-001',
  text: '',
  isUser: false,
  status: 'pending',
  timestamp: new Date().toISOString(),
  toolType: 'CARD_VIEW',
  cardViewPayload: {
    type: 'DOCTOR_PROFILE',
    id: 'doctor-sara-ahmadi',
    title: 'دکتر سارا احمدی',
    subtitle: 'متخصص پوست و مو',
    rating: '۴.۸',
    primaryMetric: {
      label: 'سابقه فعالیت',
      value: '۱۲ سال',
    },
    secondaryMetric: {
      label: 'بیماران موفق',
      value: '+۲۰۰۰ نفر',
    },
    location: 'تهران، سعادت آباد، بلوار دریا، مجتمع پزشکی ساحل',
    actionLabel: 'رزرو نوبت آنلاین',
    actionValue: 'رزرو نوبت آنلاین برای دکتر سارا احمدی',
  },
};

export const textMessageSample: Message = {
  id: 'msg-otp-001',
  taskId: 'task-001',
  text: '👨‍⚕️ دکتر کامران هرمزی پور\nجنسیت: مرد\nتخصص: دکترای پزشکی \nتعداد بازدید: 1472\nشناسه شهر: qazvin\nتصویر: https://cdn.paziresh24.com/getImage/p24/search-doctors/8fe5fe76e48cd06e0c71abce2ca80368.jpg\n\nمتأسفانه اطلاعات بیشتری درباره دکتر کامران هرمزی پور در دسترس نیست، اما می‌توانید برای نوبت‌گیری یا مشاوره با وی از طریق وب‌سایت پازیرش24 اقدام کنید. در صورت نیاز به راهنمایی بیشتر یا ایجاد نوبت، در خدمت هستم!',
  isUser: false,
  status: 'pending',
  timestamp: new Date().toISOString(),
  toolType: 'TEXT',
};

import { Platform } from 'react-native';
import { Message } from '../types/Chat';
import { Task } from '../types/Tasks';

const APP_NAME = 'Pishkar';
const APP_PERSIAN_NAME = 'پیشکار';
const BASE_URL =
  Platform.OS === 'web'
    ? window.__APP_CONFIG__?.API_BASE_URL
    : 'https://ai.mypishkar.ir';

const BASE_SENTRY_DNS =
  Platform.OS === 'web'
    ? window.__APP_CONFIG__?.BASE_SENTRY_DNS
    : 'https://454d8f57e5dae77e89532a4fb7ffd294@o4511531027464192.ingest.de.sentry.io/4511531028971600';

const SHOW_VOICE_BUTTON =
  Platform.OS === 'web' ? window.__APP_CONFIG__?.FF_SHOW_VOICE_BUTTON : false;

export {
  APP_NAME,
  APP_PERSIAN_NAME,
  BASE_URL,
  BASE_SENTRY_DNS,
  SHOW_VOICE_BUTTON,
};

// constants/defaultTasks.ts
export const DEFAULT_TASKS: Task[] = [
  {
    id: '1',
    title: 'تنظیم آلارم برای یادآوری جلسه با تیم طراحی',
    datetime: 'فردا، ۰۸:۰۰ صبح',
    completed: false,
    pinned: false,
    category: 'یادآوری',
    categoryColor: 'red',
  },
  {
    id: '2',
    title: 'ارسال پیام به مدیر پروژه برای تأیید نهایی',
    datetime: 'امروز، ۱۴:۳۰',
    completed: false,
    pinned: true,
    category: 'پروژه جدید',
    categoryColor: 'red',
  },
  {
    id: '3',
    title: 'ایجاد رویداد برای جلسه هماهنگی با تیم توسعه',
    datetime: 'پنج‌شنبه، ۱۱:۰۰ صبح',
    completed: false,
    pinned: false,
    category: 'جلسات کاری',
    categoryColor: 'red',
  },
  {
    id: '4',
    title: 'تنظیم زنگ برای بیدار شدن جهت سفر کاری',
    datetime: 'شنبه، ۵:۴۵ صبح',
    completed: true,
    pinned: false,
    category: 'سفر',
    categoryColor: 'red',
  },
  {
    id: '5',
    title: 'ارسال پیام تبریک تولد به همکاران',
    datetime: 'امروز، ۱۹:۰۰',
    completed: false,
    pinned: false,
    category: 'شخصی',
    categoryColor: 'red',
  },
  {
    id: '6',
    title: 'ایجاد رویداد برای ارائه نسخه جدید محصول',
    datetime: 'سه‌شنبه آینده، ۱۰:۰۰ صبح',
    completed: false,
    pinned: true,
    category: 'محصول',
    categoryColor: 'red',
  },
  {
    id: '7',
    title: 'تنظیم آلارم دارو برای مادر',
    datetime: 'هر روز، ۲۱:۰۰',
    completed: false,
    pinned: false,
    category: 'سلامتی',
    categoryColor: 'red',
  },
  {
    id: '8',
    title: 'ارسال پیام پیگیری وضعیت سفارش به پشتیبانی',
    datetime: 'فردا، ۱۲:۱۵ ظهر',
    completed: true,
    pinned: false,
    category: 'کارهای روزمره',
    categoryColor: 'red',
  },
  {
    id: '9',
    title: 'اضافه کردن جلسه بررسی UX به تقویم',
    datetime: 'دوشنبه آینده، ۱۶:۰۰',
    completed: false,
    pinned: false,
    category: 'طراحی',
    categoryColor: 'red',
  },
  {
    id: '10',
    title: 'تنظیم زنگ برای یادآوری تمرین ورزشی',
    datetime: 'هر روز، ۱۸:۳۰',
    completed: false,
    pinned: true,
    category: 'سلامتی',
    categoryColor: 'red',
  },
];

export const DEFAULT_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'سلام! چطور می‌تونم کمکتون کنم؟',
    isUser: false,
    taskId: '1',
    toolType: 'TEXT',
  },
  // {
  //   id: '2',
  //   text: 'وقت دکتر برای سه‌شنبه ساعت ۱۰ رزرو کن.',
  //   isUser: true,
  // },
  // {
  //   id: '3',
  //   text: 'در حال بررسی تقویم شما...',
  //   isUser: false,
  //   status: 'pending',
  //   timestamp: 'در حال انجام...',
  // },
  // {
  //   id: '4',
  //   text: 'انجام شد. قرار ملاقات با دکتر برای سه‌شنبه ساعت ۱۰ صبح در تقویم شما ثبت شد.',
  //   isUser: false,
  //   status: 'completed',
  //   timestamp: 'انجام شد',
  // },
];
// ==========================================
//             TASK & MESSAGE
// ==========================================

const NEW_TASK: Task = {
  id: 'task-0', //`task-${Date.now()}`,
  title: 'کار جدید',
  datetime: '0', //new Date().toISOString(),
  completed: false,
  pinned: false,
  category: 'عمومی',
  categoryColor: '#95a5a6',
};

const WELCOME_MESSAGE: Message = {
  id: '0', //(Date.now() + 1).toString(),
  taskId: '0',
  text: 'سلام! چطور می‌تونم کمکتون کنم؟',
  isUser: false,
  status: 'pending',
  timestamp: '0', // new Date().toISOString(),
  toolType: 'TEXT',
};
const PROCESSING_MESSAGES: string[] = [
  'متوجه شدم. در حال پردازش درخواست شما هستم...',
  'باشه، دارم روی درخواستتون کار می‌کنم...',
  'چشم، الان دارم اطلاعات رو بررسی می‌کنم...',
  'درک شد. چند لحظه صبر کنید تا پردازش انجام بشه...',
  'حله! دارم درخواست شما رو آماده و پردازش می‌کنم...',
];
const PROCESSING_MESSAGES_EN: string[] = [
  'Got it. I’m processing your request...',
  'Sure thing, I’m reviewing the information now...',
  'Understood. Please wait a moment while I process this...',
  'Alright, I’m working on your request...',
  'All set! I’m preparing and processing your request...',
];

const LOCAL_RESPONSE_TO_USER: Message = {
  id: '0', //(Date.now() + 1).toString(),
  taskId: '0',
  text: PROCESSING_MESSAGES[
    Math.floor(Math.random() * PROCESSING_MESSAGES.length)
  ],
  isUser: false,
  status: 'pending',
  timestamp: '0', // new Date().toISOString(),
  toolType: 'TEXT',
};

const WELCOME_TEXT_MESSAGES: string[] = [
  'سلام! پیشکار در خدمت شماست. امروز چطور می‌تونم کمکتون کنم؟',
  'سلام! خوش اومدی. از کجا شروع کنیم؟',
  'درود! پیشکار آماده‌ست تا هر کاری لازم داری انجام بده.',
  'سلام! بگو ببینم امروز چه برنامه یا کاری تو ذهنته؟',
  'سلام! من پیشکارم. هرچی لازم داشتی کافیه بگی.',
  'سلام! آماده‌ام هوشمندانه کمکت کنم. از چی شروع کنیم؟',
  'سلام! امروز دوست داری روی چی کار کنیم؟',
  'درود بر شما! پیشکار همیشه برای کمک اینجاست.',
  'سلام! بگو ببینم چی تو ذهنت داری تا با هم انجامش بدیم.',
  'سلام! من اینجام تا کارت رو راحت‌تر کنم. چی لازم داری؟',
  'سلام! پیشکار حاضره. فقط بگو چی می‌خوای و من شروع می‌کنم.',
  'سلام! آماده‌ای؟ هر کمکی بخوای من کنارتم.',
  'درود! خوش اومدی. امروز چطور می‌تونم همراهت باشم؟',
  'سلام! پیشکار همیشه آماده‌ست؛ فقط کافی یک دستور بدی.',
];

const WELCOME_TEXT_MESSAGES_EN: string[] = [
  'Hello! Pishkar is at your service. How can I help you today?',
  'Hi! Welcome. Where should we start?',
  'Greetings! Pishkar is ready to handle anything you need.',
  'Hello! Tell me what plans or tasks you have in mind today.',
  'Hi! I’m Pishkar. Whatever you need, just say the word.',
  'Hello! I’m ready to assist you smartly. What should we begin with?',
  'Hi! What would you like to work on today?',
  'Greetings! Pishkar is always here to help.',
  'Hello! Tell me what’s on your mind so we can get it done together.',
  'Hi! I’m here to make things easier for you. What do you need?',
  'Hello! Pishkar is ready. Just tell me what you want and I’ll get started.',
  'Hi! Ready when you are. Whatever help you need, I’m here.',
  'Greetings! Welcome. How can I support you today?',
  'Hello! Pishkar is always ready—just give a command.',
];

export {
  NEW_TASK,
  WELCOME_MESSAGE,
  LOCAL_RESPONSE_TO_USER,
  WELCOME_TEXT_MESSAGES,
  WELCOME_TEXT_MESSAGES_EN,
  PROCESSING_MESSAGES,
  PROCESSING_MESSAGES_EN,
};

export const BADGE_COLORA: any = {
  none: '#95a5a6', // gray
  send_sms: '#f1c40f', // yellow
  make_call: '#2ecc71', // green
  set_calendar: '#9b59b6', // purple
  send_email: '#e67e22', // orange
  set_alarm: '#e74c3c', // red
} as const;

export const TASKS_BADGE_CATEGORY = {
  none: { category: 'عمومی', categoryColor: BADGE_COLORA.none },
  send_sms: { category: 'پیامک', categoryColor: BADGE_COLORA.send_sms },
  make_call: { category: 'تماس', categoryColor: BADGE_COLORA.make_call },
  set_calendar: {
    category: 'رویداد',
    categoryColor: BADGE_COLORA.set_calendar,
  },
  send_email: { category: 'ایمیل', categoryColor: BADGE_COLORA.send_email },
  set_alarm: { category: 'یادآوری', categoryColor: BADGE_COLORA.set_alarm },
} as const;

export interface PreferenceType {
  name: string;
  description: string | null;
  faName: string;
  image: string;
  isFollowed: boolean;
}

export const preferences: PreferenceType[] = [
  {
    name: 'travel',
    description: null,
    faName: 'سفر',
    image: 'https://files.virgool.io/upload/topic/travel.png',
    isFollowed: false,
  },
  {
    name: 'health',
    description: null,
    faName: 'سلامت',
    image: 'https://files.virgool.io/upload/topic/health.png',
    isFollowed: false,
  },
  {
    name: 'mentalhealth',
    description: null,
    faName: 'سلامت روانی',
    image: 'https://files.virgool.io/upload/topic/mentalhealth.png',
    isFollowed: false,
  },
  {
    name: 'politics',
    description: null,
    faName: 'سیاست',
    image: 'https://files.virgool.io/upload/topic/politics.png',
    isFollowed: false,
  },
  {
    name: 'socialmedia',
    description: null,
    faName: 'شبکه اجتماعی',
    image: 'https://files.virgool.io/upload/topic/socialmedia.png',
    isFollowed: false,
  },
  {
    name: 'work',
    description: null,
    faName: 'شغل و کار',
    image: 'https://files.virgool.io/upload/topic/work.png',
    isFollowed: false,
  },
  {
    name: 'photography',
    description: null,
    faName: 'عکاسی',
    image: 'https://files.virgool.io/upload/topic/photography.png',
    isFollowed: false,
  },
  {
    name: 'food',
    description: null,
    faName: 'غذا',
    image: 'https://files.virgool.io/upload/topic/food.png',
    isFollowed: false,
  },
  {
    name: 'culture',
    description: null,
    faName: 'فرهنگ',
    image: 'https://files.virgool.io/upload/topic/culture.png',
    isFollowed: false,
  },
  {
    name: 'freelancer',
    description: null,
    faName: 'فریلنسری',
    image: 'https://files.virgool.io/upload/topic/freelancer.png',
    isFollowed: false,
  },
  {
    name: 'philosophy',
    description: null,
    faName: 'فلسفه',
    image: 'https://files.virgool.io/upload/topic/philosophy.png',
    isFollowed: false,
  },
  {
    name: 'film',
    description: null,
    faName: 'فیلم و سینما',
    image: 'https://files.virgool.io/upload/topic/film.png',
    isFollowed: false,
  },
  {
    name: 'fintech',
    description: null,
    faName: 'فین تک',
    image: 'https://files.virgool.io/upload/topic/fintech.png',
    isFollowed: false,
  },
  {
    name: 'entrepreneurship',
    description: null,
    faName: 'کارآفرینی',
    image: 'https://files.virgool.io/upload/topic/entrepreneurship.png',
    isFollowed: false,
  },
  {
    name: 'book',
    description: null,
    faName: 'کتاب',
    image: 'https://files.virgool.io/upload/topic/book.png',
    isFollowed: false,
  },
  {
    name: 'environment',
    description: null,
    faName: 'محیط زیست',
    image: 'https://files.virgool.io/upload/topic/environment.png',
    isFollowed: false,
  },
  {
    name: 'softwareengineering',
    description: null,
    faName: 'مهندسی نرم افزار',
    image: 'https://files.virgool.io/upload/topic/softwareengineering.png',
    isFollowed: false,
  },
  {
    name: 'startup',
    description: null,
    faName: 'استارتاپ',
    image: 'https://files.virgool.io/upload/topic/startup.png',
    isFollowed: false,
  },
  {
    name: 'islam',
    description: null,
    faName: 'مذهبی',
    image: 'https://files.virgool.io/upload/topic/islam.png',
    isFollowed: false,
  },
  {
    name: 'economy',
    description: null,
    faName: 'اقتصاد',
    image: 'https://files.virgool.io/upload/topic/economy.png',
    isFollowed: false,
  },
  {
    name: 'cybersecurity',
    description: null,
    faName: 'امنیت سایبری',
    image: 'https://files.virgool.io/upload/topic/cybersecurity.png',
    isFollowed: false,
  },
  {
    name: 'iot',
    description: null,
    faName: 'اینترنت اشیا',
    image: 'https://files.virgool.io/upload/topic/iot.png',
    isFollowed: false,
  },
  {
    name: 'marketing',
    description: null,
    faName: 'بازاریابی',
    image: 'https://files.virgool.io/upload/topic/marketing.png',
    isFollowed: false,
  },
  {
    name: 'computergame',
    description: null,
    faName: 'بازی رایانه ای',
    image: 'https://files.virgool.io/upload/topic/computergame.png',
    isFollowed: false,
  },
  {
    name: 'programming',
    description: null,
    faName: 'برنامه نویسی',
    image: 'https://files.virgool.io/upload/topic/programming.png',
    isFollowed: false,
  },
  {
    name: 'productivity',
    description: null,
    faName: 'بهره وری',
    image: 'https://files.virgool.io/upload/topic/productivity.png',
    isFollowed: false,
  },
  {
    name: 'cryptocurrency',
    description: null,
    faName: 'رمز ارز',
    image: 'https://files.virgool.io/upload/topic/cryptocurrency.png',
    isFollowed: false,
  },
  {
    name: 'history',
    description: null,
    faName: 'تاریخ',
    image: 'https://files.virgool.io/upload/topic/history.png',
    isFollowed: false,
  },
  {
    name: 'ux',
    description: null,
    faName: 'تجربه کاربری',
    image: 'https://files.virgool.io/upload/topic/ux.png',
    isFollowed: false,
  },
  {
    name: 'education',
    description: null,
    faName: 'تحصیلی و آموزشی',
    image: 'https://files.virgool.io/upload/topic/education.png',
    isFollowed: false,
  },
  {
    name: 'law',
    description: null,
    faName: 'حقوقی',
    image: 'https://files.virgool.io/upload/topic/law.png',
    isFollowed: false,
  },
  {
    name: 'family',
    description: null,
    faName: 'خانواده',
    image: 'https://files.virgool.io/upload/topic/family.png',
    isFollowed: false,
  },
  {
    name: 'selfknowledge',
    description: null,
    faName: 'خودشناسی',
    image: 'https://files.virgool.io/upload/topic/selfknowledge.png',
    isFollowed: false,
  },
  {
    name: 'relationship',
    description: null,
    faName: 'رابطه',
    image: 'https://files.virgool.io/upload/topic/relationship.png',
    isFollowed: false,
  },
  {
    name: 'psychology',
    description: null,
    faName: 'روانشناسی',
    image: 'https://files.virgool.io/upload/topic/psychology.png',
    isFollowed: false,
  },
  {
    name: 'music',
    description: null,
    faName: 'موسیقی',
    image: 'https://files.virgool.io/upload/topic/music.png',
    isFollowed: false,
  },
  {
    name: 'success',
    description: null,
    faName: 'موفقیت',
    image: 'https://files.virgool.io/upload/topic/success.png',
    isFollowed: false,
  },
  {
    name: 'art',
    description: null,
    faName: 'هنر',
    image: 'https://files.virgool.io/upload/topic/art.png',
    isFollowed: false,
  },
  {
    name: 'space',
    description: null,
    faName: 'هوا فضا',
    image: 'https://files.virgool.io/upload/topic/space.png',
    isFollowed: false,
  },
  {
    name: 'ai',
    description: null,
    faName: 'هوش مصنوعی',
    image: 'https://files.virgool.io/upload/topic/ai.png',
    isFollowed: false,
  },
  {
    name: 'sport',
    description: null,
    faName: 'ورزشی',
    image: 'https://files.virgool.io/upload/topic/sport.png',
    isFollowed: false,
  },
  {
    name: 'story',
    description: null,
    faName: 'داستان',
    image: 'https://files.virgool.io/upload/topic/story.png',
    isFollowed: false,
  },
  {
    name: 'science',
    description: null,
    faName: 'علوم',
    image: 'https://files.virgool.io/upload/topic/science.png',
    isFollowed: false,
  },
  {
    name: 'blockchain',
    description: null,
    faName: 'بلاک چین',
    image: 'https://files.virgool.io/upload/topic/blockchain.png',
    isFollowed: false,
  },
  {
    name: 'machinelearning',
    description: null,
    faName: 'یادگیری ماشین',
    image: 'https://files.virgool.io/upload/topic/machinelearning.png',
    isFollowed: false,
  },
  {
    name: 'digitaldesign',
    description: null,
    faName: 'طراحی دیجیتال',
    image: 'https://files.virgool.io/upload/topic/digitaldesign.png',
    isFollowed: false,
  },
  {
    name: 'writing',
    description: null,
    faName: 'نویسندگی',
    image: 'https://files.virgool.io/upload/topic/writing.png',
    isFollowed: false,
  },
  {
    name: 'podcast',
    description: null,
    faName: 'پادکست',
    image: 'https://files.virgool.io/upload/topic/podcast.png',
    isFollowed: false,
  },
  {
    name: 'women',
    description: null,
    faName: 'زنان',
    image: 'https://files.virgool.io/upload/topic/women.png',
    isFollowed: false,
  },
  {
    name: 'emigration',
    description: null,
    faName: 'مهاجرت',
    image: 'https://files.virgool.io/upload/topic/emigration.png',
    isFollowed: false,
  },
];

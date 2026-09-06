"use client";
import { useState } from "react";
import SectionTitle from "../Common/SectionTitle";
import OfferList from "./OfferList";
import PricingBox from "./PricingBox";

const Pricing = () => {
  const [isB2B, setIsB2B] = useState(true);
  const [isMonthly, setIsMonthly] = useState(true);

  return (
    <section id="pricing" className="relative z-10 py-16 md:py-20 lg:py-28">
      <div className="container">
        {/* Toggle between B2C and B2B */}
        {/* <div className="w-full mb-8 flex justify-center">
          <div className="inline-flex rounded-full bg-gray-100 p-1 dark:bg-[#1D2144] border border-body-color border-opacity-10 dark:border-white dark:border-opacity-10 items-center">
            <button
              disabled
              // onClick={() => setIsB2B(true)}
              className="bg-primary text-white px-6 py-2 rounded-full text-base font-semibold cursor-default"
            >
              سازمانی (B2B)
            </button>
            <button
              disabled
              // onClick={() => setIsB2B(false)}
              className="relative px-6 py-2 rounded-full text-base font-semibold text-dark/40 dark:text-white/40 cursor-not-allowed flex items-center gap-2"
            >
              <span>شخصی (B2C)</span>
            </button>
          </div>
        </div> */}
        <SectionTitle
          title={isB2B ? "راه‌حل‌های هوش مصنوعی برای کسب‌وکار شما" : "ساد‌ه، شفاف و بدون دردسر"}
          paragraph={
            isB2B
              ? "ما به کسب‌وکارها کمک می‌کنیم با هوش مصنوعی، فرایندهایشان را متحول کنند."
              : "پیشکار طوری قیمت‌گذاری شده که بدون نگرانی از هزینه، فقط روی آرامش و نظم زندگی‌ات تمرکز کنی."
          }
          center
          width="665px"
        />

        {/* Billing period toggle (only for B2C) */}
        {!isB2B && (
          <div className="w-full">
            <div className="wow fadeInUp mb-8 flex justify-center md:mb-12 lg:mb-16" data-wow-delay=".1s">
              <span
                onClick={() => setIsMonthly(true)}
                className={`${
                  isMonthly ? "text-primary font-bold" : "text-dark dark:text-white"
                } mr-4 cursor-pointer text-base font-semibold`}
              >
                ماهانه
              </span>
              <div onClick={() => setIsMonthly(!isMonthly)} className="flex cursor-pointer items-center">
                <div className="relative">
                  <div className="h-5 w-14 rounded-full bg-[#1D2144] shadow-inner"></div>
                  <div
                    className={`${
                      isMonthly ? "" : "translate-x-full"
                    } shadow-switch-1 absolute left-0 top-[-4px] flex h-7 w-7 items-center justify-center rounded-full bg-primary transition`}
                  >
                    <span className="active h-4 w-4 rounded-full bg-white"></span>
                  </div>
                </div>
              </div>
              <span
                onClick={() => setIsMonthly(false)}
                className={`${
                  isMonthly ? "text-dark dark:text-white" : "text-primary font-bold"
                } ml-4 cursor-pointer text-base font-semibold`}
              >
                سالانه
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {!isB2B ? (
            <>
              <PricingBox
                packageName="رایگان"
                price="۰"
                duration={isMonthly ? "ماه" : "سال"}
                subtitle="شروع کن، بدون پرداخت"
                buttonText="شروع رایگان"
              >
                <OfferList text="۱۰۰ جان پیشکار رایگان" status="active" />
                <OfferList text="مدیریت کارها و یادآوری‌ها" status="active" />
                <OfferList text="تعامل با زبان طبیعی" status="active" />
                <OfferList text="مناسب برای استفاده سبک" status="active" />
                <OfferList text="پشتیبانی محدود" status="inactive" />
                <OfferList text="افزایش جان با ارتقا پلن" status="inactive" />
              </PricingBox>
              <PricingBox
                packageName="حرفه‌‌ای"
                price={isMonthly ? "۱۴۹٬۰۰۰" : "۱٬۱۹۰٬۰۰۰"}
                duration={isMonthly ? "ماه" : "سال"}
                subtitle="برای استفاده روزمره و جدی"
                buttonText="خرید اشتراک"
              >
                <OfferList text="جان پیشکار بیشتر برای استفاده مداوم" status="active" />
                <OfferList text="یادآوری‌های هوشمند و دقیق‌تر" status="active" />
                <OfferList text="شخصی‌سازی بر اساس عادت‌ها" status="active" />
                <OfferList text="اولویت در پردازش درخواست‌ها" status="active" />
                <OfferList text="پشتیبانی بهتر" status="active" />
                <OfferList text="بدون محدودیت آزاردهنده" status="active" />
              </PricingBox>
              <PricingBox
                packageName="پیشرفته"
                price={isMonthly ? "۲۴۹٬۰۰۰" : "۱٬۹۹۰٬۰۰۰"}
                duration={isMonthly ? "ماه" : "سال"}
                subtitle="برای کسانی که پیشکار، همراه همیشگی‌شان است"
                buttonText="خرید اشتراک"
              >
                <OfferList text="بیشترین جان پیشکار" status="active" />
                <OfferList text="استفاده سنگین بدون نگرانی" status="active" />
                <OfferList text="حداکثر شخصی‌سازی و هوشمندی" status="active" />
                <OfferList text="اولویت بالا در پاسخ‌ها" status="active" />
                <OfferList text="پشتیبانی ویژه" status="active" />
                <OfferList text="دسترسی زودهنگام به امکانات جدید" status="active" />
              </PricingBox>
            </>
          ) : (
            <>
              <PricingBox
                packageName="پایه سازمانی"
                price="سفارشی"
                priceUnit=""
                duration="تیم"
                subtitle="شروع آسان با API چت برای کسب‌وکارهای نوپا"
                buttonText="تماس بگیرید"
                isB2B
              >
                <OfferList text="Chat API دسترسی پایه" status="active" />
                <OfferList text="ادغام با یک وب‌سرویس کلیدی" status="active" />
                <OfferList text="پشتیبانی استاندارد" status="active" />
                <OfferList text="تحلیل‌های پایه هوش مصنوعی" status="active" />
                <OfferList text="امنیت داده‌ها" status="active" />
                <OfferList text="استفاده بر اساس میزان مصرف" status="active" />
              </PricingBox>
              <PricingBox
                packageName="پیشرفته سازمانی"
                price="سفارشی"
                priceUnit=""
                duration="سازمان"
                subtitle="برای کسب‌وکارهای در حال رشد با نیازهای وسیع‌تر"
                buttonText="تماس بگیرید"
                isB2B
              >
                <OfferList text="Chat API با قابلیت‌های پیشرفته" status="active" />
                <OfferList text="ادغام با چند وب‌سرویس کلیدی" status="active" />
                <OfferList text="تحلیل‌های عمیق‌تر هوش مصنوعی" status="active" />
                <OfferList text="اولویت بالا در پردازش درخواست‌ها" status="active" />
                <OfferList text="پشتیبانی ویژه و مشاوره اختصاصی" status="active" />
                <OfferList text="امکان میزبانی ابری اختصاصی" status="active" />
              </PricingBox>
              <PricingBox
                packageName="سفارشی / هولدینگ"
                price="سفارشی"
                priceUnit=""
                duration="پروژه"
                subtitle="راه‌حل اختصاصی برای سازمان‌ها و هولدینگ‌های بزرگ"
                buttonText="تماس بگیرید"
                isB2B
              >
                <OfferList text="پیاده‌سازی Agent اختصاصی (فین‌تک، خرده‌فروشی، نوبت‌دهی و غیره)" status="active" />
                <OfferList text="ادغام با کلیه سامانه‌های داخلی و خارجی" status="active" />
                <OfferList text="مدل‌سازی و تحلیل داده‌های خاص سازمان" status="active" />
                <OfferList text="تیم پشتیبانی و توسعه ۲۴/۷ اختصاصی" status="active" />
                <OfferList text="مشاوره استراتژیک و معماری هوش مصنوعی" status="active" />
                <OfferList text="زیرساخت ابری یا On-Premise کاملا اختصاصی" status="active" />
              </PricingBox>
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 z-[-1]">
        <svg width="239" height="601" viewBox="0 0 239 601" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect
            opacity="0.3"
            x="-184.451"
            y="600.973"
            width="196"
            height="541.607"
            rx="2"
            transform="rotate(-128.7 -184.451 600.973)"
            fill="url(#paint0_linear_93:235)"
          />
          <rect
            opacity="0.3"
            x="-188.201"
            y="385.272"
            width="59.7544"
            height="541.607"
            rx="2"
            transform="rotate(-128.7 -188.201 385.272)"
            fill="url(#paint1_linear_93:235)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_93:235"
              x1="-90.1184"
              y1="420.414"
              x2="-90.1184"
              y2="1131.65"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00B3A6" />
              <stop offset="1" stopColor="#00B3A6" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_93:235"
              x1="-159.441"
              y1="204.714"
              x2="-159.441"
              y2="915.952"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00B3A6" />
              <stop offset="1" stopColor="#00B3A6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
};

export default Pricing;

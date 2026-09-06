"use client";

import { useRuntimeConfig } from "@/hooks/useRuntimeConfig";
import React, { useEffect, useRef, useState } from "react";

type B2BDemoProps = {
  refreshSignal?: number;
};

const B2BDemo = ({ refreshSignal = 0 }: B2BDemoProps) => {
  const [showAiTooltip, setShowAiTooltip] = useState(false);
  const [showAssistantTooltip, setShowAssistantTooltip] = useState(true);
  const [showDemoFrame, setShowDemoFrame] = useState(false);

  const aiTooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assistantTooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { iframeSrcDemoB2B } = useRuntimeConfig();

  useEffect(() => {
    return () => {
      if (aiTooltipTimer.current) {
        clearTimeout(aiTooltipTimer.current);
      }
      if (assistantTooltipTimer.current) {
        clearTimeout(assistantTooltipTimer.current);
      }
    };
  }, []);

  const handleAiMouseEnter = () => {
    setShowAiTooltip(false);
    if (aiTooltipTimer.current) {
      clearTimeout(aiTooltipTimer.current);
    }
  };

  const handleAiMouseLeave = () => {
    aiTooltipTimer.current = setTimeout(() => {
      setShowAiTooltip(true);
    }, 400);
  };

  const handleAssistantMouseEnter = () => {
    setShowAssistantTooltip(false);
    if (assistantTooltipTimer.current) {
      clearTimeout(assistantTooltipTimer.current);
    }
  };

  const handleAssistantMouseLeave = () => {
    assistantTooltipTimer.current = setTimeout(() => {
      setShowAssistantTooltip(true);
    }, 1000);
  };

  const handleOpenDemoRoute = () => {
    setShowDemoFrame(true);
  };

  useEffect(() => {
    setShowDemoFrame(false);
  }, [refreshSignal]);

  if (showDemoFrame) {
    return (
      <div className="relative h-full w-full bg-gray-100 dark:bg-[#1c2331]">
        <iframe
          // key={`${refreshSignal}-${demoIframeSrc}`}
          id="pishkar-demo-frame"
          src={iframeSrcDemoB2B}
          style={{ width: "100%", height: "100%", border: "none" }}
        ></iframe>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-gray-100 text-right dark:bg-[#1c2331]" dir="rtl">
      {/* Header */}
      <header className="border-b border-gray-200 bg-gray-50 px-5 py-3 dark:border-white/10 dark:bg-[#252d3d]">
        <div className="flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-6">
            <h3 className="text-base font-bold text-gray-600">برند شما</h3>
            <nav className="hidden items-center gap-5 md:flex">
              <span className="cursor-pointer text-xs font-medium text-gray-600 hover:text-primary">خانه</span>
              <span className="cursor-pointer text-xs font-medium text-gray-600 hover:text-primary">محصولات</span>
              <span className="cursor-pointer text-xs font-medium text-gray-600 hover:text-primary">خدمات</span>
              <span className="cursor-pointer text-xs font-medium text-gray-600 hover:text-primary">گزارش‌ها</span>
              <span className="cursor-pointer text-xs font-medium text-gray-600 hover:text-primary">تنظیمات</span>
            </nav>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2.5">
            <div className="text-left">
              <div className="text-xs font-semibold text-gray-600">کاربر نمونه</div>
              <div className="text-[10px] text-gray-500">خودم</div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
              <svg className="h-5 w-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <svg className="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-5 py-10">
        {/* Hero Section */}
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-600 md:text-3xl">
            برند شما؛ محصول مورد نظر خود را جستجو کنید
          </h2>

          {/* Search Bar */}
          <div className="relative mx-auto mb-5 max-w-3xl">
            <div className="flex items-center gap-2.5 rounded-2xl bg-gray-50 px-5 py-3 shadow-md dark:bg-[#252d3d]">
              <button className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-400 text-white hover:bg-primary/90">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
              <input
                type="text"
                placeholder="جستجو در محصولات..."
                className="flex-1 bg-transparent text-right text-sm text-gray-400 outline-none"
                disabled
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mx-auto flex max-w-3xl items-center justify-center gap-3">
            <button className="rounded-xl bg-gray-50 px-5 py-2.5 text-xs font-medium text-gray-600 shadow-sm hover:shadow-md dark:bg-[#252d3d]">
              جستجوی پیشرفته
            </button>
            <div className="group relative">
              <button
                id="Ai-Action_Button"
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-primary/90"
                onMouseEnter={handleAiMouseEnter}
                onMouseLeave={handleAiMouseLeave}
                onClick={handleOpenDemoRoute}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                پیشنهاد محصول با هوش مصنوعی
              </button>
              <div
                className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-[320px] -translate-x-1/2 rounded-lg border border-stroke bg-slate-800 px-3 py-2 text-[11px] leading-5 text-white shadow-two transition-all duration-300 dark:border-stroke-dark dark:bg-gray-dark ${
                  showAiTooltip ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
                }`}
              >
                <span className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b border-stroke bg-slate-800 dark:border-stroke-dark dark:bg-gray-dark" />
                با پیشکار، مشتریان می‌توانند خدمات شما را در سریع‌ترین زمان و تنها با چت یا فرستادن ویس رزرو و دریافت
                کنند.
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-3">
          {/* Reports Card */}
          <div className="rounded-2xl bg-gray-50 p-5 shadow-md dark:bg-[#252d3d]">
            <div className="mb-2.5 flex items-center justify-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-[#2e3647]">
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="mb-2 text-center text-sm font-bold text-gray-600">(گزارش‌ها)</h3>
            <p className="mb-4 text-center text-[11px] leading-relaxed text-gray-600">
              گزارش‌های فروش، عملکرد و روند بازار را در یک نمای ساده و قابل فهم ببینید.
            </p>
            <div className="flex justify-center">
              <button className="rounded-lg bg-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-300 dark:bg-[#2e3647] dark:hover:bg-[#353f53]">
                مشاهده
              </button>
            </div>
          </div>

          {/* Products Card */}
          <div className="rounded-2xl bg-gray-50 p-5 shadow-md dark:bg-[#252d3d]">
            <div className="mb-2.5 flex items-center justify-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-[#2e3647]">
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="mb-2 text-center text-sm font-bold text-gray-600">(محصولات)</h3>
            <p className="mb-4 text-center text-[11px] leading-relaxed text-gray-600">
              فهرست کامل محصولات را همراه با جزئیات قیمت، موجودی و دسته‌بندی مدیریت کنید.
            </p>
            <div className="flex justify-center">
              <button className="rounded-lg bg-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-300 dark:bg-[#2e3647] dark:hover:bg-[#353f53]">
                مشاهده
              </button>
            </div>
          </div>

          {/* Services Card */}
          <div className="rounded-2xl bg-gray-50 p-5 shadow-md dark:bg-[#252d3d]">
            <div className="mb-2.5 flex items-center justify-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-[#2e3647]">
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="mb-2 text-center text-sm font-bold text-gray-600">(خدمات شما)</h3>
            <p className="mb-4 text-center text-[11px] leading-relaxed text-gray-600">
              خدمات قابل ارائه را معرفی و سامان‌دهی کنید تا مشتریان انتخاب سریع‌تری داشته باشند.
            </p>
            <div className="flex justify-center">
              <button className="rounded-lg bg-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-300 dark:bg-[#2e3647] dark:hover:bg-[#353f53]">
                مشاهده
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Assistant Button */}
      <div className="absolute bottom-6 left-6">
        <div className="group relative">
          <button
            id="Floating-Assistant-Button"
            className="flex items-center gap-2.5 rounded-full bg-primary px-5 py-3 text-white shadow-lg hover:bg-primary/90"
            onMouseEnter={handleAssistantMouseEnter}
            onMouseLeave={handleAssistantMouseLeave}
            onClick={handleOpenDemoRoute}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span className="text-xs font-semibold">دستیار هوشمند</span>
          </button>
          <div
            className={`pointer-events-none absolute bottom-full left-0 z-20 mb-2 w-[320px] rounded-lg border border-stroke  bg-slate-800 px-3 py-2 text-[11px] leading-5 text-white shadow-two transition-all duration-300 dark:border-stroke-dark dark:bg-gray-dark ${
              showAssistantTooltip ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
          >
            <span className="absolute left-6 top-full h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-r border-b border-stroke  bg-slate-800 dark:border-stroke-dark dark:bg-gray-dark" />
            سرویس‌های خود را به چت‌بات صوتی و متنی مجهز کنید تا کاربران در چند ثانیه به آن‌ها دسترسی داشته باشند.
          </div>
        </div>
      </div>
    </div>
  );
};

export default B2BDemo;

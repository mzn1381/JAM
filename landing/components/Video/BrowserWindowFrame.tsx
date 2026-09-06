import React from "react";

type BrowserWindowFrameProps = {
  children: React.ReactNode;
  urlLabel?: string;
  onRefresh?: () => void;
  showRefresh?: boolean;
  className?: string;
};

const BrowserWindowFrame = ({
  children,
  urlLabel = "app.your-domain.ir",
  onRefresh,
  showRefresh = true,
  className = "",
}: BrowserWindowFrameProps) => {
  return (
    <div
      className={`flex justify-center items-center transition-all duration-500 ease-in-out ${className}`}
    >
      <div className="relative w-full max-w-[980px]">
        <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45),0_8px_24px_-12px_rgba(15,23,42,0.35)] dark:border-gray-700/80 dark:bg-gray-900">
          <div className="border-b border-gray-200/80 bg-[#f6f7f9] px-3 py-2.5 dark:border-gray-700/80 dark:bg-[#1f2430] sm:px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"></span>
                <span className="h-3 w-3 rounded-full bg-[#febc2e] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"></span>
                <span className="h-3 w-3 rounded-full bg-[#28c840] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"></span>
              </div>
              <div className="flex-1 rounded-lg border border-gray-200/90 bg-white px-3 py-1.5 text-center text-xs font-medium tracking-wide text-gray-500 shadow-sm dark:border-gray-600/80 dark:bg-gray-800 dark:text-gray-300 sm:px-4 sm:text-sm">
                {urlLabel}
              </div>
              {showRefresh && (
                <button
                  type="button"
                  aria-label="refresh demo frame"
                  onClick={onRefresh}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border-none border-gray-200/90 text-gray-500 transition hover:border-primary hover:text-primary dark:border-gray-600/80 dark:text-gray-300 dark:hover:border-primary dark:hover:text-primary"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m14.836 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-14.83-2m14.83 2H15"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-50 dark:bg-gray-950">
            <div
              className="flex h-full w-full items-center justify-center px-6 text-center min-[430px]:hidden"
              dir="rtl"
              role="note"
            >
              <p className="max-w-[280px] text-sm font-medium leading-7 text-body-color dark:text-body-color-dark">
                برای مشاهده بهتر این بخش، لطفاً با دسکتاپ یا صفحه‌نمایش بزرگ‌تر
                مشاهده کنید.
              </p>
            </div>
            <div className="hidden h-full w-full min-[430px]:block">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserWindowFrame;

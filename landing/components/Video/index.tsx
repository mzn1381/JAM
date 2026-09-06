"use client";

import { useState } from "react";
import SectionTitle from "../Common/SectionTitle";
import MobileDeviceFrame from "../Common/MobileDeviceFrame";
import B2BDemo from "./B2BDemo";
import BrowserWindowFrame from "./BrowserWindowFrame";
import { useRuntimeConfig } from "@/hooks/useRuntimeConfig";

type DemoMode = "b2c" | "b2b";

const Video = () => {
  const [demoMode, setDemoMode] = useState<DemoMode>("b2b");
  const [b2bFrameRefreshSignal, setB2bFrameRefreshSignal] = useState(0);
  const { iframeSrcDemoB2C } = useRuntimeConfig();

  const handleB2bFrameRefresh = () => {
    setB2bFrameRefreshSignal((prev) => prev + 1);
  };

  return (
    <section
      id="live-demo-section"
      className="relative z-10 py-16 md:py-20 lg:py-28 min-h-[780px] md:min-h-[850px] lg:min-h-[920px]"
    >
      <div className="container">
        <SectionTitle
          title="یک نگاه کوتاه به پیشکار"
          paragraph={
            demoMode === "b2c"
              ? "کمتر از یک دقیقه ببین پیشکار چطور ذهنت را سبک‌تر می‌کند."
              : "خدمات شما، فقط به اندازه یک چت یا پیام صوتی با مشتری فاصله دارد!"
          }
          center
          mb="60px"
        />
        {/* Demo Mode Toggle */}
        {/* <div className="wow fadeInUp mb-12 flex justify-center" data-wow-delay=".1s">
          <div className="inline-flex rounded-full bg-gray-100 p-1 dark:bg-[#1D2144] border border-body-color border-opacity-10 dark:border-white dark:border-opacity-10">
            <button
              onClick={() => setDemoMode("b2b")}
              className={`px-6 py-2 rounded-full text-base font-semibold transition-all duration-300 ${
                demoMode === "b2b"
                  ? "bg-primary text-white shadow-md"
                  : "text-dark dark:text-white hover:text-primary dark:hover:text-white"
              }`}
            >
              سازمانی (B2B)
            </button>
            <button
              onClick={() => setDemoMode("b2c")}
              className={`px-6 py-2 rounded-full text-base font-semibold transition-all duration-300 ${
                demoMode === "b2c"
                  ? "bg-primary text-white shadow-md"
                  : "text-dark dark:text-white hover:text-primary dark:hover:text-white"
              }`}
            >
              نسخه موبایل (B2C)
            </button>
          </div>
        </div> */}

        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            <div className="wow fadeInUp mx-auto" data-wow-delay=".15s">
              {/* B2C Mobile Frame */}
              {demoMode === "b2c" && (
                <div className="flex justify-center items-center transition-all duration-500 ease-in-out">
                  <MobileDeviceFrame>
                    {/* <Image src="/images/video/video.jpg" alt="پیشکار موبایل" fill className="object-cover" /> */}
                    <iframe
                      id="pishkar-demo-frame"
                      src={iframeSrcDemoB2C}
                      style={{ width: "100%", height: "100%", border: "none" }}
                      // onLoad={() => {}}
                    ></iframe>
                  </MobileDeviceFrame>
                </div>
              )}

              {/* B2B Browser Frame */}
              {demoMode === "b2b" && (
                <BrowserWindowFrame onRefresh={handleB2bFrameRefresh}>
                  <B2BDemo refreshSignal={b2bFrameRefreshSignal} />
                </BrowserWindowFrame>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-[-1] h-full w-full bg-[url(/images/video/shape.svg)] bg-cover bg-center bg-no-repeat"></div>
    </section>
  );
};

export default Video;

import BrowserWindowFrame from "@/components/Video/BrowserWindowFrame";
import SectionTitle from "@/components/Common/SectionTitle";
import Link from "next/dist/client/link";
import { ChevronsDown } from "lucide-react";

const B2BDemoSection = () => {
  return (
    <section className="relative z-10 py-16 md:py-20 lg:py-28">
      <div id="b2b-demo" className="container mb-9">
        <SectionTitle
          title="دموی سازمانی پیشکار"
          paragraph="یک نمونه از طراحی یکپارچه در رابط کاربری شما"
          center
          mb="40px"
        />
        <div className="m-auto flex w-full justify-center px-4 min-[430px]:w-[55vw]">
          <BrowserWindowFrame showRefresh={false}>
            <video autoPlay muted loop playsInline className="h-full w-full object-cover">
              <source src="/images/video/health.mp4" type="video/mp4" />
            </video>
          </BrowserWindowFrame>
        </div>
      </div>
      <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 md:bottom-8">
        <Link
          href="#live-demo-section"
          aria-label="رفتن به بخش بعدی"
          className="group flex min-w-[120px] flex-col items-center px-4 py-2 text-slate-700 transition-colors duration-300 hover:text-primary focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 dark:text-white dark:hover:text-primary dark:focus-visible:ring-offset-gray-dark"
        >
          <span className="whitespace-nowrap text-base font-medium leading-6 sm:text-lg">امتحان کنید</span>
          <span className="mt-2 flex h-9 w-12 animate-scroll-down items-center justify-center motion-reduce:animate-none">
            <ChevronsDown />
          </span>
        </Link>
      </div>
    </section>
  );
};

export default B2BDemoSection;

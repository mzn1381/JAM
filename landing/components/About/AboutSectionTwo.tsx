import Image from "next/image";
import MobileDeviceFrame from "../Common/MobileDeviceFrame";

const AboutSectionTwo = () => {
  return (
    <section className="py-16 md:py-20 lg:py-28">
      <div className="container">
        <div className="-mx-4 flex flex-wrap items-center">
          <div className="w-full px-4 lg:w-1/2">
            <div className="wow fadeInUp mx-auto mb-12 max-w-[500px] text-center lg:mb-0" data-wow-delay=".15s">
              <MobileDeviceFrame>
                <Image
                  src="/images/about/about-image-2.svg"
                  alt="about image"
                  fill
                  className="object-cover dark:hidden"
                />
                <Image
                  src="/images/about/about-image-2-dark.svg"
                  alt="about image"
                  fill
                  className="hidden object-cover dark:block"
                />
              </MobileDeviceFrame>
            </div>
          </div>
          <div className="w-full px-4 lg:w-1/2">
            <div className="wow fadeInUp max-w-[470px]" data-wow-delay=".2s">
              <div className="mb-9">
                <h3 className="mb-4 text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
                  {/* ساده، هوشمند، انسانی */}
                  تضمین امنیت فرایندها و ایجنت‌ها
                </h3>
                <p className="text-base font-medium leading-relaxed text-body-color sm:text-lg sm:leading-relaxed">
                  {/* بدون پیچیدگی‌های اضافی. فقط حرفت را بزن، بقیه‌اش را پیشکار انجام می‌دهد. */}
                  با پیاده‌سازی بروزترین پروتکل‌های امنیتی و جلوگیری از حملات حوزه Agentic AI امنیت فرایندهای شما را
                  تضمین می‌کند.
                </p>
              </div>

              <div className="mb-9">
                <h3 className="mb-4 text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
                  {/* همیشه کنارت هست */}
                  یکپارچه‌سازی بی‌دردسر در لایه API
                </h3>
                <p className="text-base font-medium leading-relaxed text-body-color sm:text-lg sm:leading-relaxed">
                  {/* پیشکار فقط یک اپ نیست؛ یک همراه است که گوش می‌دهد، پیگیری می‌کند و در زمان درست به تو یادآوری می‌کند. */}
                  بدون نیاز به تغییر زیرساخت‌ها، پیشکار به‌عنوان AIaaS به سیستم‌های شما متصل می‌شود.
                </p>
              </div>

              <div className="mb-1">
                <h3 className="mb-4 text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
                  {/* خیالت راحت، چیزی فراموش نمی‌شود */}
                  از پاسخ‌گویی تا اجرا؛ یک ایجنت واقعی
                </h3>
                <p className="text-base font-medium leading-relaxed text-body-color sm:text-lg sm:leading-relaxed">
                  {/*                   
                  پیشکار طوری طراحی شده که کارها، قرارها و جزئیات مهم از دست نروند؛ حتی وقتی ذهنت شلوغ است یا روزت
                  پرمشغله. */}
                  پیشکار فقط یک چت‌بات نیست؛ درخواست را می‌فهمد، APIها را فراخوانی می‌کند.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSectionTwo;

import Image from "next/image";
import SectionTitle from "../Common/SectionTitle";
import MobileDeviceFrame from "../Common/MobileDeviceFrame";

const checkIcon = (
  <svg width="16" height="13" viewBox="0 0 16 13" className="fill-current">
    <path d="M5.8535 12.6631C5.65824 12.8584 5.34166 12.8584 5.1464 12.6631L0.678505 8.1952C0.483242 7.99994 0.483242 7.68336 0.678505 7.4881L2.32921 5.83739C2.52467 5.64193 2.84166 5.64216 3.03684 5.83791L5.14622 7.95354C5.34147 8.14936 5.65859 8.14952 5.85403 7.95388L13.3797 0.420561C13.575 0.22513 13.8917 0.225051 14.087 0.420383L15.7381 2.07143C15.9333 2.26669 15.9333 2.58327 15.7381 2.77854L5.8535 12.6631Z" />
  </svg>
);

const AboutSectionOne = () => {
  const List = ({ text }) => (
    <p className="mb-5 flex items-center text-md font-medium text-body-color">
      <span className="me-3 flex h-[30px] w-[30px] items-center justify-center rounded-md bg-primary bg-opacity-10 text-primary ">
        {checkIcon}
      </span>
      {text}
    </p>
  );

  return (
    <section id="about" className="pt-16 md:pt-20 lg:pt-28">
      <div className="container">
        <div className="border-b border-body-color/[.15] pb-16 dark:border-white/[.15] md:pb-20 lg:pb-28">
          <div className="-mx-4 flex flex-wrap items-center">
            <div className="w-full px-4 lg:w-1/2">
              <SectionTitle
                // title="طراحی‌شده برای زندگی روزمره شما"
                // paragraph="پیشکار با تمرکز بر سادگی، دقت و امنیت، مدیریت کارها و یادآوری‌ها را هوشمندتر می‌کند."
                title="طراحی‌شده برای رشد و بهینه‌سازی کسب‌وکار شما"
                paragraph="پیشکار با تمرکز بر سادگی پیاده‌سازی، دقت در عملیات و امنیت سازمانی، تعامل با کاربران و مدیریت فرآیندهای شما را هوشمندتر می‌کند."
                mb="44px"
              />

              <div className="wow fadeInUp mb-12 max-w-[570px] lg:mb-0" data-wow-delay=".15s">
                <div className="mx-[-12px] flex flex-wrap">
                  <div className="w-full px-3 sm:w-1/2 lg:w-full xl:w-1/2">
                    <List
                      //  text="ثبت سریع کارها با تایپ یا صدا"
                      text="تعامل صوتی و متنی کاربران"
                    />
                    <List
                      // text="یادآوری دقیق در زمان مناسب"
                      text="کاهش اصطکاک و ریزش در قیف فروش"
                    />
                    <List
                      // text=" کارهای روزمره بدون استرس"
                      text="اتوماسیون کامل سناریوهای تکراری"
                    />
                  </div>

                  <div className="w-full px-3 sm:w-1/2 lg:w-full xl:w-1/2">
                    <List
                      //  text="تعامل ساده با زبان طبیعی"
                      text="داشبورد اختصاصی مدیریت محصول"
                    />
                    <List
                      text="یادگیری از عادت‌ها و علایق کاربران شما"
                      // text="حفظ مالکیت داده‌ها"
                    />
                    <List text="حریم خصوصی و امنیت داده‌ها" />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full px-4 lg:w-1/2">
              <div className="wow fadeInUp mx-auto max-w-[500px] lg:mr-0" data-wow-delay=".2s">
                <MobileDeviceFrame>
                  <Image
                    src="/images/about/about-image.svg"
                    alt="نمایش پیشکار در موبایل"
                    fill
                    className="object-cover dark:hidden"
                  />
                  <Image
                    src="/images/about/about-image-dark.svg"
                    alt="نمایش پیشکار در موبایل (حالت تاریک)"
                    fill
                    className="hidden object-cover dark:block"
                  />
                </MobileDeviceFrame>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSectionOne;

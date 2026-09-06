import Breadcrumb from "@/components/Common/Breadcrumb";
import Contact from "@/components/Contact";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ارتباط با ما",
  description: "This is Contact Page for Pishkar",
  // other metadata
};

const ContactPage = () => {
  return (
    <>
      <Breadcrumb
        pageName="ارتباط با ما"
        description={
          <>
            ما در پیشکار باور داریم آینده‌ی کارهای روزمره، هوشمند، خودکار و بدون اصطکاک است. اگر شما هم به ساخت یک
            دستیار عملیاتی شخصی برای هر فرد علاقه‌مندید — چه به‌عنوان کاربر، همکار، سرمایه‌گذار یا شریک تجاری — خوشحال
            می‌شویم با شما گفتگو کنیم.
            <br /> برای همکاری، سرمایه‌گذاری، ارائه پیشنهاد یا حتی مطرح کردن یک دغدغه روزمره که فکر می‌کنید پیشکار باید
            آن را حل کند، با ما در ارتباط باشید. پیشکار با شما کامل‌تر می‌شود.
            <br />
            <br />
            <br />
            شماره تماس:{" "}
            <a className="text-primary text-decoration-underline text-lg" href="tel:+989162624076">
              ۰۹۱۶۲۶۲۴۰۷۶
            </a>
            <br />
            <br />
            ایمیل:{" "}
            <a className="text-primary text-decoration-underline text-lg" href="mailto:mypishkar.co@gmail.com">
              mypishkar.co@gmail.com
            </a>
          </>
        }
      />

      <Contact />
    </>
  );
};

export default ContactPage;

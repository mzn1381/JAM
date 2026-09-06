import SectionTitle from "../Common/SectionTitle";
import SingleFeature from "./SingleFeature";
import featuresData from "./featuresData";

const Features = () => {
  return (
    <>
      <section id="features" className="py-16 md:py-20 lg:py-28">
        <div className="container">
          <SectionTitle
            title="چرا پیشکار؟"
            // paragraph="چون زندگی شلوغ شده و ذهن ما ظرفیت نگه‌داشتن همه چیز را ندارد. پیشکار آمده تا بار ذهنی شما را کم کند. "
            paragraph="پیشکار، AI را از یک ابزار پاسخ‌گو به یک لایه اجرایی برای کسب‌وکار تبدیل می‌کند.
بدون تغییر زیرساخت، فرآیندها و خدمات موجود را با زبان طبیعی اجرا می‌کند."
            center
            width="70%"
          />

          {/* <SectionTitle title="به‌جای اینکه یادتان باشد چه کاری دارید، فقط به پیشکار بگویید." paragraph="" center /> */}

          <div className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {featuresData.map((feature) => (
              <SingleFeature key={feature.id} feature={feature} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;

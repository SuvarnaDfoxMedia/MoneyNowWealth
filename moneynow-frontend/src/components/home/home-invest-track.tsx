import Image from "next/image";

interface HomeInvestTrackProps {
  data: {
    phoneImage: string;
    titleLine1: string;
    titleLine2: string;
    titleLine3: string;
    appStoreImg: string;
    playStoreImg: string;
  };
}

export default function HomeInvestTrack({ data }: HomeInvestTrackProps) {
  const {
    phoneImage,
    titleLine1,
    titleLine2,
    titleLine3,
    appStoreImg,
    playStoreImg,
  } = data;

  return (
    <section className="w-full bg-[#043F79] flex justify-center">
<div className="max-w-6xl w-full flex flex-col md:flex-row items-center pt-[64px] pb-[64px] gap-5 md:gap-20">

        {/* LEFT: Phone */}
        <div className="w-full md:w-2/5 flex justify-center mt-[-140px] md:mt-[-180px]">
        <Image
  src={phoneImage}
  alt="Phone preview"
  width={260}
  height={496}
  className="object-contain w-auto h-auto md:w-[260px] md:h-[496px]"
/>
  </div>

        {/* RIGHT: Text */}
        <div className="w-full md:w-3/5 text-white text-center">

          {/* First line */}
<h1 className="font-poppins font-bold text-[30px] leading-[34px] md:text-[41px] md:leading-[60px] lg:text-[61px] lg:leading-[73px]  whitespace-nowrap">
            {titleLine1}
          </h1>

          {/* Subtitle lines */}
<p className="font-poppins font-bold text-[25px] leading-[34px] mt-4 md:text-[36px] md:leading-[60px]  lg:text-[46px] lg:leading-[73px]">
            {titleLine2}
            <br />
            {titleLine3}
          </p>

<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
  <Image
    src={appStoreImg}
    alt="App Store"
    width={260}   
    height={89}   
    className="w-[180px] h-[60px] sm:w-auto sm:h-auto md:w-[256px] md:h-[89px] lg:w-[250px] lg:h-[79px]"
  />

  <Image
    src={playStoreImg}
    alt="Google Play"
    width={256}   
    height={89}   
    className="w-[180px] h-[60px] sm:w-auto sm:h-auto md:w-[256px] md:h-[89px] lg:w-[250px] lg:h-[79px]"
  />
</div>

        </div>
      </div>
    </section>
  );
}

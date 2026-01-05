


export default function Page() {
  return (
    <div className="relative w-full mb-[25px]">

      {/* Background Image */}
      <div
        className="
          absolute inset-0 bg-center bg-cover bg-no-repeat
          bg-[url('/images/home-mob-banner.jpg')]
          sm:bg-[url('/images/hero-bg.png')]
          z-0
          opacity-55 sm:opacity-100
        "
      ></div>

      {/* Content */}
      <div className="relative z-10 w-full">
        <div
          className="
            max-w-7xl mx-auto px-6 py-22
            flex flex-col lg:flex-row 
            items-start sm:items-center 
            justify-start sm:justify-between   /* <-- TEXT AT TOP ON MOBILE */
            gap-10
          "
        >

          {/* ---- LEFT TEXT ---- */}
          <div className="max-w-2xl mt-4">  {/* optional extra spacing */}
            <h1 className="text-[29px] sm:text-[36px] font-bold font-poppins leading-[32px] sm:leading-[44px] text-[#000000]">
              Wealth guided by <span className="text-[#04407B]">trust</span> and
              <span className="text-[#04407B]"> experience </span> – beyond algorithms
            </h1>

            <p className="mt-6 text-[18px] sm:text-[26px] font-normal leading-[28px] sm:leading-[37px] text-[#000000] font-poppins">
              Clarity is the first step. Confidence is the journey. Wealth is the outcome.
            </p>

            <button className="mt-8 bg-[#043F79] hover:bg-[#032F5A] text-white font-inter font-medium text-[18px] rounded-[5px] px-[25px] py-[13px] sm:px-[30px] sm:py-[20px] uppercase">
              START YOUR JOURNEY
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}

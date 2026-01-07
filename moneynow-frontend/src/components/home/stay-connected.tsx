// "use client";

// import Image from "next/image";
// import React from "react";
// import { stayConnectedData } from "@/data/homePageData";

// const StayConnected = () => {
//   const { title, subtitle, description, features } = stayConnectedData;

//   return (
//     <section className="w-full bg-[#053C71] py-[40px] font-inter">
//       <div className="container mx-auto px-4 text-center">

//         {/* MAIN TITLE */}
//        <h2 className="text-white font-bold text-[24px] leading-[30px] sm:text-[32px] sm:leading-[34px] mb-3">
//   {title}
// </h2>

//         {/* SUBTITLE */}
//        <p className="text-[18px] leading-[20px] font-semibold text-white mb-3 sm:text-[20px] sm:leading-[22px]">
//   {subtitle}
// </p>


//         {/* DESCRIPTION */}
//         <p className="text-white leading-[26px] text-[15px] mb-10  mx-auto">
//           {description}
//         </p>

//         {/* ICON ROW */}
//        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-10">
//   {features.map((item, index) => (
//     <div 
//       key={index} 
//       className="flex flex-col items-center text-white mb-[20px] sm:mb-0"
//     >
//       <div className="bg-[#D9D9D9] p-4 rounded-[10px] flex items-center justify-center mb-4">
//         <Image
//           src={item.imageSrc}
//           alt={item.text}
//           width={75}
//           height={75}
//         />
//       </div>
//       <p className="text-[14px]">{item.text}</p>
//     </div>
//   ))}
// </div>


//         {/* SUBSCRIBE FORM */}
//         <div className="bg-white rounded-[12px] flex flex-col md:flex-row items-center p-7 gap-4 md:gap-5 max-w-full mx-auto">

//           {/* NAME */}
//           <input
//             type="text"
//             placeholder="Enter your name"
//             className="w-full md:w-[470px] border border-[#043F79] px-4 py-3 text-[15px]
//               placeholder-[#043F79] focus:outline-blue-600"
//           />

//           {/* EMAIL */}
//           <input
//             type="email"
//             placeholder="Enter your email"
//             className="w-full md:w-[470px] border border-[#043F79] px-4 py-3 text-[15px]
//               placeholder-[#043F79] focus:outline-blue-600"
//           />

//           {/* BUTTON */}
//           <button className="bg-[#043F79] text-white text-[18px] px-[30px] py-3 rounded-[5px] uppercase whitespace-nowrap hover:bg-[#032F59] transition">
//             SUBSCRIBE NOW
//           </button>
//         </div>

//       </div>
//     </section>
//   );
// };

// export default StayConnected;


"use client";

import Image from "next/image";
import React, { useState } from "react";
import { stayConnectedData } from "@/data/homePageData";
import { useApiPost } from "@/hooks/useApiPost";

const StayConnected = () => {
  const { title, subtitle, description, features } = stayConnectedData;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const { postData, loading, error, success } = useApiPost();

  const handleSubmit = async () => {
    if (!name || !email) return alert("Please enter name and email");

    await postData("/api/newsletter", { name, email });

    setName("");
    setEmail("");
  };

  return (
    <section className="w-full bg-[#053C71] py-[40px] font-inter">
      <div className="container mx-auto px-4 text-center">
        
        {/* MAIN TITLE */}
        <h2 className="text-white font-bold text-[24px] leading-[30px] sm:text-[32px] sm:leading-[34px] mb-3">
          {title}
        </h2>

        {/* SUBTITLE */}
        <p className="text-[18px] leading-[20px] font-semibold text-white mb-3 sm:text-[20px]">
          {subtitle}
        </p>

        {/* DESCRIPTION */}
        <p className="text-white leading-[26px] text-[15px] mb-10 mx-auto">
          {description}
        </p>

        {/* ICONS */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {features.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-white mb-[20px] sm:mb-0  md:mb-4">
              <div className="bg-[#D9D9D9] p-4 rounded-[10px] flex items-center justify-center mb-4">
                <Image src={item.imageSrc} alt={item.text} width={75} height={75} />
              </div>
              <p className="text-[14px]">{item.text}</p>
            </div>
          ))}
        </div>

        {/* SUBSCRIBE FORM */}
      <div className="bg-white rounded-[12px] flex flex-col lg:flex-row items-center p-7 gap-4 lg:gap-5 max-w-full mx-auto">

  {/* NAME */}
  <input
    type="text"
    placeholder="Enter your name"
    value={name}
    onChange={(e) => setName(e.target.value)}
    className="w-full lg:w-[470px] border border-[#043F79] px-4 py-3 text-[15px]
    placeholder-[#043F79] focus:outline-blue-600"
  />

  {/* EMAIL */}
  <input
    type="email"
    placeholder="Enter your email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className="w-full lg:w-[470px] border border-[#043F79] px-4 py-3 text-[15px]
    placeholder-[#043F79] focus:outline-blue-600"
  />

  {/* BUTTON */}
  <button
    onClick={handleSubmit}
    disabled={loading}
    className="w-full lg:w-auto bg-[#043F79] text-white text-[18px] px-[30px] py-3 rounded-[5px] uppercase whitespace-nowrap hover:bg-[#032F59] transition"
  >
    {loading ? "Submitting..." : "SUBSCRIBE NOW"}
  </button>

</div>


        {/* ERROR / SUCCESS MESSAGE */}
        {/* {error && <p className="text-red-300 mt-3">{error}</p>} */}
        {error && <p className="text-red-300 mt-3">Something went wrong. Please try again.</p>}

        {success && <p className="text-green-300 mt-3">{success}</p>}
      </div>
    </section>
  );
};

export default StayConnected;

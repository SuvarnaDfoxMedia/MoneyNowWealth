"use client";

import Image from "next/image";

const teamData = [
  {
    name: "Anagha Raut",
    role: "Founder & Director",
    img: "/images/people-behind-1.png",
    desc: "Over 25 years of experience across mutual funds, investments, insurance, and retirement- and tax-related planning. At Moneynow, Anagha leads goal-linked investing, portfolio oversight, and client relationships — with a strong emphasis on long-term trust and clarity. She believes every family deserves investment support that is clear, thoughtful, and truly in their interest.",
  },
  {
    name: "Ashish Sharma",
    role: "Co-founder & Director",
    img: "/images/people-behind-2.png",
    desc: "A technology professional with over 27 years of experience in financial services, specialising in insurance, technology, and financial innovation. At Moneynow, Ashish leads the platform across technology, products, and client experience, bringing research-driven thinking and process discipline to everything the team builds. Ashish’s benchmark is simple: does this genuinely make things easier and clearer for our clients?",
  },
  {
    name: "Bandish Raut",
    role: "Co-founder & Director",
    img: "/images/people-behind-3.png",
    desc: "Bandish has over 8 years of experience in mutual fund distribution and has been closely involved with the growth of Surabhi Financial Services and the creation of Moneynow Wealth Management LLP. At Moneynow, he leads partnerships, operations, compliance, and HR, helping ensure the platform runs smoothly and that client commitments are honoured consistently. Having seen Surabhi grow over the years, Bandish brings a practical understanding of what truly helps investors in their day-to-day financial lives — and what does not.",
  },
];

const TeamSection = () => {
  return (
    <section className="w-full py-[60px]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Heading */}
        <h2 className="text-center text-[28px] md:text-[40px] font-semibold mb-3">
          The People Behind Your Money
        </h2>
        <p className="text-center mb-3 max-w-3xl mx-auto text-[16px] md:text-[18px]">
          Every platform has technology. What matters just as much is who stands
          behind it.
        </p>

        <p className="text-center mb-12 max-w-3xl mx-auto text-[15px] md:text-[16px]">
          Together, our core team brings 70+ years of investing experience with
          1000+ families.
        </p>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {teamData.map((member, index) => (
            <div
              key={index}
              className="group bg-white rounded-[14px] overflow-hidden shadow-md transition-all duration-300 h-fit"
            >
              {/* Image */}
              <div className="relative w-full h-[350px] sm:h-[400px] md:h-[450px] overflow-hidden">
                <Image
                  src={member.img}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-[20px] md:text-[24px] font-semibold mb-2">
                  {member.name}
                </h3>
                <p className="text-[14px] md:text-[16px] text-[#043F79] mb-3">{member.role}</p>

                {/* Description */}
                <p
                  className="
                    text-[15px] md:text-[16px] leading-[24px] md:leading-[26px]
                    max-h-none overflow-visible pb-0
                    md:max-h-[50px] md:overflow-hidden md:pb-3
                    md:group-hover:max-h-[1000px] md:group-hover:pb-0
                    transition-all duration-500
                  "
                >
                  {member.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;

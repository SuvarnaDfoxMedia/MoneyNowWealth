import React from "react";

interface GoalTestimonialProps {
  quote: string;
  authorName: string;
  authorMeta: string;
}

export const GoalTestimonial: React.FC<GoalTestimonialProps> = ({
  quote,
  authorName,
  authorMeta,
}) => {
  // Extract initials for the avatar
  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative rounded-r-xl bg-white p-6 shadow-sm border border-gray-100 mt-8">
      {/* Left Border Accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0E4A89] rounded-l-xl" />
      
      <p className="text-[17px] italic text-gray-700 leading-relaxed mb-6">
        "{quote}"
      </p>
      
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0E4A89]/10 text-[#0E4A89] font-bold text-[14px]">
          {initials}
        </div>
        
        {/* Author Info */}
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 text-[15px]">
            {authorName}
          </span>
          <span className="text-[13px] text-gray-500">
            {authorMeta}
          </span>
        </div>
      </div>
    </div>
  );
};

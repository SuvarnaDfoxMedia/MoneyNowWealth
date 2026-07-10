import Image from "next/image";
import { ShieldCheck } from "lucide-react";

interface JourneyHeroProps {
  imageSrc: string;
  imageAlt: string;
  eyebrow: string;
  titlePlain: string;
  titleAccent: string;
  subtitle: string;
  trustBadges: string[];
}

export const JourneyHero = ({
  imageSrc,
  imageAlt,
  eyebrow,
  titlePlain,
  titleAccent,
  subtitle,
  trustBadges,
}: JourneyHeroProps) => (
  <div className="relative rounded-[8px] overflow-hidden mb-[40px]">
    <div className="relative min-h-[280px] md:min-h-[320px]">
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        className="object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      {/* fallback background so a broken image never leaves the hero blank */}
      <div className="absolute inset-0 -z-10 bg-[#17384A]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(23,56,74,0.93) 0%, rgba(23,56,74,0.75) 45%, rgba(23,56,74,0.12) 100%)",
        }}
      />
      <div className="relative z-10 h-full flex items-center px-6 md:px-10 py-8">
        <div className="max-w-[560px]">
          <div className="text-[11px] tracking-[1px] uppercase text-[#9FC4DA] mb-2 font-medium">
            {eyebrow}
          </div>
          <h1 className="text-[26px] md:text-[32px] font-medium leading-tight mb-3 text-white">
            {titlePlain}
            <span className="text-[#6FCBA6] font-bold">{titleAccent}</span>
          </h1>
          <p className="text-[13px] md:text-sm text-[#DCE9F0] leading-relaxed mb-4 max-w-[520px]">
            {subtitle}
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-[#DCE9F0]">
            {trustBadges.map((b) => (
              <span key={b} className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#5DCAA5]" />
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

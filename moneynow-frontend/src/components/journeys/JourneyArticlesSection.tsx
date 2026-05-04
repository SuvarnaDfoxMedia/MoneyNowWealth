"use client";

import Image from "next/image";
import Link from "next/link";
import { useFetchCards } from "@/hooks/useHomeBlog";

type JourneyArticlesSectionProps = {
  title?: string;
  endpoint?: string;
};

export default function JourneyArticlesSection({
  title = "Learn More About Long-Term Investing",
  endpoint = "/api/article/published/latest",
}: JourneyArticlesSectionProps) {
  const {
    cards: blogCards,
    loading: blogLoading,
    error: blogError,
  } = useFetchCards(endpoint);

  return (
    <>
       <section className="bg-[#f8f8f8] py-[40px]">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="text-center">
          <h2 className="text-[34px] font-semibold tracking-[-0.03em] md:text-[40px]">
          {title}
          </h2>
        </div>

        {blogLoading ? (
          <p className="mt-12 text-center text-[16px] text-slate-600">
            Loading articles...
          </p>
        ) : blogError ? (
          <p className="mt-12 text-center text-[16px] text-red-500">
            Something went wrong. Please try again.
          </p>
        ) : (
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {blogCards.slice(0, 3).map((article) => (
              <article
                key={article.slug}
                className="overflow-hidden rounded-[14px] border border-[#E6E6E6] bg-[#ffffff]"
              >
                <div className="relative aspect-[1.6/1]">
                  <Image
                    src={article.imageSrc}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    unoptimized
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-[20px] font-semibold leading-[1.35] tracking-[-0.02em] text-[#111111]">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-[16px] leading-8 text-[#2D2D2D]">
                    {article.description || article.category}
                  </p>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="mt-7 inline-flex items-center gap-3 text-[16px] font-medium text-[#111111]"
                  >
                    Read Article
                    <span aria-hidden="true">-&gt;</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>

    <section className="relative w-full py-[40px]">
      <div className="mx-auto w-full px-4 md:px-6">
        <p className="text-center text-[18px] font-medium leading-[32px]">
          The calculations shown above are for illustration and educational
          purposes only and are based on the assumptions you have selected.
          They do not represent actual returns or guarantees of any kind.
          Mutual fund investments are subject to market risks. Please read all
          scheme-related documents carefully before investing.
        </p>
      </div>
    </section>
    </>
 
  );
}

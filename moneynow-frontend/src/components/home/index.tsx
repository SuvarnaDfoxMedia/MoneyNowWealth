import React from 'react';
import Hero from "@/components/home/hero";
import ChooseJourneyCard from "@/components/home/choose-journey-card";
import HomePortfolio from "@/components/home/home-portfolio";
import WhyMoneyNow from "@/components/home/why-money-now";
import HomeInvestTrack from "@/components/home/home-invest-track";
import HomeCalculators from "@/components/home/home-calculators";
import StayConnected from "@/components/home/stay-connected";
import HomeBlog from "@/components/home/home-blog";

import {
  chooseJourneyTitle,
  chooseJourneySubtitle,
  chooseJourneyCards,
  homePortfolioTitle,
  homePortfolioSubtitle,
  homePortfolioCards,
  whyMoneyNowTitle,
  whyMoneyNowSubtitle,
  whyMoneyNowCards,
  homeInvestTrackData,
  homeBlogData,
} from "@/data/homePageData";

const Index = () => {
  return (
    <>
      <Hero />

      <ChooseJourneyCard
        title={chooseJourneyTitle}
        subtitle={chooseJourneySubtitle}
        cards={chooseJourneyCards}
      />

      <WhyMoneyNow
        sectionTitle={whyMoneyNowTitle}
        sectionSubtitle={whyMoneyNowSubtitle}
        cards={whyMoneyNowCards}
      />

      <HomePortfolio
        title={homePortfolioTitle}
        subtitle={homePortfolioSubtitle}
        cards={homePortfolioCards}
      />

      <HomeInvestTrack data={homeInvestTrackData} />

      <HomeCalculators />

      {/* Insights Desk Section */}
      <HomeBlog
        title={homeBlogData.title}
        subtitle={homeBlogData.subtitle}
      />

      <StayConnected />
    </>
  );
};

export default Index;

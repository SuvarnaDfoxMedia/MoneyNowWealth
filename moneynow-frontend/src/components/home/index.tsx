import React from "react";
import Hero from "@/components/home/hero";
import ChooseJourneyCard from "@/components/home/choose-journey-card";
import ChooseHowYouLikeBeging from "@/components/home/ChooseHowYouLikeBeging";
import HomeInvestTrack from "@/components/home/invest-with-confidence";
import StayConnected from "@/components/home/home-newsletters";
import HomeBlog from "@/components/home/home-blog";

import { homeInvestTrackData, homeBlogData } from "@/data/homePageData";

const Index = () => {
  return (
    <>
      <Hero />

      <ChooseJourneyCard />
      <ChooseHowYouLikeBeging />

      <HomeInvestTrack data={homeInvestTrackData} />

      {/* Insights Desk Section */}
      <HomeBlog title={homeBlogData.title} subtitle={homeBlogData.subtitle} />

      <StayConnected />
    </>
  );
};

export default Index;

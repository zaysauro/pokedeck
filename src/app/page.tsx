import { Hero } from "@/components/home/Hero";
import { AdSlot } from "@/components/social/AdSlot";
import {
  BuilderCta, Generations, Legends, PopularDecks, PopularFan, RecentlyAdded, Ticker, TypeExplorer,
} from "@/components/home/HomeSections";

export default function Home() {
  return (
    <>
      <Hero />
      <Ticker />
      <PopularFan />
      <TypeExplorer />
      <Generations />
      <Legends />
      <RecentlyAdded />
      <PopularDecks />
      <div className="mx-auto max-w-[1440px] px-4 md:px-6"><AdSlot placement="home" /></div>
      <BuilderCta />
    </>
  );
}

import { Hero } from "@/components/home/Hero";
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
      <BuilderCta />
    </>
  );
}

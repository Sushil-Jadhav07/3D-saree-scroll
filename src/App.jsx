import Bridal from "@/components/Bridal";
import Hero from "@/components/Hero";
import HeroStrip from "@/components/HeroStrip";
import MuseFilm from "@/components/MuseFilm";
import MuseReels from "@/components/MuseReels";
import Muses from "@/components/Muses";
import Navbar from "@/components/Navbar";
import PickASilk from "@/components/PickASilk";
import Rack from "@/components/Rack";
import SixMoods from "@/components/SixMoods";
import TryTheLook from "@/components/TryTheLook";
import Weave from "@/components/Weave";

export default function App() {
  return (
    <main>
      <Navbar />
      <Hero />
      <HeroStrip />
      <SixMoods />
      <TryTheLook />
      <PickASilk />
      <Rack />
      <Muses />
      <MuseFilm />
      <MuseReels />
      <Bridal />
      <Weave />
    </main>
  );
}

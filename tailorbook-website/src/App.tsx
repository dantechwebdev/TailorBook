import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Hero from './components/sections/Hero';
import Problem from './components/sections/Problem';
import Solution from './components/sections/Solution';
import Features from './components/sections/Features';
import Philosophy from './components/sections/Philosophy';
import Workflow from './components/sections/Workflow';
import AISection from './components/sections/AISection';
import WhatsApp from './components/sections/WhatsApp';
import Roadmap from './components/sections/Roadmap';
import FoundingMember from './components/sections/FoundingMember';
import FAQ from './components/sections/FAQ';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <Features />
        <Philosophy />
        <Workflow />
        <AISection />
        <WhatsApp />
        <Roadmap />
        <FoundingMember />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}

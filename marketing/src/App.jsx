import { Nav } from "./components/Nav.jsx";
import { Footer } from "./components/Footer.jsx";
import { useHashRoute } from "./router.js";
import HomePage from "./pages/HomePage.jsx";
import HowItWorksPage from "./pages/HowItWorksPage.jsx";
import TechnologyPage from "./pages/TechnologyPage.jsx";
import DriversPage from "./pages/DriversPage.jsx";
import OperatorsPage from "./pages/OperatorsPage.jsx";
import PricingPage from "./pages/PricingPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import BlogPage from "./pages/BlogPage.jsx";
import CareersPage from "./pages/CareersPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import FaqPage from "./pages/FaqPage.jsx";
import PrivacyPage from "./pages/PrivacyPage.jsx";

const PAGES = {
  home: HomePage,
  "how-it-works": HowItWorksPage,
  technology: TechnologyPage,
  drivers: DriversPage,
  operators: OperatorsPage,
  pricing: PricingPage,
  about: AboutPage,
  blog: BlogPage,
  careers: CareersPage,
  contact: ContactPage,
  faq: FaqPage,
  privacy: PrivacyPage,
};

export default function App() {
  const route = useHashRoute();
  const Page = PAGES[route] || HomePage;
  return (
    <>
      <Nav route={route} />
      <main key={route} className="route-view">
        <Page />
      </main>
      <Footer />
    </>
  );
}

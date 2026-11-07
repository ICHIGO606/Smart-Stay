import { Link } from 'react-router';
import { Compass, Globe, Shield, Sparkles } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 pt-12 pb-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-[5px] bg-stone-100 text-stone-900 flex items-center justify-center text-xs font-semibold">
                SS
              </span>
              <span className="text-sm font-semibold tracking-tight text-white">SmartStay</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-xs mb-4">
              Architectural boutique accommodations, historic estates, and tailored itinerary reservations.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-stone-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Global concierge online</span>
            </div>
          </div>

          {/* Stays Column */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-stone-200 mb-3 font-mono">
              Accommodations
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/hotels" className="text-stone-400 hover:text-white transition-colors">
                  All properties
                </Link>
              </li>
              <li>
                <Link to="/hotels" className="text-stone-400 hover:text-white transition-colors">
                  Boutique city suites
                </Link>
              </li>
              <li>
                <Link to="/hotels" className="text-stone-400 hover:text-white transition-colors">
                  Heritage villas
                </Link>
              </li>
              <li>
                <Link to="/hotels" className="text-stone-400 hover:text-white transition-colors">
                  Coastal hideaways
                </Link>
              </li>
            </ul>
          </div>

          {/* Curated Journeys */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-stone-200 mb-3 font-mono">
              Journeys
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/packages" className="text-stone-400 hover:text-white transition-colors">
                  Curated packages
                </Link>
              </li>
              <li>
                <Link to="/packages" className="text-stone-400 hover:text-white transition-colors">
                  Cultural itineraries
                </Link>
              </li>
              <li>
                <Link to="/packages" className="text-stone-400 hover:text-white transition-colors">
                  Architectural tours
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Guarantee */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-stone-200 mb-3 font-mono">
              Standards
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li className="flex items-center gap-1.5">
                <Shield size={13} className="text-stone-400" />
                <span>Verified identity check</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Globe size={13} className="text-stone-400" />
                <span>Direct host relationship</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Compass size={13} className="text-stone-400" />
                <span>No hidden resort surcharges</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-400 font-mono">
          <p>© {new Date().getFullYear()} SmartStay Operations. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-stone-300 transition-colors cursor-pointer">Privacy protocol</span>
            <span className="hover:text-stone-300 transition-colors cursor-pointer">Terms of stay</span>
            <span className="hover:text-stone-300 transition-colors cursor-pointer">Security disclosure</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

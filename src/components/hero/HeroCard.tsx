import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Sword, Wand2 } from 'lucide-react';
import type { Hero } from '../../types/hero';

const SPECIALTY_COLOR: Record<string, string> = {
  'Finisher':     'text-red-400 border-red-500/40 bg-red-500/10',
  'Burst':        'text-orange-400 border-orange-500/40 bg-orange-500/10',
  'Crowd Control':'text-purple-400 border-purple-500/40 bg-purple-500/10',
  'Control':      'text-purple-400 border-purple-500/40 bg-purple-500/10',
  'Poke':         'text-blue-400 border-blue-500/40 bg-blue-500/10',
  'Chase':        'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
  'Charge':       'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
  'Damage':       'text-rose-400 border-rose-500/40 bg-rose-500/10',
  'Magic Damage': 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
  'Mixed Damage': 'text-pink-400 border-pink-500/40 bg-pink-500/10',
  'Support':      'text-green-400 border-green-500/40 bg-green-500/10',
  'Regen':        'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  'Guard':        'text-sky-400 border-sky-500/40 bg-sky-500/10',
  'Initiator':    'text-amber-400 border-amber-500/40 bg-amber-500/10',
  'Push':         'text-lime-400 border-lime-500/40 bg-lime-500/10',
};

interface HeroCardProps {
  hero: Hero;
}

const LANE_ICONS: Record<string, string> = {
  'Gold Lane': '/assets/lanes/farm-lane.webp',
  'Jungle': '/assets/lanes/jungle.webp',
  'Mid Lane': '/assets/lanes/mid-lane.webp',
  'EXP Lane': '/assets/lanes/clash-lane.webp',
  'Exp Lane': '/assets/lanes/clash-lane.webp',
  'Roam': '/assets/lanes/roamer.webp',
};

const formatLane = (lane: string): string => {
  return lane.replace(' Lane', '');
};

// Role-based glow colors
const ROLE_GLOW: Record<string, { border: string; shadow: string; text: string }> = {
  'Tank': { border: 'border-blue-500/60', shadow: 'shadow-blue-500/30', text: 'text-blue-400' },
  'Fighter': { border: 'border-orange-500/60', shadow: 'shadow-orange-500/30', text: 'text-orange-400' },
  'Assassin': { border: 'border-purple-500/60', shadow: 'shadow-purple-500/30', text: 'text-purple-400' },
  'Mage': { border: 'border-cyan-500/60', shadow: 'shadow-cyan-500/30', text: 'text-cyan-400' },
  'Marksman': { border: 'border-yellow-500/60', shadow: 'shadow-yellow-500/30', text: 'text-yellow-400' },
  'Support': { border: 'border-green-500/60', shadow: 'shadow-green-500/30', text: 'text-green-400' },
};

// Damage type based on role
const PHYSICAL_ROLES = ['Tank', 'Fighter', 'Assassin', 'Marksman'];

export function HeroCard({ hero }: HeroCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

  const lanes = hero.lanes && hero.lanes.length > 0 ? hero.lanes : [hero.lane];
  const roleGlow = ROLE_GLOW[hero.role] || ROLE_GLOW['Fighter'];
  const skills = hero.skill?.slice(0, 4) || [];
  const isPhysical = PHYSICAL_ROLES.includes(hero.role);

  // Use cardImage (smallmap full body art) for watermark, fallback to icon
  const bestSkin = hero.skins && hero.skins.length > 0 ? hero.skins[0] : null;
  const watermarkImage = bestSkin?.skinImage || bestSkin?.skinCover || hero.cardImage || hero.icon;
  const cardBg = hero.cardImage || hero.icon;

  // Handle card flip on mobile - only flip, don't navigate
  const handleCardClick = (e: React.MouseEvent) => {
    if (isTouchDevice && !isFlipped) {
      e.preventDefault();
      e.stopPropagation();
      setIsFlipped(true);
    }
  };

  return (
    <div className="group block perspective-1000">
      <div
        className={`relative w-full aspect-[3/4] transform-style-3d transition-transform duration-700 ease-out ${
          isFlipped ? 'rotate-y-180' : ''
        } md:group-hover:rotate-y-180`}
      >
        {/* Front Side */}
        <div className="absolute inset-0 backface-hidden" onClick={handleCardClick}>
          <Link
            to="/heroes/$heroId"
            params={{ heroId: hero.heroId.toString() }}
            className="block h-full"
            onClick={(e) => {
              // On mobile, first tap flips the card - prevent navigation
              if (isTouchDevice) {
                e.preventDefault();
              }
            }}
          >
            <div className="relative h-full overflow-hidden rounded-2xl bg-dark-300/50 border border-white/10 transition-all duration-300">
              {/* Hero Image */}
              <div className="relative h-full overflow-hidden">
                <img
                  src={cardBg}
                  alt={hero.name}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-400 via-dark-400/30 to-transparent" />

                {/* Specialty Badge */}
                {hero.speciality?.[0] && (
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-sm border ${SPECIALTY_COLOR[hero.speciality[0]] || 'text-gray-400 border-white/20 bg-dark-400/80'}`}>
                      {hero.speciality[0]}
                    </span>
                  </div>
                )}

                {/* Tap hint for mobile */}
                <div className="md:hidden absolute top-3 left-3">
                  <span className="px-2 py-1 rounded-lg text-[10px] font-medium bg-dark-400/80 backdrop-blur-sm border border-white/10 text-gray-400">
                    Ketuk
                  </span>
                </div>

                {/* Hero Info - Overlaid at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-bold text-white text-lg leading-tight drop-shadow-lg">
                    {hero.name}
                  </h3>
                  <p className={`text-sm font-medium mt-1 ${roleGlow.text}`}>
                    {hero.role}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Back Side - TCG Style */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <Link
            to="/heroes/$heroId"
            params={{ heroId: hero.heroId.toString() }}
            className="block w-full h-full"
          >
            <div className={`relative w-full h-full overflow-hidden rounded-2xl border-2 ${roleGlow.border} shadow-lg ${roleGlow.shadow} transition-shadow duration-300 bg-dark-400`}>
              {/* Skin/Hero Watermark Background - Larger & More Visible */}
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={watermarkImage}
                  alt=""
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] object-cover grayscale opacity-[0.35] blur-[1px]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-dark-400/60 via-dark-400/70 to-dark-400/80" />
              </div>

              {/* TCG Inner Frame */}
              <div className="absolute inset-2 border border-amber-500/30 rounded-xl pointer-events-none" />

              {/* Content */}
              <div className="relative h-full p-3 flex flex-col">
                {/* Header with Mini Avatar */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${roleGlow.border} shadow-md ${roleGlow.shadow}`}>
                    <img
                      src={hero.icon}
                      alt={hero.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-base truncate drop-shadow-md">{hero.name}</h3>
                    <div className="flex items-center gap-1.5">
                      {/* Damage Type Icon */}
                      {isPhysical ? (
                        <Sword className="w-3.5 h-3.5 text-orange-400" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      <p className={`text-xs font-semibold ${roleGlow.text}`}>{hero.role}</p>
                    </div>
                  </div>
                  {hero.speciality?.[1] && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${SPECIALTY_COLOR[hero.speciality[1]] || 'text-gray-400 border-white/20 bg-dark-400/80'}`}>
                      {hero.speciality[1]}
                    </span>
                  )}
                </div>

                {/* Lanes Section */}
                <div className="mb-3">
                  <p className="text-[9px] text-amber-400/80 uppercase tracking-widest font-semibold mb-1.5">Lanes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lanes.map((lane) => (
                      <div
                        key={lane}
                        className="flex items-center gap-1.5 px-2 py-1 bg-dark-400/70 rounded-lg border border-white/15"
                      >
                        {LANE_ICONS[lane] && (
                          <img
                            src={LANE_ICONS[lane]}
                            alt={lane}
                            className="w-4 h-4 object-contain"
                          />
                        )}
                        <span className="text-[10px] text-white font-medium">
                          {formatLane(lane)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills Section */}
                {skills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[9px] text-amber-400/80 uppercase tracking-widest font-semibold mb-1.5">Skills</p>
                    <div className="flex gap-1.5">
                      {skills.map((skill, index) => (
                        <div
                          key={index}
                          className="w-9 h-9 rounded-lg overflow-hidden border border-white/25 bg-dark-400/60 shadow-sm"
                          title={skill.skillName}
                        >
                          {skill.skillImg ? (
                            <img
                              src={skill.skillImg}
                              alt={skill.skillName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-medium">
                              {index === 0 ? 'P' : index}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Stats Section - TCG Style (hidden on mobile) */}
                <div className="hidden md:block border-t border-amber-500/30 pt-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-dark-400/60 rounded-lg border border-green-500/30">
                      <span className="text-green-400 font-bold text-sm block">{hero.stats.winRate}</span>
                      <p className="text-[8px] text-green-500/80 uppercase tracking-wider font-medium">Win</p>
                    </div>
                    <div className="text-center p-2 bg-dark-400/60 rounded-lg border border-blue-500/30">
                      <span className="text-blue-400 font-bold text-sm block">{hero.stats.pickRate}</span>
                      <p className="text-[8px] text-blue-500/80 uppercase tracking-wider font-medium">Pick</p>
                    </div>
                    <div className="text-center p-2 bg-dark-400/60 rounded-lg border border-red-500/30">
                      <span className="text-red-400 font-bold text-sm block">{hero.stats.banRate}</span>
                      <p className="text-[8px] text-red-500/80 uppercase tracking-wider font-medium">Ban</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

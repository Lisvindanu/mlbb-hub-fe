import { User, Lock, FileText, List, Trophy } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '../hooks/useUser';
import { Loading } from '../components/ui/Loading';
import { ProfileSection } from '../components/dashboard/ProfileSection';
import { StatsSection } from '../components/dashboard/StatsSection';
import { PasswordSection } from '../components/dashboard/PasswordSection';
import { ContributionsSection } from '../components/dashboard/ContributionsSection';
import { TierListsSection } from '../components/dashboard/TierListsSection';
import { TournamentsSection } from '../components/dashboard/TournamentsSection';

type ActiveSection = 'profile' | 'password' | 'contributions' | 'tierlists' | 'tournaments';

export function DashboardPage() {
  const { data: user, isLoading } = useUser();
  const [activeSection, setActiveSection] = useState<ActiveSection>('profile');

  if (isLoading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-400">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-20 md:pt-28 pb-12">
          <div className="text-center text-gray-400">Pengguna tidak ditemukan</div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'profile' as const, label: 'Profil', icon: User },
    { id: 'password' as const, label: 'Ganti Password', icon: Lock },
    { id: 'contributions' as const, label: 'Kontribusi Saya', icon: FileText },
    { id: 'tierlists' as const, label: 'Tier List Saya', icon: List },
    { id: 'tournaments' as const, label: 'Turnamen Saya', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-dark-400">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-20 md:pt-28 pb-12">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-primary-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-lg md:text-2xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold mb-0.5 md:mb-1">Dashboard</h1>
            <p className="text-sm md:text-base text-gray-400">Selamat datang kembali, {user.name}!</p>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsSection user={user} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Sidebar Menu */}
        <div className="lg:col-span-1">
          <div className="card-hover p-3 md:p-4">
            <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex-shrink-0 lg:w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg text-sm transition-all ${
                    activeSection === item.id
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-dark-50'
                  }`}
                >
                  <item.icon className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="font-medium whitespace-nowrap">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="card-hover p-4 md:p-6">
            {activeSection === 'profile' && <ProfileSection user={user} />}
            {activeSection === 'password' && <PasswordSection />}
            {activeSection === 'contributions' && <ContributionsSection />}
            {activeSection === 'tierlists' && <TierListsSection />}
            {activeSection === 'tournaments' && <TournamentsSection />}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

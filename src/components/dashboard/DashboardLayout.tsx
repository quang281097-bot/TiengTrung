import {
  dailyChinese,
  dailyGoals,
  footerLinks,
  learningPath,
  quickLearningCards,
  sidebarItems,
  statCards,
  continueLesson,
  mobileNavItems,
} from '../../data/dashboardData';
import ContinueLearningCard from './ContinueLearningCard';
import DailyChineseCard from './DailyChineseCard';
import DailyGoal from './DailyGoal';
import Footer from './Footer';
import LearningPath from './LearningPath';
import MobileBottomNav from './MobileBottomNav';
import QuickLearningCard from './QuickLearningCard';
import Sidebar from './Sidebar';
import StatsCard from './StatsCard';
import TopHeader from './TopHeader';
import WelcomeSection from './WelcomeSection';

export default function DashboardLayout() {
  return (
    <div className="dashboard-shell">
      <Sidebar items={sidebarItems} />

      <div className="dashboard-main">
        <TopHeader />

        <main className="dashboard-content">
          <WelcomeSection />

          <section className="stats-grid" aria-label="Learning stats">
            {statCards.map((card) => (
              <StatsCard key={card.id} card={card} />
            ))}
          </section>

          <section className="content-grid">
            <ContinueLearningCard lesson={continueLesson} />
            <DailyGoal goals={dailyGoals} />
          </section>

          <section className="path-grid">
            <LearningPath items={learningPath} />
            <div className="stacked-column">
              <QuickLearningCard cards={quickLearningCards} />
            </div>
          </section>

          <DailyChineseCard item={dailyChinese} />
        </main>

        <Footer links={footerLinks} />
      </div>

      <MobileBottomNav items={mobileNavItems} />
    </div>
  );
}

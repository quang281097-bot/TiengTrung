import HomeDashboard from '../../components/dashboard/HomeDashboard';

export const metadata = { title: 'Trang chủ' };
// Số liệu đọc từ database nên không prerender lúc build.
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return <HomeDashboard />;
}

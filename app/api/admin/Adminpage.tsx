import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AdminPanel from '@/components/admin/AdminPanel';

export const metadata = { title: 'Admin — StudyCards' };

export default async function AdminPage() {
  const user = await getCurrentUser();
  const adminUsername = process.env.ADMIN_USERNAME;

  if (!user || !adminUsername || user.username !== adminUsername) {
    redirect('/study');
  }

  return <AdminPanel username={user.username} />;
}
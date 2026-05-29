import { useState } from 'react';
import type { ComponentType } from 'react';
import {
  LayoutDashboard,
  Users,
  Scale,
  Calendar,
  MessageSquare,
  Flag,
  FileText,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { AnalyticsOverview } from '@/components/admin/AnalyticsOverview';
import { AdminUsersPanel } from '@/components/admin/AdminUsersPanel';
import { AdminLawyersPanel } from '@/components/admin/AdminLawyersPanel';
import { AdminAppointmentsPanel } from '@/components/admin/AdminAppointmentsPanel';
import { AdminForumPanel } from '@/components/admin/AdminForumPanel';
import { AdminReportsPanel } from '@/components/admin/AdminReportsPanel';
import { AdminDocumentsPanel } from '@/components/admin/AdminDocumentsPanel';

type AdminTab =
  | 'overview'
  | 'users'
  | 'lawyers'
  | 'appointments'
  | 'forum'
  | 'reports'
  | 'documents';

const tabs: { id: AdminTab; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'lawyers', label: 'Lawyers', icon: Scale },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'forum', label: 'Forum', icon: MessageSquare },
  { id: 'reports', label: 'Reports', icon: Flag },
  { id: 'documents', label: 'Documents', icon: FileText },
];

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>('overview');

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="Platform moderation, verification, and analytics"
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(t.id)}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </Button>
        ))}
      </div>

      {tab === 'overview' && <AnalyticsOverview />}
      {tab === 'users' && <AdminUsersPanel />}
      {tab === 'lawyers' && <AdminLawyersPanel />}
      {tab === 'appointments' && <AdminAppointmentsPanel />}
      {tab === 'forum' && <AdminForumPanel />}
      {tab === 'reports' && <AdminReportsPanel />}
      {tab === 'documents' && <AdminDocumentsPanel />}
    </DashboardLayout>
  );
}

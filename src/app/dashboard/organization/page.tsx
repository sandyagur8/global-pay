'use client';

import { RouteGuard } from '@/components/route-guard';
import { EmployerDashboard } from '@/components/employer-dashboard';

function OrganizationDashboardContent() {
  return <EmployerDashboard />;
}

export default function OrganizationDashboard() {
  // Temporarily remove route guard for testing
  return <OrganizationDashboardContent />;
}
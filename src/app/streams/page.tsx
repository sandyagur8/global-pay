'use client';

import { RouteGuard } from '@/components/route-guard';
import { EmployeeDashboard } from '@/components/employee-dashboard';

function StreamsContent() {
  return <EmployeeDashboard />;
}

export default function Streams() {
  // Temporarily remove route guard for testing
  return <StreamsContent />;
}
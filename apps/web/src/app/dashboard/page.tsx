import { AppShell } from "@/components/layout/app-shell";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { ProtectedPage } from "@/components/layout/protected-page";
import { getBlogPosts } from "@/lib/blog";

export default function DashboardPage() {
  let blogPosts: ReturnType<typeof getBlogPosts> = [];
  try {
    blogPosts = getBlogPosts();
  } catch {
    // Blog content not available at build time, dashboard handles empty state
  }

  return (
    <ProtectedPage>
      <AppShell>
        <DashboardClient initialBlogs={blogPosts} />
      </AppShell>
    </ProtectedPage>
  );
}

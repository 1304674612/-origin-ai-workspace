import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@origin/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@origin/ui/components/card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { getBlogPosts } from "@/lib/blog";

export default function BlogPage() {
  const posts = getBlogPosts();
  return (
    <AppShell>
      <div className="min-h-screen px-5 py-8 md:px-10">
        <PageHeader
          eyebrow="Blog"
          title="Engineering notes"
          description="Roadmaps, architecture decisions, deployment notes, and product thinking for the ORIGIN AI Workspace project."
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
              <Card className="h-full transition hover:border-cyan-300/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-cyan-300/5">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <Badge variant="secondary" className="transition group-hover:bg-cyan-300/10 group-hover:text-cyan-200">{post.category}</Badge>
                    <ArrowUpRight className="h-4 w-4 text-zinc-500 transition group-hover:text-cyan-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <CardTitle className="text-xl transition group-hover:text-cyan-100">{post.title}</CardTitle>
                  <CardDescription>{post.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="default" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                  <p className="mt-5 text-sm text-zinc-500">
                    {post.date} · {post.readingMinutes} min read
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

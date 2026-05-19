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
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="h-full transition hover:border-cyan-300/30 hover:bg-white/[0.055]">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <Badge variant="secondary">{post.category}</Badge>
                    <ArrowUpRight className="h-4 w-4 text-zinc-500" />
                  </div>
                  <CardTitle className="text-xl">{post.title}</CardTitle>
                  <CardDescription>{post.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
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

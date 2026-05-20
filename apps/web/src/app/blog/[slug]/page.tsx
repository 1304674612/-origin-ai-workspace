import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@origin/ui/components/badge";
import { Button } from "@origin/ui/components/button";
import { AppShell } from "@/components/layout/app-shell";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { MarkdownContent } from "@/components/chat/markdown-content";
import { getBlogPost, getBlogPosts } from "@/lib/blog";

export function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post;
  try {
    post = getBlogPost(slug);
  } catch {
    notFound();
  }

  return (
    <AppShell>
      <ReadingProgress />
      <article className="mx-auto min-h-screen max-w-4xl px-5 py-10 md:px-10">
        <Button asChild variant="ghost" size="sm">
          <Link href="/blog">Back to blog</Link>
        </Button>
        <div className="mt-8">
          <Badge variant="secondary">{post.category}</Badge>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-white md:text-5xl">{post.title}</h1>
          <p className="mt-5 text-lg leading-8 text-zinc-400">{post.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readingMinutes} min read</span>
            {post.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </div>
        <div className="mt-10">
          <MarkdownContent content={post.content} />
        </div>
      </article>
    </AppShell>
  );
}

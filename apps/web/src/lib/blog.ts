import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  category: string;
  content: string;
  readingMinutes: number;
};

export function getBlogPosts(): BlogPost[] {
  const files = fs.existsSync(BLOG_DIR) ? fs.readdirSync(BLOG_DIR) : [];
  return files
    .filter((file) => file.endsWith(".md"))
    .map((file) => getBlogPost(file.replace(/\.md$/, "")))
    .sort((a, b) => Number(new Date(b.date)) - Number(new Date(a.date)));
}

export function getBlogPost(slug: string): BlogPost {
  const fullPath = path.join(BLOG_DIR, `${slug}.md`);
  const source = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(source);
  return {
    slug,
    title: data.title,
    description: data.description,
    date: data.date,
    tags: data.tags ?? [],
    category: data.category ?? "Engineering",
    content,
    readingMinutes: Math.max(1, Math.ceil(content.split(/\s+/).length / 220))
  };
}

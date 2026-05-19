import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <div className="absolute left-6 top-6">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">ORIGIN AI</Link>
      </div>
      <AuthForm mode="login" />
    </main>
  );
}

import { Badge } from "@origin/ui/components/badge";

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        <Badge variant="secondary">{eyebrow}</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal text-white md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">{description}</p>
      </div>
      {action}
    </div>
  );
}

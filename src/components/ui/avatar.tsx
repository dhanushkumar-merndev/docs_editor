import { initials } from "@/lib/utils";
import Image from "next/image";

export function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return <Image src={src} alt="" width={36} height={36} className="size-9 rounded-full object-cover" />;
  }
  return (
    <div className="grid size-9 place-items-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
      {initials(name)}
    </div>
  );
}

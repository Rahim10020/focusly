import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "./constants/routes";

export default function AppLogo() {
  return (
    <Link
      href={ROUTES.HOME}
      className="flex items-center gap-3 group transition-all"
    >
      <div className="relative">
        <Image
          src="/apple-touch-icon.png"
          alt="Focusly Logo"
          width={36}
          height={36}
          className="w-9 h-9 rounded-full ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
        />
      </div>
      <h1 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
        Focusly
      </h1>
    </Link>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export type AppLogoProps = {
  iconSize: number;
  md?: boolean;
};

export default function AppLogo(props: AppLogoProps) {
  const { iconSize, md } = props;
  const baseStyles =
    "text-foreground font-medium hover:text-primary transition-colors ";
  const mdStyles = md ? "text-md" : "text-lg";
  const resultStyles = [baseStyles, mdStyles].filter(Boolean).join(" ");
  return (
    <Link
      href={ROUTES.HOME}
      className="flex items-center gap-2 group transition-all"
    >
      <div className="relative">
        <Image
          src="/apple-touch-icon.png"
          alt="Focusly Logo"
          width={iconSize}
          height={iconSize}
        />
      </div>
      <h1 className={resultStyles}>Focusly</h1>
    </Link>
  );
}

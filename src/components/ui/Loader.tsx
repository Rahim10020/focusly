import { LoadingIcon } from "../icons";

export function Loader() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base font-medium">Loading</span>
      <LoadingIcon
        className="mx-auto loading-icon-swing"
        size={32}
        color="var(--color-primary)"
      />
    </div>
  );
}

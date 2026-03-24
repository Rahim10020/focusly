import { LoadingIcon } from "../icons";

export type LoaderProps = {
  label: string;
};

export function Loader(props: LoaderProps) {
  const { label = "Loading" } = props;
  return (
    <div className="flex items-center gap-2">
      <span className="text-base font-medium">{label}</span>
      <LoadingIcon
        className="mx-auto loading-icon-swing"
        size={32}
        color="var(--color-primary)"
      />
    </div>
  );
}

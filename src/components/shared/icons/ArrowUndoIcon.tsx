import type { IconProps } from "./types";

const ArrowUndoIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M7 11L3 15M3 15L7 19M3 15H16C18.7614 15 21 12.7614 21 10C21 7.23858 18.7614 5 16 5H11"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ArrowUndoIcon;

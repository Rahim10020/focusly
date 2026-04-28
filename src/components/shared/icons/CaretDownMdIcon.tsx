import type { IconProps } from "./types";

const CaretDownMdIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 1,
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
      d="M16 10L12 14L8 10"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default CaretDownMdIcon;

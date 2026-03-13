import * as React from "react";

import type { IconProps } from "./types";

const SwichtRightIcon = ({
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
      d="M8 18H16C19.3137 18 22 15.3137 22 12C22 8.68629 19.3137 6 16 6H8C4.68629 6 2 8.68629 2 12C2 15.3137 4.68629 18 8 18Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 9C14.3431 9 13 10.3431 13 12C13 13.6569 14.3431 15 16 15C17.6569 15 19 13.6569 19 12C19 10.3431 17.6569 9 16 9Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default SwichtRightIcon;

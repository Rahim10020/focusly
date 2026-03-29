/**
 * @fileoverview Timer settings button component
 */

"use client";

import Link from "next/link";
import { ROUTES } from "@/constants";
import SettingsIcon from "../../shared/icons/SettingsIcon";

export function TimerSettingsButton() {
  return (
    <Link href={ROUTES.SETTINGS}>
      <button
        className="p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
        title="Timer Settings"
      >
        <SettingsIcon size={16} className="text-muted-foreground" />
      </button>
    </Link>
  );
}

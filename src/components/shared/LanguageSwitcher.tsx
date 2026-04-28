import { CaretDownMdIcon, GlobeIcon } from "./icons";

export default function LanguageSwitcher() {
  return (
    <div className="flex items-center text-black-50 gap-1">
      <GlobeIcon size={16} />
      <div className="flex items-center cursor-pointer">
        <span className="text-xs">English(USA)</span>
        <CaretDownMdIcon size={24} />
      </div>
    </div>
  );
}

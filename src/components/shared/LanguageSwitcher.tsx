import { CaretDownMdIcon, GlobeIcon } from "./icons";

export default function LanguageSwitcher() {
  return (
    <div className="flex items-center text-black-50 gap-2">
      <GlobeIcon size={18} />
      <div className="flex items-center cursor-pointer">
        <span className="text-sm font-normal">English(EN)</span>
        <CaretDownMdIcon />
      </div>
    </div>
  );
}

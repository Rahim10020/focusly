import { CaretDownMdIcon, GlobeIcon } from "./icons";

export default function LanguageSwitcher() {
  return (
    <div className="flex items-center text-black-50">
      <GlobeIcon size={18} />
      <span className="text-sm font-normal ml-2">English(EN)</span>
      <CaretDownMdIcon />
    </div>
  );
}

import { MyLoader } from "@/components/ui/MyLoader";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <MyLoader label="Loading" />
    </div>
  );
}

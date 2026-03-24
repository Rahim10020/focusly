import { Loader } from "@/components/ui/Loader";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader label="Loading" />
    </div>
  );
}

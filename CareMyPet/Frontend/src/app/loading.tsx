import { Loader } from "@/components/ui/Loader";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex items-center justify-center">
        <Loader label="Loading..." />
      </div>
    </div>
  );
}


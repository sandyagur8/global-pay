import { Loader } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader className="h-12 w-12 animate-spin" />
    </div>
  );
}

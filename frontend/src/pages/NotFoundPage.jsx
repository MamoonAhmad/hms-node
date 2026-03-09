import { useNavigate } from "react-router-dom";
import { Home, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileQuestion className="h-12 w-12" />
        </div>
        <h1 className="text-6xl font-bold tabular-nums text-primary">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved. Check the
          URL or go back to the dashboard.
        </p>
        <Button
          onClick={() => navigate("/")}
          className="mt-8 gap-2"
        >
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

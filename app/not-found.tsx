import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          404
        </h1>
        <p className="text-slate-500 mb-6">Page not found</p>
        <Link href="/">
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

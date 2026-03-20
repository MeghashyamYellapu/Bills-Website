import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md mx-4 shadow-xl border-0 bg-white">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 text-red-500 font-bold text-xl items-center justify-center">
            <AlertCircle className="h-8 w-8" />
            <h1>404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-center text-gray-600">
            The page you requested could not be found.
          </p>
          
          <div className="mt-8 flex justify-center">
            <Link 
              href="/"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

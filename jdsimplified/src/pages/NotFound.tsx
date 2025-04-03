
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import PageLayout from "@/components/PageLayout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <PageLayout>
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-lg">
          <h1 className="text-8xl font-bold text-jdorange mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Page Not Found</h2>
          <p className="text-xl text-gray-600 mb-8">
            Oops! The page you're looking for doesn't seem to exist. It might have been moved or deleted.
          </p>
          <Link 
            to="/" 
            className="btn-primary inline-block"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </PageLayout>
  );
};

export default NotFound;

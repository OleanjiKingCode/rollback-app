import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
          <div className="mb-2 sm:mb-0">
            © {new Date().getFullYear()} Rollback. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <Link
              to="https://rollback-labs.gitbook.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-rollback-primary transition-colors"
            >
              Documentation
            </Link>
            <Link
              to="https://x.com/rollbacklabs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-rollback-primary transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

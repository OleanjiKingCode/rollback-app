
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-rollback-cream bg-rollback-cream/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-rollback-dark">Rollback</h3>
            <p className="text-sm text-rollback-brown">
              Never Lose Access to Your Crypto Again
            </p>
            <p className="text-xs text-rollback-brown">
              Rollback provides automatic safety nets for cryptocurrency assets, 
              ensuring accessibility during unexpected events.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-rollback-dark">Product</h4>
            <div className="space-y-2">
              <Link href="/dashboard" className="block text-sm text-rollback-brown hover:text-rollback-dark">
                Dashboard
              </Link>
              <Link href="/create" className="block text-sm text-rollback-brown hover:text-rollback-dark">
                Create Wallet
              </Link>
              <Link href="/governance" className="block text-sm text-rollback-brown hover:text-rollback-dark">
                Governance
              </Link>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-rollback-dark">Resources</h4>
            <div className="space-y-2">
              <Link href="/docs" className="block text-sm text-rollback-brown hover:text-rollback-dark">
                Documentation
              </Link>
              <Link href="/support" className="block text-sm text-rollback-brown hover:text-rollback-dark">
                Support
              </Link>
              <Link href="/security" className="block text-sm text-rollback-brown hover:text-rollback-dark">
                Security
              </Link>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-rollback-dark">Connect</h4>
            <div className="space-y-2">
              <Link href="#" className="block text-sm text-rollback-brown hover:text-rollback-dark">
                Twitter
              </Link>
              <Link href="#" className="block text-sm text-rollback-brown hover:text-rollback-dark">
                Discord
              </Link>
              <Link href="#" className="block text-sm text-rollback-brown hover:text-rollback-dark">
                GitHub
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-rollback-light">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-rollback-brown">
              © 2024 Rollback. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-sm text-rollback-brown hover:text-rollback-dark">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-rollback-brown hover:text-rollback-dark">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

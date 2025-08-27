
import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
      <p className="text-xs text-muted-foreground">
        &copy; 2025 Asra AI. All rights reserved.
      </p>
      <div className="sm:ml-auto flex items-center gap-4 sm:gap-6">
        <p className="text-xs text-muted-foreground">
            Designed by Zenova <br /> (Taimiya Amjad)
        </p>
        <nav className="flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}

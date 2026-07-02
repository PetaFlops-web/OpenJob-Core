import Link from "next/link"

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-border-slate bg-bg-surface py-8">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
        <Link href="/" className="text-2xl font-semibold text-primary">
          OpenJob
        </Link>
        <nav className="flex items-center gap-6 text-xs leading-[1.4]">
          <Link href="/about" className="text-on-surface-variant transition-colors hover:text-secondary">
            About
          </Link>
          <Link href="/contact" className="text-on-surface-variant transition-colors hover:text-secondary">
            Kontak
          </Link>
        </nav>
        <div className="text-xs leading-[1.4] text-on-surface-variant">
          © 2024 OpenJob Indonesia. Hak Cipta Dilindungi.
        </div>
      </div>
    </footer>
  )
}

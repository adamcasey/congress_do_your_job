import Link from "next/link";
import Image from "next/image";
import { NavLinks } from "./NavLinks";
import { freePressFont } from "@/styles/fonts";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b-2 border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow">
            <Image
              src="/logos/figma/figma_logo_light.svg"
              alt="Congress Do Your Job"
              width={28}
              height={28}
              unoptimized
            />
          </div>
          <span className={`${freePressFont.className} hidden text-lg font-semibold text-slate-900 sm:block`}>
            Congress Do Your Job
          </span>
        </Link>

        <NavLinks />
      </div>
    </nav>
  );
}

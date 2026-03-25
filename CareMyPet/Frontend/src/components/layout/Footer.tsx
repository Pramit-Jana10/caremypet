import Link from "next/link";
import { APP_NAME, ROUTES } from "@/utils/constants";

export function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-10 w-10 rounded-xl bg-white bg-[url('/brand/logo.png')] bg-cover bg-center shadow-soft"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold text-ink-900">{APP_NAME}</p>
            </div>
            <p className="mt-2 text-sm text-ink-700">
              A clean, modern platform for pet accessories and healthcare management.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">Explore</p>
            <div className="mt-2 grid gap-2 text-sm">
              <Link className="text-ink-700 hover:text-ink-900" href={ROUTES.shop}>
                Shop
              </Link>
              <Link className="text-ink-700 hover:text-ink-900" href={ROUTES.vets}>
                Vets
              </Link>
              <Link className="text-ink-700 hover:text-ink-900" href={ROUTES.vaccinations}>
                Vaccinations
              </Link>
              <Link className="text-ink-700 hover:text-ink-900" href={ROUTES.medicines}>
                Medicines
              </Link>
              <Link className="text-ink-700 hover:text-ink-900" href={ROUTES.contact}>
                Contact Us
              </Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">Account</p>
            <div className="mt-2 grid gap-2 text-sm">
              <Link className="text-ink-700 hover:text-ink-900" href={ROUTES.dashboard}>
                Dashboard
              </Link>
              <Link className="text-ink-700 hover:text-ink-900" href={ROUTES.profile}>
                Profile
              </Link>
              <Link className="text-ink-700 hover:text-ink-900" href={ROUTES.cart}>
                Cart
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-ink-100 pt-6 text-xs text-ink-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <p>CareMyPet – Pet Accessories & Healthcare Platform.</p>
        </div>
      </div>
    </footer>
  );
}


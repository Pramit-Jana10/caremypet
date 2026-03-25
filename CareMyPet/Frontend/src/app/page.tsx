import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="bg-gradient-to-b from-white to-ink-50 dark:from-ink-100 dark:to-ink-50">
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-800">
              CareMyPet Platform
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink-900 md:text-5xl">
              Pet accessories, medicines, vaccines, and vet care — all in one place.
            </h1>
            <p className="mt-4 text-lg text-ink-700">
              A modern platform to shop essentials, find vets, track vaccinations, and get AI help —
              designed for busy pet parents.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/shop">Shop Now</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/vets">View Vets</Link>
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 rounded-2xl bg-white p-4 shadow-soft dark:bg-ink-100">
              <div>
                <p className="text-sm text-ink-600">Orders</p>
                <p className="text-2xl font-semibold text-ink-900">Fast</p>
              </div>
              <div>
                <p className="text-sm text-ink-600">Vets</p>
                <p className="text-2xl font-semibold text-ink-900">Verified</p>
              </div>
              <div>
                <p className="text-sm text-ink-600">Tracking</p>
                <p className="text-2xl font-semibold text-ink-900">Simple</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-soft dark:bg-ink-100">
            <div className="rounded-2xl bg-gradient-to-br from-brand-100 via-white to-sky-100 p-6 dark:from-ink-200 dark:via-ink-100 dark:to-ink-200">
              <h2 className="text-lg font-semibold text-ink-900">How it works</h2>
              <ol className="mt-4 space-y-3 text-ink-700">
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                    1
                  </span>
                  Browse accessories, medicines, and vaccine plans.
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                    2
                  </span>
                  Find vets and view their details.
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                    3
                  </span>
                  Track upcoming vaccines and get reminders.
                </li>
              </ol>
              <div className="mt-6 rounded-xl bg-white/80 p-4 dark:bg-ink-100/90">
                <p className="text-sm font-medium text-ink-900">Testimonials</p>
                <p className="mt-2 text-sm text-ink-700">
                  “Finally, one place for my dog’s meds, food, and vet info. The vaccination calendar is a lifesaver.”
                </p>
                <p className="mt-3 text-xs text-ink-600">— Priya, Pet Parent</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard title="Marketplace" desc="Shop accessories with filters, reviews, and fast checkout." />
          <FeatureCard title="Vet Directory" desc="Find vets by specialization and view their profiles." />
          <FeatureCard title="Vaccination Tracker" desc="Create pet profiles and never miss a vaccine." />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-soft dark:bg-ink-100">
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm text-ink-700">{desc}</p>
    </div>
  );
}


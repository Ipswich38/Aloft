import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/site-config";
import { LinkButton } from "@/components/ui";
import { SendIcon, ShieldIcon, ClockIcon, PinIcon } from "@/components/icons";

export default function Home() {
  return (
    <main className="flex-1">
      {/* Nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Image src="/icons/icon.svg" alt="" width={36} height={36} className="rounded-xl" />
          <span className="text-lg font-bold tracking-tight text-ink">{siteConfig.name}</span>
        </div>
        <nav className="flex items-center gap-1.5">
          <Link
            href="/login"
            className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink-soft transition hover:text-ink"
          >
            Sign in
          </Link>
          <LinkButton href="/signup" size="sm">
            Get started
          </LinkButton>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 pt-12 pb-10 text-center sm:pt-20">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft shadow-[var(--shadow-card)]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Like an Uber — but it flies
        </span>
        <h1 className="mx-auto mt-6 max-w-2xl text-balance text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-6xl">
          Send anything across the islands in minutes.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-pretty text-lg text-ink-soft">
          Tap to send medicine, documents, or supplies by drone — to places roads can&apos;t
          reach fast. Simple, tracked, and cleared for every flight.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <LinkButton href="/signup" size="lg" className="w-full sm:w-auto">
            <SendIcon size={20} />
            Send a package
          </LinkButton>
          <LinkButton href="/operator" variant="secondary" size="lg" className="w-full sm:w-auto">
            I&apos;m an operator
          </LinkButton>
        </div>
        <p className="mt-4 text-xs text-muted">Installs like an app — add to your home screen.</p>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <div className="grid gap-3 sm:grid-cols-3">
          <Feature
            icon={<ClockIcon size={22} />}
            title="Minutes, not hours"
            body="A drone flies straight over water and mountains — no traffic, no ferries."
          />
          <Feature
            icon={<PinIcon size={22} />}
            title="Door to drop-site"
            body="Pick a route, we handle the rest — winch, locker, or landing pad."
          />
          <Feature
            icon={<ShieldIcon size={22} />}
            title="Cleared to fly"
            body="Every flight passes a CAAP safety check before it ever leaves the pad."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-center text-2xl font-bold tracking-tight text-ink">Three taps to send</h2>
          <div className="mx-auto mt-10 grid max-w-3xl gap-8 sm:grid-cols-3">
            <Step n="1" title="Tell us what & where" />
            <Step n="2" title="See the price & confirm" />
            <Step n="3" title="Track it to landing" />
          </div>
        </div>
      </section>

      <footer className="px-5 py-10 text-center text-sm text-muted">
        {siteConfig.name} — built for the Philippines 🇵🇭
      </footer>
    </main>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm text-ink-soft">{body}</p>
    </div>
  );
}

function Step({ n, title }: { n: string; title: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink text-lg font-bold text-white">
        {n}
      </div>
      <p className="mt-3 font-semibold text-ink">{title}</p>
    </div>
  );
}

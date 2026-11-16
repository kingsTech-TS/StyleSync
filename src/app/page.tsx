"use client";

import {
  ArrowRight,
  ArrowUpRight,
  CloudSun,
  Heart,
  MessageCircle,
  ScanLine,
  Shirt,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DollStage } from "@/components/doll/doll-stage";
import { Wordmark } from "@/components/layout/brand";
import {
  BrushStroke,
  CapIllustration,
  SneakerIllustration,
  StatementHoodie,
  TeeIllustration,
  ToteIllustration,
  TrousersIllustration,
} from "@/components/marketing/illustrations";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

const OCCASIONS = ["Casual", "Corporate", "Smart casual", "Party", "Beach", "Date night", "Athleisure", "Formal", "Traditional"];

const FAQ = [
  {
    q: "Will it suggest clothes I don't own?",
    a: "No. Every outfit is built from items in your wardrobe. If a piece is missing, like a rain jacket for a wet day, it says so instead of making one up.",
  },
  {
    q: "What happens to my selfie?",
    a: "It's used once to draw your doll and then deleted, unless you choose to keep it. Only the illustrated doll is ever shown to other people.",
  },
  {
    q: "Do I have to type in every item?",
    a: "No. Take a photo and the name and color fill in for you. If something's wrong, you correct it before saving.",
  },
  {
    q: "Is it free?",
    a: "Yes. AI features have a daily allowance per person, and the app shows how much you have left.",
  },
];

export default function Landing() {
  const { status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === "authenticated") router.replace("/feed");
  }, [status, router]);

  return (
    <div className="min-h-dvh overflow-x-clip p-2.5 sm:p-5">
      <Hero />
      <OccasionMarquee />
      <HowItWorks />
      <Features />
      <OurPromise />
      <Faq />
      <FinalCta />
      <footer className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted sm:flex-row">
        <Wordmark className="text-xl" />
        <nav className="flex gap-6">
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#features" className="hover:text-ink">Features</a>
          <a href="#faq" className="hover:text-ink">FAQ</a>
          <Link href="/login" className="hover:text-ink">Log in</Link>
        </nav>
      </footer>
    </div>
  );
}

/* ---------------- hero ---------------- */

function Hero() {
  return (
    <section className="mx-auto max-w-[1240px] rounded-[36px] bg-surface px-4 pt-4 pb-4 shadow-[0_30px_80px_-40px_rgb(120_40_35/0.35)] sm:px-7 sm:pt-6 sm:pb-7">
      <header className="relative flex items-center justify-between">
        <nav className="hidden items-center gap-6 text-[13px] font-medium md:flex">
          <a href="#how" className="hover:text-accent">How it works</a>
          <a href="#features" className="hover:text-accent">Features</a>
          <a href="#occasions" className="hover:text-accent">Occasions</a>
          <a href="#faq" className="hover:text-accent">FAQ</a>
        </nav>
        <Wordmark className="md:absolute md:left-1/2 md:-translate-x-1/2" />
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden h-9 items-center rounded-full px-4 text-[13px] font-medium hover:bg-surface-2 sm:inline-flex">
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-accent/40 pr-3.5 pl-1 text-[13px] font-medium transition hover:bg-accent-soft"
          >
            <span className="grid size-7 place-items-center rounded-full bg-accent text-accent-ink">
              <Shirt className="size-3.5" />
            </span>
            Get started
          </Link>
        </div>
      </header>

      {/* headline row */}
      <div className="relative mt-8 grid items-end gap-2 sm:mt-10 md:grid-cols-2">
        <h1 className="relative z-0 flex flex-wrap items-baseline gap-x-3 leading-none">
          <span className="text-[clamp(1.6rem,3.6vw,2.6rem)] font-extrabold tracking-tight italic">Own your</span>
          <span className="font-display text-[clamp(3.4rem,8.4vw,6.6rem)] leading-[0.85]">Closet</span>
        </h1>
        <p className="relative z-0 flex flex-wrap items-baseline gap-x-3 leading-none md:justify-end" aria-hidden>
          <span className="text-[clamp(1.6rem,3.6vw,2.6rem)] font-extrabold tracking-tight italic">Wear the</span>
          <span className="font-display text-[clamp(3.4rem,8.4vw,6.6rem)] leading-[0.85]">Look</span>
        </p>
        <BrushStroke className="pointer-events-none absolute -bottom-3 left-[18%] -z-0 h-6 w-[64%] text-accent-soft" />
      </div>

      {/* coral panel */}
      <div className="relative mt-6 grid rounded-[28px] bg-accent text-white md:min-h-[480px] md:grid-cols-[1fr_1.05fr_0.9fr]">
        <PanelDecor />

        <div className="relative z-10 flex flex-col p-6 sm:p-9">
          <p className="text-[13px] font-semibold text-white/85">Your wardrobe, styled</p>
          <h2 className="mt-2 max-w-xs text-[clamp(1.7rem,3vw,2.4rem)] leading-[1.1] font-extrabold tracking-tight">
            Outfits from clothes you already own
          </h2>
          <p className="mt-4 max-w-[17rem] text-[15px] text-white/85">
            Pick an occasion. Get a full look built from your closet, worn by a doll that looks like you.
          </p>
          <Link
            href="/register"
            className="mt-7 inline-flex h-12 w-fit items-center gap-3 rounded-full bg-white pr-1.5 pl-5 text-[15px] font-semibold text-ink transition hover:gap-4"
          >
            Start styling
            <span className="grid size-9 place-items-center rounded-full bg-accent text-white">
              <ArrowRight className="size-4" />
            </span>
          </Link>
          <div className="mt-auto hidden w-fit items-center gap-3 rounded-2xl bg-white/15 p-3 pr-5 backdrop-blur md:mt-12 md:flex">
            <div className="flex -space-x-2">
              {["#1d1919", "#17a589", "#e9c46a", "#f7f2ec"].map((c) => (
                <span key={c} className="size-9 rounded-full ring-2 ring-accent" style={{ background: c }} />
              ))}
            </div>
            <p className="text-[12px] leading-tight text-white/90">
              9 occasions
              <br />8 kinds of weather
            </p>
          </div>
        </div>

        {/* the hoodie overlaps the headline above, like a cut-out */}
        <div className="relative z-10 flex justify-center md:block">
          <StatementHoodie className="float-y relative -mt-4 w-[78%] max-w-[360px] md:absolute md:-top-[130px] md:left-1/2 md:w-[108%] md:max-w-[520px] md:-translate-x-1/2" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-9 md:items-end">
          <ul className="grid grid-cols-3 gap-3 text-center text-[12px] leading-tight font-medium md:max-w-[17rem]">
            {[
              { icon: ScanLine, label: "Scans your clothes" },
              { icon: Shirt, label: "Only what you own" },
              { icon: CloudSun, label: "Reads the weather" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-2">
                <Icon className="size-5" />
                {label}
              </li>
            ))}
          </ul>
          <div className="mt-auto w-full max-w-[15rem] self-center md:self-end">
            <p className="mb-3 text-center text-[13px] font-semibold">Today&apos;s pick</p>
            <div className="rounded-[22px] bg-white p-2.5 text-ink shadow-xl">
              <div className="grid aspect-[5/4] place-items-center rounded-2xl bg-[#17a589]">
                <TeeIllustration className="w-[72%]" />
              </div>
              <p className="mt-3 text-center text-sm font-bold">Linen overshirt</p>
              <p className="text-center text-[12px] text-muted">Corporate · mild · day</p>
              <Link
                href="/register"
                className="mx-auto mt-3 mb-1 flex h-9 w-fit items-center gap-2 rounded-full border border-accent/40 pr-4 pl-1 text-[12px] font-semibold"
              >
                <span className="grid size-7 place-items-center rounded-full bg-accent text-white">
                  <Sparkles className="size-3.5" />
                </span>
                Try it on
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PanelDecor() {
  // Soft pill shapes in the background of the coral panel.
  const pills = [
    "left-[32%] top-[18%] w-40",
    "left-[28%] top-[40%] w-56",
    "left-[38%] top-[62%] w-48",
    "left-[30%] top-[82%] w-60",
    "left-[58%] top-[30%] w-36",
    "left-[60%] top-[72%] w-40",
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden rounded-[28px] md:block">
      {pills.map((p) => (
        <span key={p} className={cn("absolute h-10 rounded-full bg-white/10", p)} />
      ))}
    </div>
  );
}

/* ---------------- occasions marquee ---------------- */

function OccasionMarquee() {
  const row = [...OCCASIONS, ...OCCASIONS];
  return (
    <section id="occasions" className="mx-auto mt-5 max-w-[1240px] overflow-hidden rounded-[28px] bg-ink py-5 text-bg">
      <div className="marquee flex w-max gap-10 whitespace-nowrap">
        {row.map((o, i) => (
          <span key={i} className="flex items-center gap-10 font-display text-3xl sm:text-4xl">
            {o}
            <span className="size-2.5 rounded-full bg-accent" aria-hidden />
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------------- how it works ---------------- */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Snap it",
      body: "Add a photo to a collection like Tops or Shoes. Name and color fill in, and you fix anything that's off.",
      art: <TrousersIllustration className="h-28" />,
      bg: "bg-[#fde3e1]",
    },
    {
      n: "02",
      title: "Pick the occasion",
      body: "Choose a theme. Weather and time of day come from where you are, and you can change them.",
      art: <CapIllustration className="h-24" />,
      bg: "bg-[#d9f1ec]",
    },
    {
      n: "03",
      title: "See it on you",
      body: "The outfit goes on your doll. Save it, tweak it in the Creation Room, or post it to the feed.",
      art: <SneakerIllustration className="h-24" />,
      bg: "bg-[#fbf0d3]",
    },
  ];
  return (
    <section id="how" className="mx-auto mt-5 max-w-[1240px] rounded-[36px] bg-surface p-6 sm:p-10">
      <SectionTitle eyebrow="How it works" title="Three steps to dressed" />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <article key={s.n} className="flex flex-col rounded-[28px] border border-line p-3">
            <div className={cn("relative grid h-48 place-items-center rounded-[22px]", s.bg)}>
              <span className="absolute top-4 left-5 font-display text-2xl text-ink/30">{s.n}</span>
              <div className="float-y">{s.art}</div>
            </div>
            <div className="p-4">
              <h3 className="text-xl font-extrabold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-[15px] text-muted">{s.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------- features bento ---------------- */

function Features() {
  return (
    <section id="features" className="mx-auto mt-5 max-w-[1240px] rounded-[36px] bg-surface p-6 sm:p-10">
      <SectionTitle eyebrow="Features" title="Everything your closet needs" />
      <div className="mt-10 grid gap-4 md:grid-cols-6">
        {/* scan */}
        <Bento className="md:col-span-3" title="It reads the label for you" body="Take a photo. The name, category and color are filled in before you hit save.">
          <div className="mt-6 flex items-center gap-4 rounded-2xl bg-surface-2 p-4">
            <div className="grid size-24 shrink-0 place-items-center rounded-xl bg-white">
              <TeeIllustration className="w-20" color="#2f3b52" print="#e9c46a" />
            </div>
            <dl className="grid flex-1 gap-2 text-sm">
              <FieldRow label="Name" value="Navy graphic tee" />
              <FieldRow label="Color" value={<><span className="size-3 rounded-full bg-[#2f3b52]" /> Navy</>} />
              <FieldRow label="Category" value="Top" />
            </dl>
          </div>
        </Bento>

        {/* occasion + weather */}
        <Bento className="md:col-span-3" title="Dressed for the day you're having" body="Pick a theme. The weather is already filled in from your location.">
          <div className="mt-6 flex flex-wrap gap-2">
            {["Casual", "Corporate", "Beach", "Date night", "Party"].map((t, i) => (
              <span
                key={t}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm",
                  i === 1 ? "border-ink bg-ink text-bg" : "border-line",
                )}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3.5 py-1.5 text-sm text-accent">
            <CloudSun className="size-4" /> Auto-detected · Lagos, 31°C · day
          </div>
        </Bento>

        {/* creation room — the dolls belong here, not in the hero */}
        <Bento className="md:col-span-2" title="Creation Room" body="Drag pieces onto your doll and see the outfit change as you go.">
          <div className="mt-6 grid grid-cols-2 gap-2">
            <DollStage url="/dolls/female.svg" alt="Female doll" size="card" live className="aspect-[3/5]" />
            <DollStage url="/dolls/male.svg" alt="Male doll" size="card" live className="aspect-[3/5]" />
          </div>
        </Bento>

        {/* chat */}
        <Bento className="md:col-span-2" title="A stylist you can ask" body="Send a photo and ask for the same look from your own closet.">
          <div className="mt-6 flex flex-col gap-2 text-sm">
            <span className="self-end rounded-2xl rounded-br-md bg-ink px-3.5 py-2 text-bg">Can I recreate this look?</span>
            <span className="max-w-[90%] rounded-2xl rounded-bl-md bg-surface-2 px-3.5 py-2">
              Close. Your white oxford and grey chinos work. You don&apos;t have a camel coat, so I left it out.
            </span>
          </div>
        </Bento>

        {/* feed */}
        <Bento className="md:col-span-2" title="Share the look" body="Post outfits with your username and doll. Others can like, save and comment.">
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-surface-2 p-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-xl bg-[#fbf0d3]">
                <ToteIllustration className="w-8" />
              </span>
              <span className="text-sm">
                <span className="block font-semibold">@amaka.styles</span>
                <span className="text-muted">Beach · warm</span>
              </span>
            </div>
            <span className="flex items-center gap-3 text-sm text-muted">
              <span className="flex items-center gap-1"><Heart className="size-4 fill-accent text-accent" /> 128</span>
              <span className="flex items-center gap-1"><MessageCircle className="size-4" /> 14</span>
            </span>
          </div>
        </Bento>
      </div>
    </section>
  );
}

function Bento({ className, title, body, children }: { className?: string; title: string; body: string; children: React.ReactNode }) {
  return (
    <article className={cn("flex flex-col rounded-[28px] border border-line p-6", className)}>
      <h3 className="text-xl font-extrabold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-[15px] text-muted">{body}</p>
      {children}
    </article>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-1.5">
      <dt className="text-muted">{label}</dt>
      <dd className="flex items-center gap-1.5 font-medium">
        {value}
        <span className="rounded-full bg-accent-soft px-1.5 text-[10px] font-semibold text-accent">AI</span>
      </dd>
    </div>
  );
}

/* ---------------- promise ---------------- */

function OurPromise() {
  return (
    <section className="mx-auto mt-5 grid max-w-[1240px] gap-6 rounded-[36px] bg-ink p-8 text-bg sm:p-12 md:grid-cols-[1.4fr_1fr] md:items-end">
      <h2 className="font-display text-[clamp(2.4rem,6vw,4.8rem)] leading-[0.92]">
        If you don&apos;t own it,
        <br />
        <span className="text-accent">we won&apos;t pretend</span> you do.
      </h2>
      <div>
        <p className="text-[15px] text-bg/70">
          Every suggestion is checked against your wardrobe before you see it. When a look needs something you don&apos;t
          have, you get a clear note saying what&apos;s missing.
        </p>
        <div className="mt-6 rounded-2xl bg-bg/10 p-4 text-sm">
          <p className="font-semibold">Not in your wardrobe</p>
          <p className="mt-1 text-bg/70">Rain jacket: a light waterproof layer for today&apos;s showers.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- faq ---------------- */

function Faq() {
  return (
    <section id="faq" className="mx-auto mt-5 grid max-w-[1240px] gap-8 rounded-[36px] bg-surface p-6 sm:p-10 md:grid-cols-[1fr_1.6fr]">
      <SectionTitle eyebrow="FAQ" title="Good questions" />
      <div className="divide-y divide-line">
        {FAQ.map((f) => (
          <details key={f.q} className="group py-5 first:pt-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold tracking-tight">
              {f.q}
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 transition group-open:rotate-45">
                <span className="text-xl leading-none">+</span>
              </span>
            </summary>
            <p className="mt-3 max-w-xl text-[15px] text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ---------------- final cta ---------------- */

function FinalCta() {
  return (
    <section className="relative mx-auto mt-5 max-w-[1240px] overflow-hidden rounded-[36px] bg-accent px-6 py-14 text-center text-white sm:py-20">
      <TeeIllustration className="float-y absolute -top-4 -left-6 hidden w-40 [--tilt:-14deg] md:block" color="#ffffff" print="#1d1919" />
      <SneakerIllustration className="float-y absolute right-6 bottom-6 hidden w-44 [--tilt:8deg] md:block" accent="#17a589" />
      <h2 className="relative font-display text-[clamp(2.6rem,7vw,5.4rem)] leading-[0.9]">Your closet is ready</h2>
      <p className="relative mx-auto mt-4 max-w-md text-[15px] text-white/85">
        Make your doll, add a few pieces, and get your first outfit in a couple of minutes.
      </p>
      <Link
        href="/register"
        className="relative mt-8 inline-flex h-12 items-center gap-3 rounded-full bg-white pr-1.5 pl-5 text-[15px] font-semibold text-ink transition hover:gap-4"
      >
        Create your account
        <span className="grid size-9 place-items-center rounded-full bg-ink text-white">
          <ArrowUpRight className="size-4" />
        </span>
      </Link>
    </section>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-accent">{eyebrow}</p>
      <h2 className="mt-2 font-display text-[clamp(2.2rem,5vw,3.8rem)] leading-[0.95]">{title}</h2>
    </div>
  );
}

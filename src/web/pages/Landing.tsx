import { type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { HeroIllustration } from '../components/HeroIllustration';
import { TerminalDemo } from '../components/TerminalDemo';
import { UseCases } from '../components/UseCases';
import { KitebaseLogo } from '../components/KitebaseLogo';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

interface Props {
  onSignup: () => void;
}

export function Landing({ onSignup }: Props) {
  return (
    <div className="min-h-full">
      <Nav onSignup={onSignup} />
      <Hero onSignup={onSignup} />
      <Demo />
      <UseCases />
      <Problem />
      <Features />
      <How />
      <Stack />
      <Faq />
      <FinalCta onSignup={onSignup} />
      <Footer />
    </div>
  );
}

function Nav({ onSignup }: { onSignup: () => void }) {
  return (
    <nav className="sticky top-0 z-30 mx-auto grid w-full max-w-6xl grid-cols-3 items-center gap-4 px-6 py-5">
      <a href="#" className="flex items-center justify-self-start transition hover:opacity-80">
        <KitebaseLogo size={28} withWordmark wordmarkSize={20} />
      </a>
      <div className="hidden justify-self-center sm:block">
        <div className="flex items-center gap-1 rounded-full border border-kbblue-300/40 bg-white/70 px-1.5 py-1 shadow-search backdrop-blur">
          <a
            href="#about"
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-nautral-700 transition hover:bg-kbblue-100/70 hover:text-navy"
          >
            About
          </a>
          <a
            href="#how"
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-nautral-700 transition hover:bg-kbblue-100/70 hover:text-navy"
          >
            How it works
          </a>
          <a
            href="#faq"
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-nautral-700 transition hover:bg-kbblue-100/70 hover:text-navy"
          >
            FAQ
          </a>
        </div>
      </div>
      <div className="justify-self-end">
        <Button size="sm" onClick={onSignup}>
          Try kitebase
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </nav>
  );
}

function Hero({ onSignup }: { onSignup: () => void }) {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 text-center">
      <Badge variant="blue" className="mx-auto mb-6">
        Hermes agents on the Kite chain · Kite Agent Passport
      </Badge>
      <h1
        className="mx-auto max-w-5xl font-serif text-6xl leading-[1.02] text-navy md:text-7xl lg:text-[88px]"
        style={{ letterSpacing: '-0.03em' }}
      >
        Deploy AI actors with on-chain identity in{' '}
        <span className="relative whitespace-nowrap">
          one click
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 -bottom-1 h-[10px] rounded-full bg-cta opacity-90 md:-bottom-1.5 md:h-[14px]"
          />
        </span>
        .
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-nautral-700 md:text-lg">
        Each actor has its own wallet, identity, and budget. It pays, books, and signs
        autonomously in your name.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" onClick={onSignup}>
          Try kitebase
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href="#how">See how it works</a>
        </Button>
      </div>
      <div className="mt-14">
        <HeroIllustration />
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <div className="flex items-center gap-2.5 rounded-full border border-kbblue-300/40 bg-white/80 px-3 py-1.5 shadow-search backdrop-blur">
          <img
            src="/logos/hermesIcon.png"
            alt=""
            aria-hidden="true"
            className="h-7 w-7 rounded-full ring-1 ring-kbblue-300/40"
          />
          <span className="text-[12px] font-semibold tracking-tight text-navy">
            Hermes
          </span>
        </div>
        <div className="flex items-center gap-2.5 rounded-full border border-kbblue-300/40 bg-white/80 px-3 py-1.5 shadow-search backdrop-blur">
          <img
            src="/logos/kite.svg"
            alt=""
            aria-hidden="true"
            className="h-6 w-6"
          />
          <span className="text-[12px] font-semibold tracking-tight text-navy">
            Kite Agent Passport
          </span>
        </div>
      </div>
    </section>
  );
}

function Demo() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="mx-auto mb-6 max-w-2xl text-center">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-nautral-500">
          live agent demo
        </div>
        <h2
          className="mt-2 font-serif text-3xl text-navy md:text-4xl"
          style={{ letterSpacing: '-0.025em' }}
        >
          Watch an actor think and pay.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-nautral-700">
          Real Kite Agent Passport. Real x402 settlement. Reasoning out loud.
        </p>
      </div>
      <TerminalDemo />
    </section>
  );
}

function Problem() {
  return (
    <section id="about" className="mx-auto max-w-3xl px-6 py-16 text-center">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-nautral-500">
        the problem
      </div>
      <h2
        className="mt-2 font-serif text-3xl text-navy md:text-4xl"
        style={{ letterSpacing: '-0.025em' }}
      >
        Standing up a persistent AI agent today is a whole weekend.
      </h2>
      <p className="mt-4 text-base leading-relaxed text-nautral-700">
        A VPS, an LLM provider, a wallet, an on-chain identity, the messaging channels, the
        runtime, the cron job that keeps it alive. Five accounts, ten configs, and you still
        wake up to a process that crashed at 3am.
      </p>
    </section>
  );
}

function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-nautral-500">
          what you get
        </div>
        <h2
          className="mt-2 font-serif text-3xl text-navy md:text-4xl"
          style={{ letterSpacing: '-0.025em' }}
        >
          Everything wired. Nothing to glue.
        </h2>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        <FeatureCard
          title="One-click deploy"
          body="Type a name. Click Deploy. We provision a Vultr VPS, install the Hermes runtime, and you can chat with the actor before the VPS even finishes booting."
        />
        <FeatureCard
          title="Kite Agent Passport"
          body="Every actor gets a did:kite address and an AA wallet derived from gokite-aa-sdk. The Kite Agent Passport gives it autonomous spending, x402 settlement, and a verifiable identity on-chain."
        />
        <FeatureCard
          title="20+ channels"
          body="Telegram, Discord, Slack, Signal, Email, SMS, Matrix, more. Hermes Agent's gateway is built in. Drop a bot token, your actor is everywhere."
        />
      </div>
    </section>
  );
}

function FeatureCard({ title, body }: { title: string; body: ReactNode }) {
  return (
    <div className="rounded-3xl bg-skeleton p-6 shadow-card">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-kbblue-700">
        {title}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-nautral-700">{body}</p>
    </div>
  );
}

function How() {
  const steps: { n: string; title: string; body: string }[] = [
    {
      n: '01',
      title: 'Sign up',
      body: 'Create your workspace in seconds. Email + password, no credit card.',
    },
    {
      n: '02',
      title: 'Deploy your first actor',
      body: 'Pick a name. We mint a Kite AA wallet, prep a Vultr VPS, and start a Hermes runtime.',
    },
    {
      n: '03',
      title: 'Chat immediately',
      body: 'Featherless inference is on by default. Wire Telegram, Discord, or any channel when you are ready.',
    },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-nautral-500">
          how it works
        </div>
        <h2
          className="mt-2 font-serif text-3xl text-navy md:text-4xl"
          style={{ letterSpacing: '-0.025em' }}
        >
          From zero to live actor in three steps.
        </h2>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="rounded-3xl bg-skeleton p-6 shadow-card">
            <div className="font-mono text-xs text-kbblue-700">{s.n}</div>
            <h3
              className="mt-2 font-serif text-2xl text-navy"
              style={{ letterSpacing: '-0.025em' }}
            >
              {s.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-nautral-700">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stack() {
  const items = [
    { label: 'Hermes Agent', sub: 'NousResearch' },
    { label: 'Kite chain', sub: 'gokite-aa-sdk' },
    { label: 'Featherless', sub: 'inference' },
    { label: 'Vultr', sub: 'compute' },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-nautral-500">
          built on
        </div>
        <h2
          className="mt-2 font-serif text-3xl text-navy md:text-4xl"
          style={{ letterSpacing: '-0.025em' }}
        >
          A stack you can read end-to-end.
        </h2>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((it) => (
          <div
            key={it.label}
            className="rounded-2xl bg-white px-4 py-4 text-center shadow-search"
          >
            <div className="font-serif text-lg text-navy" style={{ letterSpacing: '-0.025em' }}>
              {it.label}
            </div>
            <div className="mt-0.5 text-[11px] text-nautral-600">{it.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  const items: { q: string; a: string }[] = [
    {
      q: 'What is a Kite Agent Passport?',
      a: 'An on-chain identity for your actor: a did:kite address plus an account-abstraction wallet derived via gokite-aa-sdk. The passport lets it sign, spend, and prove who it is - autonomously, on the Kite chain.',
    },
    {
      q: 'What happens after I click deploy?',
      a: 'We mint your actor an AA wallet and DID, provision a private compute instance, install the Hermes runtime, and start it. You can chat with it while the instance is still booting.',
    },
    {
      q: 'Can my actor actually pay for things?',
      a: "Yes. Each actor has its own AA wallet. It can settle x402-priced services, top up its own credits, or transact with other agents - all bounded by a budget you set.",
    },
    {
      q: 'Where does the inference come from?',
      a: 'By default, Featherless (OpenAI-compatible, models from NousResearch). You can point any actor at a different OpenAI-compatible endpoint by editing its env.',
    },
    {
      q: 'How do I plug in Telegram or Discord?',
      a: "Drop your BotFather token in the actor's settings. The change pushes to the live instance automatically, no redeploy needed.",
    },
    {
      q: 'Who can see my actor’s private key?',
      a: "Only the instance running it. The key is derived once at deploy time and lives in the actor's own env file. We do not store inference logs or chat content beyond the actor itself.",
    },
  ];

  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-nautral-500">
          frequently asked
        </div>
        <h2
          className="mt-2 font-serif text-3xl text-navy md:text-4xl"
          style={{ letterSpacing: '-0.025em' }}
        >
          Questions you might be asking.
        </h2>
      </div>
      <div className="mt-8 space-y-3">
        {items.map((it) => (
          <details
            key={it.q}
            className="group rounded-2xl bg-white px-5 py-4 shadow-search transition open:shadow-card"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-navy">
              {it.q}
              <span
                aria-hidden="true"
                className="ml-3 text-kbblue-500 transition group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-nautral-700">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta({ onSignup }: { onSignup: () => void }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 text-center">
      <div className="relative mx-auto mb-6 w-fit">
        <KitebaseLogo size={56} />
        <div className="absolute -inset-6 -z-10 rounded-full bg-kbblue-300/30 blur-3xl" />
      </div>
      <h2
        className="font-serif text-3xl text-navy md:text-4xl"
        style={{ letterSpacing: '-0.025em' }}
      >
        Ready to deploy your first actor?
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-nautral-700">
        It is a free workspace. The first actor takes about three minutes from name to live.
      </p>
      <Button size="lg" className="mt-7" onClick={onSignup}>
        Try kitebase
        <ArrowRight className="h-4 w-4" />
      </Button>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-6 pb-12 pt-6 text-center text-[11px] text-nautral-500">
      kitebase · agents on the Kite chain
    </footer>
  );
}

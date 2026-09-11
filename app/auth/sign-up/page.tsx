import { SignUpForm } from '@/components/sign-up-form'

export default function Page() {
  return (
    <main className="min-h-svh bg-background p-3 sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] w-full max-w-6xl overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-[0_24px_80px_rgba(23,28,12,0.10)] sm:min-h-[calc(100svh-2.5rem)] lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex items-center px-6 py-10 sm:px-10 lg:px-14 xl:px-16">
          <div className="mx-auto w-full max-w-md">
            <SignUpForm />
          </div>
        </section>

        <section
          aria-hidden="true"
          className="relative hidden min-h-[620px] overflow-hidden border-l border-border/40 lg:block"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(238,244,182,0.88),transparent_25%),radial-gradient(circle_at_32%_72%,rgba(135,157,45,0.48),transparent_34%),linear-gradient(145deg,#163523_0%,#39552a_38%,#8e9a45_68%,#d7d8a8_100%)]" />
          <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="absolute inset-x-8 bottom-8 rounded-3xl border border-white/20 bg-black/10 p-6 text-white backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              April Engine
            </p>
            <p className="mt-3 max-w-md text-2xl font-medium leading-tight tracking-[-0.03em]">
              Build your research workspace around answers you can trace back to sources.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

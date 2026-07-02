import { Reveal } from "@/components/motion/Reveal";
import { LANDING_FAQ } from "@/lib/marketing/landing-content";
import { cn } from "@/lib/utils";

export function LandingFaq() {
  return (
    <section id="duvidas" className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-20" aria-labelledby="faq-heading">
      <Reveal className="text-center">
        <p className="insight-label">Dúvidas</p>
        <h2 id="faq-heading" className="mt-2 font-display text-3xl font-extrabold tracking-[-0.035em] md:text-4xl">
          Dúvidas frequentes
        </h2>
        <p className="mt-3 text-sm text-muted-foreground md:text-[15px]">
          Respostas diretas antes de você criar a conta.
        </p>
      </Reveal>

      <div className="mt-10 space-y-3">
        {LANDING_FAQ.map((item, index) => (
          <Reveal key={item.question} delay={index * 50}>
            <details
              className={cn(
                "group rounded-[14px] border border-border/80 bg-card/80 px-4 py-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.18)]",
                "landing-card open:border-primary/25 open:bg-card",
              )}
            >
              <summary className="cursor-pointer list-none font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {item.question}
                  <span
                    className="text-lg text-primary transition-transform duration-200 group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

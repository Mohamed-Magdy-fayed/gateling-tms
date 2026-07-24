import type { LegalPageContent } from "./types";

type LegalPageLayoutProps = {
  content: LegalPageContent;
  lastUpdatedLabel: string;
};

export function LegalPageLayout({
  content,
  lastUpdatedLabel,
}: LegalPageLayoutProps) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display font-bold text-3xl text-foreground sm:text-4xl">
        {content.title}
      </h1>
      <p className="mt-2 text-muted-foreground text-sm">{lastUpdatedLabel}</p>
      {content.intro ? (
        <p className="mt-6 text-muted-foreground">{content.intro}</p>
      ) : null}

      <div className="mt-10 space-y-8">
        {content.sections.map((section) => (
          <div key={section.title}>
            <h2 className="font-display font-semibold text-foreground text-xl">
              {section.title}
            </h2>
            <div className="mt-2 space-y-3 text-muted-foreground text-sm leading-relaxed">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

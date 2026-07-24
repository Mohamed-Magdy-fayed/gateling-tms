export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LegalPageContent = {
  title: string;
  intro?: string;
  sections: LegalSection[];
};

export type LocalizedLegalContent = Record<"en" | "ar", LegalPageContent>;

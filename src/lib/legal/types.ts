export type LegalSection = {
  title: string;
  body: string[];
};

export type LegalPageContent = {
  title: string;
  subtitle: string;
  sections: LegalSection[];
};
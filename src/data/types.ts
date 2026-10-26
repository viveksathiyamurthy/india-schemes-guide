export type GovernmentLevel = 'State Government' | 'Union/Central Government';

export interface Scheme {
  id: number;
  slug: string;
  /** Short display name used on cards and as the page title. */
  shortName: string;
  nameEn: string;
  nameTa: string;
  level: GovernmentLevel;
  /** A state name, or "All India" for Union/Central Government schemes. */
  state: string;
  department: string;
  /** Matches the persona keys in config.ts. */
  userTypes: string[];
  summaryEn: string;
  summaryTa: string;
  benefitEn: string;
  benefitTa: string;
  eligibilityEn: string;
  eligibilityTa: string;
  documentsEn: string;
  documentsTa: string;
  howToApplyEn: string;
  howToApplyTa: string;
  officialLink: string;
  applyLink: string;
  status: string;
  /** YYYY-MM-DD */
  lastVerified: string;
  reviewStatus: string;
}

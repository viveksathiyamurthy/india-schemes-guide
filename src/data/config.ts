export interface StateInfo {
  slug: string;
  /** Must match the "state" column in the data sheet. */
  name: string;
  nameTa: string;
  available: boolean;
}

export const states: StateInfo[] = [
  { slug: 'tamil-nadu', name: 'Tamil Nadu', nameTa: 'தமிழ்நாடு', available: true },
  { slug: 'kerala', name: 'Kerala', nameTa: 'கேரளா', available: false },
  { slug: 'karnataka', name: 'Karnataka', nameTa: 'கர்நாடகா', available: false },
  { slug: 'andhra-pradesh', name: 'Andhra Pradesh', nameTa: 'ஆந்திரப் பிரதேசம்', available: false },
  { slug: 'telangana', name: 'Telangana', nameTa: 'தெலுங்கானா', available: false },
];

export interface Persona {
  slug: string;
  /** Must match a value in the "user_types" column of the data sheet. */
  key: string;
  letter: string;
  labelEn: string;
  labelTa: string;
  hintEn: string;
  hintTa: string;
}

export const personas: Persona[] = [
  { slug: 'msme', key: 'MSME', letter: 'M', labelEn: 'MSME', labelTa: 'சிறு, குறு, நடுத்தர தொழில் (MSME)', hintEn: 'Loans and subsidies for your business', hintTa: 'உங்கள் தொழிலுக்கான கடன்கள், மானியங்கள்' },
  { slug: 'farmer', key: 'Farmer', letter: 'F', labelEn: 'Farmer', labelTa: 'விவசாயி', hintEn: 'Income support for farming families', hintTa: 'விவசாயக் குடும்பங்களுக்கான வருமான உதவி' },
  { slug: 'home', key: 'Home seeker / House owner', letter: 'H', labelEn: 'Home seeker / House owner', labelTa: 'வீடு தேடுபவர் / வீட்டு உரிமையாளர்', hintEn: 'Housing support', hintTa: 'வீட்டு வசதி உதவி' },
  { slug: 'student', key: 'Student', letter: 'S', labelEn: 'Student', labelTa: 'மாணவர்', hintEn: 'Scholarships and education loans', hintTa: 'கல்வி உதவித்தொகை, கல்விக் கடன்' },
  { slug: 'woman', key: 'Woman', letter: 'W', labelEn: 'Woman', labelTa: 'பெண்', hintEn: 'Monthly support and self help groups', hintTa: 'மாதாந்திர உதவி, சுய உதவிக் குழுக்கள்' },
];

export const findState = (slug: string) => states.find((s) => s.slug === slug);
export const findPersona = (slug: string) => personas.find((p) => p.slug === slug);

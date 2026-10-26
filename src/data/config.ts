export interface StateInfo {
  slug: string;
  /** Must match the "state" column in the data sheet. */
  name: string;
  /** Name in Tamil, used when the site is switched to Tamil. */
  nameTa: string;
  /** Name in the state's own language, always shown on the map. */
  local: string;
  localLang: 'ta' | 'ml' | 'kn' | 'te';
  available: boolean;
  /** Colour of the state on the map and on the next screen. */
  color: string;
  /** Text colour that is readable on `color`. */
  onColor: string;
}

export const states: StateInfo[] = [
  { slug: 'tamil-nadu', name: 'Tamil Nadu', nameTa: 'தமிழ்நாடு', local: 'தமிழ்நாடு', localLang: 'ta', available: true, color: '#F5AE92', onColor: '#2B2540' },
  { slug: 'kerala', name: 'Kerala', nameTa: 'கேரளா', local: 'കേരളം', localLang: 'ml', available: false, color: '#A9D8B8', onColor: '#2B2540' },
  { slug: 'karnataka', name: 'Karnataka', nameTa: 'கர்நாடகா', local: 'ಕರ್ನಾಟಕ', localLang: 'kn', available: false, color: '#F4DD8F', onColor: '#2B2540' },
  { slug: 'andhra-pradesh', name: 'Andhra Pradesh', nameTa: 'ஆந்திரப் பிரதேசம்', local: 'ఆంధ్ర ప్రదేశ్', localLang: 'te', available: false, color: '#EFAAC0', onColor: '#2B2540' },
  { slug: 'telangana', name: 'Telangana', nameTa: 'தெலுங்கானா', local: 'తెలంగాణ', localLang: 'te', available: false, color: '#BDACE3', onColor: '#2B2540' },
];

export interface Persona {
  slug: string;
  /** Must match a value in the "user_types" column of the data sheet. */
  key: string;
  /** Which drawn character stands next to this choice. */
  character: 'msme' | 'farmer' | 'home' | 'student' | 'woman';
  labelEn: string;
  labelTa: string;
  hintEn: string;
  hintTa: string;
}

export const personas: Persona[] = [
  { slug: 'msme', key: 'MSME', character: 'msme', labelEn: 'MSME', labelTa: 'சிறு, குறு, நடுத்தர தொழில் (MSME)', hintEn: 'Loans and subsidies for your business', hintTa: 'உங்கள் தொழிலுக்கான கடன்கள், மானியங்கள்' },
  { slug: 'farmer', key: 'Farmer', character: 'farmer', labelEn: 'Farmer', labelTa: 'விவசாயி', hintEn: 'Income support for farming families', hintTa: 'விவசாயக் குடும்பங்களுக்கான வருமான உதவி' },
  { slug: 'home', key: 'Home seeker / House owner', character: 'home', labelEn: 'Home seeker / House owner', labelTa: 'வீடு தேடுபவர் / வீட்டு உரிமையாளர்', hintEn: 'Housing support', hintTa: 'வீட்டு வசதி உதவி' },
  { slug: 'student', key: 'Student', character: 'student', labelEn: 'Student', labelTa: 'மாணவர்', hintEn: 'Scholarships and education loans', hintTa: 'கல்வி உதவித்தொகை, கல்விக் கடன்' },
  { slug: 'woman', key: 'Woman', character: 'woman', labelEn: 'Woman', labelTa: 'பெண்', hintEn: 'Monthly support and self help groups', hintTa: 'மாதாந்திர உதவி, சுய உதவிக் குழுக்கள்' },
];

export const findState = (slug: string) => states.find((s) => s.slug === slug);
export const findPersona = (slug: string) => personas.find((p) => p.slug === slug);

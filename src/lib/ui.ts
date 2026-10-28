/**
 * Interface text in English and Tamil. The Tamil lines were written by Claude and
 * need review by a native Tamil speaker before launch.
 */
export interface Text {
  en: string;
  ta: string;
}

export const ui = {
  brand: { en: 'India Schemes Guide', ta: 'இந்தியா திட்ட வழிகாட்டி' },
  disclaimer: {
    en: 'This website only publishes information and takes no responsibility for it. Before you apply, please check the official government website for the original instructions.',
    ta: 'இந்தத் தளம் தகவல்களை மட்டுமே வெளியிடுகிறது; அவற்றுக்கு எந்தப் பொறுப்பையும் ஏற்காது. விண்ணப்பிக்கும் முன், அசல் வழிமுறைகளுக்கு அதிகாரப்பூர்வ அரசு இணையதளத்தைப் பார்க்கவும்.',
  },
  footer: {
    en: 'An independent information site. This is not a government website.',
    ta: 'இது ஒரு சுதந்திரமான தகவல் தளம். இது அரசு இணையதளம் அல்ல.',
  },
  welcomeTitle: { en: "Welcome. Let's find help meant for you.", ta: 'வணக்கம்! உங்களுக்கான உதவிகளைக் கண்டறியலாம்.' },
  welcomeSub: {
    en: 'Government schemes, subsidies and concessions, explained simply.',
    ta: 'அரசுத் திட்டங்கள், மானியங்கள், சலுகைகள் எளிமையாக விளக்கப்பட்டுள்ளன.',
  },
  searchLabel: { en: 'Search schemes', ta: 'திட்டங்களைத் தேடு' },
  searchPlaceholder: { en: 'Search a scheme or subsidy', ta: 'திட்டம் அல்லது மானியத்தைத் தேடுங்கள்' },
  searchPlaceholderState: { en: 'Search these schemes', ta: 'இத்திட்டங்களில் தேடுங்கள்' },
  searchButton: { en: 'Search', ta: 'தேடு' },
  mapPrompt: { en: 'Tap your state on the map', ta: 'வரைபடத்தில் உங்கள் மாநிலத்தைத் தொடுங்கள்' },
  mapAria: { en: 'Map of South India. Choose your state.', ta: 'தென்னிந்திய வரைபடம். உங்கள் மாநிலத்தைத் தேர்ந்தெடுக்கவும்.' },
  planetHint: { en: 'Tap a state on the map', ta: 'வரைபடத்தில் உங்கள் மாநிலத்தைத் தொடுங்கள்' },
  openNow: { en: 'Open now', ta: 'இப்போது கிடைக்கிறது' },
  soonNote: { en: '{state} is coming soon. Tamil Nadu is open now.', ta: '{state} விரைவில் வரும். தமிழ்நாடு இப்போது கிடைக்கிறது.' },
  legendOpen: { en: 'Open now', ta: 'இப்போது கிடைக்கிறது' },
  legendSoon: { en: 'Coming soon', ta: 'விரைவில்' },
  seaArabian: { en: 'Arabian Sea', ta: 'அரபிக் கடல்' },
  seaBay: { en: 'Bay of Bengal', ta: 'வங்காள விரிகுடா' },
  seaOcean: { en: 'Indian Ocean', ta: 'இந்தியப் பெருங்கடல்' },
  chooseState: { en: 'Choose your state', ta: 'உங்கள் மாநிலத்தைத் தேர்ந்தெடுக்கவும்' },
  available: { en: 'Available', ta: 'கிடைக்கிறது' },
  comingSoon: { en: 'Coming soon', ta: 'விரைவில்' },
  whoAreYou: { en: 'Who are you?', ta: 'நீங்கள் யார்?' },
  personaIntro: {
    en: 'Choose the one that fits you best. You will see the schemes for you from {state} and the Union/Central Government.',
    ta: 'உங்களுக்குப் பொருந்துவதைத் தேர்ந்தெடுக்கவும். {state} மற்றும் ஒன்றிய/மத்திய அரசின் உங்களுக்கான திட்டங்களைக் காண்பீர்கள்.',
  },
  changeState: { en: 'Change state', ta: 'மாநிலத்தை மாற்று' },
  changePersona: { en: 'Change persona', ta: 'வகையை மாற்று' },
  back: { en: 'Back', ta: 'பின்செல்' },
  filterAll: { en: 'All', ta: 'அனைத்தும்' },
  stateGov: { en: 'State Government', ta: 'மாநில அரசு' },
  unionGov: { en: 'Union/Central Government', ta: 'ஒன்றிய/மத்திய அரசு' },
  allIndia: { en: 'All India', ta: 'இந்தியா முழுவதும்' },
  schemesCount: { en: 'schemes', ta: 'திட்டங்கள்' },
  schemeCount1: { en: 'scheme', ta: 'திட்டம்' },
  scopeState: { en: 'from {state} and the Union/Central Government', ta: '{state} மற்றும் ஒன்றிய/மத்திய அரசிலிருந்து' },
  scopeAll: { en: 'from all states and the Union/Central Government', ta: 'அனைத்து மாநிலங்கள் மற்றும் ஒன்றிய/மத்திய அரசிலிருந்து' },
  resultsFor: { en: 'Results for', ta: 'தேடல் முடிவுகள்:' },
  allSchemes: { en: 'All schemes', ta: 'அனைத்துத் திட்டங்கள்' },
  noResults: { en: 'No schemes found. Try a different word.', ta: 'திட்டங்கள் எதுவும் கிடைக்கவில்லை. வேறு சொல்லில் தேடிப் பாருங்கள்.' },
  noStateNote: {
    en: 'No state chosen yet. Choose a state to see only its schemes.',
    ta: 'மாநிலம் இன்னும் தேர்ந்தெடுக்கப்படவில்லை. அந்த மாநிலத் திட்டங்களை மட்டும் காண மாநிலத்தைத் தேர்ந்தெடுக்கவும்.',
  },
  chooseStateButton: { en: 'Choose state', ta: 'மாநிலத்தைத் தேர்ந்தெடு' },
  department: { en: 'Department', ta: 'துறை' },
  whatYouGet: { en: 'What you get', ta: 'உங்களுக்குக் கிடைப்பது' },
  whoIsEligible: { en: 'Who is eligible', ta: 'யார் தகுதியானவர்' },
  documentsRequired: { en: 'Documents required', ta: 'தேவையான ஆவணங்கள்' },
  howToApply: { en: 'How to apply', ta: 'விண்ணப்பிக்கும் முறை' },
  lastVerified: { en: 'Last verified', ta: 'கடைசியாகச் சரிபார்த்தது' },
  officialButton: { en: 'Go to the official government website', ta: 'அதிகாரப்பூர்வ அரசு இணையதளத்திற்குச் செல்லுங்கள்' },
  applyButton: { en: 'Open the application page', ta: 'விண்ணப்பப் பக்கத்தைத் திறக்கவும்' },
  confirmNote: {
    en: 'Please confirm the details on the official website before you apply.',
    ta: 'விண்ணப்பிக்கும் முன் அதிகாரப்பூர்வ இணையதளத்தில் விவரங்களை உறுதிசெய்யவும்.',
  },
  tamilPending: {
    en: 'Tamil text for this section is coming soon. Showing English.',
    ta: 'இந்தப் பகுதிக்கான தமிழ் விரைவில் வரும். ஆங்கிலத்தில் காட்டப்படுகிறது.',
  },
  notFoundTitle: { en: 'Page not found', ta: 'பக்கம் கிடைக்கவில்லை' },
  notFoundText: { en: 'We could not find that page.', ta: 'அந்தப் பக்கத்தைக் கண்டுபிடிக்க முடியவில்லை.' },
  goHome: { en: 'Go to the start', ta: 'தொடக்கத்திற்குச் செல்' },
} satisfies Record<string, Text>;

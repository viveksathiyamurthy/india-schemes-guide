import type { Scheme } from './types';

/**
 * Scheme data exported from the "India Schemes Guide - Data" Google Sheet (tab "Schemes").
 * Tamil text is filled only for names and summaries so far; blank *Ta fields fall back to English.
 * Publishing rule: a scheme shows on the site only if status is Active, review status is Verified
 * and it has an official link (see src/lib/search.ts).
 */
export const schemes: Scheme[] = [
  {
    id: 1,
    slug: 'pm-kisan',
    shortName: 'PM-KISAN',
    nameEn: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    nameTa: 'பிரதமரின் கிசான் சம்மான் நிதி (PM-KISAN)',
    level: 'Union/Central Government',
    state: 'All India',
    department: 'Ministry of Agriculture & Farmers Welfare',
    userTypes: ['Farmer'],
    summaryEn: 'Income support of ₹6,000 a year for landholding farmer families, paid in three instalments of ₹2,000.',
    summaryTa: 'நிலம் வைத்துள்ள விவசாயக் குடும்பங்களுக்கு ஆண்டுக்கு ₹6,000, ₹2,000 வீதம் மூன்று தவணைகளில் வழங்கப்படும் வருமான உதவி.',
    benefitEn: `₹6,000 per year, paid in three equal instalments of ₹2,000 directly into the farmer's bank account. Farmers do not need to pay or contribute anything.`,
    benefitTa: '',
    eligibilityEn: `• A landholding farmer family (family = husband, wife and minor children). Benefit is per family, not per person.
• Aadhaar-based eKYC is mandatory for registered farmers.
• Not eligible: institutional landholders, current/former holders of constitutional posts, and people who paid income tax in the previous assessment year.
• The official portal warns that payment can be held back where land was acquired after 1 February 2019, or where more than one member of the same family is receiving benefits, until physical verification is done.`,
    eligibilityTa: '',
    documentsEn: `1. Aadhaar card
2. Bank account details (account linked for receiving money)
3. Land ownership records`,
    documentsTa: '',
    howToApplyEn: `1. Open pmkisan.gov.in and choose 'New Farmer Registration', or go to the nearest Common Service Centre (CSC).
2. Enter your details and land information.
3. Complete eKYC: OTP-based on the portal, or biometric at a CSC.
4. Use 'Know Your Status' on the portal to check whether your instalment has been released.`,
    howToApplyTa: '',
    officialLink: 'https://pmkisan.gov.in/',
    applyLink: 'https://pmkisan.gov.in/',
    status: 'Active',
    lastVerified: '2026-10-18',
    reviewStatus: 'Verified',
  },
  {
    id: 2,
    slug: 'pmegp',
    shortName: 'PMEGP',
    nameEn: `PMEGP (Prime Minister's Employment Generation Programme)`,
    nameTa: 'பிரதமரின் வேலைவாய்ப்பு உருவாக்கும் திட்டம் (PMEGP)',
    level: 'Union/Central Government',
    state: 'All India',
    department: 'Ministry of Micro, Small and Medium Enterprises (implemented by KVIC)',
    userTypes: ['MSME', 'Woman'],
    summaryEn: 'Subsidy of 15% to 35% on the project cost for setting up a new micro enterprise, with the rest as a bank loan.',
    summaryTa: 'புதிய சிறு தொழில் தொடங்க திட்டச் செலவில் 15% முதல் 35% வரை மானியம்; மீதித் தொகை வங்கிக் கடனாக வழங்கப்படும்.',
    benefitEn: `• Margin money subsidy of 15% to 35% of the project cost.
• Highest project cost considered for subsidy: ₹50 lakh for manufacturing and ₹20 lakh for business/service.
• Reported subsidy rates: General category 25% (rural) / 15% (urban). Special categories (including women, SC/ST, minorities, ex-servicemen) 35% (rural) / 25% (urban).
• The remaining cost comes as a bank term loan and working capital.
• The subsidy is held for a 3-year lock-in period.`,
    benefitTa: '',
    eligibilityEn: `• Any individual above 18 years of age.
• Only new projects qualify. Units that have already taken a government subsidy under another scheme are not eligible.
• At least 8th standard pass for projects costing above ₹10 lakh (manufacturing) or ₹5 lakh (business/service).
• One person per family (family means self and spouse). No income ceiling.`,
    eligibilityTa: '',
    documentsEn: `1. Detailed project report (project summary)
2. Other documents listed on the PMEGP portal. Typically: ID proof, address proof, education proof where required, and a special-category certificate if claiming the higher subsidy.`,
    documentsTa: '',
    howToApplyEn: `1. Open the PMEGP e-portal and choose the Online Application option.
2. Fill in the form and click 'Save Applicant Data'.
3. Take a printout and submit it with the project report to the KVIC/KVIB/District Industries Centre office, as the portal directs.
4. The bank assesses the project and, if approved, sanctions the loan; the subsidy is routed through the bank.`,
    howToApplyTa: '',
    officialLink: 'https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp',
    applyLink: 'https://www.kviconline.gov.in/pmegpeportal/jsp/pmegponline.jsp',
    status: 'Active',
    lastVerified: '2026-10-18',
    reviewStatus: 'Verified',
  },
  {
    id: 3,
    slug: 'pmay-urban-2',
    shortName: 'PMAY-Urban 2.0',
    nameEn: 'PMAY-Urban 2.0 (Pradhan Mantri Awas Yojana - Urban 2.0)',
    nameTa: 'பிரதமரின் வீட்டு வசதித் திட்டம் - நகர்ப்புறம் 2.0 (PMAY-U 2.0)',
    level: 'Union/Central Government',
    state: 'All India',
    department: 'Ministry of Housing and Urban Affairs',
    userTypes: ['Home seeker / House owner'],
    summaryEn: 'Help for eligible urban families to build, buy or rent an affordable pucca house.',
    summaryTa: 'தகுதியுள்ள நகர்ப்புறக் குடும்பங்கள் மலிவு விலையில் நிலையான வீட்டைக் கட்ட, வாங்க அல்லது வாடகைக்கு எடுக்க உதவி.',
    benefitEn: `Financial assistance to build, buy or rent an affordable house in urban areas, through four verticals:
• Beneficiary Led Construction (BLC)
• Affordable Housing in Partnership (AHP)
• Affordable Rental Housing (ARH)
• Interest Subsidy Scheme (ISS) on home loans
Women's ownership or co-ownership of the house is encouraged. Check the official guidelines for the exact amount under each vertical.`,
    benefitTa: '',
    eligibilityEn: `• Urban family in the EWS, LIG or MIG income segment (confirm exact income bands in the official guidelines).
• Must not own a pucca house anywhere in India.
• Must not have taken a housing benefit under an earlier Central Government housing scheme.
• The house must be in a statutory urban area covered by the scheme. States may set a cut-off date for urban residence.`,
    eligibilityTa: '',
    documentsEn: `1. Aadhaar
2. Income proof or self-declaration
3. Bank account details
4. Photographs
5. Land ownership documents (for Beneficiary Led Construction)
The exact list is set by the State/Urban Local Body.`,
    documentsTa: '',
    howToApplyEn: `1. Check eligibility on the official PMAY-Urban website.
2. Apply online, or through your Urban Local Body (municipality) or a Common Service Centre.
3. Upload the documents and submit.
4. Track your application under 'Check Status' on the PMAY-Urban portal.`,
    howToApplyTa: '',
    officialLink: 'https://pmay-urban.gov.in/',
    applyLink: 'https://pmay-urban.gov.in/',
    status: 'Active',
    lastVerified: '2026-10-18',
    reviewStatus: 'Verified',
  },
  {
    id: 4,
    slug: 'pm-vidyalaxmi',
    shortName: 'PM-Vidyalaxmi',
    nameEn: 'PM-Vidyalaxmi (Education Loan Scheme)',
    nameTa: 'பிரதமரின் வித்யாலட்சுமி திட்டம் (PM-Vidyalaxmi)',
    level: 'Union/Central Government',
    state: 'All India',
    department: 'Department of Higher Education, Ministry of Education',
    userTypes: ['Student'],
    summaryEn: 'Collateral-free, guarantor-free education loans for students in quality institutions, with interest subsidy for lower-income families.',
    summaryTa: 'தரமான உயர்கல்வி நிறுவனங்களில் சேரும் மாணவர்களுக்கு பிணையோ உத்தரவாதியோ இல்லாத கல்விக் கடன்; குறைந்த வருமானக் குடும்பங்களுக்கு வட்டி மானியம்.',
    benefitEn: `• Education loans without collateral or guarantor for students admitted to notified Quality Higher Education Institutions (QHEIs).
• 3% interest subvention on loans up to ₹10 lakh for families with annual income up to ₹8 lakh.
• Full interest subvention for students whose family income is up to ₹4.5 lakh (technical/professional courses, under PM-USP CSIS).
• Up to 1% extra interest concession if interest is paid during the study and moratorium period.
• The subsidy is credited to a digital rupee (CBDC) wallet and then moved to the loan account.`,
    benefitTa: '',
    eligibilityEn: `• Admitted to a Quality Higher Education Institution (QHEI).
• Annual family income up to ₹8 lakh for the 3% interest subvention.
• Must not be receiving another Central/State scholarship, interest subvention or fee reimbursement.
• Satisfactory academic performance is needed from the 2nd year for the subsidy.
• Interest subvention and credit guarantee can be used only once (for an undergraduate, postgraduate or integrated course).`,
    eligibilityTa: '',
    documentsEn: `1. Aadhaar (used for registration)
2. Proof of admission to the institution
3. Family income proof
4. Bank details
The exact list is shown on the portal while applying.`,
    documentsTa: '',
    howToApplyEn: `1. Register on the PM-Vidyalaxmi portal using Aadhaar.
2. Fill the Common Education Loan Application Form (CELAF).
3. Search for education loans and apply to your chosen banks.
4. After the loan is sanctioned and paid out, log in again and claim interest subvention if eligible.`,
    howToApplyTa: '',
    officialLink: 'https://www.myscheme.gov.in/schemes/pmvs',
    applyLink: 'https://www.myscheme.gov.in/schemes/pmvs',
    status: 'Active',
    lastVerified: '2026-10-18',
    reviewStatus: 'Verified',
  },
  {
    id: 5,
    slug: 'magalir-urimai-thogai',
    shortName: 'Magalir Urimai Thogai',
    nameEn: 'Magalir Urimai Thogai (Kalaignar Magalir Urimai Thogai)',
    nameTa: 'மகளிர் உரிமைத் தொகை (கலைஞர் மகளிர் உரிமைத் தொகை)',
    level: 'State Government',
    state: 'Tamil Nadu',
    department: 'Tamil Nadu Government (confirm nodal department)',
    userTypes: ['Woman'],
    summaryEn: 'Monthly cash support for eligible women heads of families in Tamil Nadu.',
    summaryTa: 'தமிழ்நாட்டில் தகுதியுள்ள குடும்பத் தலைவியான பெண்களுக்கு மாதாந்திர உதவித் தொகை.',
    benefitEn: `₹1,000 per month, credited directly to the woman's bank account.`,
    benefitTa: '',
    eligibilityEn: `• Woman who is the head of the family on the ration card (or the wife of the male head), aged 21 or above.
• Permanent resident of Tamil Nadu.
• Annual family income below ₹2.5 lakh.
• Reported limits: land under 5 acres wetland or 10 acres dryland, household electricity use under 3,600 units a year, and no car/jeep.
• Elected representatives (except panchayat ward members) and their families are excluded.`,
    eligibilityTa: '',
    documentsEn: `1. Family (ration) card
2. Aadhaar card
3. Bank passbook
4. Other documents as required (for example proof of residence, land documents if the family owns land)`,
    documentsTa: '',
    howToApplyEn: `1. Apply at your ration shop, a registration camp, or an e-Sevai centre, or online on the official portal.
2. Carry the original documents and photocopies.
3. Submit the application; photo and fingerprint may be captured.
4. Check status on the official portal or the helpline.`,
    howToApplyTa: '',
    officialLink: 'https://kmut.tn.gov.in',
    applyLink: 'https://kmut.tn.gov.in',
    status: 'Active',
    lastVerified: '2026-10-18',
    reviewStatus: 'Verified',
  },
  {
    id: 6,
    slug: 'kamarajar-breakfast-scheme',
    shortName: 'Perunthalaivar Kamarajar Breakfast Scheme',
    nameEn: `Perunthalaivar Kamarajar Breakfast Scheme (formerly Chief Minister's Breakfast Scheme)`,
    nameTa: 'பெருந்தலைவர் காமராஜர் காலை உணவுத் திட்டம்',
    level: 'State Government',
    state: 'Tamil Nadu',
    department: 'School Education Department (with Greater Chennai Corporation and Tamil Nadu Corporation for Development of Women)',
    userTypes: ['Student'],
    summaryEn: 'Free breakfast at school for students of Classes 1 to 8 in government and government-aided schools.',
    summaryTa: 'அரசு மற்றும் அரசு உதவி பெறும் பள்ளிகளில் 1 முதல் 8 ஆம் வகுப்பு வரை படிக்கும் மாணவர்களுக்கு இலவசக் காலை உணவு.',
    benefitEn: `• Free breakfast at school for students of Classes 1 to 8.
• On 22 September 2026 the scheme was expanded to Classes 6 to 8 (about 15.3 lakh more students in 15,454 government and aided schools). About 34.6 lakh students in 44,984 schools are now covered.
• Reported menu items include pongal, sambar, uppuma and kichadi, with millet-based dishes twice a week. The menu may change.
• In rural areas and town panchayats, breakfast is prepared at schools by self-help group members. In Chennai it comes from integrated kitchens.`,
    benefitTa: '',
    eligibilityEn: `• Student studying in Classes 1 to 8 in a Tamil Nadu government or government-aided school.
• No income limit has been reported.`,
    eligibilityTa: '',
    documentsEn: 'No documents have been reported as necessary. Students are covered through their school.',
    documentsTa: '',
    howToApplyEn: `1. Check that your child studies in Classes 1 to 8 at a government or government-aided school.
2. Ask the school headmaster to confirm that the school is covered.
3. No separate application has been reported.`,
    howToApplyTa: '',
    // No official link yet in the data sheet: the publishing rule keeps this scheme off the site until one is added.
    officialLink: '',
    applyLink: '',
    status: 'Active',
    lastVerified: '2026-10-19',
    reviewStatus: 'Verified',
  },
  {
    id: 7,
    slug: 'needs',
    shortName: 'NEEDS',
    nameEn: 'NEEDS (New Entrepreneur-cum-Enterprise Development Scheme)',
    nameTa: 'புதிய தொழில்முனைவோர் மற்றும் தொழில் நிறுவன மேம்பாட்டுத் திட்டம் (NEEDS)',
    level: 'State Government',
    state: 'Tamil Nadu',
    department: 'Micro, Small and Medium Enterprises Department, Government of Tamil Nadu',
    userTypes: ['MSME', 'Woman'],
    summaryEn: '25% capital subsidy (up to ₹75 lakh) and 3% interest subvention for first-generation entrepreneurs starting a new enterprise.',
    summaryTa: 'புதிய தொழில் தொடங்கும் முதல் தலைமுறை தொழில்முனைவோருக்கு 25% மூலதன மானியம் (₹75 லட்சம் வரை) மற்றும் 3% வட்டி மானியம்.',
    benefitEn: `• Bank loan for the project of ₹10 lakh to ₹5 crore.
• 25% capital subsidy, up to ₹75 lakh per enterprise.
• 3% annual interest subvention during the loan period.
• A free 1-month entrepreneurship development training (through EDII-TN) is required.`,
    benefitTa: '',
    eligibilityEn: `• First-generation entrepreneur living in Tamil Nadu.
• Educational qualification: degree, diploma, ITI or vocational training.
• Age 21 to 35 years (general). Age 21 to 45 years for women, SC/ST, BC, MBC, ex-servicemen, transgender persons and persons with disabilities.
• A new (greenfield) enterprise, not an existing business.`,
    eligibilityTa: '',
    documentsEn: `1. Degree, diploma, ITI or vocational training certificate
2. Aadhaar card
3. Domicile (residence) certificate
4. Detailed Project Report (DPR)
5. Bank loan sanction letter
6. Caste certificate, if claiming an age relaxation`,
    documentsTa: '',
    howToApplyEn: `1. Apply online on the Tamil Nadu MSME online portal (NEEDS section).
2. The District Task Force Committee, headed by the District Collector, interviews the applicant and recommends the case to the bank.
3. The bank sanctions the loan, and the State Government credits the 25% capital subsidy to the lending bank account.
4. Complete the 1-month entrepreneurship development training.`,
    howToApplyTa: '',
    officialLink: 'https://msmeonline.tn.gov.in',
    applyLink: 'https://msmeonline.tn.gov.in',
    status: 'Active',
    lastVerified: '2026-10-19',
    reviewStatus: 'Verified',
  },
  {
    id: 8,
    slug: 'mahalir-thittam',
    shortName: 'Mahalir Thittam (TNSRLM)',
    nameEn: 'Mahalir Thittam (Tamil Nadu State Rural Livelihoods Mission) - Self Help Groups',
    nameTa: 'மகளிர் திட்டம் (தமிழ்நாடு மாநில ஊரக வாழ்வாதார இயக்கம்) - சுய உதவிக் குழுக்கள்',
    level: 'State Government',
    state: 'Tamil Nadu',
    department: 'Tamil Nadu Corporation for Development of Women (Tamil Nadu State Rural Livelihoods Mission), Rural Development Department',
    userTypes: ['Woman'],
    summaryEn: 'Help for rural women to form self help groups and get savings support, bank loans and livelihood help.',
    summaryTa: 'ஊரகப் பெண்கள் சுய உதவிக் குழுக்களை அமைத்து சேமிப்பு உதவி, வங்கிக் கடன் மற்றும் வாழ்வாதார உதவிகளைப் பெற உதவும் திட்டம்.',
    benefitEn: `• Revolving Fund: a one-time grant of ₹15,000 to a self help group after it is graded.
• Community Investment Fund: a loan to the group through the Panchayat Level Federation at 9% interest for livelihood activities. The amount depends on the group, so confirm it with your District Mission office.
• Vulnerability Reduction Fund: ₹10,000 to ₹25,000 for differently abled and vulnerable persons.
• Bank loans: groups can get term loans and cash credit limits through banks, and prompt repayers can get interest subvention. Confirm the current terms with the bank or Mission office.
• Training for members, and help with savings accounts, insurance and pension products.`,
    benefitTa: '',
    eligibilityEn: `• Women aged 18 to 60 from poor and vulnerable rural families can form a self help group of 12 to 20 members.
• Groups of differently abled or elderly persons can also be formed.
• For a bank loan, the group should be at least 6 months old and have a business plan for its livelihood activity.
• The Mission mainly covers rural areas.`,
    eligibilityTa: '',
    documentsEn: 'No fixed list is published on the pages we reviewed. Ask your Block or District Mission office. Groups usually need members\' identity proof and a group bank account.',
    documentsTa: '',
    howToApplyEn: `1. Contact your Block Mission Manager, the District Mission Management Unit at the District Collectorate, or your Panchayat Level Federation.
2. Form a self help group of 12 to 20 women, or ask to join an existing one.
3. After about 3 months the group is graded and can get the revolving fund.
4. For a bank loan, the group is credit-rated and its business plan is checked.
5. For the Vulnerability Reduction Fund, apply through the Panchayat Level Federation.`,
    howToApplyTa: '',
    officialLink: 'https://ariyalur.nic.in/departments/mahalir-thittam/',
    applyLink: '',
    status: 'Active',
    lastVerified: '2026-10-22',
    reviewStatus: 'Verified',
  },
  {
    id: 9,
    slug: 'day-nrlm',
    shortName: 'DAY-NRLM',
    nameEn: 'DAY-NRLM (Deendayal Antyodaya Yojana - National Rural Livelihoods Mission)',
    nameTa: 'தீன்தயாள் அந்த்யோதயா யோஜனா - தேசிய ஊரக வாழ்வாதார இயக்கம் (DAY-NRLM)',
    level: 'Union/Central Government',
    state: 'All India',
    department: 'Ministry of Rural Development',
    userTypes: ['Woman'],
    summaryEn: 'National programme that organises rural women into self help groups and helps them get savings, subsidised bank loans and livelihood support.',
    summaryTa: 'ஊரகப் பெண்களை சுய உதவிக் குழுக்களாக இணைத்து சேமிப்பு, மானியக் கடன் மற்றும் வாழ்வாதார உதவி வழங்கும் தேசிய திட்டம்.',
    benefitEn: `• Financial support to eligible self help groups and their federations, for internal lending and livelihood activities.
• Subsidised bank loans (interest subvention) for eligible women's groups that follow the scheme rules and repay on time.
• Help with bank accounts, savings and access to bank credit.
The amounts are set by the State Rural Livelihoods Mission. In Tamil Nadu this is the Mahalir Thittam.`,
    benefitTa: '',
    eligibilityEn: `• Rural poor households identified through the approved process.
• Women in rural households who want to join or form a self help group.
• Existing groups that follow the programme's rules.
• Vulnerable groups, including Scheduled Castes, Scheduled Tribes, minorities, persons with disabilities, elderly persons and single women.
• A group generally has 10 to 20 members.`,
    eligibilityTa: '',
    documentsEn: 'No list of documents is published on the page we reviewed. Ask your State Mission office.',
    documentsTa: '',
    howToApplyEn: `1. You do not apply to the central government directly.
2. In Tamil Nadu, contact your Block Mission Manager or District Mission Management Unit (see Mahalir Thittam).
3. Form or join a self help group and follow the steps the Mission gives you.`,
    howToApplyTa: '',
    officialLink: 'https://aajeevika.gov.in/',
    applyLink: '',
    status: 'Active',
    lastVerified: '2026-10-22',
    reviewStatus: 'Verified',
  },
];

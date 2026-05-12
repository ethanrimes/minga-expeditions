// Shared dial-code list used by every WhatsApp picker (profile + checkout on
// web, mobile-web, and mobile). Order: Colombia first since it's the launch
// market, then LatAm in rough population order, then the rest of the world
// alphabetically. Kept hand-maintained because a JSON-from-npm dependency
// for ~50 rows isn't worth the bundle weight.

export interface CountryCode {
  code: string; // e164 dial prefix incl. leading '+'
  iso: string; // ISO 3166-1 alpha-2
  flag: string; // emoji flag
  name: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: '+57', iso: 'CO', flag: '🇨🇴', name: 'Colombia' },
  { code: '+1', iso: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+52', iso: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+593', iso: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+51', iso: 'PE', flag: '🇵🇪', name: 'Peru' },
  { code: '+56', iso: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: '+54', iso: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+55', iso: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+58', iso: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+591', iso: 'BO', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+595', iso: 'PY', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+598', iso: 'UY', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+502', iso: 'GT', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+503', iso: 'SV', flag: '🇸🇻', name: 'El Salvador' },
  { code: '+504', iso: 'HN', flag: '🇭🇳', name: 'Honduras' },
  { code: '+505', iso: 'NI', flag: '🇳🇮', name: 'Nicaragua' },
  { code: '+506', iso: 'CR', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+507', iso: 'PA', flag: '🇵🇦', name: 'Panama' },
  { code: '+1', iso: 'DO', flag: '🇩🇴', name: 'Dominican Republic' },
  { code: '+509', iso: 'HT', flag: '🇭🇹', name: 'Haiti' },
  { code: '+53', iso: 'CU', flag: '🇨🇺', name: 'Cuba' },
  { code: '+1', iso: 'PR', flag: '🇵🇷', name: 'Puerto Rico' },
  { code: '+1', iso: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: '+34', iso: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+33', iso: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+49', iso: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+39', iso: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+351', iso: 'PT', flag: '🇵🇹', name: 'Portugal' },
  { code: '+31', iso: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+32', iso: 'BE', flag: '🇧🇪', name: 'Belgium' },
  { code: '+41', iso: 'CH', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+43', iso: 'AT', flag: '🇦🇹', name: 'Austria' },
  { code: '+44', iso: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+353', iso: 'IE', flag: '🇮🇪', name: 'Ireland' },
  { code: '+45', iso: 'DK', flag: '🇩🇰', name: 'Denmark' },
  { code: '+46', iso: 'SE', flag: '🇸🇪', name: 'Sweden' },
  { code: '+47', iso: 'NO', flag: '🇳🇴', name: 'Norway' },
  { code: '+358', iso: 'FI', flag: '🇫🇮', name: 'Finland' },
  { code: '+48', iso: 'PL', flag: '🇵🇱', name: 'Poland' },
  { code: '+30', iso: 'GR', flag: '🇬🇷', name: 'Greece' },
  { code: '+90', iso: 'TR', flag: '🇹🇷', name: 'Turkey' },
  { code: '+972', iso: 'IL', flag: '🇮🇱', name: 'Israel' },
  { code: '+27', iso: 'ZA', flag: '🇿🇦', name: 'South Africa' },
  { code: '+20', iso: 'EG', flag: '🇪🇬', name: 'Egypt' },
  { code: '+234', iso: 'NG', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', iso: 'KE', flag: '🇰🇪', name: 'Kenya' },
  { code: '+212', iso: 'MA', flag: '🇲🇦', name: 'Morocco' },
  { code: '+91', iso: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+86', iso: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+81', iso: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+82', iso: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+66', iso: 'TH', flag: '🇹🇭', name: 'Thailand' },
  { code: '+62', iso: 'ID', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+63', iso: 'PH', flag: '🇵🇭', name: 'Philippines' },
  { code: '+65', iso: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '+61', iso: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+64', iso: 'NZ', flag: '🇳🇿', name: 'New Zealand' },
];

export const DEFAULT_COUNTRY_CODE = '+57'; // Colombia.

export function findCountry(code: string, iso?: string): CountryCode | undefined {
  if (iso) {
    const exact = COUNTRY_CODES.find((c) => c.iso === iso);
    if (exact) return exact;
  }
  return COUNTRY_CODES.find((c) => c.code === code);
}

export function searchCountries(query: string): CountryCode[] {
  const q = query.trim().toLowerCase();
  if (!q) return COUNTRY_CODES;
  const digitsOnly = q.replace(/^\+/, '').replace(/\D/g, '');
  return COUNTRY_CODES.filter((c) => {
    if (c.name.toLowerCase().includes(q)) return true;
    if (c.iso.toLowerCase().includes(q)) return true;
    if (digitsOnly && c.code.replace('+', '').startsWith(digitsOnly)) return true;
    return false;
  });
}

interface PhoneMockupProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PhoneMockup({ size = 'lg', className = '' }: PhoneMockupProps) {
  const widths = { sm: 200, md: 250, lg: 300 };
  const w = widths[size];
  const h = Math.round(w * 2.05);
  const r = Math.round(w * 0.12);

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 300 615"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="TailorBook app mockup"
    >
      {/* Phone body */}
      <rect x="2" y="2" width="296" height="611" rx="38" fill="#1A1730" stroke="#3D3868" strokeWidth="2"/>
      <rect x="10" y="10" width="280" height="595" rx="32" fill="#0F0D1E"/>

      {/* Dynamic island */}
      <rect x="110" y="22" width="80" height="18" rx="9" fill="#1A1730"/>

      {/* Status bar */}
      <text x="22" y="52" fill="rgba(255,255,255,0.5)" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="500">9:41</text>
      <g transform="translate(240,42)">
        {/* Signal bars */}
        <rect x="0" y="6" width="3" height="6" rx="1" fill="rgba(255,255,255,0.6)"/>
        <rect x="5" y="4" width="3" height="8" rx="1" fill="rgba(255,255,255,0.6)"/>
        <rect x="10" y="2" width="3" height="10" rx="1" fill="rgba(255,255,255,0.6)"/>
        <rect x="15" y="0" width="3" height="12" rx="1" fill="rgba(255,255,255,0.25)"/>
        {/* Battery */}
        <rect x="22" y="2" width="18" height="10" rx="2" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2"/>
        <rect x="40" y="5" width="2" height="4" rx="1" fill="rgba(255,255,255,0.5)"/>
        <rect x="23.5" y="3.5" width="13" height="7" rx="1" fill="rgba(255,255,255,0.6)"/>
      </g>

      {/* App header */}
      <rect x="10" y="62" width="280" height="52" fill="#4B3FA0"/>
      <text x="24" y="94" fill="white" fontSize="16" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" letterSpacing="-0.3">TailorBook</text>

      {/* Bell icon (header right) */}
      <g transform="translate(256, 79)">
        <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.15)"/>
        <path d="M12 7a5 5 0 0 1 5 5v2.5l1.5 1.5H5.5L7 14.5V12a5 5 0 0 1 5-5z" fill="white" fillOpacity="0.9"/>
        <circle cx="12" cy="19" r="1.5" fill="white" fillOpacity="0.9"/>
      </g>

      {/* Search bar */}
      <rect x="22" y="124" width="256" height="32" rx="10" fill="#1E1A35"/>
      <text x="42" y="144" fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="Inter, sans-serif">Search customers…</text>
      <circle cx="33" cy="140" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none"/>
      <line x1="36.5" y1="143.5" x2="39" y2="146" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>

      {/* Section label */}
      <text x="22" y="177" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="600" letterSpacing="0.08em">UPCOMING DELIVERIES</text>

      {/* --- Customer Card 1 (Urgent) --- */}
      <rect x="22" y="186" width="256" height="72" rx="12" fill="#1E1A35" stroke="#EF4444" strokeWidth="1" strokeOpacity="0.4"/>
      {/* Avatar */}
      <circle cx="46" cy="222" r="16" fill="#4B3FA0"/>
      <text x="46" y="227" fill="white" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="700" textAnchor="middle">EO</text>
      {/* Name & details */}
      <text x="70" y="213" fill="rgba(255,255,255,0.9)" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="600">Emeka Okonkwo</text>
      <text x="70" y="228" fill="rgba(255,255,255,0.45)" fontSize="10" fontFamily="Inter, sans-serif">Senator Suit • 3 pieces</text>
      {/* Urgent badge */}
      <rect x="70" y="235" width="52" height="16" rx="8" fill="rgba(239,68,68,0.2)" stroke="rgba(239,68,68,0.4)" strokeWidth="0.8"/>
      <text x="96" y="246" fill="#FCA5A5" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="700" textAnchor="middle" letterSpacing="0.03em">TOMORROW</text>
      {/* Price */}
      <text x="266" y="220" fill="rgba(255,255,255,0.6)" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="end">₦45,000</text>
      <text x="266" y="233" fill="#EF4444" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="500" textAnchor="end">Bal: ₦15k</text>

      {/* --- Customer Card 2 (Ready) --- */}
      <rect x="22" y="268" width="256" height="72" rx="12" fill="#1E1A35" stroke="#10B981" strokeWidth="1" strokeOpacity="0.3"/>
      <circle cx="46" cy="304" r="16" fill="#065F46"/>
      <text x="46" y="309" fill="white" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="700" textAnchor="middle">AM</text>
      <text x="70" y="295" fill="rgba(255,255,255,0.9)" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="600">Aisha Musa</text>
      <text x="70" y="310" fill="rgba(255,255,255,0.45)" fontSize="10" fontFamily="Inter, sans-serif">Agbada Set • 2 pieces</text>
      <rect x="70" y="317" width="42" height="16" rx="8" fill="rgba(16,185,129,0.2)" stroke="rgba(16,185,129,0.4)" strokeWidth="0.8"/>
      <text x="91" y="328" fill="#6EE7B7" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="700" textAnchor="middle" letterSpacing="0.03em">READY ✓</text>
      <text x="266" y="302" fill="rgba(255,255,255,0.6)" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="end">₦60,000</text>
      <text x="266" y="315" fill="#6EE7B7" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="500" textAnchor="end">Fully Paid</text>

      {/* --- Customer Card 3 (In Progress) --- */}
      <rect x="22" y="350" width="256" height="72" rx="12" fill="#1E1A35" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
      <circle cx="46" cy="386" r="16" fill="#362D78"/>
      <text x="46" y="391" fill="white" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="700" textAnchor="middle">CA</text>
      <text x="70" y="377" fill="rgba(255,255,255,0.9)" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="600">Charles Adeyemi</text>
      <text x="70" y="392" fill="rgba(255,255,255,0.45)" fontSize="10" fontFamily="Inter, sans-serif">Kaftan • 1 piece</text>
      <rect x="70" y="399" width="58" height="16" rx="8" fill="rgba(245,158,11,0.2)" stroke="rgba(245,158,11,0.3)" strokeWidth="0.8"/>
      <text x="99" y="410" fill="#FCD34D" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="700" textAnchor="middle" letterSpacing="0.02em">SEWING</text>
      <text x="266" y="384" fill="rgba(255,255,255,0.6)" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="end">₦28,000</text>
      <text x="266" y="397" fill="#FCD34D" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="500" textAnchor="end">Due in 5 days</text>

      {/* Quick stats strip */}
      <rect x="22" y="434" width="256" height="56" rx="12" fill="#1A1446"/>
      <text x="55" y="456" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle" letterSpacing="0.06em">ACTIVE</text>
      <text x="55" y="472" fill="white" fontSize="16" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" textAnchor="middle">24</text>
      <line x1="86" y1="444" x2="86" y2="480" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="131" y="456" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle" letterSpacing="0.06em">DUE THIS WEEK</text>
      <text x="131" y="472" fill="#FCD34D" fontSize="16" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" textAnchor="middle">7</text>
      <line x1="176" y1="444" x2="176" y2="480" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="223" y="456" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle" letterSpacing="0.06em">READY</text>
      <text x="223" y="472" fill="#6EE7B7" fontSize="16" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" textAnchor="middle">3</text>

      {/* Bottom navigation */}
      <rect x="10" y="504" width="280" height="65" fill="#141128"/>
      <rect x="10" y="503" width="280" height="1" fill="rgba(255,255,255,0.06)"/>

      {/* Home icon */}
      <g transform="translate(30, 515)">
        <rect x="0" y="0" width="50" height="44" rx="8" fill="rgba(75,63,160,0.25)"/>
        <path d="M25 8l14 12v14H11V20L25 8z" stroke="#A78BFA" strokeWidth="1.5" fill="none"/>
        <rect x="19" y="24" width="12" height="10" rx="2" stroke="#A78BFA" strokeWidth="1.2" fill="none"/>
      </g>

      {/* Customers icon */}
      <g transform="translate(90, 515)">
        <rect x="0" y="0" width="50" height="44" rx="8" fill="transparent"/>
        <circle cx="25" cy="17" r="8" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none"/>
        <path d="M10 40c0-8.3 6.7-15 15-15s15 6.7 15 15" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none"/>
      </g>

      {/* Jobs icon */}
      <g transform="translate(150, 515)">
        <rect x="0" y="0" width="50" height="44" rx="8" fill="transparent"/>
        <rect x="11" y="11" width="28" height="26" rx="3" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none"/>
        <line x1="17" y1="20" x2="33" y2="20" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
        <line x1="17" y1="26" x2="27" y2="26" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
      </g>

      {/* Settings icon */}
      <g transform="translate(210, 515)">
        <rect x="0" y="0" width="50" height="44" rx="8" fill="transparent"/>
        <circle cx="25" cy="24" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none"/>
        <circle cx="25" cy="24" r="4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" fill="none"/>
      </g>

      {/* Home indicator */}
      <rect x="115" y="580" width="70" height="4" rx="2" fill="rgba(255,255,255,0.25)"/>

      {/* Phone side buttons */}
      <rect x="-2" y="120" width="4" height="30" rx="2" fill="#2D2850"/>
      <rect x="-2" y="160" width="4" height="50" rx="2" fill="#2D2850"/>
      <rect x="-2" y="220" width="4" height="50" rx="2" fill="#2D2850"/>
      <rect x="298" y="150" width="4" height="70" rx="2" fill="#2D2850"/>
    </svg>
  );
}

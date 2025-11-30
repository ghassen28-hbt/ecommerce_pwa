function Logopanier({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* contour du chariot */}
      <path
        d="M4 5H5.5L7.2 15.2C7.37 16.23 8.25 17 9.29 17H16.5C17.52 17 18.39 16.26 18.59 15.26L19.7 9.7C19.93 8.54 19.04 7.5 17.86 7.5H7.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* roues */}
      <circle
        cx="10"
        cy="19.5"
        r="1.4"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle
        cx="17"
        cy="19.5"
        r="1.4"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      {/* poignée stylisée */}
      <path
        d="M9 4.8C9.4 3.6 10.4 2.8 11.7 2.8C13.2 2.8 14.4 3.9 14.7 5.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* petit glow interne */}
      <path
        d="M8.5 9.2H18"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

export default Logopanier;

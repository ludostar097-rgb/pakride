import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export const CarIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.4-1.7-1.1-2.2L18 8.5C17.3 7.6 16.2 7 15 7H9C7.8 7 6.7 7.6 6 8.5L3.1 10.8C2.4 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2.5" />
    <path d="M9.5 17h5" />
    <circle cx="17" cy="17" r="2.5" />
  </svg>
);

export const MotorcycleIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Wheels */}
    <circle cx="5" cy="17" r="3" />
    <circle cx="19" cy="17" r="3" />
    {/* Frame & Engine */}
    <path d="M5 17h4l3-5 4 1" />
    {/* Fork to front wheel */}
    <path d="M16 8l3 9" />
    {/* Handlebars */}
    <path d="M14 6h3" />
    {/* Fuel tank & seat */}
    <path d="M9 12h5l-2-4H8l1 4z" />
  </svg>
);

export const RickshawIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Front Wheel */}
    <circle cx="5" cy="18" r="2.5" />
    {/* Rear Wheel */}
    <circle cx="18" cy="18" r="2.5" />
    {/* Rickshaw Cabin Canopy & Windshield */}
    <path d="M5 15.5l1.5-6.5h1.5l3-3h7a2 2 0 0 1 2 2v7.5" />
    {/* Front fender & fork */}
    <path d="M4 18h2" />
    <path d="M6 15.5l2-2.5" />
    {/* Passenger opening & chassis */}
    <path d="M11 18h4.5" />
    <path d="M12 9v5h7" />
    {/* Handlebar */}
    <path d="M7 9h2" />
  </svg>
);

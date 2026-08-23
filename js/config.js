// Shared config for the password gate and RSVP backend calls.
//
// Endpoints below are base64-encoded purely so they aren't plain, grep-able
// strings in the page source — this is NOT real security. It's trivially
// reversible (see the atob() below) and the real URL is always visible in the
// browser's Network tab the moment a request actually fires. Real protection
// comes from the password check happening server-side (see
// apps-script/password-backend.gs), not from hiding these URLs.

const RSVP_ENDPOINT_B64 =
  'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J6TjBULWlydVI0UEQ3Vk4zNTVxQkhZZUVXanFTOTBUaTdDNF90RXowNGh4TWhpNFhfcmw4d2RPTC15REwteVRicy9leGVj';

export const RSVP_ENDPOINT = atob(RSVP_ENDPOINT_B64);

const GATE_ENDPOINT_B64 =
  'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J5R2NWcTZoVUp2ajBZWVFWZlVOaVc1V016aEl5SVpSR28zZm42YjNneGF0TzJYbjRfaXR3SmU0RnIzVEdUMmlHbG4vZXhlYw==';

export const GATE_ENDPOINT = atob(GATE_ENDPOINT_B64);

// Not a real secret either — just filters out casual/bot traffic hitting the
// endpoints directly. Must match SITE_KEY in both apps-script/*.gs files.
export const SITE_KEY = 'movid-rsvp-2027';

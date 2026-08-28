// Sky the couple met under: 14 May 2015, 21:30 PDT (JD 2457157.6875), from
// 32.87°N, 117.25°W. Port the algorithm, not a screenshot — keep these constants.
const STARS = [
  ["Arcturus",213.92,19.18,-0.05],["Spica",201.30,-11.16,0.98],["Vega",279.23,38.78,0.03],
  ["Antares",247.35,-26.43,1.06],["Regulus",152.09,11.97,1.36],["Denebola",177.26,14.57,2.14],
  ["Algieba",154.99,19.84,2.08],["Zosma",168.53,20.52,2.56],["Dubhe",165.93,61.75,1.79],
  ["Merak",165.46,56.38,2.37],["Phecda",178.46,53.69,2.44],["Megrez",183.86,57.03,3.31],
  ["Alioth",193.51,55.96,1.77],["Mizar",200.98,54.93,2.23],["Alkaid",206.89,49.31,1.86],
  ["Polaris",37.95,89.26,1.98],["Kochab",222.68,74.16,2.08],["Thuban",211.10,64.38,3.65],
  ["Capella",79.17,46.00,0.08],["Menkalinan",89.88,44.95,1.90],["Mirfak",51.08,49.86,1.79],
  ["Pollux",116.33,28.03,1.14],["Castor",113.65,31.89,1.58],["Procyon",114.83,5.22,0.34],
  ["Sirius",101.29,-16.72,-1.46],["Adhara",104.66,-28.97,1.50],["Wezen",107.10,-26.39,1.83],
  ["Alphard",141.90,-8.66,1.98],["Betelgeuse",88.79,7.41,0.50],["Rigel",78.63,-8.20,0.13],
  ["Bellatrix",81.28,6.35,1.64],["Alnilam",84.05,-1.20,1.69],["Alnitak",85.19,-1.94,1.74],
  ["Mintaka",83.00,-0.30,2.23],["Saiph",86.94,-9.67,2.06],["Aldebaran",68.98,16.51,0.85],
  ["Elnath",81.57,28.61,1.65],["Altair",297.70,8.87,0.76],["Deneb",310.36,45.28,1.25],
  ["Alphecca",233.67,26.71,2.22],["Izar",221.25,27.07,2.35],["Muphrid",208.67,18.40,2.68],
  ["Vindemiatrix",195.54,10.96,2.83],["Porrima",190.42,-1.45,2.74],["Gienah",183.95,-17.54,2.59],
  ["Algorab",187.47,-16.52,2.94],["Zubenelgenubi",222.72,-16.04,2.75],["Zubeneschamali",229.25,-9.38,2.61],
  ["Shaula",263.40,-37.10,1.62],["Sabik",257.59,-15.72,2.43],["Rasalhague",263.73,12.56,2.08],
  ["Eltanin",269.15,51.49,2.23],["Unukalhai",236.07,6.43,2.63],["Menkent",211.67,-36.37,2.06],
  ["CorCaroli",194.01,38.32,2.89],["Talitha",134.80,48.04,3.14],["Alsuhail",136.99,-43.43,2.21],
  ["Naos",120.90,-40.00,2.21],["KausAustralis",276.04,-34.38,1.85],["Nunki",283.82,-26.30,2.05]
];

const LINES = [
  ["Dubhe","Merak"],["Merak","Phecda"],["Phecda","Megrez"],["Megrez","Alioth"],["Alioth","Mizar"],["Mizar","Alkaid"],["Megrez","Dubhe"],
  ["Regulus","Algieba"],["Algieba","Zosma"],["Zosma","Denebola"],["Regulus","Denebola"],
  ["Spica","Porrima"],["Porrima","Vindemiatrix"],
  ["Arcturus","Muphrid"],["Arcturus","Izar"],["Izar","Alphecca"],
  ["Bellatrix","Alnilam"],["Alnilam","Betelgeuse"],["Mintaka","Alnilam"],["Alnilam","Alnitak"],["Mintaka","Rigel"],["Alnitak","Saiph"],
  ["Castor","Pollux"],["Antares","Shaula"],["Gienah","Algorab"],
  ["Zubenelgenubi","Zubeneschamali"],["Polaris","Kochab"],["Kochab","Thuban"]
];

const WEDDING_DATE_ISO = '2027-05-14T16:00:00';

function altaz(raDeg, decDeg, jd, latDeg, lonDeg) {
  const d2r = Math.PI / 180;
  const T = (jd - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
  gmst = ((gmst % 360) + 360) % 360;
  const lst = ((gmst + lonDeg) % 360 + 360) % 360;
  const H = (lst - raDeg) * d2r;
  const dec = decDeg * d2r, lat = latDeg * d2r;
  const alt = Math.asin(Math.max(-1, Math.min(1, Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(H))));
  const az = Math.atan2(-Math.sin(H) * Math.cos(dec), Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(H));
  return { alt: alt / d2r, az: (((az / d2r) % 360) + 360) % 360 };
}

function drawSky(canvas) {
  if (!canvas || !canvas.parentElement) return;
  const w = canvas.parentElement.clientWidth, h = canvas.parentElement.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const jd = 2457157.6875, lat = 32.87, lon = -117.25;
  const cx = w / 2, cy = h * 0.46, R = Math.max(w, h) * 0.8;
  const pos = {};
  for (const [name, ra, dec] of STARS) {
    const { alt, az } = altaz(ra, dec, jd, lat, lon);
    if (alt < 1) continue;
    const r = R * (90 - alt) / 90, a = (az - 12) * Math.PI / 180;
    pos[name] = [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  }

  ctx.strokeStyle = 'rgba(245,217,160,.15)';
  ctx.lineWidth = 0.7;
  for (const [a, b] of LINES) {
    if (!pos[a] || !pos[b]) continue;
    ctx.beginPath();
    ctx.moveTo(pos[a][0], pos[a][1]);
    ctx.lineTo(pos[b][0], pos[b][1]);
    ctx.stroke();
  }
  for (const [name, ra, dec, mag] of STARS) {
    const p = pos[name];
    if (!p) continue;
    const fade = Math.min(1, Math.max(0.15, p[1] / (h * 0.5)));
    const rad = Math.max(0.7, 2.5 - mag * 0.55);
    const alpha = Math.max(0.25, Math.min(0.95, 1.05 - mag * 0.17)) * fade;
    const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], rad * 4.5);
    g.addColorStop(0, `rgba(255,244,222,${alpha})`);
    g.addColorStop(0.35, `rgba(245,217,160,${alpha * 0.35})`);
    g.addColorStop(1, 'rgba(245,217,160,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p[0], p[1], rad * 4.5, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = `rgba(255,248,236,${alpha})`;
    ctx.beginPath();
    ctx.arc(p[0], p[1], rad, 0, 6.2832);
    ctx.fill();
  }
}

function pad(n, width) {
  return String(Math.max(0, n)).padStart(width, '0');
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('stod-root');
  const envelope = document.getElementById('stod-envelope');
  const sky = document.getElementById('stod-sky');
  const calendarBtn = document.getElementById('stod-calendar-btn');

  function draw() {
    drawSky(sky);
  }

  function openEnvelope() {
    if (root.classList.contains('stod--open')) return;
    root.classList.add('stod--open');
    setTimeout(draw, 400);
  }

  envelope.addEventListener('click', openEnvelope);
  envelope.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openEnvelope();
    }
  });

  window.addEventListener('resize', draw);
  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);

  const target = new Date(WEDDING_DATE_ISO).getTime();
  const daysEl = document.getElementById('stod-cd-days');
  const hoursEl = document.getElementById('stod-cd-hours');
  const minsEl = document.getElementById('stod-cd-mins');
  const secsEl = document.getElementById('stod-cd-secs');

  function tickCountdown() {
    const s = Math.floor(Math.max(0, target - Date.now()) / 1000);
    daysEl.textContent = pad(Math.floor(s / 86400), 3);
    hoursEl.textContent = pad(Math.floor(s / 3600) % 24, 2);
    minsEl.textContent = pad(Math.floor(s / 60) % 60, 2);
    secsEl.textContent = pad(s % 60, 2);
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  if (calendarBtn) {
    calendarBtn.addEventListener('click', () => {
      calendarBtn.textContent = 'Saved · see you there';
    });
  }
});

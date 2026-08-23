import { settings, events, hotels } from './content.js';

function renderSchedule() {
  const list = document.getElementById('schedule-list');
  if (!list) return;

  for (const event of events) {
    const item = document.createElement('li');
    item.className = `event event--${event.tone}`;

    const time = document.createElement('div');
    time.className = 'event__time';
    time.textContent = `${event.day} ${event.time}`;

    const body = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'event__title';
    title.textContent = event.title;
    const sublabel = document.createElement('div');
    sublabel.className = 'event__sublabel';
    sublabel.textContent = event.sublabel;
    body.append(title, sublabel);

    const audience = document.createElement('div');
    audience.className = 'event__audience';
    audience.textContent = event.audience;

    item.append(time, body, audience);
    list.append(item);
  }
}

function renderHotels() {
  const grid = document.getElementById('hotel-list');
  if (!grid) return;

  for (const hotel of hotels) {
    const card = document.createElement('a');
    card.className = `hotel-card hotel-card--${hotel.accent}`;
    card.href = hotel.href;
    if (/^https?:\/\//.test(hotel.href)) {
      card.target = '_blank';
      card.rel = 'noopener';
    }

    const photo = document.createElement('div');
    photo.className = 'hotel-card__photo';
    if (hotel.photo) {
      photo.classList.add('hotel-card__photo--image');
      photo.style.backgroundImage = `url('${hotel.photo}')`;
      photo.style.backgroundSize = 'cover';
      photo.style.backgroundPosition = 'center';
    } else {
      const photoLabel = document.createElement('span');
      photoLabel.textContent = hotel.photoLabel;
      photo.append(photoLabel);
    }

    const name = document.createElement('div');
    name.className = 'hotel-card__name';
    name.textContent = hotel.name;

    const detail = document.createElement('div');
    detail.className = 'hotel-card__detail';
    hotel.detail.forEach((line, i) => {
      if (i > 0) detail.append(document.createElement('br'));
      detail.append(document.createTextNode(line));
    });

    const reserve = document.createElement('div');
    reserve.className = 'hotel-card__reserve';
    reserve.append(document.createTextNode('Reserve '));
    const arrow = document.createElement('span');
    arrow.className = 'hotel-card__reserve-arrow';
    arrow.textContent = '→';
    reserve.append(arrow);

    card.append(photo, name, detail, reserve);
    grid.append(card);
  }
}

function applySettings() {
  const swatches = document.getElementById('attire-swatches');
  if (swatches && !settings.showPaletteSwatches) {
    swatches.hidden = true;
  }
}

renderSchedule();
renderHotels();
applySettings();

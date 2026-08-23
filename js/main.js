import { settings, events, hotels } from './content.js';

function renderSchedule() {
  const list = document.getElementById('schedule-list');
  if (!list) return;

  events.forEach((event, index) => {
    const item = document.createElement('li');
    item.className = `event event--${event.tone}`;

    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'event__row';

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

    row.append(time, body, audience);
    item.append(row);

    if (event.details) {
      const detailsId = `event-details-${index}`;
      row.setAttribute('aria-expanded', 'false');
      row.setAttribute('aria-controls', detailsId);

      const chevron = document.createElement('span');
      chevron.className = 'event__chevron';
      chevron.setAttribute('aria-hidden', 'true');
      row.append(chevron);

      const detailsWrap = document.createElement('div');
      detailsWrap.className = 'event__details-wrap';
      detailsWrap.id = detailsId;

      const details = document.createElement('div');
      details.className = 'event__details';
      const detailsText = document.createElement('p');
      detailsText.textContent = event.details;
      details.append(detailsText);
      detailsWrap.append(details);
      item.append(detailsWrap);

      row.addEventListener('click', () => {
        const isOpen = item.classList.toggle('is-open');
        row.setAttribute('aria-expanded', String(isOpen));
      });
    }

    list.append(item);
  });
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

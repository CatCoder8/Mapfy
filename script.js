'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class Workout {
  date = new Date();
  id = 'id' + Math.random().toString(16).slice(2);

  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
}

// Managing data

class Running extends Workout {
  type = 'running';

  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.#calcPace();
  }

  #calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(distance, duration, coords, elevation) {
    super(distance, duration, coords);
    this.elevation = elevation;
    this.#calcSpeed();
  }

  #calcSpeed() {
    const MINSINSECS = 60;

    this.speed = this.duration / (this.distance / MINSINSECS);
    return this.speed;
  }
}

// ------------------------------------------------------------------------------------------
// App Architecture

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workout = [];

  constructor() {
    this.#getPosition();

    // Submitting form
    form.addEventListener('submit', this.#newWorkout.bind(this));

    // Toggling between running and cycling form
    inputType.addEventListener('change', this.#toggleElevationField);
  }

  #loadMap(pos) {
    const coords = [pos.coords.latitude, pos.coords.longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.#map);

    this.#map.on('click', this.#showForm.bind(this));
  }

  #getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this.#loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  #showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  #toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  #clearInput() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
  }

  #newWorkout(e) {
    e.preventDefault();

    // Validation

    // Getting value
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    const validate = function (...values) {
      return values.every(val => Number.isFinite(val) && val >= 0);
    };

    // If valid then create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (!validate(distance, duration, cadence)) return alert('Invalid input');

      workout = new Running(distance, duration, [lat, lng], cadence);
    }

    // If valid then create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (!validate(distance, duration, elevation))
        return alert('Invalid input');

      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }

    this.#workout.push(workout);
    console.log(workout);

    this.#renderMark(workout);
    this.#clearInput();
  }

  #renderMark(workout) {
    const marker = L.marker(workout.coords).addTo(this.#map);
    marker
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
          content: 'Workout',
        })
      )
      .openPopup();
  }
}

const app = new App();

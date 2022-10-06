'use strict';

class Workout {
  date = new Date();
  id = 'id' + Math.random().toString(16).slice(2);

  // prettier-ignore
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
}

// Managing data

class Running extends Workout {
  type = 'running';
  workoutDescription = `🏃‍♂️${this.type[0].toUpperCase()}${this.type.slice(1)} on 
  ${this.months[this.date.getMonth()]} ${this.date.getDate()}`;

  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  workoutDescription = `🚴‍♀️${this.type[0].toUpperCase()}${this.type.slice(
    1
  )} on ${this.months[this.date.getMonth()]} ${this.date.getDate()}`;

  constructor(distance, duration, coords, elevation) {
    super(distance, duration, coords);
    this.elevation = elevation;
    this.calcSpeed();
  }

  calcSpeed() {
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
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    this.#getPosition();
    this.#readLocalStorage();

    // Submitting form
    form.addEventListener('submit', this.#newWorkout.bind(this));

    // Toggling between running and cycling form
    inputType.addEventListener('change', this.#toggleElevationField);

    // Focus on workout location on map
    containerWorkouts.addEventListener('click', this.#focusLocation.bind(this));
  }

  #loadMap(pos) {
    const coords = [pos.coords.latitude, pos.coords.longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.#map);

    this.#map.on('click', this.#showForm.bind(this));
    this.#workouts.forEach(workout => this.#renderWorkoutMark(workout));
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

  #hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    setTimeout(() => (form.style.display = 'grid'), 1000);
    form.classList.add('hidden');
  }

  #newWorkout(e) {
    e.preventDefault();

    // Validation

    // Getting value
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;

    const validate = function (...values) {
      return values.every(val => Number.isFinite(val) && val >= 0);
    };

    // If valid then create running object
    let workout;

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

    // Add new object to wokrout array
    this.#workouts.push(workout);

    // Add markings on map
    this.#renderWorkoutMark(workout);

    // Add workout form on side bar
    this.#renderWorkoutForm(workout);

    // Hide workout form + clear input fields
    this.#hideForm();

    // Store in local storage
    this.#setLocalStorage();
  }

  #renderWorkoutMark(workout) {
    const marker = L.marker(workout.coords).addTo(this.#map);
    marker
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
          content: workout.workoutDescription,
        })
      )
      .openPopup();
  }

  #renderWorkoutForm(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.workoutDescription}</h2>
    <div class="workout__details">
      <span class="workout__icon">${workout.type ? '🏃' : '🚴‍♀️'}</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'running')
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;

    if (workout.type === 'cycling')
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevation}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;

    form.insertAdjacentHTML('afterend', html);
  }

  #focusLocation(e) {
    if (!this.#map) return;
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  #setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  #readLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(workout => this.#renderWorkoutForm(workout));
  }

  #clearStorage() {
    localStorage.clear();
    location.reload();
  }
}

const app = new App();

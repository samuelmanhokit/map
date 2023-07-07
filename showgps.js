/*
//const messageDiv = document.createElement('div');
//messageDiv.id = 'message';
//messageDiv.style.padding = '35px';
//messageDiv.style.backgroundColor = 'white';
//messageDiv.style.position = 'absolute';
//messageDiv.style.top = '10px';
//messageDiv.style.right = '10px';
//messageDiv.style.zIndex = 1000;
//document.body.appendChild(messageDiv);
let map;
let currentLocationMarker;
let busStops = [];
let timeNearBusStop = null;
let isNearBusStop = false;

function initmap(){
  map = L.map('map', setView())
}

function updateMessage(text) {
  const popup = L.popup()
    .setContent(text);
  currentLocationMarker.bindPopup(popup).openPopup();
}

const map = L.map("map");
map.setView([51.505, -0.09], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const currentLocationMarker = L.marker([0, 0]).addTo(map);

// Fetch bus stops within a bounding box using the Overpass API
async function fetchBusStops(minLat, minLon, maxLat, maxLon) {
  const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json][timeout:25];(node["public_transport"="platform"]["bus"="yes"](${minLat},${minLon},${maxLat},${maxLon}););out;`;
  try {
    const response = await fetch(overpassUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data.elements;
  } catch (error) {
    console.error("Error fetching bus stops:", error);
    return null;
  }
}

async function checkNearBusStop(lat, lon) {
  /
  const buffer = 0.002; //200metres
  const minLat = lat - buffer;
  const minLon = lon - buffer;
  const maxLat = lat + buffer;
  const maxLon = lon + buffer;

  const busStops = await fetchBusStops(minLat, minLon, maxLat, maxLon);

  if (!busStops) {
    console.error("Unable to fetch bus stops.");
    return;
  }

  const radius = 50; // In meters
  const userLocation = L.latLng(lat, lon);

  for (const busStop of busStops) {
    const busStopLocation = L.latLng(busStop.lat, busStop.lon);
    const distance = userLocation.distanceTo(busStopLocation);

    if (distance <= radius) {
      updateMessage("You are located at the bus stop.");
      return;
    }
  }
  updateMessage("You are not near any bus stops.");
}

function updateLocation(position) {
  const lat = position.coords.lat;
  const lon = position.coords.lon;

  currentLocationMarker.setLatLng([lat, lon]);
  map.setView([lat, lon], 16);

  checkNearBusStop(lat, lon);
}

//navigator.geolocation.getCurrentPosition(updateLocation);
const options = {
  enableHighAccuracy: true,
  maximumAge: 5000, // Accept cached position up to 5 seconds old
  timeout: 5000, // Timeout for getting a new position
};

*/
// Add a div element to display messages on the web page
const messageDiv = document.createElement('div');
messageDiv.id = 'message';
messageDiv.style.padding = '10px';
messageDiv.style.backgroundColor = 'white';
messageDiv.style.position = 'absolute';
messageDiv.style.top = '10px';
messageDiv.style.right = '10px';
messageDiv.style.zIndex = 1000;
document.body.appendChild(messageDiv);

// Function to update the message displayed on the web page
function updateMessage(text) {
  messageDiv.innerText = text;
}

const map = L.map("map");
map.setView([51.505, -0.09], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const currentLocationMarker = L.marker([0, 0]).addTo(map);

// Fetch bus stops within a bounding box using the Overpass API
async function fetchBusStops(minLat, minLon, maxLat, maxLon) {
  const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json][timeout:25];(node["public_transport"="platform"]["bus"="yes"](${minLat},${minLon},${maxLat},${maxLon}););out;`;
  try {
    const response = await fetch(overpassUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data.elements;
  } catch (error) {
    console.error("Error fetching bus stops:", error);
    return null;
  }
}

// Check if the user's location is near any bus stops
async function checkNearBusStop(latitude, longitude) {
  // Define a bounding box around the user's location
  const buffer = 0.005; // In degrees (approx. 500 meters)
  const minLat = latitude - buffer;
  const minLon = longitude - buffer;
  const maxLat = latitude + buffer;
  const maxLon = longitude + buffer;

  // Fetch bus stops within the bounding box
  const busStops = await fetchBusStops(minLat, minLon, maxLat, maxLon);

  if (!busStops) {
    console.error("Unable to fetch bus stops.");
    return;
  }

  // Check if the user is near any bus stops (within a specified distance)
  const radius = 50; // In meters
  const userLocation = L.latLng(latitude, longitude);

  for (const busStop of busStops) {
    const busStopLocation = L.latLng(busStop.lat, busStop.lon);
    const distance = userLocation.distanceTo(busStopLocation);

    if (distance <= radius) {
      updateMessage("You are located at the bus stop.");
      return;
    }
  }
  updateMessage("You are not near any bus stops.");
}

function updateLocation(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  currentLocationMarker.setLatLng([latitude, longitude]);
  map.setView([latitude, longitude], 16);

  checkNearBusStop(latitude, longitude);
}

let watchId;

function updategps(){
  if ('geolocation'in navigator){
    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000 //if cannot update in 5 seconds, casuing error
     };
     watchId = navigator.geolocation.watchPosition(updateLocation, handleError, options);
  }else{
    updateMessage("Geolocation is not supported.");
  }
}

function handleError(){
  switch(error.code){
    case error.PERMISSION_DENIED:
      updateMessage("User denied the request for geolocation");
      break;
    case error.TIMEOUT:
      updateMessage("Resquest to get location timed out")
      break;
    case error.POSITION_UNAVAILABLE:
      updateMessage("Location information is unavailable")
      break;
    case error.UNKNOWN_ERROR:
      updateMessage("An unknown error occured")
      break;
    }
  }

updategps();
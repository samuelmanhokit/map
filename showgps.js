const messageDiv = document.createElement('div');
messageDiv.id = 'message';
messageDiv.style.padding = '10px';
messageDiv.style.backgroundColor = 'white';
messageDiv.style.position = 'absolute';
messageDiv.style.top = '10px';
messageDiv.style.right = '10px';
messageDiv.style.zIndex = 1000;
document.body.appendChild(messageDiv);

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

async function checkNearBusStop(latitude, longitude) {
  const busStops = await fetchBusStops(latitude - 0.001, longitude - 0.001, latitude + 0.001, longitude + 0.001); //create bounding box
  const radius = 50;

  let nearBusStop = false;

  for (const busStop of busStops) {
    const distance = L.latLng(busStop.lat, busStop.lon).distanceTo([latitude, longitude]);
    if (distance <= radius) {
      nearBusStop = true;
      break;
    }
  }

  if (nearBusStop) {
    updateMessage("You are located at the bus stop.");
  } else {
    updateMessage("Keep walking.");
  }
}

function updateLocation(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  currentLocationMarker.setLatLng([latitude, longitude]);
  map.setView([latitude, longitude], 16);

  checkNearBusStop(latitude, longitude);
}

function handleError(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      updateMessage("User denied the request for geolocation");
      break;
    case error.TIMEOUT:
      updateMessage("Request to get location timed out. Retrying");
      updateGPS();
      break;
    case error.POSITION_UNAVAILABLE:
      updateMessage("Location information is unavailable");
      break;
    case error.UNKNOWN_ERROR:
      updateMessage("An unknown error occurred");
      break;
  }
}

async function updateGPS() {
  if ('geolocation' in navigator) {
    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000 // if cannot update in 10 seconds, causing error
    };

    const gtfsData = await loadGTFS();
    displayBusStops(gtfsData)


    navigator.geolocation.watchPosition(updateLocation, handleError, options);
  } else {
    updateMessage("Geolocation is not supported.");
  }
}

async function loadGTFS(){
  const routecsv = await fetch('gtfs/routes.txt');
  const stopcsv = await fetch('gtfs/stops.txt');
  const stoptimescsv = await fetch('gtfs/stop_times.txt');

  const routetext = await routecsv.text();
  const stoptext = await stopcsv.text();
  const stoptimestext = await stoptimescsv.text();

  const routedata = Papa.parse(routetext,{ header: true});
  const stopdata = Papa.parse(stoptext,{ header: true});
  const stoptimesdata = Papa.parse(stoptimestext,{ header: true});

  return{
    route: routedata.data,
    stops: stopdata.data,
    stoptimes: stoptimesdata.data
  };
}

function displayBusStops(gtfsDATA) {
  const busStops = gtfsDATA.stops.map((stop) => {
    const latitude = parseFloat(stop.stop_lat);
    const longitude = parseFloat(stop.stop_lon);

    const busStopMarker = L.marker([latitude, longitude], {
      title: stop.stop_name,
    }).addTo(map);

    const arrivaltimes = gtfsDATA.stopTimes
      .filter((stopTime) => stopTime.stop_id === stop.stop_id)
      .map((stopTime) => stopTime.arrival_time)
      .join(', ');

    const popupcontent = `
      <b>Bus Stop:</b> ${stop.stop_name} <br>
      <b>Real-time Arrival:</b> ${arrivaltimes}
    `;

    busStopMarker.bindPopup(popupcontent);

    return {
      latitude,
      longitude,
      stopId: stop.stop_id,
      stopName: stop.stop_name
    };
  });
}


updateGPS();


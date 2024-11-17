// Store API endpoints
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
var tectonicplatesUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

// Fetch earthquake data
d3.json(queryUrl).then(function (data) {
  console.log(data); // Log earthquake data
  createFeatures(data.features); // Pass data to createFeatures function
});

// Function to determine marker color by depth
function chooseColor(depth) {
  if (depth < 10) return "#00FF00";        // Green for shallow depth
  else if (depth < 30) return "greenyellow"; // Yellow-green for moderate depth
  else if (depth < 50) return "yellow";     // Yellow for medium depth
  else if (depth < 70) return "orange";     // Orange for deeper depth
  else if (depth < 90) return "orangered";  // Orange-red for very deep depth
  else return "#FF0000";                   // Red for extremely deep depth
}

// Function to create features from the earthquake data
function createFeatures(earthquakeData) {

  // Popup content for each earthquake
  function onEachFeature(feature, layer) {
    layer.bindPopup(`<h3>Location: ${feature.properties.place}</h3><hr><p>Date: ${new Date(feature.properties.time)}</p><p>Magnitude: ${feature.properties.mag}</p><p>Depth: ${feature.geometry.coordinates[2]}</p>`);
  }

  // Create GeoJSON layer for earthquakes
  var earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: onEachFeature,
    pointToLayer: function (feature, latlng) {
      var markers = {
        radius: feature.properties.mag * 20000,
        fillColor: chooseColor(feature.geometry.coordinates[2]),
        fillOpacity: 0.7,
        color: "black",
        weight: 0.5
      }
      return L.circle(latlng, markers);
    }
  });

  createMap(earthquakes); // Pass to createMap function
}

// Function to create the map
function createMap(earthquakes) {

  // Define tile layers
  var satellite = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: "Map data &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors" });
  var grayscale = L.tileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', { attribution: "Map data &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors" });
  var outdoors = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: "Map data &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors, <a href='https://viewfinderpanoramas.org'>SRTM</a>" });

  // Create layer for tectonic plates
  var tectonicPlates = new L.layerGroup();

  // Fetch tectonic plates data
  d3.json(tectonicplatesUrl).then(function (plates) {
    L.geoJSON(plates, { color: "orange", weight: 2 }).addTo(tectonicPlates);
  });

  var baseMaps = { "Satellite": satellite, "Grayscale": grayscale, "Outdoors": outdoors };
  var overlayMaps = { "Earthquakes": earthquakes, "Tectonic Plates": tectonicPlates };

  // Create the map
  var myMap = L.map("map", { center: [37.09, -95.71], zoom: 5, layers: [satellite, earthquakes, tectonicPlates] });

  // Add legend
  var legend = L.control({ position: "bottomright" });
  legend.onAdd = function () {
    var div = L.DomUtil.create("div", "info legend");
    var depth = [-10, 10, 30, 50, 70, 90];
    var labels = [];

    for (var i = 0; i < depth.length; i++) {
      labels.push(
        '<i style="background:' + chooseColor(depth[i] + 1) + '; width: 20px; height: 20px; display: inline-block; margin-right: 5px;"></i>' +
        ' ' + depth[i] + (depth[i + 1] ? '&ndash;' + depth[i + 1] + '<br>' : '+')
      );
    }

    div.innerHTML = "<h3 style='text-align: center'>Depth</h3>" + labels.join('');
    return div;
  };

  legend.addTo(myMap); // Add legend to map

  // Add layers control
  L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(myMap);
}

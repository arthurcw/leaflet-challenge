// API for USGS earthquake data (Last Day)
const earthquakesURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"

// Map initialization parameter
const centerCoords = [20, 0];
const mapZoomLevel = 3;

// Marker color scale
const markerLabels = ["0-1", "1-2", "2-3", "3-4", "4-5", "5+"];
const markerFillColor = ["green", "#80ff00", "yellow", "#ffd500", "#ffaa00", "red"];

/**
 * Marker color function based on earthquake magnitude
 * @param {*} magnitude - earthquake magnitude
 */
function markerColor(magnitude) {
    let fillColor;
    if (magnitude <= 1) {
        fillColor = markerFillColor[0]
    } else if (magnitude > 1 & magnitude <= 2) {
        fillColor = markerFillColor[1]
    } else if (magnitude > 2 & magnitude <= 3) {
        fillColor = markerFillColor[2]
    } else if (magnitude > 3 & magnitude <= 4) {
        fillColor = markerFillColor[3]
    } else if (magnitude > 4 & magnitude <= 5) {
        fillColor = markerFillColor[4]
    } else {
        fillColor = markerFillColor[5]
    };
    return fillColor;
}

/**
 * Marker radius/size function based on earthquake magnitude
 * @param {*} magnitude - earthquake magnitude
 */
function markerSize(magnitude) {
    return Math.max(10, magnitude * 20000);
}

/**
 * Create marker layer group
 * @param {*} json : USGS json data from API call
 */
function createMarkers(json) {
    // Initialize an array to hold earthquake markers
    var earthquakeMarkers = [];

    // Loop through features array
    json.features.forEach(feature => {
        // create marker for each earthquake, bind a tooltip with magnitude and location
        let earthquakeMarker = L
            .circle([feature.geometry.coordinates[1], feature.geometry.coordinates[0]],{
                color: "grey",
                weight: 1,
                fillColor: markerColor(+feature.properties.mag),
                fillOpacity: 0.65,
                radius: markerSize(+feature.properties.mag)
            })
            .bindPopup("<b>" + feature.properties.place + "</b><br>Magnitude: " + feature.properties.mag);
        // add marker to earthquakeMarkers array
        earthquakeMarkers.push(earthquakeMarker);
    });

    // Create layer group and feed into createMap function
    return L.layerGroup(earthquakeMarkers);
};

/**
 * Function to generate legend
 * @param {*} metadata - Metadata from USGS json data
 */
function createLegend(metadata) {
    // add layer control
    var legend = L.control({
        position: "bottomright"
    });

    // insert a div with the class of "legend"
    legend.onAdd = function() {
        // add div
        var div = L.DomUtil.create("div", "legend");

        // add generated date time and number of earthquakes
        var dateObj = new Date(metadata.generated);
        div.innerHTML = [
            "<p><b>Generated: " + dateObj.toUTCString() + "</b></p>",
            "<p>Number of Earthquakes in the Past Day:" + metadata.count + "</p>",
            "<hr>",
            "<p><b>Legend (Magnitude)</b></p>"
        ].join("");

        // add earthquake legend
        for (var i = 0; i < markerLabels.length; i++) {
            div.innerHTML +=
                '<i class="rectangle" style="background:' + markerFillColor[i] + '"></i>'
                + markerLabels[i] + "<br>";
        };

        return div;
    };

    return legend;
};

/**
 * Create Map
 * @param {*} json : USGS json data from API call
 */
function createMap(json) {
    // data check. Earthquakes data are in array of features
    // console.log(json.features);

    // Create the tile layer that will be the background of our map
    var lightMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.light",
        accessToken: API_KEY
    });

    // Create a baseMaps object to hold the lightmap layer
    var baseMaps = {
        "Light Map": lightMap
    };

    // Create marker layer group with json data
    var earthquakes = createMarkers(json);

    // Create an overlayMaps object to hold the earthquaker layer
    var overlayMaps = {
        "Earthquakes": earthquakes
    };

    // Create the map object with options
    var myMap = L.map("map", {
        center: centerCoords,
        zoom: mapZoomLevel,
        layers: [lightMap, earthquakes]
    });

    // Create a layer control, pass in the baseMaps and overlayMaps. Add the layer control to the map
    L.control.layers(baseMaps, overlayMaps, {
        collapsed: false
    }).addTo(myMap);

    // Create legend, add to map
    var legend = createLegend(json.metadata);
    legend.addTo(myMap);

};

// Perform API call to USGS to get today's earthquake data
d3.json(earthquakesURL, createMap);
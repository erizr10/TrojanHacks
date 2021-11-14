var map;
window.onload = function() {
  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyDJfecggDCSSnp1SS265blDqR182s2ZywE",
    authDomain: "gunnhacks-1509167013046.firebaseapp.com",
    databaseURL: "https://gunnhacks-1509167013046.firebaseio.com",
    projectId: "gunnhacks-1509167013046",
    storageBucket: "gunnhacks-1509167013046.appspot.com",
    messagingSenderId: "7288610574"
  };
  firebase.initializeApp(config);
  firebase.auth().signInAnonymously();
};

function main()
{
  initMap();
  initAutocomplete();
}

function initAutocomplete() {
  var input = document.getElementById('autocomplete');
  var searchBox = new google.maps.places.Autocomplete(input);
  var pois = getPOIs(null);

  google.maps.event.addListener(searchBox, 'place_changed', function(){
    var place = searchBox.getPlace();
    addDestination(place.formatted_address);

    initMap();
    getPOIs(null);
    getPOIs(place.geometry.location); //{lat: 37.3603, lng: -122.1266}
    initDirections(place.geometry.location);
    console.log(originPOI);
    console.log(destinationPOI);

    clearMarkers();
    originPOI = [];
    destinationPOI = [];
  });


}

function addDestination(dest) {
  var ref = firebase.database().ref('places/');
    getLocation().then(function(loc) {
      console.log(loc);
      var geocoder = new google.maps.Geocoder();
      var latlng = new google.maps.LatLng({lat: loc.lat, lng: loc.lng});
      geocoder.geocode({'location': latlng}, function(results, status) {
        var person = {current: results[0].formatted_address, dest: dest, point: dest_waypoint};
        ref.push(person);
      });
  });
}

function initMap() {

  var pyrmont = {lat: -33.867, lng: 151.195};

  map = new google.maps.Map(document.getElementById('map'), {
    center: pyrmont,
    zoom: 15
  });

  var location = getLocation()
    .then(function(loc) {
      map.setCenter(loc);
      var marker = new google.maps.Marker({
              position: loc,
              map: map
      });
    });

}

function getLocation() {
  var pos;
  var promise = new Promise(function(resolve, reject) {
    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
         pos = { lat: position.coords.latitude,
                 lng: position.coords.longitude
               };
          resolve(pos);
      });
    }
  });

  return promise;
}

function getPOIs(targetLoc) {

  if(targetLoc == null) {
    var location = getLocation()
     .then(function(loc) {
       infowindow = new google.maps.InfoWindow();
       var service = new google.maps.places.PlacesService(map);
       var places = service.nearbySearch({
         location: loc,
         radius: 500,
         //type: ['store']
       }, callbackOrigin);
       return places;
     });
  }

  else {
    infowindow = new google.maps.InfoWindow();
    var service = new google.maps.places.PlacesService(map);
    var places = service.nearbySearch({
      location: targetLoc,
      radius: 500,
      //type: ['store']
    }, callbackDestination);
    return places;
  }

}

var infowindow;
var originPOI = [];
var destinationPOI = [];
function callbackOrigin(results, status) {
  var list = document.getElementById('list');
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      var element = document.createElement("LI");
      var text = document.createTextNode("Name: " + results[i].name + ", Vicinity: " + results[i].vicinity);
      var obj = new POI(results[i].name, 0, 0);
      originPOI.push(obj);
      element.classList.add('list-group-item');
      element.addEventListener('click', function() {
        var elements = document.getElementsByClassName('list-group-item');
        for(var x = 0; x < elements.length; x++) {
          elements[x].style.background = 'white';
          elements[x].style.color = '#333';
        }
        this.style.background = 'blue';
        this.style.color = 'white';
      });
      element.appendChild(text);
      list.appendChild(element);
      createMarker(results[i]);
    }
  }
}

function callbackDestination(results, status) {
  var list = document.getElementById('list');
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      var element = document.createElement("LI");
      var text = document.createTextNode("Name: " + results[i].name + ", Vicinity: " + results[i].vicinity);
      var obj = new POI(results[i].name, 0, 0);
      destinationPOI.push(obj);
      element.classList.add('list-group-item');
      element.addEventListener('click', function() {
        var elements = document.getElementsByClassName('list-group-item');
        for(var x = 0; x < elements.length; x++) {
          elements[x].style.background = 'white';
          elements[x].style.color = '#333';
        }
        this.style.background = 'blue';
        this.style.color = 'white';
      });
      element.appendChild(text);
      list.appendChild(element);
      createMarker(results[i]);
    }
  }
}

var markers = [];

function createMarker(place) {
  var placeLoc = place.geometry.location;
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location
  });
  markers.push(marker);
  marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
  console.log(destinationPOI);
  console.log(this);
  var index = 0;
  for(var i = 0; i < destinationPOI.length; i++) {
    if(destinationPOI[i].name === place.name ) {
      index = i;
      break;
    }
  }
  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent('<p>' + place.name + '</p>' + '<p>' + destinationPOI[index].people + ' attending' + '</p>' +
      '<button onclick="myFunction()">Make this my Rendezvous Point</button>'); //place.people
    infowindow.open(map, this);
    //console.log(originPOI);

    /*
    index = 0;
    for(var i = 0; i < originPOI.length; i++) {
      if(originPOI[i].name === place.name ) {
        index = i;
        break;
      }
    }*/
    destinationPOI[index].people++;
    firebase.database().ref("places/go").set(destinationPOI);
    //originPOI[index].people++;
    //firebase.database().ref("places/come").set(originPOI);
  });
}


class POI {
  constructor(name, people, departTime) {
    this.name = name;
    this.people = people;
    this.departTime = departTime;
  }
}
function initDirections(destination) {
  var directionsDisplay = new google.maps.DirectionsRenderer;
  var directionsService = new google.maps.DirectionsService;
  directionsDisplay.setMap(map);
  var location = getLocation()
   .then(function(loc) {
     calcRoute(directionsService,directionsDisplay, loc, destination); //37.3603° N, 122.1266° W
   });
}

function calcRoute(directionsService,directionsDisplay, start,end) {
  var request = {
    origin: start, //start,
    destination: end, //end,
    travelMode: 'WALKING'
  };
  directionsService.route(request, function(result, status) {
    if (status == 'OK') {
      directionsDisplay.setDirections(result);
    }
    else {
      window.alert('Directions request failed due to ' + status);
    }
  });
}

function addMarker(location) {
  var marker = new google.maps.Marker({
    position: location,
    map: map
  });
  markers.push(marker);
}

// Sets the map on all markers in the array.
function setMapOnAll(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
  setMapOnAll(null);
}

// Shows any markers currently in the array.
function showMarkers() {
  setMapOnAll(map);
}

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
  clearMarkers();
  markers = [];
}

// Initialize Firebase
var confFirebase = {
  apiKey: "AIzaSyCjnw9VGC2Mtsv1DXeg_kznr50xxp3TjhE",
  authDomain: "project-5518000328915581804.firebaseapp.com",
  databaseURL: "https://project-5518000328915581804.firebaseio.com",
  storageBucket: "project-5518000328915581804.appspot.com",
};
firebase.initializeApp(confFirebase);

// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('smokeless', ['ionic','firebase','ngMessages','ngCordova']);


app.run(["$rootScope", "$location","$ionicPlatform", function($rootScope, $location, $ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });

  $rootScope.$on("$routeChangeError", function(event, next, previous, error) {
    // We can catch the error thrown when the $requireSignIn promise is rejected
    // and redirect the user back to the home page
    if (error === "AUTH_REQUIRED") {
      $location.path("/");
    }
  });

}]);
// imports and init of the app
var app = angular.module('smokeless', ['ionic','firebase','ngMessages']);


app.run(["$rootScope", "$location","$ionicPlatform","$state", function($rootScope, $location, $ionicPlatform, $state) {
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

  $rootScope.$on("$stateChangeError", function(event, next, previous, error) {
    // We can catch the error thrown when the $requireSignIn promise is rejected
    // and redirect the user back to the home page
    console.log('Unauthenticated user.Redirecting to login...' + error);
    console.log(error);
    window.location = "/";
  });

}]);

// directive for preventing default href click (ng-click required for all clicks)
app.directive('a', function() {
    return {
        restrict: 'E',
        link: function(scope, elem, attrs) {
            if(attrs.ngClick || attrs.href === '' || attrs.href === '#'){
                elem.on('click', function(e){
                    e.preventDefault();
                });
            }
        }
   };
});

// capturing click on elements in the app (used for tracking)
app.directive('irEventClick', function () {
return {
    restrict: 'A',
    scope: {
        click: '&irEventClick'
    },
    controller: function ($scope) {

    },
    link: function (scope, elem, attrs) {
        elem.bind('click', function () {
          var json = JSON.parse(attrs.irEventClick);
          console.log(json);
          ga('send', {
            hitType:json.name,
            eventCategory:json.category
          });
          window.webkit.messageHandlers.trackEvent.postMessage(json);
        });
    }
}});
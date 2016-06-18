// app routing config
app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
   .state('login', {
    url:"/",
    templateUrl: 'templates/login.html',
    controller: 'LoginController',
    resolve: {
      "currentAuth":["Auth", function(Auth) {
        return Auth.$waitForSignIn();
      }]
    }
  }).state('register', {
    url:"/register",
    templateUrl:"templates/register.html",
    controller: "RegisterController",
    resolve: {
      "currentAuth":["Auth", function(Auth) {
        return Auth.$waitForSignIn();
      }]
    }
  })
  .state('chart', {
      url: "/chart",
      controller: "ChartController",
      templateUrl:"templates/chart.html",
      resolve: {
        "currentAuth":["Auth", function(Auth) {
        return Auth.$requireSignIn();
      }]
      }
   })
   .state('tabs', {
      url: "/tabs",
      controller: "GroupTabsController",
      templateUrl:"templates/tabs.html",
      resolve: {
        "currentAuth":["Auth", function(Auth) {
        return Auth.$requireSignIn();
      }]
      }
   })
   .state('tabs.dash', {
      url: "/dash",
       views: {
        'dash' : {
            templateUrl: "templates/dash.html",
            controller: "DashController",
        }
      },
      resolve: {
        "currentAuth":["Auth", function(Auth) {
        return Auth.$requireSignIn();
      }]
      }
   })
   .state('tabs.settings', {
      url:"/settings",
      views: {
        'settings' : {
          templateUrl:"templates/settings.html",
          controller: "SettingsController",
        }
      },
      resolve: {
        "currentAuth":["Auth", function(Auth) {
        return Auth.$waitForSignIn();
      }]
      }
   })
   .state('tabs.list', {
    url:"/list",
    views: {
        'list' : {
          templateUrl:"templates/list.html",
          controller: 'SmokeController',
        }
      },
    resolve: {
      "currentAuth":["Auth", function(Auth) {
        return Auth.$requireSignIn();
      }]
    }
   })
    .state('tabs.social', {
      url:"/social",
      views: {
        'settings' : {
          templateUrl:"templates/social.html",
          controller: "SocialController",
        }
      },
      resolve: {
        "currentAuth":["Auth", function(Auth) {
        return Auth.$waitForSignIn();
      }]
      }
   });

  $urlRouterProvider.otherwise('/');
});
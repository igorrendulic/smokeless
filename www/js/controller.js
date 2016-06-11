app.controller("SmokeController", function($scope, $firebaseArray, $firebaseObject,SmokesPerDay, Auth, $location, currentAuth, Utils) {

  if (currentAuth == null) {
    $location.url('/'); 
  } 

  $scope.loggedInEmail = currentAuth.email;

  var ref = firebase.database().ref().child("smokes/" + currentAuth.uid);
  var query = ref.orderByChild("priority");
  $scope.smokes =  $firebaseArray(query);

  $scope.smokes.$watch(function(event) {
    var today = new Date();
    $scope.numberOfTodaySmokes = 0;
    $scope.numberOfOverallSmokes = 0;
    var limitOf10 = [];
      var limitOf4 = [];
      var smokedByDay = [];
      var smokedByDate = [];
      var days = {};

    $scope.smokes.forEach(function(data) {
      var recordDate = new Date(data.timestamp);
      var dateKey = (recordDate.getMonth() + 1)  + "/" + recordDate.getDate() + "/" + recordDate.getFullYear();

      if (!(dateKey in days)) {
        limitOf10.push(10);
        limitOf4.push(4);
        days[dateKey] = 1;
      } else {
        var num = days[dateKey];
        num +=1;
        days[dateKey] = num;
      }

      if (today.getFullYear() == recordDate.getFullYear() 
            && today.getMonth() == recordDate.getMonth() && today.getDay() == recordDate.getDay()) {
            
            $scope.numberOfTodaySmokes += 1;
          }
          $scope.numberOfOverallSmokes += 1;
    });
    
    for (var key in days) {
      if (days.hasOwnProperty(key)) {
        smokedByDay.push(days[key]);
        smokedByDate.push(key);
      }
    }
    $scope.smokeChartConfig = {
      "options": {
        "chart": {
          "type": "areaspline"
        },
        "plotOptions": {
          "series": {
            "stacking": ""
          }
        }
      },
      "series": [
        {
          "name": "10 per day",
          "data": limitOf10,
          "id": "series-0"
        },
        {
          "name": "4 per day",
          "data": limitOf4,
          "id": "series-1"
        },
        {
          "name": "You smoked",
          "data": smokedByDay,
          "type": "column",
          "id": "series-2"
        }
      ],
      "title": {
        "text": "SmokeLess Chart"
      },
      "xAxis": {
        "type": "datetime",
        "labels":{
          "enabled":true
        },
        "categories":smokedByDate
      },
      "yAxis": {
                "title": {
                    "text": 'Smoked'
                },
                "tickInterval": 1,
            },
      "credits": {
        "enabled": true
      },
      "loading": false,
      "size": {}
    }
  });

  $scope.removeSmoke = function(smoke) {
    $scope.smokes.$remove(smoke);

    var smokesPerDay = SmokesPerDay(currentAuth, Utils.daynumber());
    // add today smokes
    smokesPerDay.$loaded().then(function() {
        if (smokesPerDay.count == null) {
          smokesPerDay = 0;
        } else if (smokesPerDay.count >= 1) {
          smokesPerDay.count -= 1;
        } 
        
        smokesPerDay.$save();
    });

  };
});


app.controller("LoginController", function($scope, $state, Auth, login, $location, currentAuth) {
  var ref = firebase.database().ref();
  $scope.auth = Auth;
  $scope.userLogin = {};

  Auth.$onAuthStateChanged(function(authData) {
      if (authData) {
        console.log(authData);
        login.set(authData);
        $state.go('tabs.dash');
     } else {
       $scope.loggedInInfo = "Please login!";
     }
  });

  $scope.showRegisterForm = function() {
    $state.go('register');
  };

  $scope.login = function() {

    console.log($scope.userLogin.email);
    
    $scope.auth.$signInWithEmailAndPassword($scope.userLogin.email,$scope.userLogin.password).then(function(authData) {
      console.log("Logging in called!");
      console.log(authData);
    }, function() {}).catch(function(error) {
      console.log(error);
      console.log("Error?");
    });
  };

});

app.controller("DashController", function($scope, Auth, login, $state, $firebaseArray,$firebaseObject,currentAuth, Utils, SmokesPerDay, SmokesPerDayList) {
  
  if (currentAuth == null) {
    $state.go('/');
  } 

  //settings calculate money saveed
  var settingsRef = firebase.database().ref().child("settings/" + currentAuth.uid);
  var settingsObject = $firebaseObject(settingsRef);
  settingsObject.$bindTo($scope,"settings");
  settingsObject.$watch(function(event) {
    // TODO: trigger recalculation
    console.log('TODO: when settings change update saved money: ' + event);
  });

  // display number of smoked today
  var smokesPerDay = SmokesPerDay(currentAuth, Utils.daynumber());
  smokesPerDay.$bindTo($scope, "smokesPerDay");

  $scope.smokedUntilNow = SmokesPerDayList(currentAuth);
  $scope.smokedUntilNow.$watch(function(event) {
    var total = 0;
    var days = 0;
    $scope.smokedUntilNow.forEach(function(data) {
      total += data.count;
      days++;
    });
    $scope.numberOfOverallSmokes = total;
    $scope.averagePerDay = total / days;
    // calc money saved
    settingsObject.$loaded().then(function(settings) {
      $scope.moneySaved = Utils.moneysaved(settings.pricePerPack,settings.numberOfSmoked, total, days);
    });

  });

  $scope.addsmoke = function() {
    var ref = firebase.database().ref().child("smokes/" + currentAuth.uid);
    var smokes =  $firebaseArray(ref);
    smokes.$add({
          timestamp: new Date().getTime(),
          priority: 0 - new Date().getTime()
    });


    // add today smokes
    smokesPerDay.$loaded().then(function() {
        if (smokesPerDay.count == null) {
          smokesPerDay.count = 0;
        }
        smokesPerDay.count += 1;
        smokesPerDay.$save();
    });
  };

});

app.controller("SettingsController", function($scope, $state, Auth,$firebaseObject, login, currentAuth, Utils) {
  if (currentAuth == null) {
    $state.go('/');
  } 

  $scope.loggedInAs = currentAuth.email;

  var ref = firebase.database().ref().child("settings/" + currentAuth.uid);
  var syncSettings = $firebaseObject(ref);

  syncSettings.$bindTo($scope, "settings");

    $scope.logout = function() {
      console.log("logging out");
      Auth.$signOut();
      $state.go('login');
      document.location.href="/";
    };

});

app.controller('GroupTabsController', function ($scope, $state) {
  $scope.goTab = function (el) {
    $state.go('tabs.' + el);
  };
});

app.controller('RegisterController', function($scope, $state, Auth, Utils) {
  var ref = firebase.database().ref();

  Auth.$onAuthStateChanged(function(firebaseUser) {
  if (firebaseUser) {
    console.log("Logged in as:", firebaseUser.uid);
    $state.go('tabs.dash');
  } else {
    console.log("Logged out");
  }
});

  $scope.register = function() {
    
    if ($scope.register.username && $scope.register.email && $scope.register.password) {
      console.log('Here we are');
      Auth.$createUserWithEmailAndPassword($scope.register.email, $scope.register.password).then(function(firebaseUser) {
        console.log(user);
        return user;
      }).catch(function(error) {
        $scope.registerError = "true";
        $scope.errorMessage = "" + error;
        console.error("Error: " + error);
      });
    }
  };
});

app.controller('SocialController', function($scope,$state,Auth) {
  console.log('social');
});




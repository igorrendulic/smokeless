// Login controller
app.controller("LoginController", function($scope, $state, Auth, $location, currentAuth) {
  var ref = firebase.database().ref();
  $scope.auth = Auth;
  $scope.userLogin = {};
  $scope.exception = {};

  Auth.$onAuthStateChanged(function(authData) {
      if (authData) {
        console.log(authData);
        $state.go('tabs.dash');
     } else {
       $scope.loggedInInfo = "Please login!";
     }
  });

  $scope.showRegisterForm = function() {
    $state.go('register');
  };

  $scope.login = function() {

    $scope.auth.$signInWithEmailAndPassword($scope.userLogin.email,$scope.userLogin.password).then(function(authData) {
      console.log(authData); // handling auth on promise
    }).catch(function(error) {
      if (error.code == 'auth/user-not-found') {
        $scope.exception.message = 'User not found. Please register first.';
      } else {
        $scope.exception.message = error.message;
      }
      $scope.exception.code = error.code;
    });
  };

});

// Registration
app.controller('RegisterController', function($scope, $state, Auth, Utils, $firebaseObject) {
  var ref = firebase.database().ref();
  $scope.exception = {};

  Auth.$onAuthStateChanged(function(firebaseUser) {
    if (firebaseUser) {
      console.log("Logged in as:", firebaseUser.uid);

      var refUsers = firebase.database().ref().child("users/" + firebaseUser.uid);
      var users = $firebaseObject(refUsers);
      users.$bindTo($scope, "users");
      users.fullname = $scope.register.fullname;
      users.$save();
      $state.go('tabs.dash');
    } else {
      console.log("Logged out");
    }
  });

  $scope.register = function() {
    
    if ($scope.register.fullname && $scope.register.email && $scope.register.password) {

      Auth.$createUserWithEmailAndPassword($scope.register.email, $scope.register.password).then(function(firebaseUser) {
        return firebaseUser;
      }).catch(function(error) {
        $scope.exception.message = error.message;
        $scope.exception.code = error.code;
      });
    }
  };
});

function colorSinceLastSmoke($scope, sinceLastSmoke) {
  var hr = sinceLastSmoke.hour;
    var min = sinceLastSmoke.min;
    var days = sinceLastSmoke.days;
    $scope.lastSmokeStyle.style = {"color":"gray"};
    if (days > 0) {
      $scope.lastSmokeStyle.style = {"color":"green"};
    } else if (hr < 2) {
      $scope.lastSmokeStyle.style = {"color":"red"};
    } else if (hr >= 2) {
      $scope.lastSmokeStyle.style = {"color":"FF9900"};
    }

    $scope.sinceLastSmoke = days + " days " + hr + " hours " + min + " min";
}

// Dashboard (unfortunatelly angularfire firebaseObject does not work well offline so i had to implement Firebase "native" calls to datastore)
app.controller("DashController", function($scope,$rootScope,$timeout,$interval, Auth,$SmokesPerDayService,$SmokesService,$state,currentAuth,Sync, SyncNow, Utils) {
  
  Sync(currentAuth);

  $scope.settings = {};
  $scope.smokesPerDay = 0;
  $scope.moneySaved = 0;
  $scope.moneySpent = 0;
  $scope.averagePerDay = 0;
  $scope.numberOfOverallSmokes = 0;

  $SmokesPerDayService.recalculate($scope);

  $scope.$on('refreshSmokeValues', function (event, value) {

    $SmokesPerDayService.recalculate($scope);    
    $scope.lastSmokeStyle = {};
    $scope.lastSmokeStyle.style = {"color":"gray"};

    var msSinceLastSmoke = new Date().getTime() - $scope.lastSmokeTime;
    var sinceLastSmoke = Utils.daysHoursMinutesSince(msSinceLastSmoke);
    colorSinceLastSmoke($scope,sinceLastSmoke);
  });

  $scope.lastSmokeStyle = {};
  $scope.lastSmokeStyle.style = {"color":"gray"};

  var msSinceLastSmoke = new Date().getTime() - $scope.lastSmokeTime;
  var sinceLastSmoke = Utils.daysHoursMinutesSince(msSinceLastSmoke);
  colorSinceLastSmoke($scope,sinceLastSmoke);

  $interval(function() {
    var msSinceLastSmoke = new Date().getTime() - $scope.lastSmokeTime;
    var sinceLastSmoke = Utils.daysHoursMinutesSince(msSinceLastSmoke);      
    colorSinceLastSmoke($scope,sinceLastSmoke);
  }, 15000);

  $scope.addsmoke = function() {
    $SmokesPerDayService.addSmoke(currentAuth);
    $SmokesPerDayService.recalculate($scope);
    $scope.smokes = $SmokesService.getList(50);

    var msSinceLastSmoke = new Date().getTime() - $scope.lastSmokeTime;
    var sinceLastSmoke = Utils.daysHoursMinutesSince(msSinceLastSmoke);
    colorSinceLastSmoke($scope,sinceLastSmoke);

    SyncNow(currentAuth);
  };

  $scope.showChart = function() {
    $timeout(function(){
      $rootScope.$broadcast('refreshChart', 'refresh chart from dash');
    });
    $state.go('chart');
  };

});

// Social
app.controller('SocialController', function($scope,$state, Auth,Connection, currentAuth, $firebaseArray, $firebaseObject, $ionicPopup) {

  $scope.internet = {online:true};

  if (connected) {
      $scope.internet.online = true;

      var ref = firebase.database().ref().child("social");
      var query = ref.orderByChild("priority").limitToFirst(100);
      
      $scope.social =  $firebaseArray(query);
  } else {
      $scope.internet.online = false;
  }

  var userRef = firebase.database().ref().child("users/" + currentAuth.uid);
  var syncUsers = $firebaseObject(userRef);
  syncUsers.$bindTo($scope, "users");

  $scope.addNewPost = function() {
    var myPopup = $ionicPopup.show({
    template: '<textarea ng-model="social.post" rows="10" cols="10"></textarea>',
    title: 'Add new Post',
    subTitle: 'Please be respectful to others',
    scope: $scope,
    buttons: [
      { text: 'Cancel' },
      {
        text: '<b>Save</b>',
        type: 'button-positive',
        onTap: function(e) {
          if (!$scope.social.post) {
            //don't allow the user to close unless he enteres some text
            e.preventDefault();
          } else {
            syncUsers.$loaded().then(function(users) {
                $scope.social.$add({
                  timestamp: new Date().getTime(),
                  priority: 0 - new Date().getTime(),
                  message: $scope.social.post,
                  authorId: currentAuth.uid,
                  authorName: users.fullname,
                  profilephoto: users.profilephoto
                });
            });
            
          }
        }
      }
    ]
  });
  };

  $scope.submitNewComment = function(item) {
    console.log(item);
    if ($scope.social.newcomment) {
      syncUsers.$loaded().then(function(users) {
        var comments = item.comments;
        if (!comments) {
          comments = [];
        }
        var comment = {};
        comment.message = $scope.social.newcomment;
        comment.timestamp = new Date().getTime();
        comment.authorId = currentAuth.uid;
        comment.authorName = users.fullname;
        comment.profilephoto = users.profilephoto;
        comments.push(comment);
        item.comments = comments;
        $scope.social.$save(item);
        $scope.social.newcomment = null;
      });
    }
  };

  $scope.submitLike = function(item) {
    
    // check if user already liked. If yes, unlike
    if (item.likes) {
      for (var i=item.likes.length; i--; ) {
        var like = item.likes[i];
        if (like.authorId == currentAuth.uid) {
          item.likes.splice(i,1);
          $scope.social.$save(item);
          return;
        }
      }
    }

    // add like
    syncUsers.$loaded().then(function(users) {
        var likes = item.likes;
        if (!likes) {
          likes = [];
        }
        
        var like = {};
        like.timestamp = new Date().getTime();
        like.authorId = currentAuth.uid;
        like.authorName = users.fullname;
        like.profilephoto = users.profilephoto;
        likes.push(like);
        item.likes = likes;
        $scope.social.$save(item);
    });
  };
 
});

// Time Log
app.controller("SmokeController", function($scope, Auth, currentAuth, $SmokesPerDayService, $SmokesService, Sync,SyncNow) {

  Sync(currentAuth);

  $scope.smokes = $SmokesService.getList(50);

  $scope.$on('refreshSmokeList', function (event, value) {
    $scope.smokes = $SmokesService.getList(50); 
  });

  $scope.removeSmoke = function(smoke) {
    $SmokesPerDayService.removeSmoke(currentAuth,smoke);
    $scope.smokes = $SmokesService.getList(50); 
    SyncNow(currentAuth);
  };
});

// Settings
app.controller("SettingsController", function($scope, $rootScope, $state, Auth,$firebaseObject,$firebaseUtils, currentAuth, Utils, $Settings) {

  $scope.loggedInAs = currentAuth.email;

  $scope.settings = $Settings.get();

  $scope.$watch('settings.numberOfSmoked', function(newValue, oldValue) {
    if (!isNaN(newValue)) {
      localStorage.setItem('settings', JSON.stringify($scope.settings));
      $rootScope.$broadcast('refreshSmokeValues', 'from settings');
    }
  });
  $scope.$watch('settings.pricePerPack', function(newValue, oldValue) {
    if (!isNaN(newValue)) {
      localStorage.setItem('settings', JSON.stringify($scope.settings));
      $rootScope.$broadcast('refreshSmokeValues', 'from settings');
    }
  });

  // var ref = firebase.database().ref().child("settings/" + currentAuth.uid);
  // var syncSettings = $firebaseObject(ref);

  // syncSettings.$bindTo($scope, "settings");

  var userRef = firebase.database().ref().child("users/" + currentAuth.uid);
  var userObject = $firebaseObject(userRef);
  userObject.$bindTo($scope, "users");

  $scope.profileLoaded = false;
  userObject.$loaded().then(function() {
    $scope.profileLoaded = true;
  });

    $scope.logout = function() {
      console.log("logging out");
      localStorage.clear();
      Auth.$signOut();
      $state.go('login');
      document.location.href="/";
    };

    $scope.takePhoto = function() {
        var cameraEl = document.querySelector( '#cameraID' );
        cameraEl.click();
    };

    $scope.uploadPhoto = function() {

      if ($scope.profileLoaded) {
        var cameraEl = document.querySelector( '#cameraID' );
        var file = cameraEl.files[0];
        var storageRef = firebase.storage().ref();
         var metadata = {
          'contentType': file.type
        };
        var uploadTask = storageRef.child('profile/' + currentAuth.uid + "/" + file.name).put(file, metadata);
        
        uploadTask.on('state_changed', null, function(error) {
          console.error('Upload failed:', error);
          
        }, function() {
          var url = uploadTask.snapshot.metadata.downloadURLs[0];
          console.log('File available at', url);
          userObject.profilephoto = url;
          $scope.users.profilephoto = url;
          userObject.$save();
        });
      } else {
        $scope.networkProblems = "true";
      }

    }; 

});

// Helper for switching tabs
app.controller('GroupTabsController', function ($scope, $state) {
  $scope.goTab = function (el) {
    $state.go('tabs.' + el);
  };
});

// Chart display
app.controller('ChartController', function($scope,Auth, $firebaseArray, $state, currentAuth,$SmokesPerDayService, Utils) {
  $scope.goBack = function() {
    $state.go('tabs.dash');
  };

  $scope.$on('refreshChart', function (event, value) {
      var series = $SmokesPerDayService.getSmokesPerDayChartData();

    var chart = Highcharts.chart('container', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Smoked cigarettes by day'
        },
        subtitle: {
            text: 'Showing last 14 days of logged smokes'
        },
        xAxis: {
            type: 'category'
        },
        yAxis: {
            title: {
                text: 'Number of smoked per day'
            }

        },
        legend: {
            enabled: false
        },
        plotOptions: {
            series: {
                borderWidth: 0,
                dataLabels: {
                    enabled: true,
                    format: '{point.y}'
                }
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
            pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y}</b><br/>'
        },
      series: [series]
    });
  });

});
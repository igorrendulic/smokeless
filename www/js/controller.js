app.controller("SmokeController", function($scope, $firebaseArray, $firebaseObject,SmokesPerDay, Auth, $location, currentAuth, Utils) {

  if (currentAuth == null) {
    $location.url('/'); 
  } 

  $scope.loggedInEmail = currentAuth.email;

  var ref = firebase.database().ref().child("smokes/" + currentAuth.uid);
  var query = ref.orderByChild("priority").limitToFirst(100);
  $scope.smokes =  $firebaseArray(query);

  //TODO: not yet implemented in Firebase 3.0 (06/10/2016)

  // $scope.noMoreItemsAvailable = true;
  // $scope.loadMore = function() {
  //   console.log('load more!');
  //   var query = ref.orderByChild("priority").limitToFirst(20);
  //   $scope.smokes =  $firebaseArray(query);
  //   $scope.$broadcast('scroll.infiniteScrollComplete');
  // };
  // $scope.$on('$stateChangeSuccess', function() {
  //   $scope.loadMore();
  // });

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

app.controller("SettingsController", function($scope, $state, Auth,$firebaseObject, login, currentAuth, Utils, $ionicPlatform, $cordovaCamera) {
  if (currentAuth == null) {
    $state.go('/');
  } 

  $scope.loggedInAs = currentAuth.email;

  var ref = firebase.database().ref().child("settings/" + currentAuth.uid);
  var syncSettings = $firebaseObject(ref);

  syncSettings.$bindTo($scope, "settings");

  var userRef = firebase.database().ref().child("users/" + currentAuth.uid);
  var syncUsers = $firebaseObject(userRef);
  syncUsers.$bindTo($scope, "users");

    $scope.logout = function() {
      console.log("logging out");
      Auth.$signOut();
      $state.go('login');
      document.location.href="/";
    };

    $scope.takePhoto = function() {
        $ionicPlatform.ready(function() {
            console.log("TODO: photos upload");
            var options = {
                quality: 75,
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.CAMERA,
                allowEdit: true,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 100,
                targetHeight: 100,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: false,
              correctOrientation:true
          };

          $cordovaCamera.getPicture(options).then(function(imageData) {
            var image = document.getElementById('myImage');
            image.src = "data:image/jpeg;base64," + imageData;
          }, function(err) {
            // error
            console.error(err);
          });
        });
    };

});

app.controller('GroupTabsController', function ($scope, $state) {
  $scope.goTab = function (el) {
    $state.go('tabs.' + el);
  };
});

app.controller('RegisterController', function($scope, $state, Auth, Utils, $firebaseObject) {
  var ref = firebase.database().ref();

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
        $scope.registerError = "true";
        $scope.errorMessage = "" + error;
        console.error("Error: " + error);
      });
    }
  };
});

app.controller('SocialController', function($scope,$state, Auth, currentAuth, $firebaseArray, $firebaseObject, $ionicPopup) {
  var ref = firebase.database().ref().child("social");
  var query = ref.orderByChild("priority").limitToFirst(100);
  $scope.social =  $firebaseArray(query);

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
                  authorName: users.fullname
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
        comments.push(comment);
        item.comments = comments;
        $scope.social.$save(item);
        $scope.social.newcomment = null;
      });
    }
  };

  $scope.submitLike = function(item) {
    syncUsers.$loaded().then(function(users) {
         var likes = item.likes;
         if (!likes) {
          likes = [];
        }
        var like = {};
        like.timestamp = new Date().getTime();
        like.authorId = currentAuth.uid;
        like.authorName = users.fullname;
        likes.push(like);
        item.likes = likes;
        $scope.social.$save(item);
    });
  };
 
});

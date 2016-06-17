app.controller("SmokeController", function($scope, ListOperations, $firebaseObject,SmokesPerDay, Auth, $location, currentAuth, Utils) {


  if (Auth.$getAuth() == null) {
    $location.url('/'); 
  } 

  var ref = firebase.database().ref().child("smokes/" + currentAuth.uid);

  $scope.loggedInEmail = currentAuth.email;

  $scope.smokes = ListOperations.initialLoad(currentAuth, ref);

  // // TODO: move to utilitiy factory
  // var smokesConcat = function(firebaseResults) {
  //     firebaseResults.forEach(function(data) {
  //         $scope.smokes.push(data);
  //     }); 
  // };

  // smokesArray.$loaded().then(function() {
  //   smokesConcat(smokesArray);
  //   if (smokesArray.length < 9) {
  //     $scope.endReached = true;
  //   }
  // });

  // smokesArray.$watch(function(event) {
  //   console.log(event);
  //   if (event.event == 'child_removed' || event.event == 'child_added') {
  //     console.log('in here');
  //   }
  // });

  // $scope.moreDataCanBeLoaded = function() {
  //   if ($scope.endReached) {
  //     return false;
  //   }
  //   return true;
  // };

  // $scope.loadMoreData = function() {
  //   console.log('load more called');
  //   if ($scope.smokes.length > 9) {
  //     var lastItem = $scope.smokes[$scope.smokes.length - 1];
  //     var smokesMore = ListOperations.loadFromStart(currentAuth, ref, lastItem.priority);
  //     smokesMore.$loaded().then(function() {
  //       if (smokesMore.length > 1) {
  //         smokesConcat(smokesMore);
  //       } else {
  //         console.log("end reached = true");
  //         $scope.endReached = true;
  //       }
  //       $scope.$broadcast('scroll.infiniteScrollComplete');
  //     });
  //   } else {
  //     $scope.endReached = true;
  //   }
  // };

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
  
  if (Auth.$getAuth() == null) {
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
      $scope.moneySpent = Utils.moneyspent(settings.pricePerPack, settings.numberOfSmoked, total);
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

  $scope.showChart = function() {
    $state.go('chart');
  };

});

app.controller("SettingsController", function($scope, $state, Auth,$firebaseObject,$firebaseUtils, login, currentAuth, Utils) {
  if (Auth.$getAuth() == null) {
    $state.go('/');
  } 

  $scope.loggedInAs = currentAuth.email;

  var ref = firebase.database().ref().child("settings/" + currentAuth.uid);
  var syncSettings = $firebaseObject(ref);

  syncSettings.$bindTo($scope, "settings");

  var userRef = firebase.database().ref().child("users/" + currentAuth.uid);
  var userObject = $firebaseObject(userRef);
  userObject.$bindTo($scope, "users");

  $scope.profileLoaded = false;
  userObject.$loaded().then(function() {
    $scope.profileLoaded = true;
  });

    $scope.logout = function() {
      console.log("logging out");
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

  if (Auth.$getAuth() == null) {
    $state.go('/');
  } 

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

app.controller('ChartController', function($scope,Auth, $firebaseArray, $state, SmokesForCharts, currentAuth, Utils) {
  $scope.goBack = function() {
    $state.go('tabs.dash');
  };

  var smokedUntilNow = SmokesForCharts(currentAuth);

  smokedUntilNow.$watch(function(eventObject) {
    var series = { name:"Smoked",colorByPoint:true, data:[] };
    var count = 0;
    smokedUntilNow.forEach(function(data) {
        var date = Utils.daynumberToDate( data.$id);
        var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
        var dataPoint = { name: formattedDate, y: data.count};
        series.data.push(dataPoint);
        count++;
    });

    Highcharts.chart('container', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Smokes cigarettes by day'
        },
        subtitle: {
            text: 'Showing last two weeks'
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

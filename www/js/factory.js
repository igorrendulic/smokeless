app.factory("Auth", ["$firebaseAuth",
  function($firebaseAuth) {
   return $firebaseAuth();
  }
]);


app.factory("login", function() {
  var loggedInUser = {};

  loggedInUser.set = function(authData) {
    
    if (authData != null) {
      loggedInUser.authData = authData;
    }
  };

  return loggedInUser;

});

app.factory("SmokesPerDay", function($firebaseObject) {
	return function(currentAuth,daynumber) {
		var refDayNumbers = firebase.database().ref().child("smokesPerDay/" + currentAuth.uid + "/" + daynumber);
    	return $firebaseObject(refDayNumbers);
	}
});

app.factory("SmokesPerDayList", function($firebaseArray) {
	return function(currentAuth) {
		var ref = firebase.database().ref().child("smokesPerDay/" + currentAuth.uid);
		return $firebaseArray(ref);
	}
});

app.service('Utils', function() {
	
	// days since 1/1/1970
	this.daynumber = function() {
		var timezone = new Date().getTimezoneOffset() * 60 * 1000;
		return Math.floor((Date.now() - timezone) / (1000 * 60 * 60 * 24));
	};

	this.moneysaved = function(pricePerPack, numberOfSmoked, total, days) {
		var saved = 0;
		if (pricePerPack && numberOfSmoked) {
			var pricePerCig = parseFloat(pricePerPack) / 20.0;
	    	var priceBefore = parseFloat(numberOfSmoked) * pricePerCig * days;
	    	var priceNow = parseFloat(total) * pricePerCig;
	    	console.log("Price now: " + priceNow + ", priceBefore: " + priceBefore);
	    	// if 10 per day now
	    	saved = parseFloat(priceBefore - priceNow);
	    	//$scope.moneySaved = savedToday;
	    	console.log(saved);
    	}
    	return saved;
	};

});

// app.factory('$cordovaCamera', ['$q', function ($q) {

//     return {
//       getPicture: function (options) {
//         var q = $q.defer();

//         if (!navigator.camera) {
//           q.resolve(null);
//           return q.promise;
//         }

//         navigator.camera.getPicture(function (imageData) {
//           q.resolve(imageData);
//         }, function (err) {
//           q.reject(err);
//         }, options);

//         return q.promise;
//       },

//       cleanup: function () {
//         var q = $q.defer();

//         navigator.camera.cleanup(function () {
//           q.resolve();
//         }, function (err) {
//           q.reject(err);
//         });

//         return q.promise;
//       }
//     };
//   }]);
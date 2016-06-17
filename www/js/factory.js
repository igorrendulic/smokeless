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
	return function(currentAuth, query) {
		var ref = firebase.database().ref().child("smokesPerDay/" + currentAuth.uid);
		return $firebaseArray(ref);
	}
});

app.factory("SmokesForCharts", function($firebaseArray) {
	return function(currentAuth) {
		var ref = firebase.database().ref().child("smokesPerDay/" + currentAuth.uid);
		var query = ref.limitToFirst(14);
		return $firebaseArray(query);
	}
});

app.factory("ListOperations", function($firebaseArray) {
	var limit = 100;
	var initialLoad = function(currentAuth, ref) {
		var query = ref.orderByChild("priority").limitToFirst(limit);
		return $firebaseArray(query);
	};

	var loadFromStart = function(currentAuth, ref, startPriority) {
		var query = ref.orderByChild("priority").startAt(startPriority).limitToFirst(limit);
		return $firebaseArray(query);
	};
	return {
		initialLoad: initialLoad,
		loadFromStart: loadFromStart
	};
});

app.service('Utils', function() {
	
	// days since 1/1/1970
	this.daynumber = function() {
		var timezone = new Date().getTimezoneOffset() * 60 * 1000;
		return Math.floor((new Date().getTime() - timezone) / (1000 * 60 * 60 * 24));
	};

	this.moneysaved = function(pricePerPack, numberOfSmoked, total, days) {
		var saved = 0;
		if (pricePerPack && numberOfSmoked) {
			var pricePerCig = parseFloat(pricePerPack) / 20.0;
	    	var priceBefore = parseFloat(numberOfSmoked) * pricePerCig * days;
	    	var priceNow = parseFloat(total) * pricePerCig;
	    	// console.log("Price now: " + priceNow + ", priceBefore: " + priceBefore);
	    	// if 10 per day now
	    	saved = parseFloat(priceBefore - priceNow);
	    	//$scope.moneySaved = savedToday;
	    	console.log(saved);
    	}
    	return saved;
	};

	this.moneyspent = function(pricePerPack, numberOfSmoked, total) {
		var spent = 0;
		if (pricePerPack && numberOfSmoked && total > 0) {
			var pricePerCig = parseFloat(pricePerPack) / 20.0;
			spent = total * pricePerCig;
		}
		return spent;
	};

	this.daynumberToDate = function(daynumber) {
		var tzOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;
		return new Date(daynumber * 1000 * 60 * 60 * 24 + (tzOffsetMs));
	};

});
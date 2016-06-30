// reference to Auth
app.factory("Auth", ["$firebaseAuth",
  function($firebaseAuth) {
   return $firebaseAuth();
  }
]);

var connected = true;
app.factory('Connection', function($q, $rootScope, $timeout) {
	var deffered = $q.defer();

	// monitoring internet connection state
	firebase.database().ref().child('.info/connected').on('value', function(connectedSnap) {
	  	if (connectedSnap.val() === true) {
	    	/* we're connected! */    
	    	console.log("connected ok");
	    	connected = true;
	    	deffered.notify(true);
	  	} else {
	    	/* we're disconnected! */
	    	console.log("no connection");
	    	connected = false;
	    	deffered.notify(false);
		}
	});
  	return deffered.promise;
});

function syncObject(localObject,databaseObject, databaseChild, key) {
	
	var ref = firebase.database().ref().child(databaseObject + "/" + databaseChild);

	ref.once('value').then(function(snapshot) {
		if (snapshot.val() == null) {
			ref.set(localObject);
		} else if (key == snapshot.key) {
			var currentObject = snapshot.val();
			if (!currentObject.timestamp) { // fix for old data without timestamps
				currentObject.timestamp = 0;
			}
			if (currentObject.timestamp < localObject.timestamp) {
				ref.set(localObject).then(function() {
					console.log('synced: ', localObject);
				});
			}
		} 
	});
}

function syncSmokeList(currentAuth) {

	var smokes = JSON.parse(localStorage.getItem("smokes"));

	if (smokes != null && smokes.length > 0) {
		// remove if deleted
		var newSmokes = smokes.filter(function(element) {
			if (element.deleted && !element.sync) {
				return false;
			} else if (element.deleted) {
				var refRemove = firebase.database().ref().child("smokes/" + currentAuth.uid + "/" + element.id);
				refRemove.remove();
				return false;
			}
			return true;
		});
		localStorage.setItem("smokes", JSON.stringify(newSmokes));

 		// TODO: add smokes to db
 		for (var i in newSmokes) {
 			var smoke = newSmokes[i];
 			if (!smoke.sync && !smoke.deleted) {
 				smoke.sync = true;
 				var refSet = firebase.database().ref().child("smokes/" + currentAuth.uid + "/" + smoke.id);
 				refSet.set(smoke);
 				newSmokes[i] = smoke;
 			}
 		}
 		localStorage.setItem("smokes", JSON.stringify(newSmokes));
	} else {
		var ref = firebase.database().ref().child("smokes/" + currentAuth.uid);
		ref.once('value').then(function(snapshot) {
			// console.log(snapshot.val());
			var smokes = [];
			snapshot.forEach(function(data) {
				var smoke = data.val();
				var key = data.key;
				if (smoke.id == null) {
					smoke.id = key;
				}
				smokes.push(smoke);
			});
			localStorage.setItem('smokes', JSON.stringify(smokes));
		});
	}	
}

var syncListInProgress = false;

app.factory('SyncNow', function(Utils, $rootScope, $q) {
	return function(currentAuth) {
		console.log('Sync in progress...');
		syncSmokeList(currentAuth);
		
		// sync day objects
		var json = JSON.parse(localStorage.getItem("smokesPerDay"));
		if (json != null && Object.keys(json).length > 0) {
			Object.keys(json).forEach(function(key) {
				syncObject(json[key],'smokesPerDay',currentAuth.uid + "/" + key, key);
			});
		} else {
			// refresh local storage
			var ref = firebase.database().ref().child("smokesPerDay/" + currentAuth.uid);
			ref.once('value').then(function(data) {
				localStorage.setItem("smokesPerDay", JSON.stringify(data.val()));
			});
		}

		// sync settings
		var settingsJson = JSON.parse(localStorage.getItem('settings'));
		if (settingsJson != null) {
			settingsJson.timestamp = new Date().getTime();
			syncObject(settingsJson, 'settings', currentAuth.uid, currentAuth.uid);
		} else {
			var ref = firebase.database().ref().child('settings/' + currentAuth.uid);
			ref.once('value').then(function(data) {
				var settingsObj = data.val();
				if (!settingsObj.timestamp) {
					settingsObj.timestamp = new Date().getTime();
				}
				localStorage.setItem('settings', JSON.stringify(settingsObj));
			});
		}
	}
});

app.factory('Sync', function(Connection, SyncNow) {
	return function(currentAuth) {
		Connection.then(null, null, function(connected) {
			SyncNow(currentAuth);
		});
	}
});

// app.factory("SmokesForCharts", function($firebaseArray) {
// 	return function(currentAuth) {
// 		var ref = firebase.database().ref().child("smokesPerDay/" + currentAuth.uid);
// 		var query = ref.limitToFirst(14);
// 		return $firebaseArray(query);
// 	}
// });

// app.factory("ListOperations", function($firebaseArray) {
// 	var limit = 100;
// 	var initialLoad = function(currentAuth, ref) {
// 		var query = ref.orderByChild("priority").limitToFirst(limit);
// 		return $firebaseArray(query);
// 	};

// 	var loadFromStart = function(currentAuth, ref, startPriority) {
// 		var query = ref.orderByChild("priority").startAt(startPriority).limitToFirst(limit);
// 		return $firebaseArray(query);
// 	};
// 	return {
// 		initialLoad: initialLoad,
// 		loadFromStart: loadFromStart
// 	};
// });

app.service('Utils', function() {
	
	// days since 1/1/1970
	this.daynumber = function(date) {
		var timezone = date.getTimezoneOffset() * 60 * 1000;
		return Math.floor((date.getTime() - timezone) / (1000 * 60 * 60 * 24));
	};
	// money saved calculations
	this.moneysaved = function(pricePerPack, numberOfSmoked, total, days) {
		var saved = 0;
		if (pricePerPack && numberOfSmoked) {
			var pricePerCig = parseFloat(pricePerPack) / 20.0;
	    	var priceBefore = parseFloat(numberOfSmoked) * pricePerCig * days;
	    	var priceNow = parseFloat(total) * pricePerCig;
	    	// console.log("Price now: " + priceNow + ", priceBefore: " + priceBefore);
	    	// if 10 per day now
	    	saved = parseFloat(priceBefore - priceNow);
    	}
    	return saved;
	};
	// money spent calculations
	this.moneyspent = function(pricePerPack, numberOfSmoked, total) {
		var spent = 0;
		if (pricePerPack && numberOfSmoked && total > 0) {
			var pricePerCig = parseFloat(pricePerPack) / 20.0;
			spent = total * pricePerCig;
		}
		return spent;
	};

	// reverting from daynumber to date
	this.daynumberToDate = function(daynumber) {
		var tzOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;
		return new Date(daynumber * 1000 * 60 * 60 * 24 + (tzOffsetMs));
	};

	this.daysHoursMinutesSince = function(t) {
	    var cd = 24 * 60 * 60 * 1000,
	        ch = 60 * 60 * 1000,
	        d = Math.floor(t / cd),
	        h = Math.floor( (t - d * cd) / ch),
	        m = Math.round( (t - d * cd - h * ch) / 60000),
	        pad = function(n){ return n < 10 ? '0' + n : n; };
	  if( m === 60 ){
	    h++;
	    m = 0;
	  }
	  if( h === 24 ){
	    d++;
	    h = 0;
	  }
	  return d + ' days ' + pad(h) + " hr " + pad(m) + " min"; //[d, pad(h), pad(m)].join(':');
	}

});
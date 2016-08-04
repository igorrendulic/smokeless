var smokedPerDayKey = 'smokesPerDay';
var listOfSmoked = 'smokes';
var settingsKey = 'settings';

app.service('$SmokesService', function() {

	this.getList = function(cutOffAt) {
		var smokes = JSON.parse(localStorage.getItem(listOfSmoked));	
		var smokeList = [];
		if (smokes != null) {
			for (var i in smokes) {
				var smoke = smokes[i];
				if (!smoke.deleted) {
					smokeList.push(smoke);
				}
			}
		}
		return smokeList.reverse();
	}
});

app.service('$Settings', function() {
	this.get = function() {
		var settings = JSON.parse(localStorage.getItem('settings'));
		if (settings == null) {
			localStorage.setItem('settings', '{}');
			settings = {};
		}
		return settings;
	};
});

app.service('$SmokesPerDayService', function(Utils, $q, $rootScope,$ionicListDelegate) {

	this.addSmoke =  function(currentAuth) {
		
		var daynumber = Utils.daynumber(new Date());

		if (localStorage.getItem(smokedPerDayKey) == null) {
			localStorage.setItem(smokedPerDayKey, '{}');
		}
		var smokes = JSON.parse(localStorage.getItem(listOfSmoked));
		if (smokes == null) {
			smokes = [];
			localStorage.setItem(listOfSmoked, '[]');
		}
		var ts = new Date().getTime();
		var newJsonKey = "smk_" + ts;
		var newJsonUnsynced = {timestamp: ts, priority: 0 - ts, sync:false, id: newJsonKey};
		smokes.push(newJsonUnsynced);
		localStorage.setItem(listOfSmoked, JSON.stringify(smokes));

		var smokedPerDayJson = JSON.parse(localStorage.getItem(smokedPerDayKey));
		if (smokedPerDayJson == null) {
			smokedPerDayJson = {};
		}
		var countForTheDay = smokedPerDayJson[daynumber];
		if (!countForTheDay) {
			countForTheDay = {};
			countForTheDay.count = 0;
		}
		countForTheDay.count ++;
		countForTheDay.timestamp = new Date().getTime();
		smokedPerDayJson[daynumber] = countForTheDay;

		localStorage.setItem(smokedPerDayKey, JSON.stringify(smokedPerDayJson));

		$rootScope.$broadcast('refreshSmokeList', 'from removing a smoke');
	}

	this.removeSmoke = function(currentAuth, smoke) {

		var daynumber = Utils.daynumber(new Date(smoke.timestamp));

		var smokes = JSON.parse(localStorage.getItem(listOfSmoked));
		var smokesPerDay = JSON.parse(localStorage.getItem(smokedPerDayKey));

		if (smokesPerDay == null) {
			smokesPerDay = {};
		}

		if (smokes != null) {

			// mark smoke as deleted
			for (var i in smokes) {
				var existingSmoke = smokes[i];
				if (existingSmoke.id == smoke.id) { // found for deleting
					existingSmoke.deleted = true;
					smokes[i] = existingSmoke;
				}
			}
			localStorage.setItem(listOfSmoked, JSON.stringify(smokes));

			if (smokesPerDay != null) { // decrement smoke per day
				var daySmoke = smokesPerDay[daynumber];
				if (daySmoke != null && daySmoke.count > 0) {
					daySmoke.count--;
					daySmoke.timestamp = new Date().getTime();
					smokesPerDay[daynumber] = daySmoke;
					localStorage.setItem(smokedPerDayKey, JSON.stringify(smokesPerDay));
				}
			}

			$ionicListDelegate.closeOptionButtons();
			$rootScope.$broadcast('refreshSmokeValues', 'from removing a smoke');
		}
	}

	// calculations only from local store (need to be fired after every succesfull Sync)
	this.recalculate = function($scope) {
		var list = JSON.parse( localStorage.getItem(listOfSmoked) );
		var smokesPerDay = JSON.parse( localStorage.getItem(smokedPerDayKey) );
		var settingsJson = JSON.parse( localStorage.getItem(settingsKey));

		if (list) {
			var last = list[list.length - 1];
			$scope.lastSmokeTime = last.timestamp;
		}

		var daynumber = Utils.daynumber(new Date());
		if (smokesPerDay) {
			
			var total = 0;
		    var days = 0;
		    Object.keys(smokesPerDay).forEach(function(key) {
		    	var smokeDay = smokesPerDay[key];
		      	total += smokeDay.count;
		      	days++;
		      	if (key == daynumber + '') {
		      		console.log(smokeDay);
		      		$scope.smokesPerDay = smokeDay.count;
		      	}
		    });
		    $scope.numberOfOverallSmokes = total;
		    $scope.averagePerDay = total / days;
		    if (settingsJson) {
		    	$scope.moneySaved = Utils.moneysaved(settingsJson.pricePerPack,settingsJson.numberOfSmoked, total, days);
		      	$scope.moneySpent = Utils.moneyspent(settingsJson.pricePerPack, settingsJson.numberOfSmoked, total);
		    }
		}
	}

	this.getSmokesPerDayChartData = function() {
		var smokesPerDay = JSON.parse(localStorage.getItem(smokedPerDayKey));
		if ( smokesPerDay == null) {
			localStorage.setItem(smokedPerDayKey, '{}');
			smokesPerDay = {};
		}

		var series = { name:"Smoked",colorByPoint:true, data:[] };
  		var count = 0;
  		var BreakException= {};
  		try {
			Object.keys(smokesPerDay).forEach(function(key) {
				var todaySmoked = smokesPerDay[key];
				var date = Utils.daynumberToDate(key);
	  		    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
	        	var dataPoint = { name: formattedDate, y: todaySmoked.count};
	  	      	series.data.push(dataPoint);
	        	count++;
	        	if (count > 13) {
	        		throw BreakException;
	        	}
			});
		} catch (e) {
			if (e!==BreakException) throw e;
		}

		series.data.reverse();
		return series;
	}
});
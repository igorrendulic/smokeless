# SmokeLess

### Project Goals

The main goal was for me to learn ionic, angular, firebase and angularfire frameworks and in progress create an app that would help people reduce or even quit smoking. Project demonstrated usage of new AngularFire 2.0 library with firebase 3.0 javascript library on top of HTML5 Hyrid mobile app framework Ionic. 

You can download zip file or clone this git repo: git clone git@<span></span>github.com:igorrendulic/smokeless.git

## Install and run

Step 1: Create Firebase init file -> firebaseConfig.js under project folder: www/js. 

*You can copy/paste into this file contents from Firebase console (Project Settings/Add Firebase to your web app).
NOTE: EXCLUDE the first line if copying from Firebase Console (```<script src="https://www.gstatic.com/firebasejs/live/3.0/firebase.js"></script>``` - it's already included in index.html)*
```javascript
// Initialize Firebase
var confFirebase = {
  apiKey: "apiKEy",
  authDomain: "<PROJECT_ID>.firebaseapp.com",
  databaseURL: "https://<PROJECT_ID>.firebaseio.com",
  storageBucket: "<PROJECT_ID>.appspot.com",
};
firebase.initializeApp(confFirebase);
```

Step 2: Run local server root folder: ionic serve

*Make sure you have ionic installed http://ionicframework.com/docs/guide/installation.html*

Once it works locally you can init it as firebase project and use FREE [Google's Firebase hosting](https://firebase.google.com/). For that you will need to follow Firebase deploy instructions:
[Firebase tools install and deploy instructions](https://www.firebase.com/docs/hosting/guide/deploying.html)

## Project dependencies (included in project)

[Angular 1.5.3](https://angularjs.org/)

[Firebase](https://firebase.google.com/)

[Ionic Framework 1.3.1](http://ionicframework.com/)

[AngularFire 2.0.0.](http://ionicframework.com/)

[Highcharts v4.2.5](http://www.highcharts.com/)

[Angular messages 1.5.6](https://docs.angularjs.org/api/ngMessages)


## TODO

- Clean up the code
- improve security rules for storage buckets

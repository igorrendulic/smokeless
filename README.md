# SmokeLess

### Project Goals

Learning Google's Firebase Realtime Datastore with LocalStorage and Sync to Firebase.

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

## Project dependencies

Already included in project.

[Angular 1.5.3](https://angularjs.org/)

[Firebase](https://firebase.google.com/)

[Ionic Framework 1.3.1](http://ionicframework.com/) - only for css and html

[AngularFire 2.0.0.](https://github.com/angular/angularfire2)

[Highcharts v4.2.5](http://www.highcharts.com/)

[Angular messages 1.5.6](https://docs.angularjs.org/api/ngMessages)

## Firebase Storage Bucket Security Rules

Storabe bucket "profile" is secured. Writes are allowed only to a user who matches /profile/{userId} with auth.uid. Read are allowed to any user who is authenticated within the app. This is necessary because we wan't users to see others profile images in Social part of the app.

```
service firebase.storage {
  match /b/PROJECT_ID.appspot.com/o {
    match /profile/{userId}/{allPaths=**} {
    	allow read: if request.auth != null;
      allow write:if request.auth.uid == userId;
    }
  }
}
```

## Firebase Datastore Security Rules Explained

You can find rules in database.rules.json file.

All tables have strict security rules. Only authenticated user can view/write his own data (e.g. /settings/someUniqueUserId can read, write only when auth.uid equals "someUniqueUserId"). 

Smokes and Social lists can grow fairly large. In this case indexing is recommended. [General Database indexing info](https://en.wikipedia.org/wiki/Database_index), [Firebase indexing documentation](https://www.firebase.com/docs/security/guide/indexing-data.html)

.indexOn corresponds to orderByChild('priority') $firebaseArray queries. 

```json
{
  "rules": {
    "settings":{
      "$user_id":{
        ".read": "$user_id === auth.uid",
        ".write": "$user_id === auth.uid"
      }
    },
    "users":{
      "$user_id":{
        ".read": "$user_id === auth.uid",
        ".write": "$user_id === auth.uid"
      }
    },
    "smokes":{
      "$user_id":{
        ".read": "$user_id === auth.uid",
        ".write": "$user_id === auth.uid",
        ".indexOn": ["priority"]
      }
    },
      "smokesPerDay":{
      "$user_id":{
        ".read": "$user_id === auth.uid",
        ".write": "$user_id === auth.uid"
      }
    },
    "social":{
      ".read": "auth.uid != null",
      ".write": "auth.uid != null",
      ".indexOn": ["priority"]
    }
  }
}
```

## TODO

- Clean up the code

- Infinite Scroll on Social and Time Log

## WARNING

- Comments and Like are currently not suited for large number of comments/likes per Post. Comments and posts are currently nested in each Post. In order to scale move to it's own chil (e.g. /social/postId/comments, /social/postId/likes)

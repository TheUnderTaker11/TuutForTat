importScripts('https://www.gstatic.com/firebasejs/7.16.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.16.1/firebase-messaging.js');
 
firebase.initializeApp({
    apiKey: "AIzaSyAs1d5wFplVdPmkW_rdZhNnxVrDzAIdXbU",
    authDomain: "tuutfortat.firebaseapp.com",
    databaseURL: "https://tuutfortat-default-rtdb.firebaseio.com/",
    projectId: "tuutfortat",
    storageBucket: "tuutfortat.appspot.com",
    messagingSenderId: "244586887978"
});
 
const messaging = firebase.messaging();
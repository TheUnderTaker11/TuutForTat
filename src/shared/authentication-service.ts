import { Injectable, NgZone } from '@angular/core';
import { User, auth } from "firebase/firebase-auth";
import { IUser } from "./user";
import { Router } from "@angular/router";
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { ProfileModel } from "./profile.model";
import { filter, map, take } from 'rxjs/operators';
import { Constants } from './Constants';
import { UserModel } from "./user.model";
import { AngularFireDatabase, AngularFireList, AngularFireObject } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})

export class AuthenticationService {
  userData: any; 
  public currentUser: User;
  userProviderAdditionalInfo: any;

  constructor(
    public afStore: AngularFirestore,
    public ngFireAuth: AngularFireAuth,
    public router: Router,  
    public ngZone: NgZone,
    private db: AngularFireDatabase
  ) {
    this.ngFireAuth.authState.subscribe(user => {
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
        JSON.parse(localStorage.getItem('user'));
      } else {
        localStorage.setItem('user', null);
        JSON.parse(localStorage.getItem('user'));
      }

      this.ngFireAuth.onAuthStateChanged((user) => {
        if (user) {
          // User is signed in.
          this.currentUser = user;
        } else {
          // No user is signed in.
          this.currentUser = null;
        }
      });
    })
  }

  initLocalStorage(){
    localStorage.setItem(Constants.cached_uid, this.currentUser.uid);
    var profileData: ProfileModel = this.getProfileData();
    localStorage.setItem(Constants.cached_email, profileData.email);
    //Ensure the currentUser gets reset with new auth info. (One in constructor doesn't keep live updated :/ )
    this.ngFireAuth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in.
        this.currentUser = user;
      } else {
        // No user is signed in.
        this.currentUser = null;
      }
    });

    var dbUserRef: AngularFireObject<UserModel> = this.db.object('/users/' + localStorage.getItem(Constants.cached_uid));
    dbUserRef.valueChanges().subscribe(data => {
      if(data == null){
        this.createUser();
      }
      localStorage.setItem(Constants.cached_username, data["username"]);
      localStorage.setItem(Constants.cached_image, data["image"]);
      localStorage.setItem(Constants.cached_phone_num, data["phone"]);
    });
  }

  createUser() {
    var tempArray = localStorage.getItem(Constants.cached_email).toString().split("@");
    var defaultUserName = tempArray[0];
    this.db.object('/users/' + localStorage.getItem(Constants.cached_uid).toString()).set({
      username: defaultUserName,
      location: "Oxford MS",
      image: Constants.default_profile_image,
      phone: Constants.default_phone_number
    });
  }

  clearLocalStorage(){
    localStorage.clear();
  }

  // Login in with email/password
  SignIn(email, password) {
    return this.ngFireAuth.signInWithEmailAndPassword(email, password).then(
      res => {
        this.initLocalStorage();
      });
  }

  // Register user with email/password
  RegisterUser(email, password) {
    return this.ngFireAuth.createUserWithEmailAndPassword(email, password)
  }

  // Email verification when new user register
  
  SendVerificationMail() {
    return this.ngFireAuth.currentUser.then(u => u.sendEmailVerification())
    .then(() => {
      this.router.navigate(['verify-email']);
    })
  }

  // Recover password
  PasswordRecover(passwordResetEmail) {
    return this.ngFireAuth.sendPasswordResetEmail(passwordResetEmail)
    .then(() => {
      window.alert('Password reset email has been sent, please check your inbox.');
    }).catch((error) => {
      window.alert(error)
    })
  }

  // Returns true when user is logged in
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user'));
    return (user !== null && user.emailVerified !== false) ? true : false;
  }

  // Returns true when user's email is verified
  get isEmailVerified(): boolean {
    const user = JSON.parse(localStorage.getItem('user'));
    return (user.emailVerified !== false) ? true : false;
  }

  // Auth providers
  AuthLogin(provider) {
    return this.ngFireAuth.signInWithPopup(provider)
    .then((result) => {
       this.ngZone.run(() => {
          this.router.navigate(['dashboard']);
        })
      this.SetUserData(result.user);
    }).catch((error) => {
      window.alert(error)
    })
  }

  // Store user in localStorage
  SetUserData(user) {
    const userRef: AngularFirestoreDocument<any> = this.afStore.doc(`users/${user.uid}`);
    const userData: IUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    }
    return userRef.set(userData, {
      merge: true
    })
  }

  // Sign-out 
  SignOut() {
    this.userData = null;
    this.currentUser = null;
    localStorage.removeItem('user');
    localStorage.removeItem(Constants.cached_username);
    localStorage.removeItem(Constants.cached_image);
    localStorage.removeItem(Constants.cached_phone_num);
    localStorage.removeItem(Constants.cached_uid);
    localStorage.removeItem(Constants.cached_email);
    return this.ngFireAuth.signOut().then(() => {
      window.location.reload();
      this.router.navigate(['login']);
    })
  }

  setProviderAdditionalInfo(additionalInfo: any) {
    this.userProviderAdditionalInfo = {...additionalInfo};
  }

  public getProfileDataSource() {
    return this.ngFireAuth.user.pipe(
      filter((user: User) => user != null),
      map((user: User) => {
        return this.getProfileData();
      }),
      take(1) // this.ngFireAuth.user never completes so we use take(1) in order to complete after the first value is emitted
    );
  }

  public getProfileData() {
    const userModel = new ProfileModel();
    let providerData : any = this.currentUser.providerData[0];

    if (this.userProviderAdditionalInfo) {
      providerData = {...providerData, ...this.userProviderAdditionalInfo};
    }

    // Default imgs are too small and our app needs a bigger image
    switch (providerData.providerId) {
      case 'facebook.com':
        userModel.image = providerData.photoURL + '?height=400';
        break;
      case 'password':
        userModel.image = './assets/img/defaultprofilepic.jpg';
        break;
      case 'twitter.com':
        userModel.image = providerData.photoURL.replace('_normal', '_400x400');
        break;
      case 'google.com':
        userModel.image = providerData.photoURL.split('=')[0];
        break;
      default:
        userModel.image = providerData.photoURL;
    }
    userModel.name = providerData.name || providerData.displayName || 'What\'s your name?';
    userModel.role = 'How would you describe yourself?';
    userModel.description = providerData.description || 'Anything else you would like to share with the world?';
    userModel.phoneNumber = providerData.phoneNumber || 'Is there a number where I can reach you?';
    userModel.email = providerData.email || 'Where can I send you emails?';
    userModel.provider = (providerData.providerId !== 'password') ? providerData.providerId : 'Credentials';

    return userModel;
  }
}
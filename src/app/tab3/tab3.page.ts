import { Component, OnInit, ɵLocaleDataIndex } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from "../../shared/authentication-service";
import { AlertController, ToastController } from '@ionic/angular';
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFireDatabase, AngularFireList, AngularFireObject } from '@angular/fire/database';
import { ProfileModel } from "../../shared/profile.model";
import { UserModel } from "../../shared/user.model";
import { Constants } from 'src/shared/Constants';
import { MessagingService } from '../services/messaging.service';
//import { FCM } from '@ionic-native/fcm/ngx';
import { AngularFireMessaging } from '@angular/fire/messaging';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  dbUserRef: AngularFireObject<UserModel>;

  fireAuth: AngularFireAuth = null;
  userEmail: any = "null";
  userName: string = "null";
  image: string = Constants.default_profile_image;
  phoneNumber: string = Constants.default_phone_number;
  userID: any = "null";

  constructor(
    private messagingService: MessagingService,
    public router: Router,
    public authService: AuthenticationService,
    public alertController: AlertController,
    public ngFireAuth: AngularFireAuth,
    private db: AngularFireDatabase,
    private toastCtrl: ToastController,
    //private fcm: FCM,
    private afMessaging: AngularFireMessaging
  ) {

    this.ngFireAuth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in.
        authService.currentUser = user;
        this.userID = user.uid;
        var profileData: ProfileModel = authService.getProfileData();
        this.userEmail = profileData.email;
        if (profileData.name == "What's your name?") {
          //var tempArray = this.userEmail.toString().split("@");
          //this.userName = tempArray[0];
          this.userName = "Loading...";
        } else {
          this.userName = profileData.name;
        }
        console.log("Done loading user!");
      } else {
        // No user is signed in.
        this.userID = null;
        this.navigateToLogin();
      }

      this.dbUserRef = this.db.object('/users/' + this.userID.toString());
      
      this.userName = localStorage.getItem(Constants.cached_username);
      this.image = localStorage.getItem(Constants.cached_image);
      this.phoneNumber = localStorage.getItem(Constants.cached_phone_num);
    });

    this.listenForMessages();
  }


  listenForMessages() {
    this.messagingService.getMessages().subscribe(async (msg: any) => {
      const alert = await this.alertController.create({
        header: msg.notification.title,
        subHeader: msg.notification.body,
        message: msg.data.info,
        buttons: ['OK'],
      });

      await alert.present();
    });
  }
  //Old tutorial code
  /*
  requestPermission(): Promise<void> {
    console.log("ABout to ask for permission.");
    return new Promise<void>(async (resolve) => {
      console.log("In promise.");
      if (!Notification) {
        console.log("Not Notification?");
        resolve();
        return;
      }
      if (!firebase.messaging.isSupported()) {
        console.log("Messaging not supported.");
        resolve();
        return;
      }
      try {
        console.log("About to attempt.");
        const messaging = firebase.messaging();
        await Notification.requestPermission();
        console.log("Oh MAMA it asked for permission and got it's answer");
        this.messagingService.requestPermission
        const token: string = await messaging.getToken();
        console.log('User notifications token:', token);
      } catch (err) {
        // No notifications granted
      }

      resolve();
    });
  }
*/
  //Original requestPermission function from tutorial I used
  requestPermission() {
    this.presentAlert("Not implemented", "Due to time constraints, this feature is not currently enabled, sorry!", false)
    /*
    this.messagingService.requestPermission().subscribe(
      async token => {
        const toast = await this.toastCtrl.create({
          message: 'Got your token',
          duration: 2000
        });
        toast.present();
      },
      async (err) => {
        console.log(err);
        const alert = await this.alertController.create({
          header: 'Error',
          message: err,
          buttons: ['OK'],
        });

        await alert.present();
      }
    );*/
  }


  async deleteToken() {
    this.messagingService.deleteToken();
    const toast = await this.toastCtrl.create({
      message: 'Token removed',
      duration: 2000
    });
    toast.present();
  }

  getDBUser() {

  }

  createUser() {
    var tempArray = this.userEmail.toString().split("@");
    var defaultUserName = tempArray[0];
    this.db.object('/users/' + this.userID.toString()).set({
      username: defaultUserName,
      location: "Oxford MS",
      image: this.image,
      phone: this.phoneNumber
    });
    localStorage.setItem(Constants.cached_username, defaultUserName);
    localStorage.setItem(Constants.cached_image, this.image);
    localStorage.setItem(Constants.cached_phone_num, this.phoneNumber);
  }
  navigateToLogin() {
    this.router.navigateByUrl('login');
  }
  logout() {
    this.presentAlert('Logged Out', 'You would of been logged out here.', true);
  }
  /**
   * Will inform admins of a user wanting to become a tutor
   */
  requestTutorStatus() {
    this.presentAlert("Tutor Request", "To request to be put on one of the tutor pages, send an email to <a href = \"mailto: abc@example.com\">cabellou@go.olemiss.edu</a>, and we will get back to you ASAP", false);
  }

  editUsername() {
    this.presentUsernameChangePrompt();
  }

  editProfilePic() {
    this.presentProfilePicChangePrompt();
  }
  editLocation() {
    this.presentAlert("Edit Location", "Some method to change locations would happen (Unlikely app will ACTUALLY use this due to time constraints)", false);
  }
  editRadius() {
    this.presentAlert("Edit Radius", "Change radius (Unlikely app will ACTUALLY use this due to time constraints)", false);
  }

  async updateUsername(newUserName) {
    this.userName = newUserName;
    this.db.object('/users/' + this.userID.toString()).update({
      username: this.userName
    });
    localStorage.setItem(Constants.cached_username, newUserName);
  }

  async updateProfilePic(link) {
    this.image = link;
    this.db.object('/users/' + this.userID.toString()).update({
      image: this.image
    });
    localStorage.setItem(Constants.cached_image, this.image);
  }

  //////////////////////////////////////////Alerts////////////////////////////////
  async presentAlert(alertHeader, alertMessage, redirect) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: alertHeader,
      //subHeader: 'Subtitle',
      message: alertMessage,
      buttons: ['OK']
    });

    await alert.present();
    if (redirect) this.navigateToLogin();
  }

  async presentProfilePicChangePrompt() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Set Profile Pic Img',
      inputs: [
        {
          name: 'link',
          placeholder: 'Link to new Img'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Change',
          handler: data => {
            this.updateProfilePic(data.link);
          }
        }
      ]
    });
    alert.present();
  }
  async presentUsernameChangePrompt() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'New Username',
      inputs: [
        {
          name: 'username',
          placeholder: 'Username'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Change',
          handler: data => {
            this.updateUsername(data.username);
            localStorage.setItem(Constants.cached_username, data.username);
          }
        }
      ]
    });
    alert.present();
  }
}

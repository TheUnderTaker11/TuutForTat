import { Component, ViewChild } from '@angular/core';
import { Injectable } from '@angular/core';
import { AuthenticationService } from "../../shared/authentication-service";
import { AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFireDatabase, AngularFireList, AngularFireObject } from '@angular/fire/database';
import { DMListModel } from './dmlist.model';
import { UserModel } from "../../shared/user.model";
import { Constants } from '../../shared/Constants';
import { DMsBetweenUsersModel } from '../../shared/dbdmsbetweenusers.model';
import { DatabaseHandler } from 'src/shared/DatabaseHandler';
import { MessagingService } from '../services/messaging.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  dmid: string = "null";
  test: string = "farout";
  doneLoading: boolean = false;
  all_dm_ids: [];
  all_dms: DMListModel[] = [new DMListModel("null", "-1", "Loading...", "./assets/img/loading-icon.jpg", "Loading your DM's please wait!")];
  userID: any = null;
  userName: any = "Loading...";
  dbUserRef: AngularFireObject<UserModel>;

  constructor(
    private messagingService: MessagingService,
    public router: Router,
    public authService: AuthenticationService,
    public ngFireAuth: AngularFireAuth,
    public alertController: AlertController,
    private toastCtrl: ToastController,
    private db: AngularFireDatabase
  ) {
    this.dmid = localStorage.getItem(Constants.dmid);
    //this.getDMsForUser(authService.currentUser.uid);
    this.loadAllDMs();
    console.log("Tab 2 loaded from constructor!");
    this.listenForMessages();
  }

  /**
   * Reloads the page the 2nd time somone visits it.
   * Ionic is caching a TON of stuff that makes my app CONSTANTLY display incorrect data.
   */
  reloadControl: boolean = false;
  ionViewDidEnter() {
    if (this.reloadControl) {
      window.location.reload();
    } else {
      this.reloadControl = true;
    }
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

  requestPermission() {
    this.messagingService.requestPermission().subscribe(
      async token => {
        const toast = await this.toastCtrl.create({
          message: 'Got your token',
          duration: 2000
        });
        toast.present();
      },
      async (err) => {
        const alert = await this.alertController.create({
          header: 'Error',
          message: err,
          buttons: ['OK'],
        });
 
        await alert.present();
      }
    );
  }
 
  async deleteToken() {
    this.messagingService.deleteToken();
    const toast = await this.toastCtrl.create({
      message: 'Token removed',
      duration: 2000
    });
    toast.present();
  }

  async redirectToDM(id, target_ID) {
    localStorage.setItem(Constants.dmid, id);
    localStorage.setItem(Constants.dm_target_id, target_ID);
    this.router.navigateByUrl('directmessage');
  }


  async createNewDMOrOpenExisting(target_user_id) {
    if (target_user_id != "null") {
      console.log("Loading DM's page with user " + target_user_id);
      DatabaseHandler.openDMWithUser(localStorage.getItem(Constants.cached_uid), target_user_id, this.db, this.router);
    } else {
      console.log("User ID is null so doing nothing.")
      //I guess do nothing.
      //I could give an alert, but meh.
    }
  }

  async loadAllDMs() {
    //console.log("Starting to load all DM's");
    var dmsDBRef = this.db.list<DMsBetweenUsersModel>('dmsbetweenusers/' + localStorage.getItem(Constants.cached_uid), ref => ref.orderByKey());
    var firstRun: boolean = true;
    dmsDBRef.valueChanges().subscribe(
      (dmEntrys) => {
        if (dmEntrys == null) {
          var dummy: DMsBetweenUsersModel = new DMsBetweenUsersModel("FAKEDEFAULTUSERID", "0");
          dmsDBRef.set("realtime-write", dummy);
          console.log("Created new entry into database since one didn't exist.");
        }
        if (firstRun) {
          //console.log("Right before forEach DMsBetweenUsersModel");
          this.all_dms = [];
          dmEntrys.forEach(async (dmthing: DMsBetweenUsersModel) => {
            //console.log("About to request user data for " + dmthing.target_user);
            var usernameImageArray: string[] = await this.loadUserData(dmthing.target_user);
            console.log("Just added user " + dmthing.target_user + " with username " + usernameImageArray[0] + " and DM ID of " + dmthing.dm_index);
            this.all_dms.push(new DMListModel(dmthing.target_user, dmthing.dm_index, usernameImageArray[0], usernameImageArray[1], "Click to view..."));
          });
          //console.log("Right AFTER forEach DMsBetweenUsersModel");
          firstRun = false;
          this.doneLoading = true;
        }
      }
    );
  }

  /**
   * Grabs the username and image for a given UserID and returns them in a string[]
   * @param target_ID 
   * @return string[], index 0 is username, 1 is image.
   */
  async loadUserData(target_ID: string) {
    var firstRun: boolean = true;
    var returnArray: string[] = [];
    this.db.object('/users/' + target_ID)
      .valueChanges().subscribe(data => {
        if (firstRun) {
          if (data == null) {
            //Do nothing, just skip it.
          } else {
            returnArray = [data["username"], data["image"]];
          }
          firstRun = false;
        }
      });
    var count = 0;
    while (firstRun) {
      count++;
      await DatabaseHandler.delay(5);
      if (count > 400) {
        console.log("Wait loop timed out at 2 seconds :/ - For user " + target_ID);
        firstRun = false;
      }
    }
    return returnArray;
  }
  async presentNewUserDMPrompt() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Message new user',
      inputs: [
        {
          name: 'id',
          placeholder: 'ID of user to message'
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
          text: 'Message',
          handler: data => {
            this.createNewDMOrOpenExisting(data.id);
          }
        }
      ]
    });
    alert.present();
  }
}

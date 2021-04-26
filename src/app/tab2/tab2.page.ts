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
import { MessageModel } from '../directmessage/message.model';

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
      async (dmEntrys) => {
        if (dmEntrys == null) {
          var dummy: DMsBetweenUsersModel = new DMsBetweenUsersModel("FAKEDEFAULTUSERID", "0");
          dmsDBRef.set("realtime-write", dummy);
          console.log("Created new entry into database since one didn't exist.");
        }
        if (firstRun) {
          //console.log("Right before forEach DMsBetweenUsersModel");
          this.all_dms = [];
          dmEntrys.forEach(async (dmthing: DMsBetweenUsersModel) => {
            var messagesDBRef = this.db.list<MessageModel>('allmessages/' + dmthing.dm_index, ref => ref.orderByKey());
            var firstRun2: boolean = true;
            messagesDBRef.valueChanges().subscribe(
              async (messages) => {
                if (firstRun2) {
                  var lastMessageObj: MessageModel = messages.pop();
                  var lastMessageSender: string = lastMessageObj.sender;
                  var lastMessageContent: string = lastMessageObj.content;
                  if (lastMessageSender == localStorage.getItem(Constants.cached_uid)) {
                    lastMessageContent = "You: " + lastMessageContent;
                  } else {
                    lastMessageContent = "Them: " + lastMessageContent;
                  }
                  var usernameImageArray: string[] = await this.loadUserData(dmthing.target_user);
                  console.log("Just added user " + dmthing.target_user + " with username " + usernameImageArray[0] + " and DM ID of " + dmthing.dm_index);
                  this.all_dms.push(new DMListModel(dmthing.target_user, dmthing.dm_index, usernameImageArray[0], usernameImageArray[1], lastMessageContent));
                  firstRun2 = false;
                }
              }
            );
            //console.log("About to request user data for " + dmthing.target_user);

          });
          //console.log("Right AFTER forEach DMsBetweenUsersModel");
          firstRun = false;
          this.doneLoading = true;
        } else {
          var dmModelThing: DMsBetweenUsersModel = dmEntrys.pop();
          var usernameImageArray: string[] = await this.loadUserData(dmModelThing.target_user);
          console.log("Just added user " + dmModelThing.target_user + " with username " + usernameImageArray[0] + " and DM ID of " + dmModelThing.dm_index);
          var foundExistingDM: boolean = false;
          this.all_dms.forEach(
            (dmListModelObj) => {
              if(dmListModelObj.target_id.toString() == dmModelThing.target_user.toString()){
                dmListModelObj.targets_lastmessage = "New message, click to view...";
                //Temporary solution to at least inform users that a new message has been recieved
                this.all_dms.push(new DMListModel(dmModelThing.target_user, dmModelThing.dm_index, "NEW MESSAGE FROM: " + usernameImageArray[0], usernameImageArray[1], "Click to view the new message!"));
                foundExistingDM = true;
              }
            }
          );
          //If one doesn't exist, make a new one.
          if(!foundExistingDM){
            this.all_dms.push(new DMListModel(dmModelThing.target_user, dmModelThing.dm_index, usernameImageArray[0], usernameImageArray[1], "New Message, click to view..."));
          }
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

import { IonContent } from '@ionic/angular';
import { Component, OnInit, ɵLocaleDataIndex, ViewChild } from '@angular/core';
import { RouterModule, Routes, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFireDatabase, AngularFireList, AngularFireObject } from '@angular/fire/database';
import { Constants } from 'src/shared/Constants';
import { MessageEntry } from './MessageEntryObj';
import { DatabaseHandler } from 'src/shared/DatabaseHandler';
import { Observable } from 'rxjs';
import { MessageModel } from './message.model';

@Component({
  selector: 'app-directmessage',
  templateUrl: './directmessage.page.html',
  styleUrls: ['./directmessage.page.scss'],
})
export class DirectmessagePage implements OnInit {

  @ViewChild(IonContent, { static: false }) content: IonContent;

  dm_id: string = null;
  target_ID: string = null;
  target_Username: string = "USER INVALID";
  targetImage: string = Constants.default_profile_image;
  allMessages: MessageEntry[] = [];
  doneLoading: boolean = false;

  constructor(
    public router: Router,
    public alertController: AlertController,
    public ngFireAuth: AngularFireAuth,
    private db: AngularFireDatabase
  ) {
    this.dm_id = localStorage.getItem(Constants.dmid);
    this.target_ID = localStorage.getItem(Constants.dm_target_id);
    if (this.dm_id == null || this.target_ID == null || this.dm_id == undefined || this.target_ID == undefined) {
      //|| this.dm_id == "null" || this.target_ID == "null" || this.dm_id == "undefined" || this.target_ID == "undefined"
      this.presentAlert("Invalid DM opening", "ID or Target for the DM was not set or invalid!");
      console.log("ROUTED DUE TO INVALID DM OPENING " + this.dm_id + " and " + this.target_ID);
      this.router.navigateByUrl('tabs/tab2');
    }
    this.loadInfoAboutTarget();
    this.loadAllMessages();
    console.log("End of DM constructor, doneLoading = " + this.doneLoading);
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

  ngOnInit() {
  }


  sendMessage(messageRaw) {
    var message: string = messageRaw.value;
    if (message == null || message == "") {
      this.presentAlert("Invalid Message", "You gotta type something silly!");
      return;
    }
    console.log("Sending message: " + message);
    var DBMessageFormat: MessageModel = new MessageModel();
    DBMessageFormat.content = message.toString();
    DBMessageFormat.sender = localStorage.getItem(Constants.cached_uid).toString();
    DBMessageFormat.time = Date.now() + "";
    this.db.list<MessageModel>('allmessages/' + localStorage.getItem(Constants.dmid), ref => ref.orderByKey()).push(DBMessageFormat);

    //window.location.reload();
    //Instead of reloading the page, just clear the text box and add it to the list!
    (<HTMLInputElement>document.getElementById("sendmessagebox")).value = "";
    this.allMessages.push(new MessageEntry(DBMessageFormat.sender, localStorage.getItem(Constants.cached_username), DBMessageFormat.content, localStorage.getItem(Constants.cached_image)));
    this.scrollToBottom();
  }
  /**
     * Grabs all messages between the 2 users and loads them into an array of MessageEntry objects
     * 
     * I would LOVE to do this in DatabaseHandler.ts, but shit this is so infurating honestly.
     */
  async loadAllMessages() {
    await this.ensureMessagesExist();
    //The array I'm working with
    //this.allMessages
    var isDone: boolean = false;

    var rawMessagesList: MessageModel[] = [];
    var messagesList: Observable<any[]>;
    var messagesDBRef = this.db.list<MessageModel>('allmessages/' + localStorage.getItem(Constants.dmid), ref => ref.orderByKey());
    //var test = messagesDBRef.map(obj => Object.values(obj));
    var firstRun = true;
    messagesDBRef.valueChanges().subscribe(
      async (messages) => {
        if (firstRun) {
          //if (true) {
          console.log("Loading messages");
          messages.forEach((message) => {
            rawMessagesList.push(message);
          });
          this.sortAndFillMessagesArray(rawMessagesList);
          isDone = true;
          firstRun = false;
        } else {
          //Add a single new message to their list.
          console.log("This log SHOULD mean a new message was recieved. (Either sent by us or the other account)");
          //Reload is the jank way to do it
          //window.location.reload();
          //This gives a seamless experince!
          var messageObj = messages.pop();
          if (messageObj.sender.toString() != localStorage.getItem(Constants.cached_uid)) {
            
            var senderDisplayName = localStorage.getItem(Constants.dm_target_username);
            var senderProfileImage = this.targetImage;
            this.allMessages.push(new MessageEntry(messageObj.sender, senderDisplayName, messageObj.content, senderProfileImage));
            this.scrollToBottom();
          }
        }
      }
    );

    while (!isDone) {
      await this.delay(50);
    }

    this.doneLoading = true;
    this.scrollToBottom();
  }

  async scrollToBottom() {
    await this.delay(600);
    var objDiv = document.getElementById("messagesDiv");
    objDiv.scrollTop = objDiv.scrollHeight;
  }

  sortAndFillMessagesArray(rawMessagesList: MessageModel[]) {
    //this.doneLoading = false;
    //this.allMessages.length = 0;
    rawMessagesList.forEach(messageObj => {
      var senderDisplayName: string = null;
      var senderProfileImage: string = null;
      if (messageObj.sender.toString() == localStorage.getItem(Constants.cached_uid)) {
        senderDisplayName = localStorage.getItem(Constants.cached_username) + " (You!)";
        senderProfileImage = localStorage.getItem(Constants.cached_image);
      } else {
        senderDisplayName = localStorage.getItem(Constants.dm_target_username);
        senderProfileImage = this.targetImage;
      }
      this.allMessages.push(new MessageEntry(messageObj.sender, senderDisplayName, messageObj.content, senderProfileImage));
    });
    //this.doneLoading = true;
  }
  async ensureMessagesExist() {
    var messagesDBRef = this.db.object('allmessages/' + localStorage.getItem(Constants.dmid) + "/-1");
    messagesDBRef.valueChanges().subscribe(data => {
      if (data == null) {
        messagesDBRef.set({
          content: "Default starting message!",
          sender: localStorage.getItem(Constants.cached_uid),
          time: Date.now()
        });
      }
    });

  }

  async loadInfoAboutTarget() {
    var firstRun: boolean = true;
    this.db.object('/users/' + localStorage.getItem(Constants.dm_target_id))
      .valueChanges().subscribe(data => {
        if (firstRun) {
          if (data == null) {
            this.presentAlert("User not found", "Couldn't find an existing user with the given UserID!");
            this.router.navigateByUrl('tabs/tab2');
          } else {
            this.target_Username = data["username"];
            localStorage.setItem(Constants.dm_target_username, data["username"]);
            this.targetImage = data["image"];
            localStorage.setItem(Constants.dm_target_image, data["image"]);
          }
          firstRun = false;
        }
      });
    while (true) {
      this.dm_id = localStorage.getItem(Constants.dmid);
      this.target_ID = localStorage.getItem(Constants.dm_target_id);
      this.target_Username = localStorage.getItem(Constants.dm_target_username);
      this.targetImage = localStorage.getItem(Constants.dm_target_image);
      console.log("Tested local values - " + this.dm_id + " and " + this.target_ID);
      await this.delay(500);
    }
  }
  /**
   * Send you back to the list of all your DM's page
   */
  redirectToMessages() {
    this.router.navigateByUrl('tabs/tab2');
  }
  searchDirectMessages() {
    this.presentAlert("Search Messages", "This would allow searching through the private messages. (Low priority, might not get implemented)");
  }

  async presentAlert(alertHeader, alertMessage) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: alertHeader,
      //subHeader: 'Subtitle',
      message: alertMessage,
      buttons: ['OK']
    });

    await alert.present();
  }

  async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

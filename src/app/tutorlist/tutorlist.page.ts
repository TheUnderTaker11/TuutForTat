import { Component, OnInit } from '@angular/core';
import { RouterModule, Routes, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Constants } from 'src/shared/Constants';
import { DatabaseHandler } from 'src/shared/DatabaseHandler';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from '@angular/fire/database';


@Component({
  selector: 'app-tutorlist',
  templateUrl: './tutorlist.page.html',
  styleUrls: ['./tutorlist.page.scss'],
})
export class TutorlistPage implements OnInit {

  category: string;
  constructor(public router: Router, 
    public alertController: AlertController,
    private db: AngularFireDatabase) { 
    this.category = localStorage.getItem(Constants.selected_tutor_category);
  }

  isCalc(){
    return (this.category == Constants.category_math_calculus);
  }

  isTrig(){
    return (this.category == Constants.category_math_trig);
  }

  backToTab1(){
    this.router.navigateByUrl('tabs/tab1');
  }
  ngOnInit() {
  }

  dmTutor(targetUserID){
    DatabaseHandler.openDMWithUser(localStorage.getItem(Constants.cached_uid), targetUserID, this.db, this.router);
  }
  async presentAlert(alertHeader, alertMessage, redirect) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: alertHeader,
      //subHeader: 'Subtitle',
      message: alertMessage,
      buttons: ['OK']
    });

    await alert.present();
    //if(redirect) this.router.navigateByUrl('directmessage');
  }

}

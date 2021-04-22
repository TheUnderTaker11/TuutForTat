import { Component } from '@angular/core';
import { RouterModule, Routes, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Constants } from 'src/shared/Constants';
import { AuthenticationService } from "../../shared/authentication-service";

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  category : string;

  constructor(public router: Router, public alertController: AlertController) {}

  subCategorySelected(){
    this.presentAlert("Selected " + this.category, "Click on any of the tutors to start messaging them!" , true);
    localStorage.setItem(Constants.selected_tutor_category, this.category);
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
    if(redirect){
      this.router.navigateByUrl('tutorlist');
      //window.location.reload();
    } 
  }
}

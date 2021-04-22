import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthenticationService } from "../../shared/authentication-service";


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})

export class LoginPage implements OnInit {
  userName: any = "test";
  user: any;

  constructor(
    public router: Router, 
    public authService: AuthenticationService,
    public alertController: AlertController,
    ) { 
      
    }

  ngOnInit() {
  }

  recoverFromEmail(email){
    this.authService.PasswordRecover(email.value)      
      .then((res) => {
        this.router.navigateByUrl('tabs/tab1');
      }).catch((error) => {
        window.alert(error.message)
      })
  }

  logIn(email, password) {
    this.authService.SignIn(email.value, password.value)
      .then((res) => {
        if(this.authService.isEmailVerified) {
          this.router.navigateByUrl('tabs/tab1');         
        } else {
          window.alert('Email is not verified')
          return false;
        }
      }).catch((error) => {
        window.alert(error.message)
      })
  }

  signUp(email, password){
      this.authService.RegisterUser(email.value, password.value)      
      .then((res) => {
        this.authService.SendVerificationMail()
        this.router.navigateByUrl('verify-email');
      }).catch((error) => {
        window.alert(error.message)
      })
  }

  loginAttempt(){
    this.presentAlert("Logging in", 'Here it would try to log you in, then redirect to this page it just switched to.');
  }
  registerNewAccount(){
    this.presentAlert("Creating new account", 'Here it would start whatever is used to register a new account, presumibly going to this page afterwards.');
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
    this.router.navigateByUrl('tabs/tab1');
  }

}

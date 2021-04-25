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

  recoverFromEmail(email) {
    this.authService.PasswordRecover(email.value)
      .then((res) => {
        this.router.navigateByUrl('tabs/tab1');
      }).catch((error) => {
        window.alert(error.message)
      })
  }

  /**
   * Always throws some BS error on first login attempt
   * So if it's not a known error, it will trying logging in a 2nd time before actually
   * displaying the error to the user!
   * 
   * BIG NOTE: In authService.SignIn(), the localStorage is initilized with username/image/phone #/etc. etc.!!!!!
   * So make sure if they log in, that works correctly and doesn't error out.
   * @param email 
   * @param password 
   * @param secondRun 
   */
  logIn(email, password, secondRun = false) {
    this.authService.SignIn(email.value, password.value)
      .then((res) => {
        if (this.authService.isEmailVerified) {
          this.router.navigateByUrl('tabs/tab1');
        } else {
          window.alert('Email is not verified')
          return false;
        }
      }).catch((error) => {
        console.log("Error in logIn() function.");
        console.log(error);
        var errorString = error + "";
        if (errorString == "Error: The password is invalid or the user does not have a password.") {
          window.alert("Invalid username or password!");
        } else if (errorString == "Error: The email address is badly formatted.") {
          window.alert("Username must be a valid email!");
        } else {
          if(secondRun){
            window.alert(error);
          }else{
            //If it's only the first run, try logging in again.
            this.logIn(email, password, true);
          }
          
        }
      })
  }

  signUp(email, password) {
    this.authService.RegisterUser(email.value, password.value)
      .then((res) => {
        this.authService.SendVerificationMail()
        this.router.navigateByUrl('verify-email');
      }).catch((error) => {
        window.alert(error.message)
      })
  }

  loginAttempt() {
    this.presentAlert("Logging in", 'Here it would try to log you in, then redirect to this page it just switched to.');
  }
  registerNewAccount() {
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

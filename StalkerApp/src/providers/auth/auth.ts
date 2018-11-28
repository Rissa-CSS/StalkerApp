import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { GooglePlus } from '@ionic-native/google-plus';
import * as firebase from 'firebase/app';
import { DatabaseProvider } from '../database/database';
import { TwitterConnect } from '@ionic-native/twitter-connect';
import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook';



@Injectable()
export class AuthProvider {

  userProfile: any = null;
  uid: string;

  constructor(public afAuth: AngularFireAuth,
    public googlePlus: GooglePlus,
    public database: DatabaseProvider,
    public twitterConnect: TwitterConnect,
    public facebook: Facebook) {
    console.log('Hello AuthProvider Provider');
  }

  //Creates a new Firebase user with email and password
  async postUser2Firebase(email, password, firstname, lastname) {
    try {
      let newUser = await firebase.auth().createUserWithEmailAndPassword(email, password);

      //Add the user to the collection
      await this.database.setUserDoc(newUser.user.uid, firstname, lastname);
      
      console.log(`${newUser.user.email} 's UID: ${newUser.user.uid}`);
    }
    catch(e) {
      throw(e);
    }
  }

  //Signs existing user in with email and password
  //Param:
  //    credentials = {
  //        email:String,
  //        password:String
  //      };
  async loginWithEmail(credentials) {
    try{
      await this.afAuth.auth.signInWithEmailAndPassword(credentials.email, credentials.password);
      this.uid = this.afAuth.auth.currentUser.uid;
    }
    catch(e)
    {
       throw(e);
    } 
  }

  //Signs user in with google account
  //User does not need to sign up for Stalker App
  //If user doesn't exist when signing in with Google,
  //function automatically creates account in Firebase
  async loginWithGoogle() {
    try {
      if ((<any>window).cordova) {
        let response = await this.googlePlus.login({
          'webClientId': '733520227387-jmb6ooftoiu5g4j9pg57lbeo89006fru.apps.googleusercontent.com',// optional clientId of your Web application from Credentials settings of your project - On Android, this MUST be included to get an idToken. On iOS, it is not required.
          'offline': true
        })

        const googleCredential = await firebase.auth.GoogleAuthProvider.credential(response.idToken);
        await firebase.auth().signInWithCredential(googleCredential);
      }
      else {
        await this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      }
    }
    catch (e) {
      throw (e);
    }
  }

  async loginWithTwitter() {
    try {
      if ((<any>window).cordova) {
        let response = await this.twitterConnect.login();
        console.log("loginWithTwitter successful", response)

        const twitterCredential = await firebase.auth.TwitterAuthProvider
          .credential(response.token, response.secret);

        let userProfile = await firebase.auth().signInWithCredential(twitterCredential)
        this.userProfile = userProfile;
        this.userProfile.twName = response.userName;
        console.log(this.userProfile);

        return this.userProfile;
      }
      else {
        await this.afAuth.auth.signInWithPopup(new firebase.auth.TwitterAuthProvider());
      }
    } catch (e) {
      throw (e);
    }
  }

  async loginWithFacebook() {
    try {
      if ((<any>window).cordova) {
        // Login with permissions
        let res: FacebookLoginResponse = await this.facebook.login(['public_profile', 'user_photos',
          'email', 'user_birthday']);

        // The connection was successful
        if (res.status == "connected") {

          // Get user ID and Token
          let fb_id = await res.authResponse.userID;
          let fb_token = await res.authResponse.accessToken;

          // Get user infos from the API
          let user = await this.facebook.api("/me?fields=name,gender,birthday,email", []);

          // Get the connected user details
          let gender = user.gender;
          let birthday = user.birthday;
          let name = user.name;
          let email = user.email;

          console.log("=== USER INFOS ===");
          console.log("Gender : " + gender);
          console.log("Birthday : " + birthday);
          console.log("Name : " + name);
          console.log("Email : " + email);
        }
      }
      else {
        await this.afAuth.auth.signInWithPopup(new firebase.auth.FacebookAuthProvider());

      }

    } catch (e) {
      throw (e);
    }
  }

  //Logs user out
  async logout() {
    try {
      await this.afAuth.auth.signOut();
    }
    catch (e) {
      console.log(e);
    }
  }

}

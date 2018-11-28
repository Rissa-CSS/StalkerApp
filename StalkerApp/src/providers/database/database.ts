import { AuthProvider } from './../auth/auth';
import { Injectable } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';
import { AngularFireStorage } from 'angularfire2/storage';
import * as firebase from 'firebase';
import 'firebase/firestore';

@Injectable()
export class DatabaseProvider {

  //The user directory
  users: any[];
  //Download URLs for specific image files in storage. Keyed like so
  //{
  //  './myfile.jpg': 'https://www.whatever.thisdownload.net/myfile.jpg',
  //  './otherfile.jpg': 'https://www.whatever.thisdownload.net/otherfile.jpg'
  //}
  image_urls: any = {};

  private fire: any;

  constructor(
    public db: AngularFirestore,
    public store: AngularFireStorage
  ) {

    this.fire = firebase.firestore()

    //Track any changes to the Users collection
    this.db.collection('Users').valueChanges().subscribe((collection) => {

      //Store collection in the users object
      this.users = collection;
      //For each user in the users collection
      this.users.forEach((user) => {

        //If the user has a picture
        if (user.Picture != null) {
          //Get the download url of the file listed as its picture
          this.store.storage.ref(user.Picture).getDownloadURL().then((url) => {
            //Store that url in an object, keyed with the name of the file
            this.image_urls[user.Picture] = url;
          });
        }

      })

    });

  }

  /* setUserDoc
   * Desc: Asynchronous. Uploads a user document to the firestore.
   * Params:
   *     id: the id of the document being set
   *     firstname: the first name of the user
   *     lastname: the last name of the user
   * returns: nothing.
   */
  async setUserDoc(id: string, firstname: string, lastname: string) {
    try {

      var obj = {
        first: firstname,
        last: lastname
      }

      await this.db.collection('Users').doc(id).set(obj);

    } catch (e) {
      throw e;
    }
  }

  /* storeImg
   * Desc: Asynchronous. Stores an image to the firebase storage.
   * Params:
   *     image64: a base 64 encoded image (uri?)
   *     filename: the name the user wishes to give the file
   * returns: nothing.
   */
  async storeImg(image64: string, filename: string) {
    try {
      let image_folder = this.store.ref('images/' + filename);

      image_folder.putString(image64, 'data_url');

    } catch (e) {
      throw e;
    }
  }

  async setUserImg(id: string, filename: string){
    try{
      let temp = {};
      temp["Picture"] = 'images/' + filename;
      await this.db.collection("Users").doc(id).update(temp);
    }catch(e){
      throw e;
    }
  }

  async usersObj(){

    try{
      var query = await this.fire.collection("Users").get();
      var collection_obj = {};
      query.forEach(
        (doc: any) => {
          var doc_obj = {};
          var doc_data = doc.data();
          for (var field in doc_data){
            doc_obj[field] = doc_data[field];
          }
          collection_obj[doc.id] = doc_obj;
        }
      );

      return collection_obj;

    }
    catch(e){
      throw e;
    }
  }

  async profilePic(id: string){
    let allUsers = await this.usersObj();
    return this.image_urls[allUsers[id]['Picture']];
  }

}

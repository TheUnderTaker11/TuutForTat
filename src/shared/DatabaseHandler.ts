import { MessageEntry } from "src/app/directmessage/MessageEntryObj";
import { Constants } from "./Constants";
import { AngularFireDatabase, AngularFireList, AngularFireObject } from '@angular/fire/database';
import { DMsBetweenUsersModel } from './dbdmsbetweenusers.model';
import { DomElementSchemaRegistry } from "@angular/compiler";

// JxIow3Nou7hHEwkWQ2zIENwpAEo1
export class DatabaseHandler {

    /**
     * If a DM exist it will open it, if not, it will create a new one then open it.
     * @param currentUser 
     * @param targetUser 
     * @param db Database reference.
     * @param router Router which will have .navigateByUrl() called on it.
     */
    public static openDMWithUser(currentUserID, targetUserID, db: AngularFireDatabase, router) {
        console.log("Starting DM open process with user " + targetUserID);
        var new_dmid: string = null;
        var dmsList: DMsBetweenUsersModel[] = [];
        var dmsDBRef = db.list<DMsBetweenUsersModel>('dmsbetweenusers/' + currentUserID.toString(), ref => ref.orderByKey());
        var firstRun: boolean = true;
        dmsDBRef.valueChanges().subscribe(
            async (dmEntrys) => {
                if(dmEntrys == null){
                    var dummy :DMsBetweenUsersModel = new DMsBetweenUsersModel("FAKEDEFAULTUSERID", "0");
                    dmsDBRef.set("realtime-write", dummy);
                    console.log("Created new entry into database since one didn't exist.");
                }
                if (firstRun) {
                    dmEntrys.forEach((dmthing:DMsBetweenUsersModel) => {
                        if(dmthing.target_user == targetUserID){
                            //We found an existing DM, so use it.
                            new_dmid = dmthing.dm_index;
                            console.log("Found existing DM db entry.");
                        }
                        dmsList.push(dmthing);
                    });
                    //If we don't find an existing DM id, make a new one.
                    if(new_dmid == null){
                        console.log("Created new DM db entry since it didn't exist.");
                        new_dmid = "" + (await this.createNewDMBetweenUsers(currentUserID, targetUserID, db));
                    }

                    localStorage.setItem(Constants.dmid, new_dmid);
                    localStorage.setItem(Constants.dm_target_id, targetUserID);
                    firstRun = false;

                    //Now we have the cache values set, go to the page and reload
                    //If you don't reload, the browser is annoying and doesn't actually load new page content.
                    console.log("Ended DM open process, final DM ID Found is " + new_dmid);
                    router.navigateByUrl('directmessage');
                    //Can't have this, returns you back to previous page!
                    //window.location.reload();
                }
            }
        );
        
        //router.navigateByUrl('directmessage');
    }

    public static async createNewDMBetweenUsers(currentUserID, targetUserID, db: AngularFireDatabase) {
        var new_dmid: number = null;
        var run: boolean = false;
        var done: boolean = false;
        db.object('/allexistingdms/currentindex')
            .valueChanges().subscribe(data => {
                if (!run) {
                    if (data == null) {
                        this.createNewAllDMsIndex(db);
                        new_dmid = 0;
                    } else {
                        //Make new ID 1 higher than the old one.
                        new_dmid = data["index"];
                        new_dmid = new_dmid + 1;
                        this.iterateDMsIndexLazy(data["index"], db);
                    }

                    //Set DM id for this user's db entry
                    var usersEntry: DMsBetweenUsersModel = new DMsBetweenUsersModel(targetUserID.toString(), new_dmid.toString());
                    db.list<DMsBetweenUsersModel>('/dmsbetweenusers/' + currentUserID.toString()).push(usersEntry);
                    //Set DM id for target user's db entry
                    var targetsEntry: DMsBetweenUsersModel = new DMsBetweenUsersModel(currentUserID.toString(), new_dmid.toString());
                    db.list<DMsBetweenUsersModel>('/dmsbetweenusers/' + targetUserID.toString()).push(targetsEntry);

                    run = true;
                    done = true;
                }
            });

        console.log("Setting ID's in dmsbetweenusers now " + new_dmid);
        while(!done){
            await this.delay(500);
        }
        return new_dmid;
    }

    private static createNewAllDMsIndex(db) {
        db.object('/allexistingdms/currentindex').set({
            index: 0
        });
        return 0;
    }

    /**
     * Adds 1 to the current /allexistingdms/currentindex "index" value.
     * @param db 
     */
    private static iterateDMsIndex(db) {
        var oldValue: number = null;
        db.object('/allexistingdms/currentindex')
            .valueChanges().subscribe(data => {
                if (oldValue == null) {
                    oldValue = data["index"];
                    this.iterateDMsIndexLazy(oldValue, db);
                }
            });
    }

    /**
     * Adds 1 to the current /allexistingdms/currentindex "index" value.
     * Assumes whatever you pass in is the correct current value of that index.
     * @param db 
     */
    private static iterateDMsIndexLazy(oldValue: number, db) {
        var newValue: number = oldValue + 1;
        db.object('/allexistingdms/currentindex').set({
            index: newValue
        });
    }

    public static async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
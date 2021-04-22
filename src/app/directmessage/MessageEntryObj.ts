export class MessageEntry{
    public user_id: String;
    public username: String;
    public message: String;
    public image: String;

    constructor(
        userID: String,
        userName: String,
        rawmessage: String,
        Image: String
    ){
        this.user_id = userID;
        this.username = userName;
        this.message = rawmessage;
        this.image = Image;
    }
}
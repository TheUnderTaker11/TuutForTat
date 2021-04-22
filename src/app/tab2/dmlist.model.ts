export class DMListModel {
    target_id: string;
    id: string;
    targets_username: string;
    targets_image: string;
    targets_lastmessage: string;

    constructor(
        target_user_id,
        dm_id,
        username,
        image,
        lastmessage
    ){
        this.target_id = target_user_id;
        this.id = dm_id;
        this.targets_username = username;
        this.targets_image = image;
        this.targets_lastmessage = lastmessage;
    }
}
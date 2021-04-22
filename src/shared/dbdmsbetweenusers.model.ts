export class DMsBetweenUsersModel {
    public target_user: string;
    public dm_index: string;

    constructor(
        targetUser: string,
        DM_Index: string,
    ){
        this.target_user = targetUser;
        this.dm_index = DM_Index;
    }
}
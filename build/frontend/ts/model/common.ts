/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

/// <reference path="../command.ts" />

module Common {

  export enum UserAction {
    Added,
    Left,
    AdminSelected,
  }

  export interface MessageDispatcher {
    AddUserMessagesObserver(callback : (type : Command.Type,
                                        data : string,
                                        user_id : string) => boolean) : void;
    AddUserChangedObserver(callback : (action : UserAction,
                                       user_id : string) => void) : void;
    SendUserMessage(type : Command.Type, data: string) : void;
    GetUsers() : User[];
    GetCurrentUser() : User;
    GetTaskInfo(task_id : string) : Promise<Object>;
  }

}

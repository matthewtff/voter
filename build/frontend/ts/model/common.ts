/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

/// <reference path="../command.ts" />

/// <reference path="message_router.ts" />

module Common {

  export enum UserAction {
    Added,
    Left
  }

  export interface MessageDispatcher {
    AddUserChangedObserver(callback : (action : UserAction,
                                       user_id : string) => void) : void;
    GetCurrentUser() : User;
    GetMessageRouter() : Model.MessageRouter;
    GetUsers() : User[];
    GetTaskInfo(task_id : string) : Promise<Object>;
  }

}

/// <reference path="typings/es6-promise/es6-promise.d.ts" />

/// <reference path="command.ts" />
/// <reference path="room.ts" />
/// <reference path="utils.ts" />
/// <reference path="user.ts" />

/// <reference path="model/common.ts"/>
/// <reference path="model/message_router.ts"/>
/// <reference path="model/tasks.ts" />

/// <reference path="ui/chat.ts" />

interface MessageHandler {
  command : string;
  handle(message : Object) : void;
}

interface TaskCallbacks {
  resolve : (value? : Object | Thenable<Object>) => void;
  reject : (error? : any) => void;
}

class RoomPage implements Utils.MessageProcessor,
                          Common.MessageDispatcher {
  private static kIndexPagePath = "/html/index.html";
  private static kMaximumNumberOfBrokenRequests = 5;
  private users_ : User[];
  private current_user_ : User;
  private room_ : Room;
  private message_handlers_ : MessageHandler[];
  private number_of_broken_requests_ : number;
  private message_router_ : Model.MessageRouter;
  private user_action_listeners_ :
      ((action : Common.UserAction, user_id : string) => void)[];
  private tasks_ : Tasks.TaskList;
  private tasks_callbacks_ : TaskCallbacks[];

  // UI:
  private select_link_ : Element;
  private chat_ : UI.Chat;

  constructor() {
    this.InitializeVariables();

    // Registering event listeners.
    this.select_link_.addEventListener('click', this.SelectRoomUrl.bind(this));

    this.RegisterMessageHandlers();

    this.room_ = new Room({room_id : document.location.hash.substr(1)});
    if (!this.room_) {
      RoomPage.MoveToHomePage();
    }
    this.RenderRoomInfo();
    this.RegisterUser();
    this.GetAllUsers();
  }

  OnMessageReceived(response : Object, is_long_poll : boolean) {
    this.number_of_broken_requests_ = 0;
    this.message_handlers_.forEach(handler => {
      if (response[Utils.kCommand] == handler.command) {
        try {
          handler.handle(response);
        } catch (error) {
          console.log('Error handling %s: %s', handler.command, error.message);
        }
      }
    });

    if (is_long_poll) {
      this.MakeLongPoll();
    }
  }

  // Common.MessageDispatcher implementation:
  AddUserChangedObserver(callback : (action : Common.UserAction,
                                     user_id : string) => void) : void {
    this.user_action_listeners_.push(callback);
  }

  GetUsers() : User[] { return this.users_; }
  GetCurrentUser() : User { return this.current_user_; }
  GetChat() : UI.Chat { return this.chat_; }
  GetMessageRouter() : Model.MessageRouter { return this.message_router_; }

  GetTaskInfo(task_id : string) : Promise<Object> {
    return new Promise<Object>((resolve, reject) => {
      this.tasks_callbacks_[task_id] = {
        resolve : resolve,
        reject : reject
      };
      const parameters =
          "id=" + this.current_user_.id() + "&task_id=" + task_id;
      Utils.RunHttpRequest('/user?command=get_task&' + parameters, this);
    });
  }

  // private:
  private InitializeVariables() {
    this.current_user_ = null;
    this.users_ = [];
    this.message_handlers_ = [];
    this.number_of_broken_requests_ = 0;
    this.user_action_listeners_ = [];
    this.message_router_ = new Model.MessageRouter(this);
    this.tasks_ = new Tasks.TaskList(this);
    this.tasks_callbacks_ = [];

    this.select_link_ = document.querySelector('.select-room-url');
    this.chat_ = new UI.Chat(
        this.message_router_.SendUserMessage.bind(this, Command.Type.ChatMessage));
  }

  private RegisterMessageHandlers() {
    this.AddMessageHandler("user_message", this.OnUserMessage.bind(this));
    this.AddMessageHandler("user_info", this.OnUserInfo.bind(this));
    this.AddMessageHandler("user_leave", this.OnUserLeave.bind(this));
    this.AddMessageHandler("add_user", this.OnAddUser.bind(this));
    this.AddMessageHandler("admin_selected", function(){});
    this.AddMessageHandler("get_task", this.OnGetTask.bind(this));
    this.AddMessageHandler("users_list", this.OnUsersList.bind(this));
  }

  OnMessageAborted(error : string, url : string) {
    const hash = document.location.hash;
    if (url.indexOf("long_poll") != -1) {
      if (++this.number_of_broken_requests_ <
              RoomPage.kMaximumNumberOfBrokenRequests) {
        // Longpoll request could abort if we sent another request using XHR.
        this.MakeLongPoll();
      } else {
        RoomPage.MoveToHomePage();
      }
    } else {
      // TODO(matthewtff): Show error message...
      console.error('Got aborted message for %s', url);
    }
  }

  private OnUserMessage(response : Object) {
    const user = this.FindUser(response['user_id']);
    this.message_router_.OnUserMessageReceived(user, response[Utils.kData]);
  }

  private OnUserInfo(response : Object) {
    this.current_user_ = this.UpdateUser(response[Utils.kData]);
  }

  private OnUserLeave(response : Object) {
    const removed_user = this.RemoveUser(response[Utils.kData]);
    Utils.Write('User disconnected: ' + removed_user.identity_for_test());
    this.user_action_listeners_.forEach(
        callback => callback(Common.UserAction.Left, removed_user.id()));
  }

  private OnAddUser(response : Object) {
    const new_user = this.UpdateUser(response[Utils.kData]);
    this.user_action_listeners_.forEach(
        callback => callback(Common.UserAction.Added, new_user.id()));
    this.tasks_.BroadcastCurrentTasks();
  }

  private OnGetTask(response : Object) {
    const task_info = response[Utils.kData];
    const task_id = task_info['key'];
    if (this.tasks_callbacks_[task_id]) {
      this.tasks_callbacks_[task_id].resolve(task_info);
      delete this.tasks_callbacks_[task_id];
    } else {
      Utils.Write('No callback for ' + task_id + ' registered :(');
    }
  }

  private OnUsersList(response : Object) {
    const users_list = response[Utils.kData];
    if (!Utils.IsArray(users_list)) {
      throw new Error("Wrong users list: " + JSON.stringify(users_list));
    }
    users_list.forEach(user_info => this.UpdateUser(user_info));
  }

  private AddMessageHandler(command_name : string,
                            handler_fun : (value : Object) => void) {
    this.message_handlers_.push({
      command : command_name,
      handle : handler_fun
    });
  }

  private MakeLongPoll() {
    if (!this.current_user_) {
      console.error("Longpoll to unkown user id performed.");
      return;
    }
    const long_poll_url =
        '/user?command=long_poll&id=' + this.current_user_.id();
    Utils.RunHttpRequest(long_poll_url, this, true /* is_long_poll */);
  }

  private GetAllUsers() {
    const all_users_url = '/room?command=get_all_users&id=' + this.room_.id();
    Utils.RunHttpRequest(all_users_url, this);
  }

  private RegisterUser() {
    // Actually this is not a long-poll request, but we pretend it is
    // to pass check in |OnMessageReceived| to start actual long-polling.
    Utils.RunHttpRequest('/room?command=add_user&id=' + this.room_.id(),
                         this, true /* is_long_poll */);
  }

  private RenderRoomInfo() {
    const room_id_holder = document.querySelector('.room-id');
    room_id_holder.textContent = this.room_.id();
    const room_link_holder = document.querySelector('.room-url');
    room_link_holder.textContent = document.location.href;
  }

  private RemoveUser(user_value : Object) : User {
    const user_info = User.Validate(user_value);
    if (!user_info)
      return;
    var removed_user = null;
    this.users_ = this.users_.filter(user => {
      if (user.id() == user_info.user_id) {
        removed_user = user;
        return false;
      }
      return true;
    });
    return removed_user;
  }

  private FindUser(user_id : string) : User {
    var expected_user : User = null;
    this.users_.forEach(user => {
      if (user.id() == user_id)
        expected_user = user;
    });
    if (!expected_user) {
      throw new Error("Received message from user, that does not exist!");
    }
    return expected_user;
  }

  private UpdateUser(user_info : Object) : User {
    const new_user = new User(user_info);
    this.users_ = this.users_.filter(user => user.id() != new_user.id());
    this.users_.push(new_user);
    return new_user;
  }

  private SelectRoomUrl() : void {
    const selection = getSelection();
    const room_url_div = document.querySelector('.room-url');
    const range = document.createRange();
    range.selectNodeContents(room_url_div);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  static MoveToHomePage() : void {
    document.location.href = RoomPage.kIndexPagePath;
  }
}

var room_page = new RoomPage();

/// <reference path="room.ts" />
/// <reference path="utils.ts" />
/// <reference path="user.ts" />

interface MessageHandler {
  command : string;
  Handle(message : Object) : void;
}

class RoomPage implements Utils.MessageProcessor {
  private static kIndexPagePath = "/html/index.html";
  private users_ : User[];
  private current_user_ : User;
  private room_ : Room;
  private message_handlers_ : MessageHandler[];

  constructor() {
    this.current_user_ = null;
    this.users_ = [];
    this.message_handlers_ = [];
    this.AddMessageHandler("chat_message", this.OnChatMessage.bind(this));
    this.AddMessageHandler("user_info", this.OnUserInfo.bind(this));
    this.AddMessageHandler("user_leave", this.OnUserLeave.bind(this));
    this.AddMessageHandler("add_user", this.OnAddUser.bind(this));
    this.AddMessageHandler("admin_selected", this.OnAdminSelected.bind(this));
    this.AddMessageHandler("users_list", this.OnUsersList.bind(this));
    try {
      this.room_ = Room.Load();
    } catch (error) {
      console.error(error.message);
      RoomPage.MoveToHomePage();
    }
    this.RenderRoomInfo();
    this.RegisterUser();
    this.GetAllUsers();
  }

  OnMessageReceived(response : Object, is_long_poll : Boolean) {
    this.message_handlers_.forEach(function (handler) {
      if (response[Utils.kCommand] == handler.command) {
        try {
          handler.Handle(response);
        } catch (error) {
          console.log('Error handling %s: %s', handler.command, error.message);
        }
      }
    });

    if (is_long_poll) {
      this.MakeLongPoll();
    }
  }

  OnMessageAborted(error : string, url : string) {
    const hash = document.location.hash;
    // Check if it was typed url with room hash
    if (hash.length > 0) {
      Room.MoveToRoom({room_id : hash.slice(3)});
    } else {
      // TODO(matthewtff): Show error message...
    }
  }

  private OnChatMessage(response : Object) {
    const user = this.FindUser(response['user_id']);
    const message = response[Utils.kData];
    Utils.Write(user.name() + ' : ' + message);
  }

  private OnUserInfo(response : Object) {
    this.current_user_ = this.UpdateUser(response[Utils.kData]);
    Utils.Write(this.current_user_.name());
    this.current_user_.Save();
    window.addEventListener('beforeunload', this.Leave.bind(this));
  }

  private OnUserLeave(response : Object) {
    const removed_user = this.RemoveUser(response[Utils.kData]);
    Utils.Write('User disconnected: ' + removed_user.name());
  }

  private OnAddUser(response : Object) {
    const new_user = this.UpdateUser(response[Utils.kData]);
    Utils.Write('User connected: ' + new_user.name());
  }

  private OnAdminSelected(response : Object) {
    const administrator = this.UpdateUser(response[Utils.kData]);
    Utils.Write('Admin selected: ' + administrator.name());
  }

  private OnUsersList(response : Object) {
    const users_list = response[Utils.kData];
    if (!Utils.IsArray(users_list)) {
      throw new Error("Wrong users list: " + JSON.stringify(users_list));
      return;
    }
    users_list.forEach(function (user_info) {
      const user = this.UpdateUser(user_info);
      Utils.Write('User available: ' + user.name());
    }, this);
  }

  private AddMessageHandler(command_name : string,
                            handler_fun : (value : Object) => void) {
    this.message_handlers_.push({
      command : command_name,
      Handle : handler_fun
    });
  }

  private Leave() {
    Utils.RunHttpRequest(
        '/user?command=remove_user&id=' + this.current_user_.id(), this);
  }

  private MakeLongPoll() {
    if (!this.current_user_) {
      console.error("Longpoll to unkown user id performed.");
      return;
    }
    Utils.RunHttpRequest(
        '/user?command=long_poll&id=' + this.current_user_.id(),
        this, true /* is_long_poll */);
  }

  private GetAllUsers() {
    Utils.RunHttpRequest('/room?command=get_all_users&id=' + this.room_.id(),
                         this);
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
    room_link_holder.textContent =
        document.location.href + '#id' + this.room_.id();
  }

  private RemoveUser(user_value : Object) : User {
    const user_info = User.Validate(user_value);
    if (!user_info)
      return;
    var removed_user = null;
    this.users_ = this.users_.filter(function (user) {
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
    this.users_.forEach(function(user) {
      if (user.id() == user_id) {
        expected_user = user;
      }
    });
    if (!expected_user) {
      throw new Error("Received message from user, that does not exist!");
    }
    return expected_user;
  }

  private UpdateUser(user_info : Object) : User {
    var updated_user : User = null;
    const new_user = new User(user_info);
    this.users_.forEach(function(user) {
      if (user.id() == new_user.id()) {
        user = new_user;
        updated_user = user;
      }
    });
    if (!updated_user) {
      this.users_.push(new_user);
      updated_user = new_user;
    }
    return updated_user;
  }

  static MoveToHomePage() : void {
    document.location.href = RoomPage.kIndexPagePath;
  }
}

var room_page = new RoomPage();

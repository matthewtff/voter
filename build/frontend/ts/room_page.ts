/// <reference path="command.ts" />
/// <reference path="room.ts" />
/// <reference path="utils.ts" />
/// <reference path="user.ts" />

interface MessageHandler {
  command : string;
  Handle(message : Object) : void;
}

class RoomPage implements Utils.MessageProcessor {
  private static kIndexPagePath = "/html/index.html";
  private static kMaximumNumberOfBrokenRequests = 5;
  private users_ : User[];
  private current_user_ : User;
  private room_ : Room;
  private message_handlers_ : MessageHandler[];
  private number_of_broken_requests_ : number;

  // UI:
  private static kChatMessageHelp = "Enter message";
  private static kDisabledClass = "disabled";
  private chat_ : Element;
  private chat_input_ : Element;

  constructor() {
    this.current_user_ = null;
    this.users_ = [];
    this.message_handlers_ = [];
    this.number_of_broken_requests_ = 0;
    this.chat_ = document.querySelector('.chat-holder .chat');
    this.chat_input_ = document.querySelector('.message-input .input');
    this.chat_input_.addEventListener('focus', this.RemoveHelp.bind(this));
    this.chat_input_.addEventListener('blur', this.ReturnHelp.bind(this));
    this.chat_input_.addEventListener('keydown',
                                      this.TrySendChatMessage.bind(this));

    this.AddMessageHandler("user_message", this.OnChatMessage.bind(this));
    this.AddMessageHandler("user_info", this.OnUserInfo.bind(this));
    this.AddMessageHandler("user_leave", this.OnUserLeave.bind(this));
    this.AddMessageHandler("add_user", this.OnAddUser.bind(this));
    this.AddMessageHandler("admin_selected", this.OnAdminSelected.bind(this));
    this.AddMessageHandler("users_list", this.OnUsersList.bind(this));
    /*this.AddMessageHandler("keep_alive", this.MakeLongPoll.bind(this));*/
    try {
      this.room_ = Room.Load();
    } catch (error) {
      console.error(error.message);
    }
    if (!this.room_) {
      RoomPage.MoveToHomePage();
    }
    this.RenderRoomInfo();
    this.RegisterUser();
    this.GetAllUsers();
  }

  OnMessageReceived(response : Object, is_long_poll : boolean) {
    this.number_of_broken_requests_ = 0;
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
    } else if (url.indexOf("long_poll") != -1) {
      if (++this.number_of_broken_requests_ <
          RoomPage.kMaximumNumberOfBrokenRequests) {
        // Longpoll request could aborted if we sent another request using XHR.
        this.MakeLongPoll();
      }
    } else {
      // TODO(matthewtff): Show error message...
      console.error('Got aborted message for %s', url);
      //RoomPage.MoveToHomePage();
    }
  }

  private OnChatMessage(response : Object) {
    const user = this.FindUser(response['user_id']);
    const [type, message_command] = Command.GetCommand(response[Utils.kData]);
    if (message_command['message']) {
      this.AppendChatMessage(user, message_command['message']);
    }
  }

  private OnUserInfo(response : Object) {
    this.current_user_ = this.UpdateUser(response[Utils.kData]);
    Utils.Write(this.current_user_.name());
    this.current_user_.Save();
    window.addEventListener('beforeunload', this.Leave.bind(this));
  }

  private OnUserLeave(response : Object) {
    const removed_user = this.RemoveUser(response[Utils.kData]);
    Utils.Write('User disconnected: ' + removed_user.identity_for_test());
  }

  private OnAddUser(response : Object) {
    const new_user = this.UpdateUser(response[Utils.kData]);
    Utils.Write('User connected: ' + new_user.identity_for_test());
  }

  private OnAdminSelected(response : Object) {
    const administrator = this.UpdateUser(response[Utils.kData]);
    Utils.Write('Admin selected: ' + administrator.identity_for_test());
  }

  private OnUsersList(response : Object) {
    const users_list = response[Utils.kData];
    if (!Utils.IsArray(users_list)) {
      throw new Error("Wrong users list: " + JSON.stringify(users_list));
      return;
    }
    users_list.forEach(function (user_info) {
      const user = this.UpdateUser(user_info);
      Utils.Write('User available: ' + user.identity_for_test());
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

  private RemoveHelp() : void {
    this.chat_input_.classList.remove(RoomPage.kDisabledClass);
    if (this.chat_input_.textContent == RoomPage.kChatMessageHelp) {
      this.chat_input_.textContent = "";
    }
  }

  private ReturnHelp() : void {
    if (this.chat_input_.textContent.length == 0) {
      this.chat_input_.classList.add(RoomPage.kDisabledClass);
      this.chat_input_.textContent = RoomPage.kChatMessageHelp;
    }
  }

  private TrySendChatMessage(keydown_event : KeyboardEvent) : void {
    if (keydown_event.keyCode != 13) {
      return;
    }
    const chat_message = this.chat_input_.textContent;
    if (chat_message.length > 0) {
      const parameters = "id=" + this.current_user_.id() +
          "&data=" + Command.CreateCommand(Command.Type.ChatMessage,
                                           {message : chat_message});
      Utils.RunHttpRequest('/user?command=user_message&' + parameters,
                           this);
      this.chat_input_.textContent = "";
    }
  }

  private AppendChatMessage(user : User, message : string) : void {
    const message_div = document.createElement('div');
    message_div.classList.add('message');
    const user_name_div = document.createElement('div');
    user_name_div.classList.add('user-name');
    user_name_div.textContent = user.name();
    const message_contents_div = document.createElement('div');
    message_contents_div.classList.add('contents');
    message_contents_div.textContent = message;

    message_div.appendChild(user_name_div);
    message_div.appendChild(message_contents_div);

    this.chat_.appendChild(message_div);
    this.chat_.scrollTop = this.chat_.scrollHeight;
  }

  static MoveToHomePage() : void {
    document.location.href = RoomPage.kIndexPagePath;
  }
}

var room_page = new RoomPage();

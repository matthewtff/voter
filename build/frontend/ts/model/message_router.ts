/// <reference path="../command.ts" />
/// <reference path="../utils.ts"/>
/// <reference path="../user.ts"/>

module Model {
  export interface PackedMessage {
    data : string,
    type : Command.Type,
    user_id : string,
  }
  export class MessageRouter {

    private room_page_ : RoomPage;
    private user_message_listeners_ : ((message : PackedMessage) => boolean)[];
    private queued_messages_ : PackedMessage[];
    constructor(room_page : RoomPage) {
      this.room_page_ = room_page;
      this.user_message_listeners_ = [];
      this.queued_messages_ = [];
    }

    SendUserMessage(type : Command.Type, message : string) {
      const parameters = "id=" + this.room_page_.GetCurrentUser().id() +
          "&data=" + Command.Create(type, {data : message});
      const url = "/user?command=user_message&" + parameters;
      Utils.RunHttpRequest(url, this.room_page_);
    }

    OnUserMessageReceived(sender : User, encoded_command : string) {
      const current_user = this.room_page_.GetCurrentUser();
      const [type, message_command] = Command.GetCommand(encoded_command);
      switch (type) {
        case Command.Type.ChatMessage: {
          if (message_command['data']) {
            const chat = this.room_page_.GetChat();
            chat.AddMessage(sender.name(), message_command['data']);
          }
          break;
        }
        default: {
          if (sender.id() == current_user.id())
            return;  // Do not send messages from current user.
          this.queued_messages_.push({
            data : message_command['data'],
            type : type,
            user_id : sender.id(),
          });
          this.DeliverMessages();
        }
      }
    }

    AddUserMessagesObserver(callback : (PackedMessage) => boolean) : void {
      this.user_message_listeners_.push(callback);
      this.DeliverMessages();
    }

    private DeliverMessages() : void {
      this.queued_messages_ = this.queued_messages_.filter(
          message => !this.TryDeliverMessage(message));
    }

    private TryDeliverMessage(message : PackedMessage) : boolean {
      for (const counter in this.user_message_listeners_) {
        const listener = this.user_message_listeners_[counter];
        if (listener(message)) {
          return true;
        }
      }
      return false;
    }
  };
}

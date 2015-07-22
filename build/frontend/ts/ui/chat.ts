/// <reference path="utils.ts" />

module UI {

  export class Chat {
    private static kChatMessageHelp = "Enter message";
    private chat_ : Element;
    private chat_input_ : Element;
    private send_callback_ : (string) => void;

    constructor(send_callback : (string) => void) {
      this.chat_ = document.querySelector('.chat-holder .chat');
      this.chat_input_ = document.querySelector('.message.input .input-inner');
      this.send_callback_ = send_callback;
      this.RegisterHandlers();
    }

    AddMessage(name : string, message : string) : void {
      const message_div = Utils.CreateDiv('message');
      const user_name_div = Utils.CreateDiv('user-name');
      user_name_div.textContent = name;
      const message_contents_div = Utils.CreateDiv('contents');
      message_contents_div.textContent = message;

      message_div.appendChild(user_name_div);
      message_div.appendChild(message_contents_div);

      this.chat_.appendChild(message_div);
      this.chat_.scrollTop = this.chat_.scrollHeight;
    }

    // private:
    private RegisterHandlers() : void {
    this.chat_input_.addEventListener('focus',
        Utils.RemoveHelp.bind(Utils, Chat.kChatMessageHelp));
    this.chat_input_.addEventListener('blur',
        Utils.ReturnHelp.bind(Utils, Chat.kChatMessageHelp));
    this.chat_input_.addEventListener('keydown',
                                      this.TrySendChatMessage.bind(this));
    }


    private TrySendChatMessage(keydown_event : KeyboardEvent) : void {
      if (keydown_event.keyCode != 13) {
        return;
      }
      const chat_message = this.chat_input_.textContent;
      if (chat_message.length > 0) {
        this.send_callback_(chat_message);
        this.chat_input_.textContent = "";
      }
    }

  }

}
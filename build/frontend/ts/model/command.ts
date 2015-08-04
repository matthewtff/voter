module Model {

  export enum CommandType {
    ChatMessage,
    CreateTask,
    VoteEstimage,
  };

  interface CommandInfo {
    type : CommandType,
    data : Object,
  }

  export class Command {

    type_ : CommandType;
    data_ : Object;

    constructor (info : CommandInfo) {
      this.type_ = info.type;
      this.data_ = info.data;
    }

    data() : Object { return this.data_; }
    type() : CommandType { return this.type_; }

    static Create(command_type : CommandType, data : Object) : string {
      return btoa(JSON.stringify({
        type : command_type,
        data : data
      }));
    }

    static Parse(message : string) : Command {
      const command = JSON.parse(atob(message));
      if (!(command.hasOwnProperty('type') && command.hasOwnProperty('data'))) {
        throw new Error('Malformed command message: ' + message);
      }
      return new Command(command);
    }

  };
}

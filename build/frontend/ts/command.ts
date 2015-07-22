module Command {
  export enum Type {
    ChatMessage,
    CreateTask,
    VoteEstimage,
  }

  export function CreateCommand(command_type : Type, data : Object) : string {
    return btoa(JSON.stringify({
      type : command_type,
      data : data
    }));
  }

  export function GetCommand(message : string) : [Type, Object] {
    const command = JSON.parse(atob(message));
    if (!(command.hasOwnProperty('type') && command.hasOwnProperty('data'))) {
      throw new Error('Malformed command message: ' + message);
    }
    return [command.type, command.data];
  }
}

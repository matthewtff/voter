module Utils {

  export const kCommand = "command";
  export const kData = "data";

  export function IsArray(obj : any) {
    return Array.isArray(obj);
  }

  export function IsString(obj : any) {
    return typeof obj == "string";
  }

  export function IsBoolean(obj : any) {
    return typeof obj == "boolean";
  }

  export function IsNumber(obj : any) {
    return typeof obj == "number";
  }

  export function ParseInteger(string_representation : string) : Number {
    return parseInt(string_representation);
  }

  export interface MessageProcessor {
    OnMessageReceived(message : Object, data? : any) : void;
    OnMessageAborted(error : string, url : string) : void;
  }

  export function RunHttpRequest(url : string,
                                 message_processor : MessageProcessor,
                                 data? : any) {
    var req = new XMLHttpRequest();
    req.open("GET", url);
    req.onreadystatechange = function () {
      if (req.readyState == 4) {
        if (req.status == 200) {
          // Server always responses a bunch of messages.
          // So call callback for every of them.
          var response = JSON.parse(req.response);
          if (IsArray(response)) {
            response.forEach(function (message) {
              message_processor.OnMessageReceived(message, data);
            });
          }
        }
      } else {
        message_processor.OnMessageAborted(
          "Error loading resource: " + req.statusText, url);
      }
    };
    req.send();
  }

  export function Write(message) {
    const paragraph = document.createElement('p');
    paragraph.innerText = message;
    document.body.appendChild(paragraph);
  }
}

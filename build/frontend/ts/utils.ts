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
    (message : Object, data? : any) : void;
  }

  export function RunHttpRequest(url,
                                 callback : MessageProcessor,
                                 data? : any) {
    var req = new XMLHttpRequest();
    req.open("GET", url);
    req.onreadystatechange = function () {
      if (req.readyState == 4 && req.status == 200) {
        // Server always responses a bunch of messages.
        // So call callback for every of them.
        var response = JSON.parse(req.response);
        if (IsArray(response)) {
          response.forEach(function (message) {
            callback(message, data);
          });
        }
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

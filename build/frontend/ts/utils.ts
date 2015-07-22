/// <reference path="typings/es6-promise/es6-promise.d.ts" />

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

  export function ParseInteger(string_representation : string) : number {
    return parseInt(string_representation);
  }

  export function HttpRequest(url: string) : Promise<string> {
    return new Promise(function (resolve, reject) {
      var req = new XMLHttpRequest();
      req.open("GET", url);
      req.onreadystatechange = function () {
        if (req.readyState == 4) {
          if (req.status == 200) {
            resolve(req.response);
          } else {
            reject(new Error(req.statusText));
          }
        };
      }
      req.send();
    });
  }

  export interface MessageProcessor {
    OnMessageReceived(message : Object, data? : any) : void;
    OnMessageAborted(error : string, url : string) : void;
  }

  export function RunHttpRequest(url : string,
                                 message_processor : MessageProcessor,
                                 data? : any) : void {
    HttpRequest(url).then(function (response_text : string) {
      // Server always responses a bunch of messages.
      // So call callback for every of them.
      const response = JSON.parse(response_text);
      if (IsArray(response)) {
        response.forEach(function (message) {
          message_processor.OnMessageReceived(message, data);
        });
      } else {
        console.error(response_text);
      }
    }, function (error_status : Error) {
      message_processor.OnMessageAborted(
              "Error loading resource: " + error_status.message, url);
    });
  }

  export function Write(message) {
    console.log(message);
  }
}

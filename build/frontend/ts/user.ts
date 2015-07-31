/// <reference path="utils.ts" />

interface UserInfo {
  user_id : string;
  user_name : string;
}

class User {
  private static kUserInfoPath = "user.info";
  private static kUserIdFieldName = "user_id";
  private static kUserNameFieldName = "user_name";
  private info_ : UserInfo;

  constructor(user_info : Object) {
    const info = User.Validate(user_info);
    if (!info) {
      throw new Error("Cannot create user from invalid user info!");
    }
    this.info_ = info;
  }

  id() : string {
    return this.info_.user_id;
  }

  name() : string {
    return this.info_.user_name;
  }

  identity_for_test() : string {
    return this.name() + '(' + this.id() + ')';
  }

  static Validate (info : Object) : UserInfo {
    const has_valid_user_id = info.hasOwnProperty(User.kUserIdFieldName)
        && Utils.IsString(info[User.kUserIdFieldName]);
    const has_valid_user_name = info.hasOwnProperty(User.kUserNameFieldName)
        && Utils.IsString(info[User.kUserNameFieldName]);
    if (has_valid_user_id && has_valid_user_name) {
      return {
          user_id : info[User.kUserIdFieldName],
          user_name : info[User.kUserNameFieldName],
      };
    }
    return null;
  }
}

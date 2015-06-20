/// <reference path="utils.ts" />

interface UserInfo {
  user_id : string;
  user_name : string;
  is_administrator : Boolean;
}

class User {
  private static kUserInfoPath = "user.info";
  private static kUserIdFieldName = "user_id";
  private static kUserNameFieldName = "user_name";
  private static kIsAdministratorFieldName = "is_administrator";
  private info_ : UserInfo;

  constructor(user_info : Object) {
    const info = User.Validate(user_info);
    if (!info) {
      throw new Error("Cannot create user from invalid user info!");
    }
    this.info_ = info;
  }

  id() {
    return this.info_.user_id;
  }

  name() {
    return this.info_.user_name;
  }

  is_administrator() {
    return this.info_.is_administrator;
  }

  identity_for_test() {
    return this.name() + '(' + this.id() + ')';
  }

  Save() : void {
    localStorage.setItem(User.kUserInfoPath, JSON.stringify(this.info_));
  }
  static Load() : User {
    const saved_user_info = localStorage.getItem(User.kUserInfoPath);
    return new User(saved_user_info);
  }
  static Validate (info : Object) : UserInfo {
    const has_valid_user_id = info.hasOwnProperty(User.kUserIdFieldName)
        && Utils.IsString(info[User.kUserIdFieldName]);
    const has_valid_user_name = info.hasOwnProperty(User.kUserNameFieldName)
        && Utils.IsString(info[User.kUserNameFieldName]);
    const has_valid_administrator_field =
        info.hasOwnProperty(User.kIsAdministratorFieldName)
        && Utils.IsBoolean(info[User.kIsAdministratorFieldName]);
    if (has_valid_user_id
        && has_valid_user_name
        && has_valid_administrator_field) {
      return {
          user_id : info[User.kUserIdFieldName],
          user_name : info[User.kUserNameFieldName],
          is_administrator : info[User.kIsAdministratorFieldName],
      };
    }
    return null;
  }
}

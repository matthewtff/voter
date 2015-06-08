#ifndef voter_user_hh
#define voter_user_hh

#include <list>
#include <memory>
#include <string>

#include <koohar.hh>

#include "commands_handler.hh"

namespace voter {

class Room;

class User : public CommandsHandler,
             public CommandsHandler::Delegate {
 public:
  enum class Role {
    Admin,
    Voter
  };
  User(Room* room) : User(room, Role::Voter) {}
  User(Room* room, const Role role);

  // CommandsHandler::Delegate implementation.
  bool ShouldHandleRequest(const koohar::Request& request) const override;

  std::string name() const { return name_; }
  std::string id() const { return id_; }

  koohar::JSON::Object GetUserInfo() const;

 private:
  // Command handlers:
  void OnChatMessage(const koohar::Request& request);
  void OnLongPoll(const koohar::Request& request);
  void OnUserLeave(const koohar::Request& /* request */);

  Room* const room_;
  const std::string name_;
  const std::string id_;
  Role role_;
};  // class User

}  // namespace voter

#endif  // voter_user_hh

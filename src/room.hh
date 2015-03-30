#ifndef voter_room_hh
#define voter_room_hh

#include <list>
#include <string>

#include "commands_handler.hh"
#include "user.hh"

namespace koohar {
class Request;

namespace JSON {
class Object;
}
}  // namespace koohar

namespace voter {

class RoomManager;
class User;

class Room : public CommandsHandler,
             public CommandsHandler::Delegate {
 public:
  using UserList = std::list<User>;

  Room(RoomManager* room_manager);

  // CommandsHandler::Delegate implementation.
  bool ShouldHandleRequest(const koohar::Request& request) const override;

  // CommandsHandler implementation.
  bool OnRequest(koohar::Request&& request,
                 koohar::Response&& response) override;

  void RemoveUser(const std::string& user_id);
  void BroadcastMessage(const koohar::JSON::Object& message);

  const UserList& users() const { return users_; }
  const std::string id() const { return id_; }

 private:
  using CommandsListener = void(Room::*)(const koohar::Request& request);
  CommandsHandler::Handler CreateHandler(CommandsListener listener);

  void OnAddUser(const koohar::Request& /* request */);

  RoomManager* room_manager_;
  UserList users_;
  const std::string id_;
};  // class Room

}  // namespace voter

#endif  // voter_room_hh
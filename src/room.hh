#ifndef voter_room_hh
#define voter_room_hh

#include <list>
#include <string>

#include "commands_handler.hh"
#include "user.hh"

namespace koohar {
class ClientRequest;
class ClientResponse;
class Request;

namespace JSON {
class Object;
}
}  // namespace koohar

namespace voter {

class RoomManager;
class User;

class Room : public CommandsHandler,
             public CommandsHandler::Delegate,
             public User::Delegate {
 public:
  Room(RoomManager* room_manager);
  ~Room();

  // CommandsHandler::Delegate implementation.
  bool ShouldHandleRequest(const koohar::Request& request) final;

  // CommandsHandler implementation.
  bool OnRequest(koohar::Request&& request,
                 koohar::Response&& response) final;

  // User::Delegate implementation.
  bool CheckNameIsUnique(const std::string& name) override;
  void BroadcastMessage(const koohar::JSON::Object& message) override;
  void MakeRequest(koohar::ClientRequest&& request,
                   koohar::OutputConnection::Callback callback) override;

  std::string id() const { return id_; }

 private:
  using UserList = std::list<User>;

  void OnAddUser(const koohar::Request& /* request */);
  void OnUsersList(const koohar::Request& /* request */);

  void CheckEmptyness();
  void SelectNewAdministrator();

  RoomManager* room_manager_;
  UserList users_;
  const std::string id_;
  std::size_t check_emptyness_interval_;
};  // class Room

}  // namespace voter

#endif  // voter_room_hh

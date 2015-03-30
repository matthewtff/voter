#ifndef voter_room_manager_hh
#define voter_room_manager_hh

#include <list>
#include <string>

#include "commands_handler.hh"
#include "room.hh"

namespace koohar {
class Request;
}  // namespace koohar

namespace voter {

class RoomManager : public CommandsHandler,
                    public CommandsHandler::Delegate {
 public:
  RoomManager();
  void RemoveRoom(const std::string& room_id);

  // CommandsHandler::Delegate implementation.
  bool ShouldHandleRequest(const koohar::Request& request) const override;

  // CommandsHandler implementation.
  bool OnRequest(koohar::Request&& request,
                 koohar::Response&& response) override;


 private:
  using RoomList = std::list<Room>;
  using CommandsListener = void(RoomManager::*)(const koohar::Request& request);
  CommandsHandler::Handler CreateHandler(CommandsListener listener);

  void OnCreateRoom(const koohar::Request& /* request */);

  RoomList rooms_;
};  // class RoomManager

}  // namespace voter

#endif  // voter_room_manager_hh

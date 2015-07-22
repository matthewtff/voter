#ifndef voter_room_manager_hh
#define voter_room_manager_hh

#include <chrono>
#include <functional>
#include <list>
#include <string>

#include "commands_handler.hh"
#include "room.hh"

namespace koohar {
class ClientRequest;
class OutputConnection;
class Request;
class ServerAsio;
}  // namespace koohar

namespace voter {

class RoomManager : public CommandsHandler,
                    public CommandsHandler::Delegate {
 public:
  class IntervalDelegate {
   public:
    virtual typename koohar::ServerAsio::TimeoutHandle SetInterval(
        std::chrono::milliseconds,
        typename koohar::ServerAsio::TimerCallback) = 0;
    virtual void ClearInterval(typename koohar::ServerAsio::TimeoutHandle) = 0;
    virtual void MakeRequest(koohar::ClientRequest&&,
                             typename koohar::OutputConnection::Callback) = 0;
  };  // class IntervalDelegate

  RoomManager(IntervalDelegate* interval_delegate);
  void RemoveRoom(const std::string& room_id);
  typename koohar::ServerAsio::TimeoutHandle SetInterval(
      std::chrono::milliseconds timeout,
      std::function<void()> callback);
  void ClearInterval(
      typename koohar::ServerAsio::TimeoutHandle timeout_handle);
  void MakeRequest(koohar::ClientRequest&& request,
                   typename koohar::OutputConnection::Callback callback);

  // CommandsHandler::Delegate implementation.
  bool ShouldHandleRequest(const koohar::Request& request) override;

  // CommandsHandler implementation.
  bool OnRequest(koohar::Request&& request,
                 koohar::Response&& response) override;

 private:
  using RoomList = std::list<Room>;

  void OnCreateRoom(const koohar::Request& /* request */);
  void OnGetAllRooms(const koohar::Request& /* request */);

  IntervalDelegate* interval_delegate_;
  RoomList rooms_;
};  // class RoomManager

}  // namespace voter

#endif  // voter_room_manager_hh

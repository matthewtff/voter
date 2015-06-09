#include "router.hh"

#include <koohar.hh>

namespace voter {

Router::Router(RoomManager::IntervalDelegate* interval_delegate)
    : room_manager_(interval_delegate) {}

void Router::OnRequest(koohar::Request&& request, koohar::Response&& response) {
  if (room_manager_.OnRequest(std::move(request), std::move(response))) {
    return;
  }

  std::cout << "Unknown command: " << request.uri() << std::endl;
  response.WriteHead(404);
  response.End("Hello world!");
}

}  // namespace voter

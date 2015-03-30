#include "router.hh"

#include <koohar.hh>

namespace voter {

void Router::OnRequest(koohar::Request&& request, koohar::Response&& response) {
  if (room_manager_.OnRequest(std::move(request), std::move(response))) {
    return;
  }

  std::cout << "Unknown command: " << request.uri() << std::endl;
  response.WriteHead(404);
  response.End("Hello world!");
}

}  // namespace voter

#include <iostream>

#include <koohar.hh>

#include "handler.hh"
#include "router.hh"
#include "room_manager.hh"

namespace {
const char kConfigPath[] = "./config.json";

koohar::ServerAsio* server_ptr = nullptr;

HandlerRet SignalHandler(HandlerGet /* sig */) {
  if (server_ptr) {
    koohar::LOG(koohar::kInfo) << "Stopping server... ";
    server_ptr->Stop();
    koohar::LOG(koohar::kInfo) << "Done!" << std::endl;
  }
}

void RegisterHandlers() {
  SetHandler(CTRL_C_EVENT, SignalHandler);
  SetHandler(QUIT_EVENT, SignalHandler);
  SetHandler(TERM_EVENT, SignalHandler);
}

class IntervalMaster : public voter::RoomManager::IntervalDelegate {
 public:
  IntervalMaster(koohar::ServerAsio* server_asio,
                 const std::string& session_id_value)
      : server_asio_(server_asio),
        session_id_value_(session_id_value) {}

  // RoomManager::IntervalDelegate implementation.
  koohar::ServerAsio::TimeoutHandle SetInterval(
      std::chrono::milliseconds timeout,
      koohar::ServerAsio::TimerCallback callback) override {
    return server_asio_->SetInterval(timeout, callback);
  }

  void ClearInterval(
      koohar::ServerAsio::TimeoutHandle timeout_handle) override {
    server_asio_->ClearInterval(timeout_handle);
  }

  void MakeRequest(koohar::ClientRequest&& request,
                   koohar::OutputConnection::Callback callback) override {
    request.SetHeader("Cookie", "Session_id=" + session_id_value_ + ";");
    server_asio_->MakeClientRequest(std::move(request), callback);
  }

 private:
  koohar::ServerAsio* server_asio_;
  std::string session_id_value_;
};  // class IntervalMaster

}  // anonymous namespace

int main (int argc, char* argv[]) {
  const unsigned short port = (argc > 1)
      ? static_cast<unsigned short>(std::atoi(argv[1])) : 8000;

  const std::string session_id_value = (argc > 2) ? argv[2] :
      "3:1435833256.5.0.1434711154367:iyjBgg:3c.0|1120000000014521.0"
      ".2|76497.34380.yObOU0fUPh-sQIfFA60zx1NkN3Q";

  RegisterHandlers();
  koohar::ServerAsio server{port};
  server.Load(kConfigPath);
  server_ptr = &server;

  IntervalMaster interval_master(&server, session_id_value);

  voter::Router router(&interval_master);
  server.Listen(std::bind(&voter::Router::OnRequest,
                          &router,
                          std::placeholders::_1,
                          std::placeholders::_2));
}

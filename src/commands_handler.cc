#include "commands_handler.hh"

namespace {
const char kCommand[] = "command";
}  // anonymous namespace

namespace voter {

const char* CommandsHandler::kCommandName = "command";
const char* CommandsHandler::kData = "data";


bool CommandsHandler::OnRequest(koohar::Request&& request,
                                koohar::Response&& response) {
  if (!delegate_->ShouldHandleRequest(request)) {
    return false;
  }
  response_.reset(new koohar::Response(std::move(response)));
  TryHandleMessage(request);
  DispatchMessages();
  return true;
}

void CommandsHandler::SendMessage(const koohar::JSON::Object& message) {
  message_queue_.push_back(message);
  DispatchMessages();
}

// private

void CommandsHandler::TryHandleMessage(const koohar::Request& request) {
  const std::string& command_name = request.Body(kCommand);
  HandlersMap::const_iterator handler = handlers_map_.find(command_name);
  if (handler != handlers_map_.cend()) {
    handler->second(request);
  }
}

void CommandsHandler::DispatchMessages() {
  if (message_queue_.empty() || !response_) {
    return;
  }

  // Create array of messages and send em all.
  koohar::JSON::Object data;
  for (const koohar::JSON::Object& message : message_queue_) {
    data.AddToArray(message);
  }
  response_->SendJSON(data);
  response_.reset();
  message_queue_.clear();
}

}  // namespace voter

/// <reference path="../utils.ts" />
/// <reference path="../ui/voting.ts" />

/// <reference path="common.ts" />
/// <reference path="message_router.ts" />

module Model {
export module Voting {
  export class Process implements UI.VotingDelegate {
    private delegate_ : Common.MessageDispatcher;
    private id_ : string;
    private ui_ : UI.Voting;
    private message_router_ : Model.MessageRouter;
    private users_estimates_ : UI.UserEstimate[];
    private current_estimate_ : UI.UserEstimate;

    constructor(delegate: Common.MessageDispatcher,
                id: string,
                tasks: HTMLDivElement) {
      Utils.Write("Created voting for " + id);
      this.delegate_ = delegate;
      this.id_ = id;
      this.current_estimate_ = {
        estimate : UI.Estimate.None,
        user_id : this.delegate_.GetCurrentUser().id()
      };
      this.message_router_ = this.delegate_.GetMessageRouter();

      this.ClearUsersEstimates();
      // It's important to initilize |estimates_| __before__ creating new Voting
      // UI, cause it's visiting our |estimates| method in it's constructor.
      this.ui_ = new UI.Voting(this, tasks);

      this.message_router_.AddUserMessagesObserver(this.OnUserMessage.bind(this));
      this.delegate_.AddUserChangedObserver(this.OnUserAction.bind(this));
    }

    ui() : UI.Voting { return this.ui_; }

    SendEstimate(estimate : number) : void {
      this.current_estimate_.estimate = estimate;
      var estimate_data = {
        task_id : this.id_,
        estimate : estimate,
      };
      this.message_router_.SendUserMessage(CommandType.VoteEstimage,
                                     JSON.stringify(estimate_data));
      this.ShowUsersEstimates();
    }

    GetOtherEstimates() : UI.UserEstimate[] {
      return this.users_estimates_;
    }

    BroadcastCurrentVotes() : void {
      Utils.Write('Broadcasting current estimate ' + this.current_estimate_.estimate + ' for task ' + this.id_);
      this.SendEstimate(this.current_estimate_.estimate);
    }

    private OnUserMessage(message : Model.PackedMessage) : boolean {
      Utils.Write("Received user packed message!!!");
      switch (message.type) {
        case CommandType.VoteEstimage: {
          Utils.Write("Received user estimate!!!");
          const estimate_data = JSON.parse(message.data);
          if (estimate_data['task_id'] != this.id_)
            return false;
          this.OnVoteEstimate(estimate_data['estimate'], message.user_id);
          break;
        }
        default: return false;
      }
      return true;
    }

    private OnUserAction(action : Common.UserAction, user_id : string) : void {
      switch (action) {
        case Common.UserAction.Added: {
          this.AddEmptyUserEstimate(user_id);
          break;
        }
        case Common.UserAction.Left: {
          this.users_estimates_ = this.users_estimates_.filter(
              user_estimate => user_estimate.user_id != user_id);
          break;
        }
      }
      this.ShowUsersEstimates();
    }

    private OnVoteEstimate(estimate : number, user_id : string) : void {
      this.UpdateUserEstimate({
          user_id : user_id,
          estimate : estimate,
      });
      this.ShowUsersEstimates();
    }

    private ShowUsersEstimates() : void {
      var has_all_votes = this.current_estimate_.estimate != UI.Estimate.None;
      this.users_estimates_.forEach(estimate =>
          has_all_votes = has_all_votes && estimate.estimate != UI.Estimate.None
      );
      this.ui_.ShowUsersEstimates(has_all_votes);
    }

    private ClearUsersEstimates() : void {
      this.users_estimates_ = [];
      this.GetOtherUsers().forEach(
          user => this.AddEmptyUserEstimate(user.id()));
    }

    private AddEmptyUserEstimate(user_id : string) : void{
      this.users_estimates_.push({
        user_id : user_id,
        estimate : UI.Estimate.None,
      });
    }

    private UpdateUserEstimate(user_estimate : UI.UserEstimate) : void {
      for (const counter in this.users_estimates_) {
        if (this.users_estimates_[counter].user_id == user_estimate.user_id) {
          this.users_estimates_[counter].estimate = user_estimate.estimate;
        }
      }
    }

    private GetOtherUsers() : User[] {
      const current_user_id = this.delegate_.GetCurrentUser().id();
      return this.delegate_.GetUsers().filter(
          user => user.id() != current_user_id);
    }
  }

}
}

/// <reference path="../utils.ts" />
/// <reference path="../ui/voting.ts" />

/// <reference path="common.ts" />

module Voting {
  export class Process implements UI.VotingDelegate {
    private delegate_ : Common.MessageDispatcher;
    private id_ : string;
    private ui_ : UI.Voting;
    private estimates_ : number[];
    private users_estimates_ : UI.UserEstimate[];
    private current_estimate_ : UI.UserEstimate;

    constructor(delegate: Common.MessageDispatcher,
                id: string,
                tasks: HTMLDivElement) {
      this.delegate_ = delegate;
      this.id_ = id;
      this.estimates_ = [1, 2, 3, 4, 5, UI.Estimate.DontKnow];
      this.current_estimate_ = {
        estimate : UI.Estimate.None,
        user_id : this.delegate_.GetCurrentUser().id()
      };

      this.ClearUsersEstimates();
      // It's important to initilize |estimates_| __before__ creating new Voting
      // UI, cause it's visiting our |estimates| method in it's constructor.
      this.ui_ = new UI.Voting(this, tasks);

      this.delegate_.AddUserMessagesObserver(this.OnUserMessage.bind(this));
      this.delegate_.AddUserChangedObserver(this.OnUserAction.bind(this));
    }

    ui() : UI.Voting { return this.ui_; }

    estimates() : number[] { return this.estimates_; }

    SendEstimate(estimate : number) : void {
      this.current_estimate_.estimate = estimate;
      var estimate_data = {
        task_id : this.id_,
        estimate : estimate,
      };
      this.delegate_.SendUserMessage(Command.Type.VoteEstimage,
                                     JSON.stringify(estimate_data));
      this.ShowUsersEstimates();
    }

    GetOtherEstimates() : UI.UserEstimate[] {
      return this.users_estimates_;
    }

    BroadcastCurrentVotes() : void {
      this.SendEstimate(this.current_estimate_.estimate);
    }

    private OnUserMessage(type : Command.Type,
                          data : string,
                          user_id : string) : boolean {
      switch (type) {
        case Command.Type.VoteEstimage: {
          var estimate_data = JSON.parse(data);
          if (estimate_data['task_id'] != this.id_)
            return false;
          this.OnVoteEstimate(estimate_data['estimate'], user_id);
          break;
        }
        default: return false;
      }
      Utils.Write("[Voting] Received user message!");
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
        case Common.UserAction.AdminSelected: {
          return;
        }
      }
      this.ShowUsersEstimates();
    }

    private OnVoteEstimate(estimate : number, user_id : string) : void {
      Utils.Write(
          '[Voting] Received estimate ' + estimate + ' from ' + user_id);
      this.UpdateUserEstimate({
          user_id : user_id,
          estimate : estimate,
      });
      this.ShowUsersEstimates();
    }

    private ShowUsersEstimates() : void {
      var has_all_votes = this.current_estimate_.estimate != UI.Estimate.None;
      this.users_estimates_.forEach(estimate => {
        if (estimate.estimate == UI.Estimate.None)
          has_all_votes = false;
      });
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
      return this.delegate_.GetUsers().filter(
          user => user.id() != this.delegate_.GetCurrentUser().id());
    }

  }

}

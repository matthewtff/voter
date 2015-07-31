/// <reference path="utils.ts" />

module UI {
  export enum Estimate {
    DontKnow = -1,
    None = -2,
  }

  const all_estimates = [1, 2, 3, 4, 5, UI.Estimate.DontKnow];

  export interface UserEstimate {
    user_id : string;
    estimate : number;
  }

  function GetEstimateText(estimate : number) {
    if (estimate == Estimate.DontKnow) {
      return '...';
    } else if (estimate == Estimate.None) {
      return '';
    }
    return estimate.toString();
  }

  class OtherEstimate {
    private vote_node_ : HTMLDivElement;
    private inner_node_ : HTMLDivElement;
    private estimate_ : UserEstimate;

    constructor(other_votes : HTMLDivElement,
                estimate : UserEstimate,
                reveal : boolean) {
      this.vote_node_ = Utils.CreateDiv('vote');
      this.vote_node_.classList.add('other-vote');

      this.estimate_ = estimate;
      this.vote_node_.classList.add(
          estimate.estimate == Estimate.None ? 'other-clean' : 'other-voted');
      this.CreateInnerNode(reveal);
      other_votes.appendChild(this.vote_node_);
    }

    // private:
    private CreateInnerNode(reveal : boolean) {
      this.inner_node_ = Utils.CreateDiv('vote-inner');
      Utils.SetVisibility(this.inner_node_, reveal);
      this.inner_node_.textContent = GetEstimateText(this.estimate_.estimate);
      this.vote_node_.appendChild(this.inner_node_);
    }
  }

  class VoteEstimate {
    private observers_ : ((MouseEvent) => void)[];
    private estimate_ : number;
    private vote_node_ : HTMLDivElement;
    private inner_node_ : HTMLDivElement;

    constructor(votings_node : HTMLDivElement, estimate : number) {
      this.observers_ = [];
      this.estimate_ = estimate;
      this.vote_node_ = Utils.CreateDiv('vote');
      this.CreateInnerNode();
      votings_node.appendChild(this.vote_node_);
      this.RegisterHandlers();
    }

    estimate() : number { return this.estimate_; }

    SetAsCurrentEstimate(set : boolean) : void {
      if (set) {
        this.inner_node_.textContent = '';
      } else {
        this.inner_node_.textContent = GetEstimateText(this.estimate_);
      }
    }

    IsCurrentEstimate() : boolean {
      return this.inner_node_.textContent.length == 0;
    }

    AddObserver(callback : (MouseEvent) => void) {
      this.observers_.push(callback);
    }

    // private
    private CreateInnerNode() : void {
      this.inner_node_ = Utils.CreateDiv('vote-inner');
      this.inner_node_.textContent = GetEstimateText(this.estimate_);
      this.vote_node_.appendChild(this.inner_node_);
    }

    private RegisterHandlers() : void {
      this.vote_node_.addEventListener('click', this.OnClicked.bind(this));
    }

    private OnClicked(event : MouseEvent) : void {
      this.SetAsCurrentEstimate(!this.IsCurrentEstimate());
      this.observers_.forEach(callback => callback(event));
    }
  }

  export interface VotingDelegate {
    SendEstimate(estimate : number) : void;
    GetOtherEstimates() : UserEstimate[];
  }

  export class Voting {
    private static kCurrentVotesClass = 'current-votes';
    private delegate_ : VotingDelegate;
    private revealing_ : boolean;

    private my_vote_ : HTMLDivElement;
    private vote_estimates_ : VoteEstimate[];
    private votings_ : HTMLDivElement;
    private other_votes_ : HTMLDivElement;

    constructor(delegate : VotingDelegate, tasks: HTMLDivElement) {
      this.delegate_ = delegate;
      this.vote_estimates_ = [];
      this.revealing_ = false;

      this.votings_ = Utils.CreateDiv('votings');
      Utils.SetVisibility(this.votings_, false);
      this.ShowCurrentVotes();
      this.votings_.appendChild(Utils.CreateDiv('clear-both'));
      this.ShowUsersEstimates(false);
      this.ShowEstimates();
      this.votings_.appendChild(Utils.CreateDiv('clear-both'));
      tasks.appendChild(this.votings_);
    }

    ToggleVisibility() : void {
      Utils.ToggleVisibility(this.votings_);
    }

    ShowUsersEstimates(reveal : boolean) : void {
      // Check if we should stop revealing results. If so - new voting
      // round has started!
      if (this.revealing_ && !reveal) {
        this.my_vote_.textContent = '';
      }
      this.revealing_ = reveal;

      Utils.ClearNode(this.other_votes_);
      this.delegate_.GetOtherEstimates().forEach(user_estimate => {
        new OtherEstimate(this.other_votes_, user_estimate, reveal);
      });
    }

    // private
    private ShowCurrentVotes() : void {
      const current_votes = Utils.CreateDiv(Voting.kCurrentVotesClass);

      // Creating my-vote.
      const my_vote = Utils.CreateDiv('my-vote');
      my_vote.classList.add('vote');
      this.my_vote_ = Utils.CreateDiv('my-vote-inner');
      this.my_vote_.classList.add('vote-inner');

      my_vote.appendChild(this.my_vote_);
      current_votes.appendChild(my_vote);

      // Creating other-votes holding div.
      this.other_votes_ = Utils.CreateDiv('other-votes');
      current_votes.appendChild(this.other_votes_);

      this.votings_.appendChild(current_votes);
    }

    private ShowEstimates() : void {
      const vote_estimates = Utils.CreateDiv('vote-estimates');
      all_estimates.forEach(estimate => {
        const vote_estimate = new VoteEstimate(vote_estimates, estimate);
        vote_estimate.AddObserver(
            this.OnVoteEstimateClicked.bind(this, vote_estimate));
        this.vote_estimates_.push(vote_estimate);
      });
      this.votings_.appendChild(vote_estimates);
    }

    private OnVoteEstimateClicked(estimate: VoteEstimate,
                                  event : MouseEvent) : void {
      this.my_vote_.textContent = GetEstimateText(estimate.estimate());
      this.vote_estimates_.forEach(
          vote_estimage => vote_estimage.SetAsCurrentEstimate(false));
      estimate.SetAsCurrentEstimate(true);
      this.delegate_.SendEstimate(estimate.estimate());
    }
  }
}

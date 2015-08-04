/// <reference path="../utils.ts" />

/// <reference path="../ui/tasks.ts" />
/// <reference path="../ui/voting.ts" />

/// <reference path="command.ts" />
/// <reference path="common.ts" />
/// <reference path="message_router.ts" />
/// <reference path="voting.ts" />

module Model {
export module Tasks {
  export class TaskList implements UI.TasksListDelegate {
    private dispatcher_ : Common.MessageDispatcher;
    private ui_ : UI.TasksList;
    private tasks_ : Task[];
    private message_router_ : Model.MessageRouter;

    constructor(message_dispatcher : Common.MessageDispatcher) {
      this.dispatcher_ = message_dispatcher;
      this.ui_ = new UI.TasksList(this);
      this.tasks_ = [];
      this.message_router_ = this.dispatcher_.GetMessageRouter();
      this.message_router_.AddUserMessagesObserver(this.OnUserMessage.bind(this));
    }

    CreateTask(task_id : string) : Promise<UI.Task> {
      var reject = Promise.reject(new Error("Task already exists!"));
      if (this.DoesTaskExist(task_id))
        return reject;
      return this.dispatcher_.GetTaskInfo(task_id).then(
        issue_details => {
          if (this.DoesTaskExist(task_id))
            return reject;
          const task = new Task(this.dispatcher_, task_id);
          const ui_task =
              new UI.Task(task, this.ui_.GetTasksListElement(), issue_details);
          this.tasks_.push(task);
          this.message_router_.SendUserMessage(CommandType.CreateTask, task_id);
          return ui_task;
        },
        error_status => Promise.reject(new Error("Could not fetch task")));
    }

    BroadcastCurrentTasks() : void {
      this.tasks_.forEach(task => {
        this.message_router_.SendUserMessage(CommandType.CreateTask, task.id());
        task.BroadcastCurrentVotes();
      });
    }

    // private:
    private DoesTaskExist(task_id : string) {
      var task_exists = false;
      this.tasks_.forEach(task => {
        task_exists = task_exists || task.id() == task_id;
      });
      return task_exists;
    }

    private OnUserMessage(message : Model.PackedMessage) : boolean {
      switch (message.type) {
        case CommandType.CreateTask : this.ui_.AddTask(message.data); break;
        default: return false;
      }
      return true;
    }
  }

  class Task implements UI.TaskDelegate {
    private dispatcher_ : Common.MessageDispatcher;
    private task_id_ : string;
    private voting_ : Voting.Process;
    constructor(message_dispatcher : Common.MessageDispatcher,
                task_id : string) {
      this.dispatcher_ = message_dispatcher;
      this.task_id_ = task_id;
    }

    CreateVoting(task_div : HTMLDivElement) : UI.Voting {
      this.voting_ =
          new Voting.Process(this.dispatcher_, this.task_id_, task_div);
      return this.voting_.ui();
    }

    BroadcastCurrentVotes() : void {
      this.voting_.BroadcastCurrentVotes();
    }

    id() : string { return this.task_id_; }
  }

}
}

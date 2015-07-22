/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

/// <reference path="utils.ts" />
/// <reference path="voting.ts" />

module UI {
  export interface TasksListDelegate {
    CreateTask(task_id : string) : Promise<Task>;
  }

  export class TasksList {
    private static kAddTask = "Add task";

    private delegate_ : TasksListDelegate;
    private tasks_list_ : Element;
    private add_task_input_ : Element;

    private tasks_ : Task[];

    constructor(delegate : TasksListDelegate) {
      this.delegate_ = delegate;
      this.tasks_list_ = document.querySelector('.tasks-list');
      this.add_task_input_ =
          document.querySelector('.add-task.input .input-inner');

      this.tasks_ = [];
      this.RegisterHandlers();
    }

    GetTasksListElement() : Element {
      return this.tasks_list_;
    }

    AddTask(task_id : string) {
      this.delegate_.CreateTask(task_id).then(
        task => this.tasks_.push(task),
        error => {}
      );  // Do nothing on error. Task could already present.
    }

    // private:
    private RegisterHandlers() : void {
      this.add_task_input_.addEventListener('focus',
          Utils.RemoveHelp.bind(Utils, TasksList.kAddTask));
      this.add_task_input_.addEventListener('blur',
          Utils.ReturnHelp.bind(Utils, TasksList.kAddTask));
      this.add_task_input_.addEventListener('keyup',
                                        this.TryAddTask.bind(this));
    }

    private TryAddTask(keydown_event : KeyboardEvent) : void {
      if (keydown_event.keyCode != 13) {
        return;
      }
      const task_id = this.add_task_input_.textContent;
      if (task_id.length > 0) {
        this.AddTask(task_id);
        this.add_task_input_.textContent = "";
      }
    }
  }

  export interface TaskDelegate {
    CreateVoting(task_div : HTMLDivElement) : UI.Voting;
  }

  export class Task {
    private delegate_ : TaskDelegate;
    private open_description_div_ : HTMLDivElement;
    private description_div_ : HTMLDivElement;
    private votings_div_ : HTMLDivElement;
    private voting_ : UI.Voting;

    constructor(delegate : TaskDelegate,
                tasks_list : Element,
                task_info : Object) {
      this.delegate_ = delegate;
      const task_div = Utils.CreateDiv('task');

      const header_div = Utils.CreateDiv('task-header');
      header_div.textContent = task_info['key'] + ': ' + task_info['summary'];
      task_div.appendChild(header_div);

      this.open_description_div_ = Utils.CreateDiv('open-description');
      this.open_description_div_.textContent = 'V';
      task_div.appendChild(this.open_description_div_);

      this.description_div_ = Utils.CreateDiv('task-description');
      this.description_div_.textContent = task_info['description'];
      Utils.SetVisibility(this.description_div_, false);
      task_div.appendChild(this.description_div_);

      const clear_both_div = Utils.CreateDiv('clear-both');
      task_div.appendChild(clear_both_div);

      this.voting_ = this.delegate_.CreateVoting(task_div);

      tasks_list.appendChild(task_div);
      this.RegisterHandlers();
    }

    // private:
    private RegisterHandlers() : void {
      this.open_description_div_.addEventListener(
          'click', this.ToggleDescription.bind(this));
    }

    private ToggleDescription() : void {
      Utils.ToggleVisibility(this.description_div_);
      this.voting_.ToggleVisibility();
    }
  }

}

import { NgModule } from "@angular/core";

import { commonModules } from "app/common";
import { FileBrowseModule } from "app/components/file/browse";
import { FileDetailsModule } from "app/components/file/details";
import { TaskBrowseModule } from "app/components/task/browse";

import { NoTaskSelectedComponent } from "./no-task-selected.component";
import { TaskOutputComponent } from "./output";
import { SubTaskDisplayListComponent, SubTaskPropertiesComponent } from "./sub-tasks";
import { TaskDependenciesComponent } from "./task-dependencies.component";
import { TaskDetailsComponent } from "./task-details.component";
import { TaskEnvironmentSettingsComponent } from "./task-env-settings.component";
import { TaskErrorDisplayComponent } from "./task-error-display.component";
import { TaskPropertiesComponent } from "./task-properties.component";
import { TaskResourceFilesComponent } from "./task-resource-files.component";
import { TaskSubTasksTabComponent } from "./task-sub-tasks-tab.component";
import { TaskTimelineComponent, TaskTimelineStateComponent } from "./task-timeline";

const components = [
    TaskTimelineComponent, TaskTimelineStateComponent, NoTaskSelectedComponent,
    TaskDependenciesComponent, TaskDetailsComponent, TaskOutputComponent,
    TaskEnvironmentSettingsComponent, TaskPropertiesComponent, TaskResourceFilesComponent, TaskSubTasksTabComponent,
    SubTaskPropertiesComponent, SubTaskDisplayListComponent, TaskErrorDisplayComponent,
];

@NgModule({
    declarations: components,
    exports: components,
    imports: [...commonModules,
        FileBrowseModule, FileDetailsModule, TaskBrowseModule],
})
export class TaskDetailsModule {
}
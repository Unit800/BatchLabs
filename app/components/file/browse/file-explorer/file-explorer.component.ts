import {
    ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output,
} from "@angular/core";
import { BackgroundTaskService, DialogService, LoadingStatus } from "@batch-flask/ui";
import { SplitPaneConfig } from "@batch-flask/ui/split-pane";
import { log } from "@batch-flask/utils";
import { Subscription } from "rxjs";

import { CurrentNode, FileExplorerWorkspace, FileSource, OpenedFile } from "app/components/file/browse/file-explorer";
import { FileNavigator, FileTreeNode } from "app/services/file";
import { FileUrlUtils } from "app/utils";
import "./file-explorer.scss";

export interface FileNavigatorEntry {
    name: string;
    navigator: FileNavigator;
}

export enum FileExplorerSelectable {
    none = 1,
    file = 2,
    folder = 4,
    all = 6,
}

export interface FileDeleteEvent {
    navigator: FileNavigator;
    path: string;
    isDirectory: boolean;
}

export interface FileDropEvent {
    path: string;
    files: File[];
}

export interface FileExplorerConfig {
    /**
     * If the file explorer should show the tree view on the left
     * @default true
     */
    showTreeView?: boolean;

    /**
     * If the explorer should just select the file(not open)
     * @default FileExplorerSelectable.none
     */
    selectable?: FileExplorerSelectable;

    /**
     * If the explorer allows dropping external files
     * @default false
     */
    canDropExternalFiles?: boolean;

    /**
     * If log file can be automatically refreshed(Tail)
     */
    tailable?: boolean;
}

const fileExplorerDefaultConfig: FileExplorerConfig = {
    showTreeView: true,
    selectable: FileExplorerSelectable.none,
    canDropExternalFiles: false,
    tailable: false,
};

/**
 * File explorer is a combination of the tree view and the file preview.
 */
@Component({
    selector: "bl-file-explorer",
    templateUrl: "file-explorer.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileExplorerComponent implements OnChanges, OnDestroy {
    @Input() public set data(data: FileExplorerWorkspace | FileNavigator) {
        if (data instanceof FileExplorerWorkspace) {
            this.workspace = data;
        } else {
            this.workspace = new FileExplorerWorkspace(data);
        }
        this._updateWorkspaceEvents();
    }
    @Input() public autoExpand = false;
    @Input() public activeFile: string;
    @Input() public set config(config: FileExplorerConfig) {
        this._config = { ...fileExplorerDefaultConfig, ...config };
    }
    public get config() { return this._config; }
    @Output() public activeFileChange = new EventEmitter<string>();
    @Output() public dropFiles = new EventEmitter<FileDropEvent>();

    public LoadingStatus = LoadingStatus;
    public currentSource: FileSource;
    public currentNode: CurrentNode;
    public workspace: FileExplorerWorkspace;

    public splitPaneConfig: SplitPaneConfig;

    private _workspaceSubs: Subscription[] = [];
    private _config: FileExplorerConfig = fileExplorerDefaultConfig;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private backgroundTaskService: BackgroundTaskService,
        private dialogService: DialogService) {
        this._updateSplitPanelConfig();
    }

    public ngOnChanges(inputs) {
        // Todo Remove?
        if (inputs.config) {
            this._updateSplitPanelConfig();
        }
    }

    public ngOnDestroy() {
        this._clearWorkspaceSubs();
    }

    /**
     * Triggered when a file/folder is selected in the table view
     * It will either navigate to the given item or select it depending on the settings.
     * @param node Tree node that got selected
     */
    public nodeSelected(node: FileTreeNode) {
        // tslint:disable-next-line:no-bitwise
        if (node.isDirectory && (this.config.selectable & FileExplorerSelectable.folder)) {
            this.activeFileChange.emit(node.path);
            // tslint:disable-next-line:no-bitwise
        } else if (!node.isDirectory && (this.config.selectable & FileExplorerSelectable.file)) {
            this.activeFileChange.emit(node.path);
        } else {
            this.navigateTo(node.path, this.currentSource);
        }
    }

    public navigateTo(path: string, source: FileSource) {
        this.workspace.navigateTo(path, source);
    }

    public goBack() {
        this.workspace.goBack();
    }

    public handleDrop(event: FileDropEvent) {
        this.dropFiles.emit(event);
    }

    public trackSource(index, source: FileSource) {
        return source.name;
    }

    public trackOpenedFile(index, file: OpenedFile) {
        return `${file.source.name}/${file.path}`;
    }

    public handleDelete(event: FileDeleteEvent) {
        const { path } = event;
        const description = event.isDirectory
            ? `All files will be deleted from the folder: ${path}`
            : `The file '${FileUrlUtils.getFileName(path)}' will be deleted.`;
        this.dialogService.confirm(`Delete files`, {
            description: description,
            yes: () => {
                if (event.isDirectory) {
                    const taskTitle = `Deleting folder ${event.path}`;
                    this.backgroundTaskService.startTask(taskTitle, (task) => {
                        const obs = event.navigator.deleteFolder(event.path);
                        obs.subscribe({
                            next: (progress) => {
                                task.name.next(`${taskTitle} (${progress.deleted + 1}/${progress.total})`);
                                task.progress.next((progress.deleted + 1) / progress.total * 100);
                            },
                            error: (error) => {
                                log.error("Failed to delete blob", error);
                            },
                            complete: () => {
                                task.progress.next(100);
                            },
                        });
                        return obs;
                    });
                    return null;
                } else {
                    return event.navigator.deleteFile(event.path);
                }
            },
        });
    }

    private _updateWorkspaceEvents() {
        this._clearWorkspaceSubs();
        this._workspaceSubs.push(this.workspace.currentSource.subscribe((source) => {
            this.currentSource = source;
            this.changeDetector.markForCheck();
        }));

        this._workspaceSubs.push(this.workspace.currentNode.subscribe((node) => {
            this.currentNode = { ...node, treeNode: new FileTreeNode(node.treeNode) };
            this.changeDetector.markForCheck();
        }));
    }

    private _clearWorkspaceSubs() {
        this._workspaceSubs.forEach(x => x.unsubscribe());
        this._workspaceSubs = [];
    }

    private _updateSplitPanelConfig() {
        this.splitPaneConfig = {
            firstPane: {
                minSize: 200,
                hidden: !this.config.showTreeView,
            },
            secondPane: {
                minSize: 300,
            },
            initialDividerPosition: 250,
        };
        this.changeDetector.markForCheck();
    }
}

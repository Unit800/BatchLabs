import { TemplateRef } from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";

export interface TableColumnRef {
    name: string;
    defaultWidth: number;
    minWidth: number;
    maxWidth: number;
    sortable: boolean;
    headCellTemplate: TemplateRef<any>;
    cellTemplate: TemplateRef<any>;
}

export interface SortingInfo {
    column: string;
    direction: SortDirection;
}

export enum SortDirection {
    Asc,
    Desc,
}

export class TableColumnManager {
    public sorting: Observable<SortingInfo>;
    public dimensionsChange = new Subject();

    public columnMap = new Map<string, TableColumnRef>();
    public columnOrder = [];
    private _columns = [];
    private _sorting = new BehaviorSubject<SortingInfo>(null);
    private _dimensions = new Map<string, number>();

    constructor() {
        this.sorting = this._sorting.asObservable();
    }

    public dispose() {
        this._sorting.complete();
        this.dimensionsChange.complete();
    }

    public set columns(columns: TableColumnRef[]) {
        this.columnOrder = columns.map(x => x.name);
        this.columnMap.clear();
        for (const column of columns) {
            if (this.columnMap.has(column.name)) {
                throw new Error(`bl-column name '${column.name}' must be unique`);
            }
            this.columnMap.set(column.name, column);
        }
        this._computeColumns();
    }

    public get columns() {
        return this._columns;
    }

    public updateColumn(ref: TableColumnRef) {
        this.columnMap.set(ref.name, ref);
        this._computeColumns();
    }

    public updateColumnWidth(name: string, width: number) {
        this._setColumnWidth(name, width);
        this.dimensionsChange.next(true);
    }

    /**
     * Batch update of column width to limit notifications
     * @param widths Map of width
     */
    public updateColumnsWidth(widths: StringMap<number>) {
        for (const name of Object.keys(widths)) {
            this._setColumnWidth(name, widths[name]);
        }
        this.dimensionsChange.next(true);
    }

    public getColumnWidth(name: string) {
        return this._dimensions.get(name) || this.columnMap.get(name).defaultWidth;
    }

    public getAllColumnWidth(): StringMap<number> {
        const result = {};
        for (const column of this.columnMap.keys()) {
            result[column] = this.getColumnWidth(column);
        }
        return result;
    }

    public resetColumnWidth(name: string) {
        this._dimensions.delete(name);
        this.dimensionsChange.next(true);
    }

    public resetAllColumnWidth() {
        this._dimensions.clear();
        this.dimensionsChange.next(true);
    }

    public sortBy(column: string, direction: SortDirection = SortDirection.Asc) {
        this._sorting.next({ column, direction });
    }

    private _computeColumns() {
        this._columns = this.columnOrder.map(x => this.columnMap.get(x));
    }

    private _setColumnWidth(name: string, width: number) {
        const column = this.columnMap.get(name);
        if (!column) { return; }

        if (width < column.minWidth) {
            width = column.minWidth;
        }
        if (column.maxWidth && width > column.maxWidth) {
            width = column.maxWidth;
        }
        this._dimensions.set(name, width);
    }
}

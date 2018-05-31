import { AbstractControl, FormControl, FormGroup } from "@angular/forms";
import { Observable } from "rxjs";

export class FormUtils {
    public static getControl(formGroup: FormGroup, path: string | string[]): AbstractControl {
        const actualPath = Array.isArray(path) ? path : [path];
        let current: AbstractControl = formGroup;
        for (const segment of actualPath) {
            current = current.get(segment);
            if (!current) {
                throw new Error(`Path ${actualPath} is invalid, there is no control with name '${segment}'`);
            }
        }
        return current;
    }

    public static passValidation(control: FormControl, processErrors?: (errors: any) => any): Observable<any> {
        processErrors = processErrors || ((errors) => errors);

        if (control.status === "PENDING") {
            return control.statusChanges.filter(x => x !== "PENDING").take(1).map(() => {
                return processErrors(control.errors);
            });
        } else {
            return Observable.of(processErrors(control.errors));
        }
    }
}

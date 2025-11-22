import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
export interface UploadState {
	selectedFile: File | null;
	message: string;
}

export const UploadStore = signalStore(
	{ providedIn: 'root' },
	withState<UploadState>({
		selectedFile: null,
		message: '',
	}),
	withMethods((store) => {
		return {
			setFile(file: File | null) {
				if (file?.name.toLocaleLowerCase().endsWith('.stl')) {
					patchState(store, {
						selectedFile: file,
						message: '',
					});
				} else {
					patchState(store, {
						selectedFile: null,
						message: 'Please select a valid STL file.',
					});
				}
			},
			setMessage(message: string) {
				patchState(store, { message });
			},
			reset() {
				patchState(store, {
					selectedFile: null,
					message: '',
				});
			},
			isFileSelected(): boolean {
				return !!store.selectedFile();
			},
		};
	}),
);

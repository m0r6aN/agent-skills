// Pi supplies the real API and types when loading this extension; this minimal
// declaration keeps the package independently typecheckable.
declare module "@earendil-works/pi-coding-agent" {
	export interface ExtensionAPI {
		registerCommand(
			name: string,
			options: {
				description: string;
				getArgumentCompletions?: (
					argumentText: string,
				) => Array<{ value: string; label: string }> | null;
				handler: (
					args: string,
					ctx: {
						ui: { notify(message: string, type: "info" | "error"): void };
						shutdown(): void;
					},
				) => void | Promise<void>;
			},
		): void;
		sendUserMessage(message: string): Promise<void>;
	}
}

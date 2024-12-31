export class CI {
	constructor(private message: string) {}

	public async execute(): Promise<string> {
		return this.message;
	}
}

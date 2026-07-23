import {
	DEFAULT_FRAME_POSITIONS,
	FRAME_IDS,
	type FrameId,
	type FrameState
} from '@portfolio/realtime-contract';

export const CURRENT_SCHEMA_VERSION = 1;

export interface FrameRow {
	frame_id: string;
	x: number;
	y: number;
	revision: number;
	updated_at: number;
	updated_by: string | null;
}

interface SchemaMigration {
	version: number;
	apply(storage: DurableObjectStorage): void;
}

const schemaMigrations: readonly SchemaMigration[] = [
	{
		version: 1,
		apply(storage) {
			storage.sql.exec(`
				CREATE TABLE IF NOT EXISTS frames (
					frame_id TEXT PRIMARY KEY,
					x REAL NOT NULL,
					y REAL NOT NULL,
					revision INTEGER NOT NULL DEFAULT 0,
					updated_at INTEGER NOT NULL DEFAULT 0,
					updated_by TEXT
				);
				CREATE TABLE IF NOT EXISTS meta (
					key TEXT PRIMARY KEY,
					value INTEGER NOT NULL
				);
				INSERT OR IGNORE INTO meta (key, value) VALUES ('global_revision', 0);
			`);

			for (const frame of DEFAULT_FRAME_POSITIONS) {
				storage.sql.exec(
					`INSERT OR IGNORE INTO frames
					 (frame_id, x, y, revision, updated_at, updated_by)
					 VALUES (?, ?, ?, 0, 0, NULL)`,
					frame.id,
					frame.x,
					frame.y
				);
			}
		}
	}
];

export function migratePortfolioRoomStorage(storage: DurableObjectStorage): void {
	storage.transactionSync(() => {
		storage.sql.exec(`
			CREATE TABLE IF NOT EXISTS _sql_schema_migrations (
				id INTEGER PRIMARY KEY,
				applied_at TEXT NOT NULL DEFAULT (datetime('now'))
			);
		`);
		const currentVersion = storage.sql
			.exec<{ version: number }>(
				'SELECT COALESCE(MAX(id), 0) AS version FROM _sql_schema_migrations'
			)
			.one().version;

		for (const migration of schemaMigrations) {
			if (migration.version <= currentVersion) continue;
			migration.apply(storage);
			storage.sql.exec('INSERT INTO _sql_schema_migrations (id) VALUES (?)', migration.version);
		}
	});
}

export function frameFromRow(id: FrameId, row: FrameRow | undefined): FrameState {
	if (!row) throw new Error(`Missing persisted frame: ${id}`);
	return {
		id,
		x: row.x,
		y: row.y,
		revision: row.revision,
		updatedAt: row.updated_at,
		updatedBy: row.updated_by
	};
}

export class PortfolioRoomStorage {
	constructor(private readonly storage: DurableObjectStorage) {}

	migrate(): void {
		migratePortfolioRoomStorage(this.storage);
	}

	getBoardState(): { revision: number; frames: FrameState[] } {
		return { revision: this.getRevision(), frames: this.getFrames() };
	}

	moveFrame(id: FrameId, x: number, y: number, updatedAt: number, updatedBy: string): FrameState {
		return this.storage.transactionSync(() => {
			const revision = this.nextRevision();
			this.storage.sql.exec(
				`UPDATE frames
				 SET x = ?, y = ?, revision = ?, updated_at = ?, updated_by = ?
				 WHERE frame_id = ?`,
				x,
				y,
				revision,
				updatedAt,
				updatedBy,
				id
			);
			return { id, x, y, revision, updatedAt, updatedBy };
		});
	}

	reset(updatedAt: number): { revision: number; frames: FrameState[] } {
		const revision = this.storage.transactionSync(() => {
			const nextRevision = this.nextRevision();
			for (const frame of DEFAULT_FRAME_POSITIONS) {
				this.storage.sql.exec(
					`UPDATE frames
					 SET x = ?, y = ?, revision = ?, updated_at = ?, updated_by = 'owner-reset'
					 WHERE frame_id = ?`,
					frame.x,
					frame.y,
					nextRevision,
					updatedAt,
					frame.id
				);
			}
			return nextRevision;
		});
		return { revision, frames: this.getFrames() };
	}

	private getRevision(): number {
		return this.storage.sql
			.exec<{ value: number }>("SELECT value FROM meta WHERE key = 'global_revision'")
			.one().value;
	}

	private nextRevision(): number {
		this.storage.sql.exec("UPDATE meta SET value = value + 1 WHERE key = 'global_revision'");
		return this.getRevision();
	}

	private getFrames(): FrameState[] {
		const rows = this.storage.sql.exec<FrameRow>('SELECT * FROM frames').toArray();
		const byId = new Map(rows.map((row) => [row.frame_id, row]));
		return FRAME_IDS.map((id) => frameFromRow(id, byId.get(id)));
	}
}

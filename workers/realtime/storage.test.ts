import { env } from 'cloudflare:workers';
import { runInDurableObject } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION, migratePortfolioRoomStorage } from './storage';

describe('PortfolioRoom SQLite migrations', () => {
	it('marks a fresh database at the current schema version', async () => {
		const room = env.PORTFOLIO_ROOMS.getByName('public');
		const board = await room.getBoardState();
		expect(board.frames.every((frame) => frame.visible && !frame.locked)).toBe(true);

		await runInDurableObject(room, (_instance, state) => {
			const version = state.storage.sql
				.exec<{ version: number }>(
					'SELECT COALESCE(MAX(id), 0) AS version FROM _sql_schema_migrations'
				)
				.one().version;
			expect(version).toBe(CURRENT_SCHEMA_VERSION);
		});
	});

	it('migrates a v1 room without overwriting positions or revisions', async () => {
		const room = env.PORTFOLIO_ROOMS.getByName('public');
		await room.getBoardState();

		await runInDurableObject(room, (_instance, state) => {
			state.storage.sql.exec('DROP TABLE frames');
			state.storage.sql.exec(`
				CREATE TABLE frames (
					frame_id TEXT PRIMARY KEY,
					x REAL NOT NULL,
					y REAL NOT NULL,
					revision INTEGER NOT NULL DEFAULT 0,
					updated_at INTEGER NOT NULL DEFAULT 0,
					updated_by TEXT
				);
				INSERT INTO frames (frame_id, x, y, revision, updated_at, updated_by)
				VALUES ('profile', 4321, -1234, 7, 99, 'legacy-session');
				DELETE FROM _sql_schema_migrations;
				INSERT INTO _sql_schema_migrations (id) VALUES (1);
			`);

			migratePortfolioRoomStorage(state.storage);
			migratePortfolioRoomStorage(state.storage);

			const profile = state.storage.sql
				.exec<{ x: number; y: number; visible: number; locked: number; revision: number }>(
					"SELECT x, y, visible, locked, revision FROM frames WHERE frame_id = 'profile'"
				)
				.one();
			expect(profile).toEqual({
				x: 4321,
				y: -1234,
				visible: 1,
				locked: 0,
				revision: 7
			});

			const migrations = state.storage.sql
				.exec<{ count: number }>('SELECT COUNT(*) AS count FROM _sql_schema_migrations')
				.one().count;
			expect(migrations).toBe(2);
		});
	});
});

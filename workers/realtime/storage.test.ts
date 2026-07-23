import { env } from 'cloudflare:workers';
import { runInDurableObject } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION, migratePortfolioRoomStorage } from './storage';

describe('PortfolioRoom SQLite migrations', () => {
	it('marks a fresh database at the current schema version', async () => {
		const room = env.PORTFOLIO_ROOMS.getByName('public');
		await room.getBoardState();

		await runInDurableObject(room, (_instance, state) => {
			const version = state.storage.sql
				.exec<{ version: number }>(
					'SELECT COALESCE(MAX(id), 0) AS version FROM _sql_schema_migrations'
				)
				.one().version;
			expect(version).toBe(CURRENT_SCHEMA_VERSION);
		});
	});

	it('adopts an existing unversioned room without overwriting positions', async () => {
		const room = env.PORTFOLIO_ROOMS.getByName('public');
		await room.getBoardState();

		await runInDurableObject(room, (_instance, state) => {
			state.storage.sql.exec(
				"UPDATE frames SET x = 4321, y = -1234, revision = 7 WHERE frame_id = 'profile'"
			);
			state.storage.sql.exec('DELETE FROM _sql_schema_migrations');

			migratePortfolioRoomStorage(state.storage);
			migratePortfolioRoomStorage(state.storage);

			const profile = state.storage.sql
				.exec<{ x: number; y: number; revision: number }>(
					"SELECT x, y, revision FROM frames WHERE frame_id = 'profile'"
				)
				.one();
			expect(profile).toEqual({ x: 4321, y: -1234, revision: 7 });

			const migrations = state.storage.sql
				.exec<{ count: number }>('SELECT COUNT(*) AS count FROM _sql_schema_migrations')
				.one().count;
			expect(migrations).toBe(1);
		});
	});
});

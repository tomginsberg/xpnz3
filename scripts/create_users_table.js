import Knex from 'knex';
import { generateId } from '../src/api/utilities.js';

const db = Knex({ 
  client: 'sqlite3', 
  connection: { filename: 'data.db' }, 
  useNullAsDefault: true 
});

async function createUsersTable() {
  // Only create if it doesn't exist
  const exists = await db.schema.hasTable('users');
  if (!exists) {
    await db.schema.createTable('users', table => {
      table.string('id').primary();
      table.string('phone_number').unique().notNullable();
      table.string('display_name');
      table.datetime('created_at').defaultTo(db.fn.now());
    });
    console.log('Created users table');
  }
}

async function migrate() {
  try {
    await createUsersTable();
    console.log('Creation completed successfully');
  } catch (error) {
    console.error('Creation failed:', error);
  } finally {
    await db.destroy();
  }
}

migrate(); 
import Knex from 'knex';

const db = Knex({ client: 'sqlite3', connection: { filename: 'data.db' }, useNullAsDefault: true });

async function addPrivateColumn() {
  try {
    // Check if column exists
    const hasColumn = await db.schema.hasColumn('ledgers', 'is_private');
    
    if (!hasColumn) {
      console.log('Adding is_private column to ledgers table...');
      await db.schema.table('ledgers', table => {
        table.boolean('is_private').defaultTo(false);
      });
      console.log('Successfully added is_private column!');
    } else {
      console.log('Column is_private already exists in ledgers table.');
    }
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    await db.destroy();
  }
}

addPrivateColumn(); 
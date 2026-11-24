import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

import nextEnv from '@next/env';
import pg from 'pg';

nextEnv.loadEnvConfig(process.cwd());

const { Pool } = pg;
const scrypt = promisify(scryptCallback);

function readHidden(prompt) {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    throw new Error('Run this command in an interactive terminal.');
  }

  return new Promise((resolve, reject) => {
    let value = '';
    process.stdout.write(prompt);
    input.setRawMode(true);
    input.resume();

    const finish = (result, error) => {
      input.setRawMode(false);
      input.pause();
      input.removeListener('data', onData);
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(result);
    };

    const onData = (chunk) => {
      for (const character of chunk.toString('utf8')) {
        if (character === '\u0003') {
          finish('', new Error('Cancelled.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish(value);
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
        } else {
          value += character;
        }
      }
    };

    input.on('data', onData);
  });
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${Buffer.from(key).toString('hex')}`;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');

  const password = await readHidden('Admin password (hidden): ');
  const confirmation = await readHidden('Confirm password (hidden): ');
  if (process.env.NODE_ENV === 'production' && password.length < 12) {
    throw new Error('Production admin passwords must contain at least 12 characters.');
  }
  if (password.length < 12) {
    console.warn('Warning: use this short password only in local development.');
  }
  if (password !== confirmation) throw new Error('Passwords do not match.');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO nguoi_dung (email, password_hash, display_name, role)
       VALUES ('admin', $1, 'Admin', 'admin')
       ON CONFLICT ((lower(email))) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         display_name = EXCLUDED.display_name,
         role = 'admin',
         updated_at = now()
       RETURNING id`,
      [await hashPassword(password)],
    );
    await client.query(
      `INSERT INTO cai_dat_nguoi_dung (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [result.rows[0].id],
    );
    await client.query('COMMIT');
    console.log('Admin account is ready. Username: admin');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
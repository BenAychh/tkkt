import { next } from '@/sync/hlc';
import { omit, sort } from 'remeda';
import type { EventID } from '@/domain/event';
import { uuidv7 } from 'uuidv7';
import { type Execer, queueExec } from '@/db/db';

const serializeValue = (value: any): string => {
  if (value === null) {
    return '0:';
  } else if (typeof value === 'number') {
    return `N:${value}`;
  } else if (typeof value === 'string') {
    return `S:${value}`;
  } else if (typeof value === 'boolean') {
    return `B:${value}`;
  }

  throw new Error('Unserializable value type: ' + JSON.stringify(value));
};

export const deserializeValue = (value: string) => {
  const type = value[0];
  switch (type) {
    case '0':
      return null;
    case 'N':
      return parseFloat(value.slice(2));
    case 'S':
      return value.slice(2);
    case 'B':
      return value[2] === 't';
  }

  throw new Error('Invalid type key for value: ' + value);
};

export const toMessages = (
  table: TableName,
  row: Record<string, any> & {
    id: string;
  },
  eventId: EventID,
  actor: string,
): CRDTMessage[] => {
  const batchId = uuidv7();
  const keys = keySorter(Object.keys(omit(row, ['id'])));
  return keys.map((column) => ({
    dataset: table,
    eventId,
    rowId: row.id,
    batchId,
    col: column,
    val: serializeValue(row[column]),
    hlc: next(),
    actor,
  }));
};

const keySorter = sort<string[]>((a: string, b: string) => {
  if (a === 'id') {
    return -1;
  } else if (b === 'id') {
    return 1;
  }

  return a.localeCompare(b);
});

export const handleCRDTMessages = async (messages: CRDTMessage[]): Promise<void> => {
  console.log('handleCRDTMessages', messages);
  for (const msg of messages) {
    switch (msg.dataset) {
      case 'students':
        await handleStudentCRDTMessage(msg as CRDTMessage & { dataset: 'students' });
        break;
      default:
        await handleCRDTMessage(msg);
    }
  }
};

const handleCRDTMessage = async (msg: CRDTMessage): Promise<void> => {
  const fn = async (exec: Execer) => {
    try {
      await exec('BEGIN TRANSACTION;');
      await exec(
        'INSERT INTO messages_crdt (hlc, dataset, rowId, batchId, col, val, actor) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [msg.hlc, msg.dataset, msg.rowId, msg.batchId, msg.col, msg.val, msg.actor],
      );
      const latestTimestampSQL = `SELECT hlc
                                  FROM messages_crdt
                                  WHERE dataset = ?
                                    AND rowId = ?
                                    AND col = ?
                                  ORDER BY hlc DESC
                                  LIMIT 1`;
      const latestTimestampResponse = await exec(latestTimestampSQL, [
        msg.dataset,
        msg.rowId,
        msg.col,
      ]);
      const latestTimestamp = latestTimestampResponse.result?.resultRows?.[0]?.hlc;
      if (latestTimestamp && latestTimestamp <= msg.hlc) {
        await exec(
          `INSERT INTO ${msg.dataset} (id, ${msg.col})
           VALUES (?, ?)
           ON CONFLICT(id) DO UPDATE SET ${msg.col} = excluded.${msg.col}`,
          [msg.rowId, deserializeValue(msg.val)],
        );
      }
      await exec('COMMIT;');
    } catch (err) {
      await exec('ROLLBACK;');
      throw err;
    }
  };
  const debugInfo = `${msg.dataset} ${msg.rowId} ${msg.col} ${msg.val} ${msg.hlc} ${msg.actor}`;
  console.log('handleCRDTMessage', debugInfo);
  return queueExec(fn, debugInfo);
};

const handleStudentCRDTMessage = async (
  msg: CRDTMessage & { dataset: 'students' },
): Promise<void> => {
  const fn = async (exec: Execer) => {
    try {
      await exec('BEGIN TRANSACTION;');
      const [eventId, sid] = msg.rowId.split('_');
      await exec(
        'INSERT INTO messages_crdt (hlc, dataset, rowId, batchId, col, val, actor) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [msg.hlc, msg.dataset, msg.rowId, msg.batchId, msg.col, msg.val, msg.actor],
      );
      const latestTimestampSQL = `SELECT hlc
                                  FROM messages_crdt
                                  WHERE dataset = ?
                                    AND rowId = ?
                                    AND col = ?
                                  ORDER BY hlc DESC
                                  LIMIT 1`;
      const latestTimestampResponse = await exec(latestTimestampSQL, [
        msg.dataset,
        msg.rowId,
        msg.col,
      ]);
      const latestTimestamp = latestTimestampResponse.result?.resultRows?.[0]?.hlc;
      if (latestTimestamp && latestTimestamp <= msg.hlc) {
        await exec(
          `INSERT INTO students (eventId, sid, ${msg.col})
           VALUES (?, ?, ?)
           ON CONFLICT(eventId, sid) DO UPDATE SET ${msg.col} = excluded.${msg.col}`,
          [eventId, sid, deserializeValue(msg.val)],
        );
      }
      await exec('COMMIT;');
    } catch (err) {
      await exec('ROLLBACK;');
      throw err;
    }
  };
  return queueExec(fn);
};

export const getCRDTMessages = async (
  dataset: TableName,
  rowId: string,
): Promise<CRDTMessage[]> => {
  const fn = async (exec: Execer) => {
    const res = await exec(
      'SELECT * FROM messages_crdt WHERE dataset = ? AND rowId = ? ORDER BY hlc',
      [dataset, rowId],
    );
    return (res.result?.resultRows as CRDTMessage[]) || [];
  };
  return queueExec(fn);
};

export type TableName = 'events' | 'students' | 'admins' | 'tickets' | 'access_student_logs';

export interface CRDTMessage<T = Record<string, any>> {
  dataset: TableName;
  eventId: string;
  rowId: string;
  batchId: string;
  col: keyof T;
  val: string;
  hlc: string;
  actor: string;
}

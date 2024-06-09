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

const insertCRDTMessages = async (
  messages: CRDTMessage[],
  exec: Execer,
): Promise<CRDTMessage[]> => {
  const crdtInsert = `
      INSERT INTO messages_crdt (hlc, dataset, rowId, batchId, col, val, actor)
      VALUES ${messages.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')}
      RETURNING hlc
  `;
  const crdtArgs: string[] = [];
  for (const msg of messages) {
    crdtArgs.push(msg.hlc, msg.dataset, msg.rowId, msg.batchId, msg.col, msg.val, msg.actor);
  }
  const crdtResponse = await exec(crdtInsert, crdtArgs);
  const insertedHlcs: string[] = crdtResponse.result?.resultRows.map((row: any) => row.hlc) || [];
  const insertHlcMap = insertedHlcs.reduce(
    (acc, hlc) => {
      acc[hlc] = true;
      return acc;
    },
    {} as Record<string, boolean>,
  );
  return messages.filter((msg) => insertHlcMap[msg.hlc]);
};

const getHlcThatWereActuallyUpdates = async (insertedMessages: CRDTMessage[], exec: Execer) => {
  // latest HLC for each dataset/row/col combo
  const latestTimestampSQL = `
      SELECT just_inserted.hlc,
             just_inserted.hlc >= max(messages_crdt.hlc) AS is_latest
      FROM (SELECT hlc, dataset, rowid, col
            FROM messages_crdt
            WHERE hlc IN (${insertedMessages.map(() => '?').join(', ')})) just_inserted
               JOIN messages_crdt
                    ON just_inserted.dataset = messages_crdt.dataset AND just_inserted.rowid = messages_crdt.rowid AND
                       just_inserted.col = messages_crdt.col
      GROUP BY just_inserted.hlc
      ORDER BY messages_crdt.hlc DESC
  `;
  const latestTimestampResponse = await exec(
    latestTimestampSQL,
    insertedMessages.map((msg) => msg.hlc),
  );
  const latestTimestamps: { hlc: string; is_latest: boolean }[] =
    latestTimestampResponse.result?.resultRows || [];
  return latestTimestamps.reduce(
    (acc, row) => {
      acc[row.hlc] = row.is_latest;
      return acc;
    },
    {} as Record<string, boolean>,
  );
};

function getSqlStringValue(msg: CRDTMessage<Record<string, any>>) {
  const value = deserializeValue(msg.val);
  let valueInSql = value;
  // it's all local, if people want to sql inject themselves, let them
  if (typeof value === 'string') {
    valueInSql = `'${value}'`;
  } else if (value === null) {
    valueInSql = 'NULL';
  } else if (typeof value === 'boolean') {
    valueInSql = value ? 'TRUE' : 'FALSE';
  }
  return valueInSql;
}

export const handleCRDTMessages = async (messages: CRDTMessage[]): Promise<void> => {
  const fn = async (exec: Execer) => {
    try {
      await exec('BEGIN TRANSACTION;');
      const insertedHlcs = await insertCRDTMessages(messages, exec);
      if (!insertedHlcs.length) {
        return;
      }
      const actuallyUpdatedHlcs = await getHlcThatWereActuallyUpdates(insertedHlcs, exec);
      const upsertSqls: string[] = [];
      for (const msg of messages) {
        if (actuallyUpdatedHlcs[msg.hlc]) {
          if (msg.dataset === 'students') {
            const [eventId, sid] = msg.rowId.split('_');
            upsertSqls.push(
              `INSERT INTO students (eventId, sid, ${msg.col})
               VALUES ('${eventId}', '${sid}', ${getSqlStringValue(msg)})
               ON CONFLICT(eventId, sid) DO UPDATE SET ${msg.col} = excluded.${msg.col}`,
            );
          } else {
            upsertSqls.push(
              `INSERT INTO ${msg.dataset} (id, ${msg.col})
               VALUES ('${msg.rowId}', ${getSqlStringValue(msg)})
               ON CONFLICT(id) DO UPDATE SET ${msg.col} = excluded.${msg.col}`,
            );
          }
        }
      }
      if (upsertSqls.length) {
        const allUpsertsSql = upsertSqls.join(';\n');
        await exec(allUpsertsSql);
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

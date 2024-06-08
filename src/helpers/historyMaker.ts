import { parseHLC } from '@/sync/hlc';
import { type CRDTMessage, deserializeValue } from '@/db/helpers';
import type { Admin } from '@/domain/admins';

export interface History {
  key: string;
  actor: string;
  date: number;
  message: string;
}

export interface NamedThing {
  id: string;
  name: string | null;
  tombstone: boolean;
}

const getChangeMessage = (
  item: CRDTMessage<NamedThing>,
  previousState: Admin,
  genericName: string,
): string => {
  const name = previousState?.name ? previousState.name : genericName;
  const value = deserializeValue(item.val);
  if (item.col === 'tombstone') {
    return value ? `Deleted ${name}` : `Restored ${name}`;
  }
  return `Changed ${item.col} to ${deserializeValue(item.val)}`;
};

export const namedHistoryMaker = (
  history: CRDTMessage<NamedThing>[],
  genericName: string,
): History[] => {
  let itemName = genericName;
  for (const item of history) {
    if (item.col === 'name') {
      itemName = deserializeValue(item.val) as string;
      break;
    }
  }
  const groupedByBatchId = history.reduce((acc, item: CRDTMessage<NamedThing>) => {
    if (!acc.length) {
      return [[item]];
    }
    const lastBatch = acc[acc.length - 1];
    const lastItem = lastBatch[lastBatch.length - 1];
    if (lastItem.batchId === item.batchId) {
      lastBatch.push(item);
    } else {
      acc.push([item]);
    }
    return acc;
  }, Array<CRDTMessage<NamedThing>[]>());

  const states: Record<string, any> = [];
  groupedByBatchId.forEach((batch, index) => {
    const previousState = index === 0 ? {} : states[index - 1];
    const batchState = batch.reduce((acc, item) => {
      return {
        ...acc,
        [item.col]: deserializeValue(item.val),
      };
    }, previousState);
    states.push(batchState);
  });
  return groupedByBatchId.map((batch, index) => {
    const isCreationBatch = index === 0;
    if (isCreationBatch) {
      return {
        key: batch[0].hlc,
        actor: batch[0].actor,
        date: parseHLC(batch[0].hlc).wallClockMs,
        message: `Created ${itemName}`,
      };
    }
    const changeMessages = batch.map((item, index) => {
      const previousState = states[index - 1];
      return getChangeMessage(item, previousState, genericName);
    });
    return {
      key: batch[0].hlc,
      actor: batch[0].actor,
      date: parseHLC(batch[0].hlc).wallClockMs,
      message: changeMessages.join(', '),
    };
  });
};

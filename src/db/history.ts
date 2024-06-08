import { type Execer, queueExec } from '@/db/db'
import type { CRDTMessage } from '@/db/helpers'

export interface CRDTAsHistoryItem {
  batchId: string
  messages: CRDTMessage[]
  isCreation: boolean
}

export const getMostRecentCRDTBatchItems = async (limit: number): Promise<CRDTAsHistoryItem[]> => {
  const fn = async (exec: Execer) => {
    const SQL = `
        SELECT distinct messages_crdt.batchId, m2.hlc IS NULL as isCreation
        FROM messages_crdt
                 LEFT JOIN messages_crdt AS m2
                           ON m2.dataset = messages_crdt.dataset AND m2.rowId = messages_crdt.rowId AND
                              m2.hlc < messages_crdt.hlc AND m2.batchId != messages_crdt.batchId
        ORDER BY messages_crdt.hlc DESC
        LIMIT 10;
    `
    const res = await exec(SQL, [limit])
    const batchBase: Omit<CRDTAsHistoryItem, 'messages'>[] = res.result?.resultRows || []
    if (batchBase.length === 0) {
      return []
    }
    const messages = await getCRDTMessagesForBatches(batchBase.map((b) => b.batchId))
    const messageMap = messages.reduce(
      (acc, msg) => {
        if (!acc[msg.batchId]) {
          acc[msg.batchId] = []
        }
        acc[msg.batchId].push(msg)
        return acc
      },
      {} as Record<string, CRDTMessage[]>
    )
    return batchBase.map((base) => ({
      ...base,
      messages: messageMap[base.batchId] || []
    }))
  }
  return queueExec(fn)
}

const getCRDTMessagesForBatches = async (batchIds: string[]): Promise<CRDTMessage[]> => {
  if (batchIds.length === 0) {
    return []
  }
  const fn = async (exec: Execer) => {
    const SQL = `
        SELECT *
        FROM messages_crdt
        WHERE batchId IN (${batchIds.map(() => '?').join(', ')})
    `
    const res = await exec(SQL, batchIds)
    return (res.result?.resultRows as CRDTMessage[]) || []
  }
  return queueExec(fn)
}

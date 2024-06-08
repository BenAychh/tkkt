import { type Promiser, sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm'
import { setupSql } from '@/db/setup.sql'
import { concatMap, of, Subject } from 'rxjs'
import { once } from 'remeda'

export type Execer = typeof exec

const log = console.log
const error = console.error

let db: Promiser
let dbId: string

interface QueuedItem<T> {
  fn: (execer: Execer) => Promise<T>
  resolve: (value: T) => void
  reject: (reason?: any) => void
  debugInfo?: string
}

const subject = new Subject<QueuedItem<any>>()
subject
  .pipe(concatMap((item) => of(item)))
  .subscribe(async ({ fn, resolve, reject, debugInfo }) => {
    try {
      if (debugInfo) {
        log('Running queued function:', debugInfo)
      }
      resolve(await fn(exec))
    } catch (err) {
      reject(err)
    }
  })

export const initializeSQLite = once(async () => {
  try {
    log('Loading and initializing SQLite3 module...')

    db = await new Promise<Promiser>((resolve) => {
      const _promiser = sqlite3Worker1Promiser({
        onready: () => resolve(_promiser)
      })
    })

    log('Done initializing. Running demo...')

    const configResponse = await db('config-get', {})
    log('Running SQLite3 version', configResponse.result.version.libVersion)

    const openResponse = await db('open', {
      filename: 'file:tkkt.sqlite3?vfs=opfs'
    })
    dbId = openResponse.dbId as string
    log(
      'OPFS is available, created persisted database at',
      (openResponse.result as any).filename.replace(/^file:(.*?)\?vfs=opfs$/, '$1')
    )
    log('Beginning migrations...')
    await db('exec', {
      sql: setupSql
    })
    log('Migrations complete...')
  } catch (err) {
    if (!(err instanceof Error)) {
      const newError = new Error((err as any).result.message)
      error(newError.name, newError.message)
    } else {
      error(err.name, err.message)
    }
  }
})

const exec = async (sql: string, bind: any[] = []): Promise<any> => {
  try {
    return await db('exec', {
      sql,
      bind,
      dbId,
      rowMode: 'object'
    })
  } catch (err) {
    if (!(err instanceof Error)) {
      const newError = new Error((err as any).result.message)
      error(newError.name, newError.message)
    } else {
      error(err.name, err.message)
    }
  }
}

export const queueExec = <T>(
  fn: (execer: Execer) => Promise<T>,
  debugInfo?: string
): Promise<T> => {
  return new Promise((resolve, reject) => {
    subject.next({ fn, resolve, reject })
  })
}

import { uuidv7 } from 'uuidv7'

type HybridLogicalClock = {
  wallClockMs: number
  counter: number
  nodeId: string
}

const makeHLC = (wallClockMs: number, counter: number, nodeId: string): HybridLogicalClock => {
  return { wallClockMs, counter, nodeId }
}

let instance = makeHLC(Date.now(), 0, uuidv7())

const serializeHLC = (hlc: HybridLogicalClock): string => {
  const isoWallClock = new Date(hlc.wallClockMs).toISOString()
  return `${isoWallClock} ${hlc.counter} ${hlc.nodeId}`
}

export const parseHLC = (hlcStr: string): HybridLogicalClock => {
  const [isoWallClock, counter, nodeId] = hlcStr.split(' ')
  return makeHLC(Date.parse(isoWallClock), parseInt(counter), nodeId)
}

const incrementHLC = (hlc: HybridLogicalClock): HybridLogicalClock => {
  const wallClockMs = Date.now()
  if (wallClockMs > hlc.wallClockMs) {
    return makeHLC(wallClockMs, 0, hlc.nodeId)
  }
  return makeHLC(hlc.wallClockMs, hlc.counter + 1, hlc.nodeId)
}

const recv = (hlc: HybridLogicalClock, senderHLC: HybridLogicalClock): HybridLogicalClock => {
  const wallClockNow = Date.now()
  if (wallClockNow > hlc.wallClockMs && wallClockNow > senderHLC.wallClockMs) {
    return makeHLC(wallClockNow, 0, hlc.nodeId)
  }
  if (hlc.wallClockMs === senderHLC.wallClockMs) {
    return makeHLC(hlc.wallClockMs, Math.max(hlc.counter, senderHLC.counter) + 1, hlc.nodeId)
  }
  if (hlc.wallClockMs > senderHLC.wallClockMs) {
    return makeHLC(hlc.wallClockMs, hlc.counter + 1, hlc.nodeId)
  }
  return makeHLC(senderHLC.wallClockMs, senderHLC.counter + 1, hlc.nodeId)
}

export const next = (): string => {
  instance = incrementHLC(instance)
  return serializeHLC(instance)
}

export const receive = (senderHLC: string): void => {
  const sender = parseHLC(senderHLC)
  instance = recv(instance, sender)
}

import { murmur3 } from 'murmurhash-js'
// adapted from https://gist.github.com/jlongster/f431b6d75ef29c1a2ed000715aef9c8c

type Merkle = Record<string, any> & { hash: number }

const getKeys = (trie: Merkle) => {
  return Object.keys(trie).filter((x) => x !== 'hash')
}

const keyToTimestamp = (key: string): Date => {
  // 16 is the length of the base 3 value of the current time in
  // minutes. Ensure it's padded to create the full value
  const fullkey = key + '0'.repeat(16 - key.length)

  // Parse the base 3 representation
  return new Date(parseInt(fullkey, 3) * 1000 * 60)
}

const insertKey = (trie: Merkle, key: string, hash: number): Merkle => {
  if (key.length === 0) {
    return trie
  }
  const c = key[0]
  const n = trie[c] || { hash: 0 }
  return {
    ...trie,
    [c]: {
      ...n,
      ...insertKey(n, key.slice(1), hash),
      hash: n.hash ^ hash
    }
  }
}

const insert = (trie: Merkle, date: Date) => {
  const hash = murmur3(date.toString())
  const key = Math.trunc(Number(date.getTime() / 1000 / 60)).toString(3)
  const newMerkle = { ...trie, hash: trie.hash ^ hash }
  return insertKey(newMerkle, key, hash)
}

const build = (dates: Date[]): Merkle => {
  if (dates.length === 0) {
    return { hash: 0 }
  }
  return dates.reduce(insert, { hash: 0 })
}

const diff = (a: Merkle, b: Merkle): Date | null => {
  if (a.hash === b.hash) {
    return null
  }
  let node1 = a
  let node2 = b
  let k = ''

  for (;;) {
    const keyset = new Set([...getKeys(node1), ...getKeys(node2)])
    console.log(keyset)
    const keys = [...keyset.values()]
    keys.sort()

    const diffkey = keys.find((key) => {
      const next1 = node1[key] || {}
      const next2 = node2[key] || {}
      return next1.hash !== next2.hash
    })
    console.log(diffkey)
    if (!diffkey) {
      return keyToTimestamp(k)
    }

    k += diffkey
    node1 = node1[diffkey] || {}
    node2 = node2[diffkey] || {}
  }
}

const dates = [
  new Date('2024-01-01T00:00:00.001Z'),
  new Date('2024-01-01T00:01:00.002Z')
  // new Date('2024-01-01T00:00:00.003Z'),
  // new Date('2024-01-01T00:00:00.004Z'),
  // new Date('2024-01-01T00:00:00.004Z'),
  // new Date('2024-01-01T00:00:00.004Z'),
  // new Date('2024-01-01T00:00:00.004Z'),
  // new Date('2024-01-02T00:00:00Z'),
  // new Date('2024-02-01T00:00:00Z'),
  // new Date('2024-02-01T00:00:01Z'),
  // new Date('2024-02-01T00:00:02Z')
]

const dates2 = [
  new Date('2024-01-01T00:00:00.001Z'),
  new Date('2024-01-01T00:00:02.002Z')
  // new Date('2024-01-01T00:00:00.003Z'),
  // new Date('2024-01-01T00:00:00.004Z'),
  // new Date('2024-01-01T00:00:00.004Z'),
  // new Date('2024-01-01T00:00:00.004Z'),
  // new Date('2024-01-01T00:00:00.004Z'),
  // new Date('2024-01-01T23:05:31Z'),
  // new Date('2024-01-02T00:00:00Z'),
  // new Date('2024-02-01T00:00:00Z'),
  // new Date('2024-02-01T00:00:01Z'),
  // new Date('2024-02-01T00:00:02Z')
]

// console.log(Math.trunc(Number(Date.now() / 1000 / 60)).toString(3))
// console.log(new Date(parseInt('22222222222222222', 3) * 1000 * 60))

const tree1 = build(dates)
const tree2 = build(dates2)
console.log(diff(tree1, tree2))

import { DataFrame, DataFrameEvents, ResolvedValue, checkSignal, createEventTarget, sortableDataFrame } from 'hightable'

function lorem(rand: number, length: number): string {
  const words = 'lorem ipsum dolor sit amet consectetur adipiscing elit'.split(' ')
  const str = Array.from({ length }, (_, i) => words[Math.floor(i + rand * 8) % 8]).join(' ')
  return str[0].toUpperCase() + str.slice(1)
}

const header = ['ID', 'Name', 'Age', 'Text', 'JSON']

function generateValue({ row, column }: { row: number, column: string }): string | number {
  switch (column) {
  case 'ID':
    return row + 1
  case 'Name':
    return `Name${row}`
  case 'Age':
    return 20 + row % 80
  case 'Text':
    return lorem( Math.abs(Math.sin(row + 1)), 10)
  case 'JSON':
    return JSON.stringify({ row, column })
  default:
    throw new Error(`Unknown column: ${column}`)
  }
}

/**
 * Generates a DataFrame that resolves cells and row numbers synchronously.
 */
function generateData({ numRows }: { numRows: number }): DataFrame {
  const cellCache = new Map<string, ResolvedValue[]>(header.map(column => [column, []]))
  const rowNumberCache: ResolvedValue<number>[] = []
  const eventTarget = createEventTarget<DataFrameEvents>()

  const mockData: DataFrame = {
    columnDescriptors: header.map(column => ({ name: column })),
    numRows,
    getCell: ({ row, column }) => {
      return cellCache.get(column)?.[row]
    },
    getRowNumber: ({ row }) => {
      return rowNumberCache[row]
    },
    fetch: ({ rowEnd, rowStart, columns, signal }) => {
      checkSignal(signal)
      for (let row = rowStart; row < rowEnd; row++) {
        if (!rowNumberCache[row]) {
          rowNumberCache[row] = { value: row }
        }
        for (const column of columns ?? []) {
          if (!header.includes(column)) {
            throw new Error(`Unknown column: ${column}`)
          }
          if (!cellCache.get(column)?.[row]) {
            const columnCache = cellCache.get(column)
            if (!columnCache) {
              throw new Error(`Column cache not found for: ${column}`)
            }
            columnCache[row] = { value: generateValue({ row, column }) }
          }
        }
      }
      eventTarget.dispatchEvent(new CustomEvent('resolve'))
      return Promise.resolve()
    },
    eventTarget,
  }

  return sortableDataFrame(mockData)
}

export const data = generateData({ numRows: 10000 })

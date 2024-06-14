// tests/table.test.js
import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import { Table, sortTable } from '../../src/electron/frontend/core/components/Table.js';
import { sleep } from '../puppeteer.js';

global.ResizeObserver = global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

const createComponent = async (props = {}) => {
    const element = new Table(props);
    document.body.appendChild(element);
    await element.updateComplete;
    return element;
}

const itemSchema = {
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    aliases: { type: 'array', items: { type: 'string' } }
  },
  required: ['name']
}

const schema = {
  type: 'array',
  items: itemSchema
}

describe('Table component', () => {


  test('should render the table', async () => {
    const element = await createComponent();
    const div = element.querySelector('table');
    expect(div).toBeTruthy();
    element.remove()
  });

  test('should set schema and update columns', async () => {
    const element = await createComponent({ schema });

    const colHeaders = element.colHeaders;
    expect(colHeaders).toEqual(['name', 'age', 'aliases']);
    element.remove()
  });

  test('should add rows and validate data', async () => {
    const element = await createComponent({ schema });

    const row = { name: 'John Doe', age: 30, aliases: ['Johny', 'Doe'] }
    element.data = [row];
    await element.updated();
    await sleep(1000);

    const tableData = element.table.getData();
    expect(tableData).toEqual([ Object.values(row) ]);
    element.remove()
  });

  test('should work with key column', async () => {
    const element = await createComponent({ schema, keyColumn: 'name' });

    const key = 'John Doe';
    const row = { age: 30, aliases: ['Johny', 'Doe'] } 
    const data = { [key]: row };
    element.data = data;
    await element.updated();
    await sleep(1000);

    const tableData = element.table.getData();
    expect(tableData).toEqual([ [key, ...Object.values(row)] ]);
    element.remove()
  })

  test('should sort table columns correctly', async () => {
    const schema = {
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
        email: { type: 'string' },
      },
      required: ['name']
    };

    const sortedColumns = sortTable(schema, 'name', ['age', 'email']);
    expect(sortedColumns).toEqual(['name', 'age', 'email']);
  });
});